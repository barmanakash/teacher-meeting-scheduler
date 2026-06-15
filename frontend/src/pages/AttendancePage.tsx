import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, UserCheck } from 'lucide-react';
import { attendanceApi, meetingsApi } from '../services/api';
import { Attendance, AttendanceStatus, Meeting, User } from '../types';
import { format } from 'date-fns';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const STATUSES: AttendanceStatus[] = ['present', 'late', 'left_early', 'absent'];

const statusColor: Record<AttendanceStatus, string> = {
  present: 'bg-green-100 text-green-700 border-green-300',
  late: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  left_early: 'bg-orange-100 text-orange-700 border-orange-300',
  absent: 'bg-red-100 text-red-700 border-red-300',
};

const AttendancePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [records, setRecords] = useState<Record<string, Partial<Attendance>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [mRes, aRes] = await Promise.all([
          meetingsApi.getById(id),
          attendanceApi.getMeetingAttendance(id),
        ]);
        setMeeting(mRes.data.data);
        const att = aRes.data.data as Attendance[];
        setAttendances(att);
        const rec: Record<string, Partial<Attendance>> = {};
        att.forEach((a) => {
          const cId = typeof a.candidate === 'object' ? (a.candidate as User)._id : a.candidate as string;
          rec[cId] = { status: a.status, joinTime: a.joinTime, leaveTime: a.leaveTime };
        });
        setRecords(rec);
      } catch { toast.error('Failed to load attendance'); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleChange = (candidateId: string, field: string, value: string) => {
    setRecords((prev) => ({ ...prev, [candidateId]: { ...prev[candidateId], [field]: value } }));
  };

  const handleSave = async () => {
    if (!id || !meeting) return;
    setSaving(true);
    try {
      const payload = meeting.candidates.map((c: any) => ({
        candidateId: c._id,
        status: records[c._id]?.status || 'absent',
        joinTime: records[c._id]?.joinTime,
        leaveTime: records[c._id]?.leaveTime,
      }));
      await attendanceApi.bulkMark(id, payload);
      toast.success('Attendance saved!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (!meeting) return <div className="text-center py-16 text-gray-400">Meeting not found</div>;

  const presentCount = Object.values(records).filter((r) => r.status && r.status !== 'absent').length;
  const total = meeting.candidates.length;
  const pct = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Attendance — {meeting.title}</h1>
          <p className="text-gray-500 text-sm">{format(new Date(meeting.startTime), 'MMMM d, yyyy · h:mm a')}</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center py-4">
          <p className="text-3xl font-bold text-indigo-600">{total}</p>
          <p className="text-xs text-gray-500 mt-1">Total</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-3xl font-bold text-green-600">{presentCount}</p>
          <p className="text-xs text-gray-500 mt-1">Present</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-3xl font-bold text-gray-700">{pct}%</p>
          <p className="text-xs text-gray-500 mt-1">Rate</p>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck size={16} className="text-indigo-500" />
            <h2 className="font-semibold text-gray-900">Mark Attendance</h2>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 text-sm">
            {saving ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>

        <div className="divide-y divide-gray-50">
          {meeting.candidates.map((c: any) => {
            const rec = records[c._id] || {};
            return (
              <div key={c._id} className="px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* User Info */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600 flex-shrink-0">
                      {c.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.email}</p>
                    </div>
                  </div>

                  {/* Status Select */}
                  <div className="flex flex-wrap items-center gap-2">
                    {STATUSES.map((s) => (
                      <button key={s} type="button"
                        onClick={() => handleChange(c._id, 'status', s)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                          rec.status === s ? statusColor[s] : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300'
                        }`}>
                        {s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Times */}
                <div className="flex flex-wrap gap-3 mt-3 ml-12">
                  <div>
                    <label className="text-xs text-gray-400">Join Time</label>
                    <input type="datetime-local"
                      value={rec.joinTime ? format(new Date(rec.joinTime), "yyyy-MM-dd'T'HH:mm") : ''}
                      onChange={(e) => handleChange(c._id, 'joinTime', e.target.value)}
                      className="block input py-1 text-xs mt-0.5" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Leave Time</label>
                    <input type="datetime-local"
                      value={rec.leaveTime ? format(new Date(rec.leaveTime), "yyyy-MM-dd'T'HH:mm") : ''}
                      onChange={(e) => handleChange(c._id, 'leaveTime', e.target.value)}
                      className="block input py-1 text-xs mt-0.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
