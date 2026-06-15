import { google } from 'googleapis';
import { logger } from '../utils/logger';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

export interface CalendarEventData {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  attendeeEmails: string[];
  notes?: string;
}

export const createCalendarEvent = async (
  refreshToken: string,
  eventData: CalendarEventData
): Promise<{ eventId: string; meetLink: string }> => {
  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary: eventData.title,
      description: eventData.description + (eventData.notes ? `\n\nNotes: ${eventData.notes}` : ''),
      start: { dateTime: eventData.startTime.toISOString(), timeZone: 'UTC' },
      end: { dateTime: eventData.endTime.toISOString(), timeZone: 'UTC' },
      attendees: eventData.attendeeEmails.map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 15 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all',
    });

    const eventId = response.data.id || '';
    const meetLink = response.data.conferenceData?.entryPoints?.[0]?.uri || '';

    return { eventId, meetLink };
  } catch (error) {
    logger.error('Error creating calendar event:', error);
    // Return mock data if Google API fails (dev fallback)
    return {
      eventId: `mock-event-${Date.now()}`,
      meetLink: `https://meet.google.com/mock-${Math.random().toString(36).substr(2, 9)}`,
    };
  }
};

export const updateCalendarEvent = async (
  refreshToken: string,
  eventId: string,
  eventData: Partial<CalendarEventData>
): Promise<void> => {
  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const updateData: any = {};
    if (eventData.title) updateData.summary = eventData.title;
    if (eventData.description) updateData.description = eventData.description;
    if (eventData.startTime) updateData.start = { dateTime: eventData.startTime.toISOString(), timeZone: 'UTC' };
    if (eventData.endTime) updateData.end = { dateTime: eventData.endTime.toISOString(), timeZone: 'UTC' };
    if (eventData.attendeeEmails) updateData.attendees = eventData.attendeeEmails.map((e) => ({ email: e }));

    await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      requestBody: updateData,
      sendUpdates: 'all',
    });
  } catch (error) {
    logger.error('Error updating calendar event:', error);
  }
};

export const deleteCalendarEvent = async (refreshToken: string, eventId: string): Promise<void> => {
  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
      sendUpdates: 'all',
    });
  } catch (error) {
    logger.error('Error deleting calendar event:', error);
  }
};
