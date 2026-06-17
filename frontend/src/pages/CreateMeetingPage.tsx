import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useAppDispatch } from '../hooks/redux';
import { createMeeting } from '../store/slices/meetingsSlice';
import { usersApi } from '../services/api';
import { User, CreateMeetingDto, MeetingType, RecurrenceType } from '../types';
import { ArrowLeft, Search, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const MEETING_TYPES: MeetingType[] = [
  'Interview', 'Technical Assessment', 'Training', 'Classroom',
  'Mentorship', 'Mock Interview', 'Group Discussion',
];

const RECURRENCE_TYPES: RecurrenceType[] = ['none', 'daily', 'weekly', 'monthly'];

const CreateMeetingPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<User[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<CreateMeetingDto>({
    defaultValues: { recurrence: 'none', meetingType: 'Interview' },
  });

  const recurrence = watch('recurrence');

  useEffect(() => {
    const fetchCandidates = async () => {
      setLoading(true);
      try {
        const res = await usersApi.getCandidates(searchQuery);
        setCandidates(res.data.data);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    const t = setTimeout(fetchCandidates, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const toggleCandidate = (c: User) => {
    setSelectedCandidates((prev) =>
      prev.find((p) => p._id === c._id) ? prev.filter((p) => p._id !== c._id) : [...prev, c]
    );
  };

  const onSubmit = async (data: CreateMeetingDto) => {
    if (selectedCandidates.length === 0) {
      toast.error('Please select at least one candidate');
      return;
    }
    setSubmitting(true);
    try {
      await dispatch(createMeeting({ ...data, candidates: selectedCandidates.map((c) => c._id) })).unwrap();
      toast.success('Meeting created successfully! Invitations sent.');
      navigate('/meetings');
    } catch (e: any) {
      toast.error(e || 'Failed to create meeting');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Meeting</h1>
          <p className="text-gray-500 text-sm">Schedule a new meeting with automatic Google Meet link</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Meeting Details</h2>

          <div>
            <label className="label">Meeting Title *</label>
            <input {...register('title', { required: 'Title is required' })}
              className="input" placeholder="e.g., Frontend Developer Interview" />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="label">Description</label>
            <textarea {...register('description')} rows={3}
              className="input resize-none" placeholder="Meeting agenda or description..." />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Meeting Type *</label>
              <select {...register('meetingType', { required: true })} className="input">
                {MEETING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Recurrence</label>
              <select {...register('recurrence')} className="input">
                {RECURRENCE_TYPES.map((r) => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Start Time *</label>
              <input type="datetime-local" {...register('startTime', { required: 'Start time is required' })}
                className="input" />
              {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime.message}</p>}
            </div>
            <div>
              <label className="label">End Time *</label>
              <input type="datetime-local" {...register('endTime', { required: 'End time is required' })}
                className="input" />
              {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime.message}</p>}
            </div>
          </div>

          {recurrence !== 'none' && (
            <div>
              <label className="label">Recurrence End Date</label>
              <input type="date" {...register('recurrenceEndDate')} className="input" />
            </div>
          )}

          <div>
            <label className="label">Notes (optional)</label>
            <textarea {...register('notes')} rows={2}
              className="input resize-none" placeholder="Additional notes for participants..." />
          </div>
        </div>

        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Select Participants</h2>
            {selectedCandidates.length > 0 && (
              <span className="text-sm text-indigo-600 font-medium">{selectedCandidates.length} selected</span>
            )}
          </div>

          {selectedCandidates.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-indigo-50 rounded-lg">
              {selectedCandidates.map((c) => (
                <span key={c._id} className="flex items-center gap-1.5 bg-indigo-100 text-indigo-700 text-sm px-3 py-1 rounded-full">
                  {c.name}
                  <button type="button" onClick={() => toggleCandidate(c)}>
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidates by name or email..."
              className="input pl-9"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2">
            {loading ? (
              <p className="text-center text-gray-400 text-sm py-4">Searching...</p>
            ) : candidates.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-4">No candidates found</p>
            ) : (
              candidates.map((c) => {
                const selected = !!selectedCandidates.find((s) => s._id === c._id);
                return (
                  <label key={c._id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selected ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-50'
                    }`}>
                    <input type="checkbox" checked={selected} onChange={() => toggleCandidate(c)} className="accent-indigo-600" />
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.email}</p>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {submitting ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Plus size={16} />}
            {submitting ? 'Creating...' : 'Create Meeting'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateMeetingPage;
