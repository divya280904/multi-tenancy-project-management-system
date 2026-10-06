const { Client } = require('../models');
const { Op } = require('sequelize');

// @route   GET /agency/clients
const getClients = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    
    let whereClause = {
      agencyId: req.user.agencyId
    };

    if (search) {
      whereClause[Op.or] = [
        { companyName: { [Op.like]: `%${search}%` } },
        { primaryContact: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Client.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      clients: rows,
      pagination: {
        total: count,
        page: parseInt(page, 10),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @route   POST /agency/clients
const createClient = async (req, res) => {
  try {
    const { companyName, primaryContact, email, phone, notes } = req.body;

    if (!companyName || companyName.trim() === '') {
      return res.status(400).json({ success: false, message: 'Company name is required' });
    }

    const client = await Client.create({
      companyName: companyName.trim(),
      primaryContact,
      email,
      phone,
      notes,
      agencyId: req.user.agencyId,
      status: 'ACTIVE'
    });

    res.status(201).json({ success: true, client });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @route   GET /agency/clients/:id
const getClientById = async (req, res) => {
  try {
    const client = await Client.findOne({
      where: {
        id: req.params.id,
        agencyId: req.user.agencyId
      }
    });

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found or belongs to another agency' });
    }

    res.status(200).json({ success: true, client });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @route   PATCH /agency/clients/:id
const updateClient = async (req, res) => {
  try {
    const { companyName, primaryContact, email, phone, notes } = req.body;

    const client = await Client.findOne({
      where: {
        id: req.params.id,
        agencyId: req.user.agencyId
      }
    });

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found or belongs to another agency' });
    }

    if (companyName) client.companyName = companyName.trim();
    if (primaryContact !== undefined) client.primaryContact = primaryContact;
    if (email !== undefined) client.email = email;
    if (phone !== undefined) client.phone = phone;
    if (notes !== undefined) client.notes = notes;

    await client.save();

    res.status(200).json({ success: true, client });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @route   DELETE /agency/clients/:id
const deleteClient = async (req, res) => {
  try {
    const client = await Client.findOne({
      where: {
        id: req.params.id,
        agencyId: req.user.agencyId
      }
    });

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found or belongs to another agency' });
    }

    // Since we don't have project models yet, hard delete is safe.
    // However, adopting a soft delete strategy by updating status
    client.status = 'INACTIVE';
    await client.save();

    res.status(200).json({ success: true, message: 'Client deactivated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getClients,
  createClient,
  getClientById,
  updateClient,
  deleteClient
};
