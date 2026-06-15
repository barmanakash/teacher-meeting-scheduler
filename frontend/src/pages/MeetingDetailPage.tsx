import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Video, Users, Edit2, XCircle, ClipboardList } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchMeetingById } from '../store/slices/meetingsSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { format } from 'date-fns';
import { User } from '../types';

const MeetingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const { currentMeeting: m, loading } = useAppSelector((s) => s.meetings);

  useEffect(() => { if (id) dispatch(fetchMeetingById(id)); }, [dispatch, id]);

  if (loading || !m) return <LoadingSpinner />;

  const isOrganizer = (m.organizer as User)._id === user?._id;
  const isActive = m.status === 'scheduled' || m.status === 'rescheduled';

  const statusColorMap: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
    rescheduled: 'bg-purple-100 text-purple-700 border-purple-200',
    ongoing: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{m.title}</h1>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full border font-medium ${statusColorMap[m.status] || ''}`}>
              {m.status}
            </span>
          </div>
        </div>

        {isOrganizer && isActive && (
          <div className="flex gap-2">
            <button onClick={() => navigate(`/meetings/${m._id}/edit`)}
              className="btn-secondary flex items-center gap-1.5 text-sm">
              <Edit2 size={14} /> Edit
            </button>
            <button onClick={() => navigate(`/meetings/${m._id}/attendance`)}
              className="btn-primary flex items-center gap-1.5 text-sm">
              <ClipboardList size={14} /> Attendance
            </button>
          </div>
        )}
      </div>

      {/* Details Card */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide text-gray-400">Meeting Info</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Calendar size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Date</p>
              <p className="text-sm font-medium">{format(new Date(m.startTime), 'EEEE, MMMM d, yyyy')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Time</p>
              <p className="text-sm font-medium">{format(new Date(m.startTime), 'h:mm a')} — {format(new Date(m.endTime), 'h:mm a')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-indigo-500 font-bold text-xs mt-0.5">T</span>
            <div>
              <p className="text-xs text-gray-400">Type</p>
              <p className="text-sm font-medium">{m.meetingType}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-indigo-500 font-bold text-xs mt-0.5">R</span>
            <div>
              <p className="text-xs text-gray-400">Recurrence</p>
              <p className="text-sm font-medium capitalize">{m.recurrence}</p>
            </div>
          </div>
        </div>

        {m.description && (
          <div>
            <p className="text-xs text-gray-400 mb-1">Description</p>
            <p className="text-sm text-gray-700">{m.description}</p>
          </div>
        )}
        {m.notes && (
          <div>
            <p className="text-xs text-gray-400 mb-1">Notes</p>
            <p className="text-sm text-gray-700">{m.notes}</p>
          </div>
        )}
        {m.cancelReason && (
          <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
            <XCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-red-500 font-medium">Cancellation Reason</p>
              <p className="text-sm text-red-700">{m.cancelReason}</p>
            </div>
          </div>
        )}
      </div>

      {/* Google Meet */}
      {m.googleMeetLink && m.status !== 'cancelled' && (
        <div className="card bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg"><Video size={20} className="text-indigo-600" /></div>
              <div>
                <p className="font-medium text-gray-900">Google Meet Link</p>
                <p className="text-xs text-gray-500 truncate max-w-xs">{m.googleMeetLink}</p>
              </div>
            </div>
            <a href={m.googleMeetLink} target="_blank" rel="noreferrer"
              className="btn-primary flex items-center gap-2 text-sm">
              <Video size={14} /> Join Now
            </a>
          </div>
        </div>
      )}

      {/* Organizer */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3">Organizer</h2>
        <div className="flex items-center gap-3">
          {(m.organizer as User).profileImage ? (
            <img src={(m.organizer as User).profileImage} alt="" className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
              {(m.organizer as User).name?.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-medium">{(m.organizer as User).name}</p>
            <p className="text-xs text-gray-500">{(m.organizer as User).email}</p>
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} className="text-indigo-500" />
          <h2 className="font-semibold text-gray-900">Participants ({m.candidates.length})</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {m.candidates.map((c: any) => (
            <div key={c._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {c.profileImage ? (
                <img src={c.profileImage} alt="" className="w-9 h-9 rounded-full" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600">
                  {c.name?.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-gray-500">{c.email}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MeetingDetailPage;
