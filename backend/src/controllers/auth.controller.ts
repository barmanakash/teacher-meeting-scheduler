import { Request, Response, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import AuditLog from '../models/AuditLog.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
};

export const googleCallback: RequestHandler = async (req, res) => {
  try {
    const user = req.user as any;
    if (!user) {
      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
      return;
    }

    const token = generateToken(user._id.toString());

    await AuditLog.create({
      user: user._id,
      action: 'user_login',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}`);
  } catch (error) {
    logger.error('Google callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
};

export const getMe: RequestHandler = async (req, res) => {
  try {
    res.json({ success: true, data: (req as AuthRequest).user });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const logout: RequestHandler = async (req, res) => {
  try {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateRole: RequestHandler = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['teacher', 'candidate'].includes(role)) {
      res.status(400).json({ success: false, message: 'Invalid role' });
      return;
    }
    const user = await User.findByIdAndUpdate(
      (req as AuthRequest).user?._id,
      { role },
      { new: true }
    );
    res.json({ success: true, data: user });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
