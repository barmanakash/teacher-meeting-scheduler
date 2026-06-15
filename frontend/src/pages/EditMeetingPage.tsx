import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchMeetingById, updateMeeting } from '../store/slices/meetingsSlice';
import { MeetingType, RecurrenceType } from '../types';
import { ArrowLeft, Save } from 'lucide-react';
import { format } from 'date-fns';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const MEETING_TYPES: MeetingType[] = ['Interview', 'Technical Assessment', 'Training', 'Classroom', 'Mentorship', 'Mock Interview', 'Group Discussion'];

const EditMeetingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentMeeting: m, loading } = useAppSelector((s) => s.meetings);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (id) dispatch(fetchMeetingById(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (m) {
      reset({
        title: m.title,
        description: m.description,
        meetingType: m.meetingType,
        startTime: format(new Date(m.startTime), "yyyy-MM-dd'T'HH:mm"),
        endTime: format(new Date(m.endTime), "yyyy-MM-dd'T'HH:mm"),
        recurrence: m.recurrence,
        notes: m.notes || '',
      });
    }
  }, [m, reset]);

  const onSubmit = async (data: any) => {
    if (!id) return;
    setSubmitting(true);
    try {
      await dispatch(updateMeeting({ id, data })).unwrap();
      toast.success('Meeting updated! Participants notified.');
      navigate(`/meetings/${id}`);
    } catch (e: any) {
      toast.error(e || 'Failed to update meeting');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !m) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Meeting</h1>
          <p className="text-gray-500 text-sm">Update details — participants will be notified</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
        <div>
          <label className="label">Meeting Title *</label>
          <input {...register('title', { required: 'Required' })} className="input" />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message as string}</p>}
        </div>
        <div>
          <label className="label">Description</label>
          <textarea {...register('description')} rows={3} className="input resize-none" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Meeting Type</label>
            <select {...register('meetingType')} className="input">
              {MEETING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Recurrence</label>
            <select {...register('recurrence')} className="input">
              {(['none', 'daily', 'weekly', 'monthly'] as RecurrenceType[]).map((r) => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Start Time *</label>
            <input type="datetime-local" {...register('startTime', { required: 'Required' })} className="input" />
          </div>
          <div>
            <label className="label">End Time *</label>
            <input type="datetime-local" {...register('endTime', { required: 'Required' })} className="input" />
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea {...register('notes')} rows={2} className="input resize-none" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {submitting ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditMeetingPage;
