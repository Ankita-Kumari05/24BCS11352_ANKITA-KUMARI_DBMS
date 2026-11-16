const jwt = require('jsonwebtoken');

/**
 * Middleware – verify the JWT in the Authorization header and attach the
 * decoded payload to `req.user`.
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role, ... }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

/**
 * Middleware factory – restrict access to one or more roles.
 * Usage: authorizeRole('TPO_ADMIN', 'COMPANY')
 */
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: 'Forbidden. You do not have the required role.' });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRole };
