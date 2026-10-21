import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required',
        error: { message: 'Access token required' } 
      });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'fallback-secret');
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found',
        error: { message: 'User not found' } 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired',
        error: { message: 'Token expired' } 
      });
    }
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token',
      error: { message: 'Invalid token' } 
    });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required',
      error: { message: 'Admin access required' } 
    });
  }
  next();
};

export const requireManager = (req, res, next) => {
  if (!['admin', 'manager'].includes(req.user?.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Manager access required',
      error: { message: 'Manager access required' } 
    });
  }
  next();
};

export const requireViewer = (req, res, next) => {
  if (!['admin', 'manager', 'viewer'].includes(req.user?.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Viewer access required',
      error: { message: 'Viewer access required' } 
    });
  }
  next();
};

export const checkPermission = (action) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    const permissions = {
      admin: [
        'create', 'read', 'update', 'delete', 'manage_users', 'view_reports', 
        'system_config', 'approve_orders', 'manage_suppliers', 'set_rules',
        'monitor_system', 'emergency_stock_control'
      ],
      manager: [
        'create', 'read', 'update', 'delete', 'view_reports', 'stock_adjust', 
        'receive_stock', 'stock_count', 'track_items', 'monitor_levels', 
        'reorder_stock', 'physical_count', 'damage_reports', 'manage_orders',
        'create_purchase_orders', 'create_sales_orders', 'update_stock'
      ],
      viewer: ['read', 'view_reports'],
      customer: ['read_products', 'create_orders', 'view_own_orders', 'track_orders']
    };

    if (!permissions[userRole]?.includes(action)) {
      return res.status(403).json({ 
        success: false, 
        message: `Permission denied: ${action} not allowed for ${userRole}`,
        error: { message: `Permission denied: ${action} not allowed for ${userRole}` } 
      });
    }
    next();
  };
};