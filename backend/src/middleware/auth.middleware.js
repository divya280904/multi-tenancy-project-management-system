const jwt = require('jsonwebtoken');
const { User, Agency } = require('../models');

const requireAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    const user = await User.findByPk(decoded.id, {
      include: [{ model: Agency, as: 'agency' }]
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(401).json({ success: false, message: 'Not authorized, user is suspended' });
    }

    if (user.agency && user.agency.status === 'SUSPENDED') {
      return res.status(401).json({ success: false, message: 'Not authorized, agency is suspended' });
    }

    // If impersonating, override role and agencyId with token payload
    const isImpersonating = decoded.isImpersonating || false;
    const effectiveRole = isImpersonating ? decoded.role : user.role;
    const effectiveAgencyId = isImpersonating ? decoded.agencyId : user.agencyId;

    req.user = {
      id: user.id,
      role: effectiveRole,
      agencyId: effectiveAgencyId,
      clientId: user.clientId || null,
      status: user.status,
      isImpersonating,
      realRole: isImpersonating ? decoded.realRole : user.role
    };

    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

module.exports = { requireAuth };
