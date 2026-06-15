import { Response, RequestHandler } from 'express';
import Attendance from '../models/Attendance.model';
import Meeting from '../models/Meeting.model';
import AuditLog from '../models/AuditLog.model';
import { AuthRequest } from '../middleware/auth.middleware';

export const getMeetingAttendance: RequestHandler = async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    const meeting = await Meeting.findById(req.params.meetingId);
    if (!meeting) { res.status(404).json({ success: false, message: 'Meeting not found' }); return; }
    if (meeting.organizer.toString() !== user._id.toString()) {
      res.status(403).json({ success: false, message: 'Access denied' }); return;
    }
    const attendance = await Attendance.find({ meeting: req.params.meetingId })
      .populate('candidate', 'name email profileImage');
    res.json({ success: true, data: attendance });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const markAttendance: RequestHandler = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { candidateId, status, joinTime, leaveTime } = req.body;
    const user = (req as AuthRequest).user!;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) { res.status(404).json({ success: false, message: 'Meeting not found' }); return; }
    if (meeting.organizer.toString() !== user._id.toString()) {
      res.status(403).json({ success: false, message: 'Access denied' }); return;
    }

    let duration = 0;
    if (joinTime && leaveTime) {
      duration = Math.round((new Date(leaveTime).getTime() - new Date(joinTime).getTime()) / 60000);
    }

    const attendance = await Attendance.findOneAndUpdate(
      { meeting: meetingId, candidate: candidateId },
      { status, joinTime: joinTime ? new Date(joinTime) : undefined, leaveTime: leaveTime ? new Date(leaveTime) : undefined, duration, markedBy: user._id },
      { new: true, upsert: true }
    ).populate('candidate', 'name email');

    await AuditLog.create({ user: user._id, action: 'attendance_updated', resource: 'Attendance', resourceId: attendance._id?.toString() });
    res.json({ success: true, data: attendance });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const bulkMarkAttendance: RequestHandler = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { records } = req.body;
    const user = (req as AuthRequest).user!;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) { res.status(404).json({ success: false, message: 'Meeting not found' }); return; }
    if (meeting.organizer.toString() !== user._id.toString()) {
      res.status(403).json({ success: false, message: 'Access denied' }); return;
    }

    const updates = records.map(async (r: any) => {
      let duration = 0;
      if (r.joinTime && r.leaveTime) {
        duration = Math.round((new Date(r.leaveTime).getTime() - new Date(r.joinTime).getTime()) / 60000);
      }
      return Attendance.findOneAndUpdate(
        { meeting: meetingId, candidate: r.candidateId },
        { status: r.status, joinTime: r.joinTime, leaveTime: r.leaveTime, duration, markedBy: user._id },
        { new: true, upsert: true }
      );
    });

    const results = await Promise.all(updates);
    res.json({ success: true, data: results });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getCandidateAttendance: RequestHandler = async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    const candidateId = req.params.candidateId || user._id;
    const attendance = await Attendance.find({ candidate: candidateId })
      .populate({ path: 'meeting', populate: { path: 'organizer', select: 'name' }, select: 'title startTime endTime meetingType googleMeetLink' })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: attendance });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const joinMeeting: RequestHandler = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const user = (req as AuthRequest).user!;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) { res.status(404).json({ success: false, message: 'Meeting not found' }); return; }

    const isCandidate = meeting.candidates.some((c) => c.toString() === user._id.toString());
    if (!isCandidate) { res.status(403).json({ success: false, message: 'You are not in this meeting' }); return; }

    const now = new Date();
    const isLate = now > new Date(meeting.startTime.getTime() + 5 * 60000);

    const attendance = await Attendance.findOneAndUpdate(
      { meeting: meetingId, candidate: user._id },
      { joinTime: now, status: isLate ? 'late' : 'present' },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: attendance, meetLink: meeting.googleMeetLink });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const leaveMeeting: RequestHandler = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const user = (req as AuthRequest).user!;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) { res.status(404).json({ success: false, message: 'Meeting not found' }); return; }

    const now = new Date();
    const attendance = await Attendance.findOne({ meeting: meetingId, candidate: user._id });
    if (!attendance) { res.status(404).json({ success: false, message: 'Attendance record not found' }); return; }

    attendance.leaveTime = now;
    const leftEarly = now < new Date(meeting.endTime.getTime() - 5 * 60000);
    if (leftEarly && attendance.status === 'present') attendance.status = 'left_early';
    if (attendance.joinTime) {
      attendance.duration = Math.round((now.getTime() - attendance.joinTime.getTime()) / 60000);
    }
    await attendance.save();

    res.json({ success: true, data: attendance });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
