import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

const getTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

interface MeetingEmailData {
  to: string;
  candidateName: string;
  meetingTitle: string;
  meetingDescription: string;
  startTime: Date;
  endTime: Date;
  meetLink: string;
  organizerName: string;
  meetingType: string;
}

const formatDateTime = (date: Date): string => {
  return date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
};

export const sendMeetingInvitation = async (data: MeetingEmailData): Promise<void> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px;">
      <div style="background: #4F46E5; color: white; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Meeting Invitation</h1>
      </div>
      <div style="background: white; padding: 24px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <p>Hi <strong>${data.candidateName}</strong>,</p>
        <p>You have been invited to a meeting by <strong>${data.organizerName}</strong>.</p>
        
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h2 style="color: #4F46E5; margin-top: 0;">${data.meetingTitle}</h2>
          <p><strong>Type:</strong> ${data.meetingType}</p>
          <p><strong>Description:</strong> ${data.meetingDescription || 'N/A'}</p>
          <p><strong>Start:</strong> ${formatDateTime(data.startTime)}</p>
          <p><strong>End:</strong> ${formatDateTime(data.endTime)}</p>
        </div>
        
        <div style="text-align: center; margin: 24px 0;">
          <a href="${data.meetLink}" style="background: #4F46E5; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            Join Google Meet
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">Meet Link: <a href="${data.meetLink}">${data.meetLink}</a></p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          Teacher Meeting Scheduler — This is an automated notification.
        </p>
      </div>
    </div>
  `;

  try {
    await getTransporter().sendMail({
      from: `"Meeting Scheduler" <${process.env.EMAIL_USER}>`,
      to: data.to,
      subject: `Meeting Invitation: ${data.meetingTitle}`,
      html,
    });
    logger.info(`Invitation email sent to ${data.to}`);
  } catch (error) {
    logger.error(`Failed to send invitation to ${data.to}:`, error);
    throw error;
  }
};

export const sendMeetingReminder = async (
  data: MeetingEmailData,
  reminderType: '24h' | '1h' | '15m'
): Promise<void> => {
  const timeLabels = { '24h': '24 hours', '1h': '1 hour', '15m': '15 minutes' };
  const timeLabel = timeLabels[reminderType];

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #F59E0B; color: white; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0;">⏰ Meeting Reminder</h1>
        <p style="margin: 8px 0 0;">Your meeting starts in <strong>${timeLabel}</strong></p>
      </div>
      <div style="background: white; padding: 24px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <p>Hi <strong>${data.candidateName}</strong>,</p>
        <p>This is a reminder that your meeting <strong>${data.meetingTitle}</strong> starts in <strong>${timeLabel}</strong>.</p>
        
        <div style="background: #fef3c7; border-left: 4px solid #F59E0B; padding: 16px; margin: 16px 0;">
          <p><strong>Start:</strong> ${formatDateTime(data.startTime)}</p>
          <p><strong>Organizer:</strong> ${data.organizerName}</p>
        </div>
        
        <div style="text-align: center; margin: 24px 0;">
          <a href="${data.meetLink}" style="background: #F59E0B; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            Join Meeting Now
          </a>
        </div>
      </div>
    </div>
  `;

  try {
    await getTransporter().sendMail({
      from: `"Meeting Scheduler" <${process.env.EMAIL_USER}>`,
      to: data.to,
      subject: `Reminder: ${data.meetingTitle} starts in ${timeLabel}`,
      html,
    });
    logger.info(`Reminder email (${reminderType}) sent to ${data.to}`);
  } catch (error) {
    logger.error(`Failed to send reminder to ${data.to}:`, error);
    throw error;
  }
};

export const sendCancellationEmail = async (
  to: string,
  candidateName: string,
  meetingTitle: string,
  startTime: Date,
  organizerName: string,
  reason?: string
): Promise<void> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #EF4444; color: white; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0;">❌ Meeting Cancelled</h1>
      </div>
      <div style="background: white; padding: 24px; border-radius: 0 0 8px 8px;">
        <p>Hi <strong>${candidateName}</strong>,</p>
        <p>The meeting <strong>${meetingTitle}</strong> scheduled for <strong>${formatDateTime(startTime)}</strong> has been cancelled by <strong>${organizerName}</strong>.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>If you have any questions, please contact your organizer directly.</p>
      </div>
    </div>
  `;

  try {
    await getTransporter().sendMail({
      from: `"Meeting Scheduler" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Meeting Cancelled: ${meetingTitle}`,
      html,
    });
  } catch (error) {
    logger.error(`Failed to send cancellation email to ${to}:`, error);
    throw error;
  }
};

export const sendRescheduleEmail = async (data: MeetingEmailData, oldStartTime: Date): Promise<void> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #8B5CF6; color: white; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0;">🔄 Meeting Rescheduled</h1>
      </div>
      <div style="background: white; padding: 24px; border-radius: 0 0 8px 8px;">
        <p>Hi <strong>${data.candidateName}</strong>,</p>
        <p>The meeting <strong>${data.meetingTitle}</strong> has been rescheduled.</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px;">
          <p><strong>Old Time:</strong> <s>${formatDateTime(oldStartTime)}</s></p>
          <p><strong>New Time:</strong> ${formatDateTime(data.startTime)}</p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${data.meetLink}" style="background: #8B5CF6; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            Join Meeting
          </a>
        </div>
      </div>
    </div>
  `;

  try {
    await getTransporter().sendMail({
      from: `"Meeting Scheduler" <${process.env.EMAIL_USER}>`,
      to: data.to,
      subject: `Meeting Rescheduled: ${data.meetingTitle}`,
      html,
    });
  } catch (error) {
    logger.error(`Failed to send reschedule email to ${data.to}:`, error);
    throw error;
  }
};
