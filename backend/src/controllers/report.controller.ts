import { RequestHandler } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import Meeting from '../models/Meeting.model';
import Attendance from '../models/Attendance.model';
import AuditLog from '../models/AuditLog.model';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAnalytics: RequestHandler = async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    const { startDate, endDate } = req.query;
    const filter: any = { organizer: user._id };
    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate as string);
      if (endDate) filter.startTime.$lte = new Date(endDate as string);
    }

    const meetings = await Meeting.find(filter).populate('candidates', 'name email');
    const meetingIds = meetings.map((m) => m._id);

    const attendanceStats = await Attendance.aggregate([
      { $match: { meeting: { $in: meetingIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const totalParticipants = await Attendance.countDocuments({ meeting: { $in: meetingIds } });
    const presentCount = attendanceStats
      .filter((s) => s._id !== 'absent')
      .reduce((sum, s) => sum + s.count, 0);
    const attendanceRate = totalParticipants > 0 ? Math.round((presentCount / totalParticipants) * 100) : 0;

    const avgDurationResult = await Attendance.aggregate([
      { $match: { meeting: { $in: meetingIds }, duration: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: '$duration' } } },
    ]);

    const meetingTypeStats = await Meeting.aggregate([
      { $match: filter },
      { $group: { _id: '$meetingType', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        totalMeetings: meetings.length,
        totalParticipants,
        attendanceRate,
        noShowRate: 100 - attendanceRate,
        avgDuration: Math.round(avgDurationResult[0]?.avg || 0),
        attendanceStats,
        meetingTypeStats,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const exportExcel: RequestHandler = async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    const { meetingId } = req.query;
    const filter: any = { organizer: user._id };
    if (meetingId) filter._id = meetingId;

    const meetings = await Meeting.find(filter).populate('candidates organizer', 'name email');
    const meetingIds = meetings.map((m) => m._id);

    const attendances = await Attendance.find({ meeting: { $in: meetingIds } })
      .populate('candidate meeting', 'name email title startTime endTime');

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Teacher Meeting Scheduler';

    const summarySheet = workbook.addWorksheet('Meeting Summary');
    summarySheet.columns = [
      { header: 'Meeting Title', key: 'title', width: 30 },
      { header: 'Type', key: 'type', width: 20 },
      { header: 'Start Time', key: 'startTime', width: 25 },
      { header: 'End Time', key: 'endTime', width: 25 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Total Candidates', key: 'total', width: 18 },
    ];
    const headerRow = summarySheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };

    meetings.forEach((m) => {
      summarySheet.addRow({
        title: m.title, type: m.meetingType,
        startTime: new Date(m.startTime).toLocaleString(),
        endTime: new Date(m.endTime).toLocaleString(),
        status: m.status, total: m.candidates.length,
      });
    });

    const attendanceSheet = workbook.addWorksheet('Attendance Details');
    attendanceSheet.columns = [
      { header: 'Meeting', key: 'meeting', width: 30 },
      { header: 'Candidate Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Join Time', key: 'joinTime', width: 25 },
      { header: 'Leave Time', key: 'leaveTime', width: 25 },
      { header: 'Duration (mins)', key: 'duration', width: 18 },
      { header: 'Status', key: 'status', width: 15 },
    ];
    const attHeaderRow = attendanceSheet.getRow(1);
    attHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    attHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };

    attendances.forEach((a: any) => {
      attendanceSheet.addRow({
        meeting: a.meeting?.title || '',
        name: a.candidate?.name || '',
        email: a.candidate?.email || '',
        joinTime: a.joinTime ? new Date(a.joinTime).toLocaleString() : 'N/A',
        leaveTime: a.leaveTime ? new Date(a.leaveTime).toLocaleString() : 'N/A',
        duration: a.duration || 0,
        status: a.status,
      });
    });

    await AuditLog.create({ user: user._id, action: 'report_downloaded', resource: 'Report', details: { format: 'xlsx' } });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch {
    res.status(500).json({ success: false, message: 'Export failed' });
  }
};

export const exportPDF: RequestHandler = async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    const { meetingId } = req.query;
    const filter: any = { organizer: user._id };
    if (meetingId) filter._id = meetingId;

    const meetings = await Meeting.find(filter);
    const meetingIds = meetings.map((m) => m._id);
    const attendances = await Attendance.find({ meeting: { $in: meetingIds } })
      .populate('candidate', 'name email')
      .populate('meeting', 'title startTime');

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.pdf');
    doc.pipe(res);

    doc.rect(0, 0, doc.page.width, 80).fill('#4F46E5');
    doc.fill('white').fontSize(22).text('Attendance Report', 40, 25);
    doc.fontSize(11).text(`Generated: ${new Date().toLocaleString()}`, 40, 52);
    doc.fill('black').moveDown(3);

    doc.fontSize(14).text('Summary', { underline: true });
    doc.fontSize(11)
      .text(`Total Meetings: ${meetings.length}`)
      .text(`Total Attendance Records: ${attendances.length}`)
      .text(`Teacher: ${user.name}`)
      .moveDown();

    doc.fontSize(14).text('Attendance Details', { underline: true }).moveDown(0.5);

    const headers = ['Meeting', 'Candidate', 'Status', 'Duration'];
    const colWidths = [160, 140, 80, 80];
    let x = 40;
    let y = doc.y;

    doc.rect(x, y, colWidths.reduce((a, b) => a + b), 20).fill('#4F46E5');
    doc.fill('white').fontSize(10);
    headers.forEach((h, i) => {
      doc.text(h, x + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 4, y + 5, { width: colWidths[i] - 8 });
    });
    y += 20;

    doc.fill('black');
    attendances.forEach((a: any, idx) => {
      if (y > 750) { doc.addPage(); y = 40; }
      const rowColor = idx % 2 === 0 ? '#f9fafb' : 'white';
      doc.rect(40, y, colWidths.reduce((a, b) => a + b, 0), 18).fill(rowColor);
      doc.fill('black').fontSize(9);
      const cols = [
        (a.meeting?.title || '').substring(0, 22),
        a.candidate?.name || '',
        a.status,
        `${a.duration || 0} min`,
      ];
      cols.forEach((col, i) => {
        doc.text(col, x + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 4, y + 5, { width: colWidths[i] - 8 });
      });
      y += 18;
    });

    doc.end();
    await AuditLog.create({ user: user._id, action: 'report_downloaded', resource: 'Report', details: { format: 'pdf' } });
  } catch {
    res.status(500).json({ success: false, message: 'PDF export failed' });
  }
};
