import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Calendar, Video, Users, ChevronRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchMeetings, cancelMeeting } from '../store/slices/meetingsSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { format } from 'date-fns';
import { Meeting } from '../types';
import toast from 'react-hot-toast';

const STATUSES = ['all', 'scheduled', 'completed', 'cancelled', 'rescheduled'];

const MeetingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const { meetings, loading, total } = useAppSelector((s) => s.meetings);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    dispatch(fetchMeetings({ status: status === 'all' ? undefined : status, page, limit: 12 }));
  }, [dispatch, status, page]);

  const filtered = meetings.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.meetingType.toLowerCase().includes(search.toLowerCase())
  );

  const handleCancel = async () => {
    if (!cancelId) return;
    try {
      await dispatch(cancelMeeting({ id: cancelId, reason: cancelReason })).unwrap();
      toast.success('Meeting cancelled');
      setCancelId(null);
      setCancelReason('');
    } catch (e: any) {
      toast.error(e || 'Failed to cancel');
    }
  };

  const typeColors: Record<string, string> = {
    'Interview': 'bg-purple-100 text-purple-700',
    'Technical Assessment': 'bg-blue-100 text-blue-700',
    'Training': 'bg-green-100 text-green-700',
    'Classroom': 'bg-yellow-100 text-yellow-700',
    'Mentorship': 'bg-pink-100 text-pink-700',
    'Mock Interview': 'bg-orange-100 text-orange-700',
    'Group Discussion': 'bg-teal-100 text-teal-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-500 text-sm mt-1">{total} total meetings</p>
        </div>
        {user?.role === 'teacher' && (
          <button onClick={() => navigate('/meetings/new')} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Meeting
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card py-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search meetings..."
            className="input pl-9 py-2 text-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                status === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Meeting Grid */}
      {loading ? <LoadingSpinner /> : (
        <>
          {filtered.length === 0 ? (
            <div className="card text-center py-16 text-gray-400">
              <Calendar size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No meetings found</p>
              {user?.role === 'teacher' && (
                <button onClick={() => navigate('/meetings/new')} className="btn-primary mt-4">
                  Create your first meeting
                </button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((m: Meeting) => (
                <div key={m._id}
                  className="card hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => navigate(`/meetings/${m._id}`)}>
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${typeColors[m.meetingType] || 'bg-gray-100 text-gray-600'}`}>
                      {m.meetingType}
                    </span>
                    <span className={`badge-${m.status}`}>{m.status}</span>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1 truncate">{m.title}</h3>
                  {m.description && <p className="text-gray-500 text-sm line-clamp-2 mb-3">{m.description}</p>}

                  <div className="space-y-1.5 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="flex-shrink-0" />
                      <span>{format(new Date(m.startTime), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 flex-shrink-0" />
                      <span>{format(new Date(m.startTime), 'h:mm a')} — {format(new Date(m.endTime), 'h:mm a')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={13} className="flex-shrink-0" />
                      <span>{m.candidates.length} participant{m.candidates.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    {m.googleMeetLink && m.status !== 'cancelled' ? (
                      <a href={m.googleMeetLink} target="_blank" rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 text-indigo-600 text-xs font-medium hover:underline">
                        <Video size={13} /> Join Meet
                      </a>
                    ) : <span />}
                    <div className="flex items-center gap-2">
                      {user?.role === 'teacher' && m.status === 'scheduled' && (
                        <button onClick={(e) => { e.stopPropagation(); setCancelId(m._id); }}
                          className="text-red-500 text-xs hover:underline">Cancel</button>
                      )}
                      <ChevronRight size={14} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > 12 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm py-1.5">Prev</button>
              <span className="text-sm text-gray-600">Page {page} of {Math.ceil(total / 12)}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 12)} className="btn-secondary text-sm py-1.5">Next</button>
            </div>
          )}
        </>
      )}

      {/* Cancel Modal */}
      {cancelId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Cancel Meeting</h3>
            <p className="text-gray-500 text-sm mb-4">Are you sure you want to cancel this meeting? All participants will be notified.</p>
            <textarea
              value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)"
              className="input resize-none h-20 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setCancelId(null)} className="btn-secondary flex-1">Keep Meeting</button>
              <button onClick={handleCancel} className="btn-danger flex-1">Cancel Meeting</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingsPage;
