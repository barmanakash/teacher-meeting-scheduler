export interface User {
  _id: string;
  googleId: string;
  name: string;
  email: string;
  profileImage: string;
  role: 'teacher' | 'candidate';
  lastLogin: string;
  createdAt: string;
}

export type MeetingType = 'Interview' | 'Technical Assessment' | 'Training' | 'Classroom' | 'Mentorship' | 'Mock Interview' | 'Group Discussion';
export type MeetingStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'rescheduled';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Meeting {
  _id: string;
  title: string;
  description: string;
  meetingType: MeetingType;
  organizer: User;
  candidates: User[];
  startTime: string;
  endTime: string;
  googleMeetLink: string;
  googleEventId: string;
  status: MeetingStatus;
  recurrence: RecurrenceType;
  recurrenceEndDate?: string;
  notes?: string;
  cancelledAt?: string;
  cancelReason?: string;
  rescheduledFrom?: string;
  createdAt: string;
  updatedAt: string;
}

export type AttendanceStatus = 'present' | 'late' | 'left_early' | 'absent';

export interface Attendance {
  _id: string;
  meeting: Meeting | string;
  candidate: User | string;
  joinTime?: string;
  leaveTime?: string;
  duration?: number;
  status: AttendanceStatus;
  markedBy?: string;
  createdAt: string;
}

export interface Analytics {
  totalMeetings: number;
  totalParticipants: number;
  attendanceRate: number;
  noShowRate: number;
  avgDuration: number;
  attendanceStats: { _id: string; count: number }[];
  meetingTypeStats: { _id: string; count: number }[];
}

export interface DashboardStats {
  total?: number;
  upcoming?: number;
  completed?: number;
  cancelled?: number;
  attendancePct?: number;
  upcomingMeetings?: Meeting[];
  todayMeetings?: Meeting[];
  history?: Meeting[];
  attendance?: Attendance[];
}

export interface Availability {
  _id: string;
  teacher: string;
  workingHours: { start: string; end: string };
  workingDays: number[];
  holidays: string[];
  blockedSlots: { start: string; end: string; reason?: string }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
  page?: number;
  limit?: number;
}

export type CreateMeetingDto = {
  title: string;
  description: string;
  meetingType: MeetingType;
  candidates: string[];
  startTime: string;
  endTime: string;
  recurrence: RecurrenceType;
  recurrenceEndDate?: string;
  notes?: string;
};
