import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { Download, TrendingUp, Users, Calendar, Clock } from 'lucide-react';
import { reportsApi } from '../services/api';
import { Analytics } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

const ReportsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getAnalytics({ startDate: startDate || undefined, endDate: endDate || undefined });
      setAnalytics(res.data.data);
    } catch { toast.error('Failed to load analytics'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleExport = async (type: 'excel' | 'pdf') => {
    setExporting(type);
    try {
      const res = type === 'excel' ? await reportsApi.exportExcel() : await reportsApi.exportPDF();
      // const blob = new Blob([res.data], { type: res.headers['content-type'] });
      const contentType = String(res.headers['content-type'] || '');

      const blob = new Blob([res.data], {
        type: contentType
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-report.${type === 'excel' ? 'xlsx' : 'pdf'}`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`${type.toUpperCase()} downloaded!`);
    } catch { toast.error('Export failed'); }
    finally { setExporting(null); }
  };

  const attendancePieData = analytics?.attendanceStats?.map((s) => ({
    name: s._id.replace('_', ' '),
    value: s.count,
  })) || [];

  const typeBarData = analytics?.meetingTypeStats?.map((s) => ({
    name: s._id.length > 12 ? s._id.substring(0, 12) + '…' : s._id,
    count: s.count,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Insights into your meetings and attendance</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('excel')} disabled={!!exporting}
            className="btn-secondary flex items-center gap-2 text-sm">
            {exporting === 'excel' ? <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : <Download size={14} />}
            Excel
          </button>
          <button onClick={() => handleExport('pdf')} disabled={!!exporting}
            className="btn-secondary flex items-center gap-2 text-sm">
            {exporting === 'pdf' ? <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : <Download size={14} />}
            PDF
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="card flex flex-wrap gap-4 items-end py-4">
        <div>
          <label className="label text-xs">Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input py-1.5 text-sm" />
        </div>
        <div>
          <label className="label text-xs">End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input py-1.5 text-sm" />
        </div>
        <button onClick={fetchData} className="btn-primary text-sm py-1.5">Apply</button>
        <button onClick={() => { setStartDate(''); setEndDate(''); fetchData(); }} className="btn-secondary text-sm py-1.5">Clear</button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Meetings', value: analytics?.totalMeetings ?? 0, icon: <Calendar size={18} className="text-indigo-600" />, color: 'bg-indigo-100' },
              { label: 'Total Participants', value: analytics?.totalParticipants ?? 0, icon: <Users size={18} className="text-blue-600" />, color: 'bg-blue-100' },
              { label: 'Attendance Rate', value: `${analytics?.attendanceRate ?? 0}%`, icon: <TrendingUp size={18} className="text-green-600" />, color: 'bg-green-100' },
              { label: 'Avg Duration', value: `${analytics?.avgDuration ?? 0}m`, icon: <Clock size={18} className="text-orange-600" />, color: 'bg-orange-100' },
            ].map((kpi) => (
              <div key={kpi.label} className="card flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${kpi.color}`}>{kpi.icon}</div>
                <div>
                  <p className="text-xs text-gray-500">{kpi.label}</p>
                  <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Attendance Status Pie */}
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Attendance Distribution</h2>
              {attendancePieData.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={attendancePieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {attendancePieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Meeting Types Bar */}
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Meetings by Type</h2>
              {typeBarData.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={typeBarData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Rates */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Performance Overview</h2>
            <div className="space-y-3">
              {[
                { label: 'Attendance Rate', value: analytics?.attendanceRate ?? 0, color: 'bg-green-500' },
                { label: 'No-Show Rate', value: analytics?.noShowRate ?? 0, color: 'bg-red-500' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-semibold">{item.value}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-200 rounded-full">
                    <div className={`h-2.5 rounded-full ${item.color} transition-all`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
