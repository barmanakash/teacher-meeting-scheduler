import Bull from 'bull';
import Meeting from '../models/Meeting.model';
import User from '../models/User.model';
import Notification from '../models/Notification.model';
import { sendMeetingReminder } from '../services/email.service';
import { logger } from '../utils/logger';

const reminderQueue = new Bull('reminders', {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
});

reminderQueue.process(async (job) => {
  const { meetingId, type } = job.data;

  try {
    const meeting = await Meeting.findById(meetingId).populate('candidates organizer', 'name email refreshToken');
    if (!meeting || meeting.status === 'cancelled') return;

    const candidates = await User.find({ _id: { $in: meeting.candidates } });
    const organizer = meeting.organizer as any;

    for (const candidate of candidates) {
      try {
        await sendMeetingReminder(
          {
            to: candidate.email,
            candidateName: candidate.name,
            meetingTitle: meeting.title,
            meetingDescription: meeting.description,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            meetLink: meeting.googleMeetLink,
            organizerName: organizer.name || 'Organizer',
            meetingType: meeting.meetingType,
          },
          type
        );

        await Notification.findOneAndUpdate(
          { meeting: meetingId, recipient: candidate._id, type: `reminder_${type}` },
          { status: 'sent', sentAt: new Date() },
          { upsert: true }
        );
      } catch (err) {
        logger.error(`Failed to send ${type} reminder to ${candidate.email}:`, err);
      }
    }

    logger.info(`Sent ${type} reminders for meeting ${meetingId}`);
  } catch (error) {
    logger.error('Reminder job error:', error);
    throw error;
  }
});

reminderQueue.on('failed', (job, err) => {
  logger.error(`Reminder job ${job.id} failed:`, err);
});

export const scheduleReminders = async (meetingId: string, startTime: Date): Promise<void> => {
  try {
    const now = Date.now();
    const start = startTime.getTime();

    const reminders: { delay: number; type: '24h' | '1h' | '15m' }[] = [
      { delay: start - 24 * 60 * 60 * 1000 - now, type: '24h' },
      { delay: start - 60 * 60 * 1000 - now, type: '1h' },
      { delay: start - 15 * 60 * 1000 - now, type: '15m' },
    ];

    for (const reminder of reminders) {
      if (reminder.delay > 0) {
        await reminderQueue.add(
          { meetingId, type: reminder.type },
          { delay: reminder.delay, jobId: `${meetingId}-${reminder.type}`, removeOnComplete: true }
        );
      }
    }
    logger.info(`Scheduled reminders for meeting ${meetingId}`);
  } catch (error) {
    logger.error('Error scheduling reminders:', error);
  }
};

export const cancelReminders = async (meetingId: string): Promise<void> => {
  try {
    for (const type of ['24h', '1h', '15m']) {
      const job = await reminderQueue.getJob(`${meetingId}-${type}`);
      if (job) await job.remove();
    }
    logger.info(`Cancelled reminders for meeting ${meetingId}`);
  } catch (error) {
    logger.error('Error cancelling reminders:', error);
  }
};

export default reminderQueue;
