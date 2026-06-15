import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle, XCircle, TrendingUp, Clock, Video, Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchDashboard } from '../store/slices/meetingsSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { format } from 'date-fns';
import { Meeting, Attendance } from '../types';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({
  title, value, icon, color,
}) => (
  <div className="card flex items-center gap-4">
    <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const DashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const { dashboardStats, loading } = useAppSelector((s) => s.meetings);

  useEffect(() => { dispatch(fetchDashboard()); }, [dispatch]);

  if (loading && !dashboardStats) return <LoadingSpinner />;
  const stats = dashboardStats;

  if (user?.role === 'teacher') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Welcome back, {user.name}</p>
          </div>
          <button onClick={() => navigate('/meetings/new')} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Meeting
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Meetings" value={stats?.total ?? 0} icon={<Calendar size={20} className="text-indigo-600" />} color="bg-indigo-100" />
          <StatCard title="Upcoming" value={stats?.upcoming ?? 0} icon={<Clock size={20} className="text-blue-600" />} color="bg-blue-100" />
          <StatCard title="Completed" value={stats?.completed ?? 0} icon={<CheckCircle size={20} className="text-green-600" />} color="bg-green-100" />
          <StatCard title="Cancelled" value={stats?.cancelled ?? 0} icon={<XCircle size={20} className="text-red-600" />} color="bg-red-100" />
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Overall Attendance Rate</h2>
            <TrendingUp size={18} className="text-green-500" />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gray-200 rounded-full h-4">
              <div className="bg-gradient-to-r from-indigo-500 to-green-500 h-4 rounded-full transition-all" style={{ width: `${stats?.attendancePct ?? 0}%` }} />
            </div>
            <span className="text-2xl font-bold text-gray-900">{stats?.attendancePct ?? 0}%</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Today's Meetings</h2>
            {!stats?.todayMeetings?.length ? (
              <div className="text-center py-8 text-gray-400"><Calendar size={40} className="mx-auto mb-2 opacity-40" /><p className="text-sm">No meetings today</p></div>
            ) : (
              <div className="space-y-3">
                {stats?.todayMeetings?.map((m: Meeting) => (
                  <div key={m._id} onClick={() => navigate(`/meetings/${m._id}`)}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 cursor-pointer transition-colors">
                    <div>
                      <p className="font-medium text-sm">{m.title}</p>
                      <p className="text-xs text-gray-500">{format(new Date(m.startTime), 'h:mm a')} — {format(new Date(m.endTime), 'h:mm a')}</p>
                    </div>
                    {m.googleMeetLink && (
                      <a href={m.googleMeetLink} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                        className="p-1.5 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors">
                        <Video size={14} className="text-indigo-600" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Upcoming Meetings</h2>
              <button onClick={() => navigate('/meetings')} className="text-indigo-600 text-sm font-medium hover:underline">View all</button>
            </div>
            {!stats?.upcomingMeetings?.length ? (
              <div className="text-center py-8 text-gray-400"><Clock size={40} className="mx-auto mb-2 opacity-40" /><p className="text-sm">No upcoming meetings</p></div>
            ) : (
              <div className="space-y-3">
                {stats?.upcomingMeetings?.map((m: Meeting) => (
                  <div key={m._id} onClick={() => navigate(`/meetings/${m._id}`)}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 cursor-pointer transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{m.title}</p>
                      <p className="text-xs text-gray-500">{format(new Date(m.startTime), 'MMM d, h:mm a')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name}</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Upcoming Meetings</h2>
          {!stats?.upcoming?.length ? (
            <div className="text-center py-8 text-gray-400"><Calendar size={40} className="mx-auto mb-2 opacity-40" /><p className="text-sm">No upcoming meetings</p></div>
          ) : (
            <div className="space-y-3">
              {stats?.upcoming?.map((m: Meeting) => (
                <div key={m._id} onClick={() => navigate(`/meetings/${m._id}`)}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 cursor-pointer transition-colors">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{m.title}</p>
                    {m.googleMeetLink && (
                      <a href={m.googleMeetLink} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-indigo-600 text-xs font-medium hover:underline">
                        <Video size={12} /> Join
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{format(new Date(m.startTime), 'MMM d, h:mm a')}</p>
                  <p className="text-xs text-gray-400">by {(m.organizer as any)?.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Attendance History</h2>
          {!stats?.attendance?.length ? (
            <div className="text-center py-8 text-gray-400"><Calendar size={40} className="mx-auto mb-2 opacity-40" /><p className="text-sm">No records yet</p></div>
          ) : (
            <div className="space-y-3">
              {stats?.attendance?.slice(0, 6).map((a: Attendance) => {
                const mtg = a.meeting as Meeting;
                return (
                  <div key={a._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{typeof mtg === 'object' ? mtg.title : ''}</p>
                      <p className="text-xs text-gray-500">{typeof mtg === 'object' ? format(new Date(mtg.startTime), 'MMM d, h:mm a') : ''}</p>
                    </div>
                    <span className={`badge-${a.status}`}>{a.status.replace('_', ' ')}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
