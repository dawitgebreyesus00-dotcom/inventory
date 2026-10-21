import User from '../models/User.js';
import Profile from '../models/Profile.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// POST /api/users
export const createUser = async (req, res) => {
  try {
    const { email, password, name, role, address } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, error: { message: 'Email and password are required' } });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, error: { message: 'Email already in use' } });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashed,
      name: name || '',
      address: address || '',
      role: role || 'customer',
    });

    const { password: _p, ...safe } = user.toObject();
    return res.status(201).json({ success: true, data: safe });
  } catch (error) {
    console.error('createUser error:', error);
    return res.status(500).json({ success: false, error: { message: 'Failed to create user' } });
  }
};

// GET /api/users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().populate('profile');
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch users' } });
  }
};

// GET /api/users/:id
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).populate('profile');
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } });
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('getUserById error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch user' } });
  }
};

// PATCH /api/users/:id
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, profile, password } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } });

    if (name !== undefined) user.name = name;
    if (email !== undefined && email !== user.email) {
      const existing = await User.findOne({ email, _id: { $ne: id } });
      if (existing) return res.status(409).json({ success: false, error: { message: 'Email already in use' } });
      user.email = email;
    }
    if (role !== undefined && role !== user.role) {
      // Prevent changing role of last admin
      if (user.role === 'admin' && role !== 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount <= 1) {
          return res.status(400).json({ success: false, error: { message: 'Cannot change role of last admin user' } });
        }
      }
      user.role = role;
    }
    if (password) user.password = await bcrypt.hash(password, 10);

    // Handle profile object: create or update
    if (profile) {
      let prof;
      if (user.profile) {
        prof = await Profile.findById(user.profile);
        if (prof) {
          prof.fullName = profile.fullName ?? prof.fullName;
          prof.photo = profile.photo ?? prof.photo;
          prof.phone = profile.phone ?? prof.phone;
          prof.address = profile.address ?? prof.address;
          await prof.save();
        }
      } else {
        prof = await Profile.create({ user: user._id, fullName: profile.fullName, photo: profile.photo, phone: profile.phone, address: profile.address });
        user.profile = prof._id;
      }
    }

    await user.save();
    const populated = await User.findById(user._id).populate('profile');
    res.json({ success: true, data: populated });
  } catch (error) {
    console.error('updateUser error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to update user' } });
  }
};

export const getMe = async (req, res) => {
  try {
    const id = req.user?.id || req.user?._id;
    console.log('getMe - User ID from token:', id);
    if (!id) return res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
    
    // Check if ID is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('getMe - Invalid ObjectId:', id);
      return res.status(400).json({ success: false, error: { message: 'Invalid user ID' } });
    }
    
    const user = await User.findById(id).populate('profile');
    console.log('getMe - Found user:', user ? 'Yes' : 'No');
    
    if (!user) {
      // User doesn't exist, token is stale - return 401 to trigger logout
      console.log('getMe - User not found in database, token may be stale');
      return res.status(401).json({ success: false, error: { message: 'User account not found. Please login again.' } });
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch profile' } });
  }
};

export const updateMe = async (req, res) => {
  try {
    const id = req.user?.id || req.user?._id;
    console.log('updateMe - User from token:', req.user);
    console.log('updateMe - User ID from token:', id);
    if (!id) return res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
    const { name, email, password, profile } = req.body;

    const user = await User.findById(id);
    if (!user) {
      console.log('updateMe - User not found in database');
      return res.status(401).json({ success: false, error: { message: 'User account not found. Please login again.' } });
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined && email !== user.email) {
      const existing = await User.findOne({ email, _id: { $ne: id } });
      if (existing) return res.status(409).json({ success: false, error: { message: 'Email already in use' } });
      user.email = email;
    }
    if (password) user.password = await bcrypt.hash(password, 10);

    if (profile) {
      let prof;
      if (user.profile) {
        prof = await Profile.findById(user.profile);
        if (prof) {
          prof.fullName = profile.fullName ?? prof.fullName;
          prof.photo = profile.photo ?? prof.photo;
          prof.phone = profile.phone ?? prof.phone;
          prof.address = profile.address ?? prof.address;
          await prof.save();
        }
      } else {
        prof = await Profile.create({
          user: user._id,
          fullName: profile.fullName,
          photo: profile.photo,
          phone: profile.phone,
          address: profile.address
        });
        user.profile = prof._id;
      }
    }

    await user.save();
    const populated = await User.findById(user._id).populate('profile');
    res.json({ success: true, data: populated });
  } catch (error) {
    console.error('updateMe error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to update profile' } });
  }
};

// DELETE /api/users/:id
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } });
    
    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          success: false, 
          error: { message: 'Cannot delete the last admin user. System must have at least one admin.' } 
        });
      }
    }
    
    // Check if user has orders
    const Order = (await import('../models/Order.js')).default;
    const orderCount = await Order.countDocuments({ user: id });
    
    if (orderCount > 0) {
      return res.status(400).json({ 
        success: false, 
        error: { message: `Cannot delete user. User has ${orderCount} order(s). Please handle orders first.` } 
      });
    }
    
    await User.findByIdAndDelete(id);

    // Optionally remove profile
    if (user.profile) {
      await Profile.findByIdAndDelete(user.profile);
    }

    res.json({ success: true, data: { id: user._id } });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to delete user' } });
  }
};
