import { Router } from 'express';
import { authenticate, requireTeacher } from '../middleware/auth.middleware';
import {
  getMeetingAttendance, markAttendance, bulkMarkAttendance,
  getCandidateAttendance, joinMeeting, leaveMeeting,
} from '../controllers/attendance.controller';

const router = Router();

router.get('/my', authenticate, getCandidateAttendance);
router.get('/candidate/:candidateId', authenticate, requireTeacher, getCandidateAttendance);
router.get('/meeting/:meetingId', authenticate, requireTeacher, getMeetingAttendance);
router.post('/meeting/:meetingId/mark', authenticate, requireTeacher, markAttendance);
router.post('/meeting/:meetingId/bulk', authenticate, requireTeacher, bulkMarkAttendance);
router.post('/meeting/:meetingId/join', authenticate, joinMeeting);
router.post('/meeting/:meetingId/leave', authenticate, leaveMeeting);

export default router;
