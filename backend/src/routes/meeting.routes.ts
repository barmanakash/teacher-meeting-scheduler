import { Router } from 'express';
import { authenticate, requireTeacher } from '../middleware/auth.middleware';
import {
  createMeeting, getMeetings, getMeetingById,
  updateMeeting, cancelMeeting, getDashboardStats,
} from '../controllers/meeting.controller';

const router = Router();

/**
 * @swagger
 * /meetings/dashboard:
 *   get:
 *     summary: Get dashboard stats
 *     tags: [Meetings]
 *     responses:
 *       200:
 *         description: Dashboard data
 */
router.get('/dashboard', authenticate, getDashboardStats);

/**
 * @swagger
 * /meetings:
 *   get:
 *     summary: Get all meetings for current user
 *     tags: [Meetings]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of meetings
 */
router.get('/', authenticate, getMeetings);

/**
 * @swagger
 * /meetings/{id}:
 *   get:
 *     summary: Get meeting by ID
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Meeting data
 */
router.get('/:id', authenticate, getMeetingById);

/**
 * @swagger
 * /meetings:
 *   post:
 *     summary: Create a new meeting
 *     tags: [Meetings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, meetingType, candidates, startTime, endTime]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               meetingType:
 *                 type: string
 *               candidates:
 *                 type: array
 *                 items:
 *                   type: string
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               recurrence:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Meeting created
 */
router.post('/', authenticate, requireTeacher, createMeeting);

/**
 * @swagger
 * /meetings/{id}:
 *   put:
 *     summary: Update a meeting (reschedule)
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Meeting updated
 */
router.put('/:id', authenticate, requireTeacher, updateMeeting);

/**
 * @swagger
 * /meetings/{id}/cancel:
 *   patch:
 *     summary: Cancel a meeting
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Meeting cancelled
 */
router.patch('/:id/cancel', authenticate, requireTeacher, cancelMeeting);

export default router;
