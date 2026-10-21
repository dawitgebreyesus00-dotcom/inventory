import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Generate Access Token (short-lived)
const generateAccessToken = (user) => {
    const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'fallback-secret';
    return jwt.sign(
        { id: user._id, role: user.role },
        secret,
        { expiresIn: '7d' } 
    );
};

// Generate Refresh Token (long-lived)
const generateRefreshToken = (user) => {
    const secret = process.env.REFRESH_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET || 'fallback-secret';
    return jwt.sign(
        { id: user._id },
        secret,
        { expiresIn: '7d' }
    );
};

// Login Controller
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials (User not found)' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials (Password incorrect)' });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Optional: save refresh token in DB
        user.refreshToken = refreshToken;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token: accessToken, // For frontend compatibility
            accessToken, // For API consistency
            refreshToken,
            user: {
                _id: user._id,
                email: user.email,
                role: user.role,
                name: user.name
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
};

// Refresh Token Controller
const refreshToken = async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(401).json({ success: false, message: 'No refresh token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== token) {
            return res.status(403).json({ success: false, message: 'Invalid refresh token' });
        }

        const newAccessToken = generateAccessToken(user);

        return res.status(200).json({ success: true, accessToken: newAccessToken });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Refresh token expired' });
        }
        return res.status(403).json({ success: false, message: 'Invalid refresh token' });
    }
};

export { login, refreshToken };
