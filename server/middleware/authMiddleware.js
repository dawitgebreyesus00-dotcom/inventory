import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('No authorization header provided');
      return res.status(401).json({ success: false, error: { message: 'No token provided' } });
    }
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      console.log('Invalid token format:', authHeader);
      return res.status(401).json({ success: false, error: { message: 'Invalid token format' } });
    }
    
    const token = parts[1];
    const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      console.error('Missing ACCESS_TOKEN_SECRET in environment');
      throw new Error('Missing ACCESS_TOKEN_SECRET');
    }
    
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    return next();
  } catch (error) {
    console.error('verifyToken error:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: { message: 'Token expired' } });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ success: false, error: { message: 'Invalid token' } });
    }
    return res.status(403).json({ success: false, error: { message: 'Failed to authenticate token' } });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: { message: 'Admin access required' } });
  return next();
};
