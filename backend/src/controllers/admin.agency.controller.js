const { Agency, User, Project, Task, Client, ProjectActivity } = require('../models');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');

// @route   GET /admin/agencies/dashboard
const getAdminDashboard = async (req, res) => {
  try {
    const totalAgencies = await Agency.count();
    const activeAgencies = await Agency.count({ where: { status: 'ACTIVE' } });
    const suspendedAgencies = await Agency.count({ where: { status: 'SUSPENDED' } });
    
    const totalUsers = await User.count();
    const totalProjects = await Project.count();
    const totalTasks = await Task.count();
    const totalClients = await Client.count();

    // Chart data (Projects by status)
    const planningProjects = await Project.count({ where: { status: 'PLANNING' }});
    const activeProjects = await Project.count({ where: { status: 'ACTIVE' }});
    const completedProjects = await Project.count({ where: { status: 'COMPLETED' }});

    // Recent platform activity (approximate by pulling recent users/agencies)
    const recentAgencies = await Agency.findAll({ order: [['createdAt', 'DESC']], limit: 3 });
    const recentUsers = await User.findAll({ order: [['createdAt', 'DESC']], limit: 3, include: [{ model: Agency, as: 'agency', attributes: ['name'] }] });
    
    const activity = [];
    recentAgencies.forEach(a => activity.push({ id: `ag-${a.id}`, description: `New agency created: ${a.name}`, date: a.createdAt, type: 'AGENCY' }));
    recentUsers.forEach(u => activity.push({ id: `us-${u.id}`, description: `New user joined: ${u.name} (${u.agency ? u.agency.name : 'Super Admin'})`, date: u.createdAt, type: 'USER' }));
    activity.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      stats: {
        agencies: {
          total: totalAgencies,
          active: activeAgencies,
          suspended: suspendedAgencies
        },
        users: {
          total: totalUsers
        },
        clients: {
          total: totalClients
        },
        projects: {
          total: totalProjects
        },
        tasks: {
          total: totalTasks
        }
      },
      chartData: [
        { name: 'Planning', count: planningProjects },
        { name: 'Active', count: activeProjects },
        { name: 'Completed', count: completedProjects }
      ],
      recentActivity: activity.slice(0, 5)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @route   POST /admin/agencies
const createAgency = async (req, res) => {
  try {
    const { name, status } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Agency name is required' });
    }

    const agency = await Agency.create({
      name,
      status: status || 'ACTIVE'
    });

    res.status(201).json({ success: true, agency });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @route   GET /admin/agencies
const getAgencies = async (req, res) => {
  try {
    const { search, status, sort = 'createdAt', order = 'DESC' } = req.query;
    
    let whereClause = {};

    if (search) {
      whereClause.name = { [Op.like]: `%${search}%` };
    }
    
    if (status) {
      whereClause.status = status;
    }

    const agencies = await Agency.findAll({
      where: whereClause,
      order: [[sort, order]],
      include: [{
        model: User,
        attributes: []
      }],
      attributes: {
        include: [
          [
            Agency.sequelize.fn('COUNT', Agency.sequelize.col('Users.id')),
            'userCount'
          ]
        ]
      },
      group: ['Agency.id']
    });

    res.status(200).json({ success: true, agencies });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @route   GET /admin/agencies/:id
const getAgencyById = async (req, res) => {
  try {
    const agency = await Agency.findByPk(req.params.id, {
      include: [{
        model: User,
        attributes: ['id', 'name', 'email', 'role', 'status']
      }]
    });

    if (!agency) {
      return res.status(404).json({ success: false, message: 'Agency not found' });
    }

    res.status(200).json({ success: true, agency });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @route   PUT /admin/agencies/:id
const updateAgency = async (req, res) => {
  try {
    const { name } = req.body;
    
    const agency = await Agency.findByPk(req.params.id);

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

// @route   PATCH /admin/agencies/:id/suspend
const suspendAgency = async (req, res) => {
  try {
    const agency = await Agency.findByPk(req.params.id);

    if (!agency) {
      return res.status(404).json({ success: false, message: 'Agency not found' });
    }

    agency.status = 'SUSPENDED';
    await agency.save();

    res.status(200).json({ success: true, message: 'Agency suspended successfully', agency });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @route   PATCH /admin/agencies/:id/activate
const activateAgency = async (req, res) => {
  try {
    const agency = await Agency.findByPk(req.params.id);

    if (!agency) {
      return res.status(404).json({ success: false, message: 'Agency not found' });
    }

    agency.status = 'ACTIVE';
    await agency.save();

    res.status(200).json({ success: true, message: 'Agency activated successfully', agency });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @route   POST /admin/agencies/:id/impersonate
const impersonateAgency = async (req, res) => {
  try {
    const agency = await Agency.findByPk(req.params.id);

    if (!agency) {
      return res.status(404).json({ success: false, message: 'Agency not found' });
    }

    if (agency.status === 'SUSPENDED') {
      return res.status(400).json({ success: false, message: 'Cannot impersonate a suspended agency' });
    }

    // Create a special JWT that identifies the super admin as an agency admin
    const payload = {
      id: req.user.id,
      role: 'AGENCY_ADMIN',
      agencyId: agency.id,
      clientId: null,
      isImpersonating: true,
      realRole: 'SUPER_ADMIN'
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
      expiresIn: '1h',
    });

    res.status(200).json({ 
      success: true, 
      token, 
      message: `Impersonating ${agency.name}` 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getAdminDashboard,
  createAgency,
  getAgencies,
  getAgencyById,
  updateAgency,
  suspendAgency,
  activateAgency,
  impersonateAgency
};
