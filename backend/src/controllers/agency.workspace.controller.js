const { Agency, User } = require('../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const DashboardService = require('../services/dashboard.service');

const TEAM_ROLES = ['AGENCY_ADMIN', 'AGENCY_TEAM'];
const TEAM_STATUSES = ['ACTIVE', 'SUSPENDED'];

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const getValidAgencyUser = async (userId, agencyId) => {
  return User.findOne({
    where: {
      id: userId,
      agencyId,
      role: { [Op.in]: TEAM_ROLES }
    },
    attributes: ['id', 'name', 'email', 'role', 'status', 'agencyId', 'createdAt', 'updatedAt']
  });
};

const ensureAgencyAdminPreserved = async (agencyId, userIdToSkip = null) => {
  const adminCount = await User.findAndCountAll({
    where: {
      agencyId,
      role: 'AGENCY_ADMIN',
      status: 'ACTIVE',
      ...(userIdToSkip ? { id: { [Op.ne]: userIdToSkip } } : {})
    },
    attributes: ['id']
  });

  return adminCount.count > 0;
};

const generateTemporaryPassword = () => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 16; i += 1) {
    password += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return password;
};

// @route   GET /agency/profile
const getAgencyDashboard = async (req, res) => {
  try {
    const dashboard = await DashboardService.getAgencyDashboard({
      agencyId: req.user.agencyId,
      userId: req.user.id,
      from: req.query.from,
      to: req.query.to,
    });

    return res.status(200).json(dashboard);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getAgencyProfile = async (req, res) => {
  try {
    const agency = await Agency.findByPk(req.user.agencyId);
    if (!agency) {
      return res.status(404).json({ success: false, message: 'Agency not found' });
    }
    res.status(200).json({ success: true, agency });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @route   PUT /agency/profile
const updateAgencyProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const agency = await Agency.findByPk(req.user.agencyId);

    if (!agency) {
      return res.status(404).json({ success: false, message: 'Agency not found' });
    }

    agency.name = name || agency.name;
    await agency.save();

    res.status(200).json({ success: true, agency });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @route   GET /agency/team
const getTeamMembers = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;
    const where = {
      agencyId: req.user.agencyId,
      role: { [Op.in]: TEAM_ROLES }
    };

    if (search) {
      const lookup = String(search).trim();
      where[Op.or] = [
        { name: { [Op.like]: `%${lookup}%` } },
        { email: { [Op.like]: `%${lookup}%` } }
      ];
    }

    if (role && TEAM_ROLES.includes(role)) {
      where.role = role;
    }

    if (status && TEAM_STATUSES.includes(status)) {
      where.status = status;
    }

    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.max(1, Math.min(100, Number(limit) || 20));

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: ['id', 'name', 'email', 'role', 'status', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']],
      limit: limitNumber,
      offset: (pageNumber - 1) * limitNumber,
    });

    return res.status(200).json({
      success: true,
      team: rows.map(sanitizeUser),
      pagination: {
        total: count,
        page: pageNumber,
        pages: Math.ceil(count / limitNumber)
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getTeamMemberById = async (req, res) => {
  try {
    const teamMember = await getValidAgencyUser(req.params.id, req.user.agencyId);

    if (!teamMember) {
      return res.status(404).json({ success: false, message: 'Team member not found in your agency' });
    }

    return res.status(200).json({ success: true, teamMember: sanitizeUser(teamMember) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @route   POST /agency/team
const addTeamMember = async (req, res) => {
  try {
    const { name, email, password, role, agencyId } = req.body;

    if (agencyId !== undefined && Number(agencyId) !== req.user.agencyId) {
      return res.status(400).json({ success: false, message: 'Agency ID cannot be overridden' });
    }

    const normalizedName = typeof name === 'string' ? name.trim() : '';
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const safePassword = typeof password === 'string' && password.trim() ? password.trim() : generateTemporaryPassword();

    if (!normalizedName || !normalizedEmail) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'A valid email address is required' });
    }

    if (!TEAM_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: 'Only Agency Admin and Agency Team roles are allowed' });
    }

    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'A team member with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(safePassword, 10);
    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
      role,
      agencyId: req.user.agencyId,
      status: 'ACTIVE'
    });

    return res.status(201).json({
      success: true,
      user: sanitizeUser(user),
      message: 'Team member created successfully.'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const updateTeamMember = async (req, res) => {
  try {
    const member = await getValidAgencyUser(req.params.id, req.user.agencyId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Team member not found in your agency' });
    }

    const { name, email, role } = req.body;
    const nextName = typeof name === 'string' ? name.trim() : member.name;
    const nextEmail = typeof email === 'string' ? email.trim().toLowerCase() : member.email;
    const nextRole = role || member.role;

    if (!nextName) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    if (!/^\S+@\S+\.\S+$/.test(nextEmail)) {
      return res.status(400).json({ success: false, message: 'A valid email address is required' });
    }

    if (!TEAM_ROLES.includes(nextRole)) {
      return res.status(400).json({ success: false, message: 'Only Agency Admin and Agency Team roles are allowed' });
    }

    if (nextEmail !== member.email) {
      const duplicateUser = await User.findOne({ where: { email: nextEmail } });
      if (duplicateUser && duplicateUser.id !== member.id) {
        return res.status(409).json({ success: false, message: 'A team member with this email already exists' });
      }
    }

    if (member.role === 'AGENCY_ADMIN' && nextRole === 'AGENCY_TEAM') {
      const hasAnotherAdmin = await ensureAgencyAdminPreserved(req.user.agencyId, member.id);
      if (!hasAnotherAdmin) {
        return res.status(400).json({ success: false, message: 'An agency must have at least one active Agency Admin.' });
      }
    }

    member.name = nextName;
    member.email = nextEmail;
    member.role = nextRole;
    await member.save();

    return res.status(200).json({ success: true, teamMember: sanitizeUser(member) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const updateTeamMemberStatus = async (req, res) => {
  try {
    const member = await getValidAgencyUser(req.params.id, req.user.agencyId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Team member not found in your agency' });
    }

    const { status } = req.body;
    if (!TEAM_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be ACTIVE or SUSPENDED' });
    }

    if (member.role === 'AGENCY_ADMIN' && status === 'SUSPENDED') {
      const hasAnotherAdmin = await ensureAgencyAdminPreserved(req.user.agencyId, member.id);
      if (!hasAnotherAdmin) {
        return res.status(400).json({ success: false, message: 'An agency must have at least one active Agency Admin.' });
      }
    }

    member.status = status;
    await member.save();

    return res.status(200).json({ success: true, teamMember: sanitizeUser(member) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @route   DELETE /agency/team/:id
const removeTeamMember = async (req, res) => {
  try {
    const member = await getValidAgencyUser(req.params.id, req.user.agencyId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Team member not found in your agency' });
    }

    if (member.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
    }

    if (member.role === 'AGENCY_ADMIN' && member.status === 'ACTIVE') {
      const hasAnotherAdmin = await ensureAgencyAdminPreserved(req.user.agencyId, member.id);
      if (!hasAnotherAdmin) {
        return res.status(400).json({ success: false, message: 'An agency must have at least one active Agency Admin.' });
      }
    }

    member.status = 'SUSPENDED';
    await member.save();

    return res.status(200).json({ success: true, message: 'Team member deactivated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getAgencyDashboard,
  getAgencyProfile,
  updateAgencyProfile,
  getTeamMembers,
  getTeamMemberById,
  addTeamMember,
  updateTeamMember,
  updateTeamMemberStatus,
  removeTeamMember
};
