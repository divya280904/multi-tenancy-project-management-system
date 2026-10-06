const requireTenant = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }

  if (req.user.role === 'SUPER_ADMIN') {
    return next();
  }

  if (!req.user.agencyId) {
    return res.status(403).json({ success: false, message: 'User does not belong to an agency' });
  }

  if (!req.body || typeof req.body !== 'object') {
    req.body = {};
  }

  const requestedAgencyId = req.params.agencyId || req.body.agencyId || req.query.agencyId;

  if (requestedAgencyId && parseInt(requestedAgencyId, 10) !== req.user.agencyId) {
    return res.status(403).json({ success: false, message: 'Cannot access data for a different agency' });
  }

  req.agencyId = req.user.agencyId;

  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    req.body.agencyId = req.user.agencyId;
  }

  next();
};

module.exports = { requireTenant };
