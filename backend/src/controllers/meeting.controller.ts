import { Response, RequestHandler } from 'express';
import Meeting from '../models/Meeting.model';
import Attendance from '../models/Attendance.model';
import User from '../models/User.model';
import AuditLog from '../models/AuditLog.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../services/googleCalendar.service';
import { sendMeetingInvitation, sendCancellationEmail, sendRescheduleEmail } from '../services/email.service';
import { scheduleReminders, cancelReminders } from '../jobs/reminder.job';
import { logger } from '../utils/logger';

export const createMeeting: RequestHandler = async (req, res) => {
  try {
    const { title, description, meetingType, candidates, startTime, endTime, recurrence, recurrenceEndDate, notes } = req.body;
    const organizer = (req as AuthRequest).user!;

    const candidateUsers = await User.find({ _id: { $in: candidates }, role: 'candidate' });
    if (candidateUsers.length === 0) {
      res.status(400).json({ success: false, message: 'No valid candidates found' });
      return;
    }

    let googleEventId = '';
    let googleMeetLink = '';

    if (organizer.refreshToken) {
      const attendeeEmails = candidateUsers.map((c) => c.email);
      const result = await createCalendarEvent(organizer.refreshToken, {
        title, description, startTime: new Date(startTime), endTime: new Date(endTime),
        attendeeEmails, notes,
      });
      googleEventId = result.eventId;
      googleMeetLink = result.meetLink;
    }

    const meeting = await Meeting.create({
      title, description, meetingType,
      organizer: organizer._id,
      candidates: candidateUsers.map((c) => c._id),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      googleMeetLink, googleEventId, recurrence,
      recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : undefined,
      notes,
    });

    await Attendance.insertMany(
      candidateUsers.map((c) => ({ meeting: meeting._id, candidate: c._id, status: 'absent' }))
    );

    await scheduleReminders(meeting._id.toString(), new Date(startTime));

    for (const candidate of candidateUsers) {
      try {
        await sendMeetingInvitation({
          to: candidate.email,
          candidateName: candidate.name,
          meetingTitle: title,
          meetingDescription: description,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          meetLink: googleMeetLink,
          organizerName: organizer.name,
          meetingType,
        });
      } catch (emailErr) {
        logger.error(`Failed to send invite to ${candidate.email}:`, emailErr);
      }
    }

    await AuditLog.create({
      user: organizer._id,
      action: 'meeting_created',
      resource: 'Meeting',
      resourceId: meeting._id.toString(),
    });

    const populated = await Meeting.findById(meeting._id).populate('organizer candidates', 'name email profileImage');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    logger.error('Create meeting error:', error);
    res.status(500).json({ success: false, message: 'Failed to create meeting' });
  }
};

export const getMeetings: RequestHandler = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;
    const user = (req as AuthRequest).user!;

    const filter: any = {};
    if (user.role === 'teacher') {
      filter.organizer = user._id;
    } else {
      filter.candidates = user._id;
    }
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate as string);
      if (endDate) filter.startTime.$lte = new Date(endDate as string);
    }

    const total = await Meeting.countDocuments(filter);
    const meetings = await Meeting.find(filter)
      .populate('organizer candidates', 'name email profileImage')
      .sort({ startTime: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ success: true, data: meetings, total, page: Number(page), limit: Number(limit) });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getMeetingById: RequestHandler = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id).populate('organizer candidates', 'name email profileImage');
    if (!meeting) {
      res.status(404).json({ success: false, message: 'Meeting not found' });
      return;
    }

    const user = (req as AuthRequest).user!;
    const isOrganizer = meeting.organizer._id.toString() === user._id.toString();
    const isCandidate = meeting.candidates.some((c: any) => c._id.toString() === user._id.toString());

    if (!isOrganizer && !isCandidate) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    res.json({ success: true, data: meeting });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateMeeting: RequestHandler = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id).populate('candidates', 'name email');
    if (!meeting) {
      res.status(404).json({ success: false, message: 'Meeting not found' });
      return;
    }

    const user = (req as AuthRequest).user!;
    if (meeting.organizer.toString() !== user._id.toString()) {
      res.status(403).json({ success: false, message: 'Only organizer can update meeting' });
      return;
    }

    const oldStartTime = meeting.startTime;
    const { startTime, endTime, title, description, notes } = req.body;

    Object.assign(meeting, req.body);
    if (startTime) meeting.startTime = new Date(startTime);
    if (endTime) meeting.endTime = new Date(endTime);
    if (startTime) meeting.rescheduledFrom = oldStartTime;
    meeting.status = 'rescheduled';
    await meeting.save();

    if (meeting.googleEventId && user.refreshToken) {
      await updateCalendarEvent(user.refreshToken, meeting.googleEventId, {
        title: title || meeting.title,
        description: description || meeting.description,
        startTime: startTime ? new Date(startTime) : meeting.startTime,
        endTime: endTime ? new Date(endTime) : meeting.endTime,
      });
    }

    const candidateList = await User.find({ _id: { $in: meeting.candidates } });
    for (const candidate of candidateList) {
      try {
        await sendRescheduleEmail({
          to: candidate.email,
          candidateName: candidate.name,
          meetingTitle: meeting.title,
          meetingDescription: meeting.description,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          meetLink: meeting.googleMeetLink,
          organizerName: user.name,
          meetingType: meeting.meetingType,
        }, oldStartTime);
      } catch { /* skip */ }
    }

    await AuditLog.create({
      user: user._id,
      action: 'meeting_updated',
      resource: 'Meeting',
      resourceId: meeting._id.toString(),
    });

    const populated = await Meeting.findById(meeting._id).populate('organizer candidates', 'name email profileImage');
    res.json({ success: true, data: populated });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const cancelMeeting: RequestHandler = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      res.status(404).json({ success: false, message: 'Meeting not found' });
      return;
    }

    const user = (req as AuthRequest).user!;
    if (meeting.organizer.toString() !== user._id.toString()) {
      res.status(403).json({ success: false, message: 'Only organizer can cancel meeting' });
      return;
    }

    meeting.status = 'cancelled';
    meeting.cancelledAt = new Date();
    meeting.cancelReason = req.body.reason;
    await meeting.save();

    if (meeting.googleEventId && user.refreshToken) {
      await deleteCalendarEvent(user.refreshToken, meeting.googleEventId);
    }

    await cancelReminders(meeting._id.toString());

    const candidates = await User.find({ _id: { $in: meeting.candidates } });
    for (const candidate of candidates) {
      try {
        await sendCancellationEmail(
          candidate.email, candidate.name, meeting.title,
          meeting.startTime, user.name, req.body.reason
        );
      } catch { /* skip */ }
    }

    await AuditLog.create({
      user: user._id,
      action: 'meeting_cancelled',
      resource: 'Meeting',
      resourceId: meeting._id.toString(),
    });

    res.json({ success: true, message: 'Meeting cancelled successfully' });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getDashboardStats: RequestHandler = async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    const now = new Date();

    if (user.role === 'teacher') {
      const [total, upcoming, completed, cancelled] = await Promise.all([
        Meeting.countDocuments({ organizer: user._id }),
        Meeting.countDocuments({ organizer: user._id, startTime: { $gt: now }, status: 'scheduled' }),
        Meeting.countDocuments({ organizer: user._id, status: 'completed' }),
        Meeting.countDocuments({ organizer: user._id, status: 'cancelled' }),
      ]);

      const attendanceData = await Attendance.aggregate([
        { $lookup: { from: 'meetings', localField: 'meeting', foreignField: '_id', as: 'meeting' } },
        { $unwind: '$meeting' },
        { $match: { 'meeting.organizer': user._id } },
        { $group: { _id: null, total: { $sum: 1 }, present: { $sum: { $cond: [{ $ne: ['$status', 'absent'] }, 1, 0] } } } },
      ]);

      const attendancePct = attendanceData[0]
        ? Math.round((attendanceData[0].present / attendanceData[0].total) * 100)
        : 0;

      const upcomingMeetings = await Meeting.find({
        organizer: user._id, startTime: { $gt: now }, status: 'scheduled',
      }).populate('candidates', 'name email profileImage').sort({ startTime: 1 }).limit(5);

      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
      const todayMeetings = await Meeting.find({
        organizer: user._id,
        startTime: { $gte: todayStart, $lte: todayEnd },
      }).populate('candidates', 'name email');

      res.json({ success: true, data: { total, upcoming, completed, cancelled, attendancePct, upcomingMeetings, todayMeetings } });
    } else {
      const [upcoming, history] = await Promise.all([
        Meeting.find({ candidates: user._id, startTime: { $gt: now }, status: 'scheduled' })
          .populate('organizer', 'name email profileImage').sort({ startTime: 1 }).limit(5),
        Meeting.find({ candidates: user._id, startTime: { $lte: now } })
          .populate('organizer', 'name email profileImage').sort({ startTime: -1 }).limit(10),
      ]);

      const attendance = await Attendance.find({ candidate: user._id })
        .populate({ path: 'meeting', populate: { path: 'organizer', select: 'name' } });

      res.json({ success: true, data: { upcoming, history, attendance } });
    }
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
