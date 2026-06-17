import React, { useEffect, useState } from 'react';
import { Save, Plus, X, Clock } from 'lucide-react';
import { availabilityApi } from '../services/api';
import { Availability } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const AvailabilityPage: React.FC = () => {
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingHours, setWorkingHours] = useState({ start: '09:00', end: '18:00' });
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [newBlock, setNewBlock] = useState({ start: '', end: '', reason: '' });
  const [newHoliday, setNewHoliday] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await availabilityApi.get();
        const av = res.data.data as Availability;
        setAvailability(av);
        setWorkingHours(av.workingHours);
        setWorkingDays(av.workingDays);
      } catch { toast.error('Failed to load availability'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await availabilityApi.update({
        workingHours, workingDays,
        holidays: availability?.holidays || [],
        blockedSlots: availability?.blockedSlots || [],
      });
      setAvailability(res.data.data);
      toast.success('Availability updated!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const toggleDay = (d: number) => {
    setWorkingDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort());
  };

  const addBlock = async () => {
    if (!newBlock.start || !newBlock.end) { toast.error('Start and end times required'); return; }
    try {
      const res = await availabilityApi.addBlock(newBlock);
      setAvailability(res.data.data);
      setNewBlock({ start: '', end: '', reason: '' });
      toast.success('Blocked slot added');
    } catch { toast.error('Failed to add block'); }
  };

  const addHoliday = async () => {
    if (!newHoliday) return;
    try {
      const res = await availabilityApi.addHoliday(newHoliday);
      setAvailability(res.data.data);
      setNewHoliday('');
      toast.success('Holiday added');
    } catch { toast.error('Failed to add holiday'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Availability Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Configure your working hours and blocked times</p>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-indigo-500" />
          <h2 className="font-semibold text-gray-900">Working Hours</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label text-xs">Start Time</label>
            <input type="time" value={workingHours.start}
              onChange={(e) => setWorkingHours((p) => ({ ...p, start: e.target.value }))}
              className="input" />
          </div>
          <div>
            <label className="label text-xs">End Time</label>
            <input type="time" value={workingHours.end}
              onChange={(e) => setWorkingHours((p) => ({ ...p, end: e.target.value }))}
              className="input" />
          </div>
        </div>

        <div>
          <label className="label text-xs mb-2">Working Days</label>
          <div className="flex gap-2 flex-wrap">
            {DAYS.map((d, i) => (
              <button key={d} type="button" onClick={() => toggleDay(i)}
                className={`w-12 h-12 rounded-full font-medium text-sm transition-colors ${
                  workingDays.includes(i)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving...' : 'Save Working Hours'}
        </button>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900">Holidays / Days Off</h2>
        <div className="flex gap-2">
          <input type="date" value={newHoliday} onChange={(e) => setNewHoliday(e.target.value)} className="input flex-1" />
          <button onClick={addHoliday} className="btn-primary px-3"><Plus size={16} /></button>
        </div>
        <div className="flex flex-wrap gap-2">
          {availability?.holidays?.map((h, i) => (
            <span key={i} className="flex items-center gap-1.5 bg-orange-100 text-orange-700 text-sm px-3 py-1 rounded-full">
              {format(new Date(h), 'MMM d, yyyy')}
            </span>
          ))}
          {!availability?.holidays?.length && <p className="text-sm text-gray-400">No holidays added</p>}
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900">Blocked Time Slots</h2>
        <div className="space-y-2">
          <div className="grid sm:grid-cols-2 gap-2">
            <div>
              <label className="label text-xs">Start</label>
              <input type="datetime-local" value={newBlock.start}
                onChange={(e) => setNewBlock((p) => ({ ...p, start: e.target.value }))}
                className="input text-sm" />
            </div>
            <div>
              <label className="label text-xs">End</label>
              <input type="datetime-local" value={newBlock.end}
                onChange={(e) => setNewBlock((p) => ({ ...p, end: e.target.value }))}
                className="input text-sm" />
            </div>
          </div>
          <input value={newBlock.reason} onChange={(e) => setNewBlock((p) => ({ ...p, reason: e.target.value }))}
            placeholder="Reason (optional)" className="input text-sm" />
          <button onClick={addBlock} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={14} /> Add Block
          </button>
        </div>

        <div className="space-y-2">
          {availability?.blockedSlots?.map((slot, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-red-700">
                  {format(new Date(slot.start), 'MMM d, h:mm a')} — {format(new Date(slot.end), 'MMM d, h:mm a')}
                </p>
                {slot.reason && <p className="text-xs text-red-500">{slot.reason}</p>}
              </div>
            </div>
          ))}
          {!availability?.blockedSlots?.length && <p className="text-sm text-gray-400">No blocked slots</p>}
        </div>
      </div>
    </div>
  );
};

export default AvailabilityPage;
