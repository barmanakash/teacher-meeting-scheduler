import { RequestHandler } from 'express';
import Availability from '../models/Availability.model';
import { AuthRequest } from '../middleware/auth.middleware';

export const getMyAvailability: RequestHandler = async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    let availability = await Availability.findOne({ teacher: user._id });
    if (!availability) {
      availability = await Availability.create({ teacher: user._id });
    }
    res.json({ success: true, data: availability });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateAvailability: RequestHandler = async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    const { workingHours, workingDays, holidays, blockedSlots } = req.body;
    const availability = await Availability.findOneAndUpdate(
      { teacher: user._id },
      { workingHours, workingDays, holidays, blockedSlots },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: availability });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const addBlockedSlot: RequestHandler = async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    const { start, end, reason } = req.body;
    const availability = await Availability.findOneAndUpdate(
      { teacher: user._id },
      { $push: { blockedSlots: { start: new Date(start), end: new Date(end), reason } } },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: availability });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const addHoliday: RequestHandler = async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    const { date } = req.body;
    const availability = await Availability.findOneAndUpdate(
      { teacher: user._id },
      { $push: { holidays: new Date(date) } },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: availability });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
