import { RequestHandler } from 'express';
import User from '../models/User.model';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAllCandidates: RequestHandler = async (req, res) => {
  try {
    const { search } = req.query;
    const filter: any = { role: 'candidate' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const candidates = await User.find(filter).select('name email profileImage role');
    res.json({ success: true, data: candidates });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getUserById: RequestHandler = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-refreshToken');
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    res.json({ success: true, data: user });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateProfile: RequestHandler = async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findByIdAndUpdate(
      (req as AuthRequest).user?._id,
      { name },
      { new: true }
    ).select('-refreshToken');
    res.json({ success: true, data: user });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getAllTeachers: RequestHandler = async (_req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).select('name email profileImage role');
    res.json({ success: true, data: teachers });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
