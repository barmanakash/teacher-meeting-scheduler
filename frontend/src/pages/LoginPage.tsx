import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux';
import { Video, Calendar, Users, BarChart2 } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/google`;
  };

  const features = [
    { icon: Calendar, title: 'Smart Scheduling', desc: 'Create meetings with automatic Google Meet link generation' },
    { icon: Users, title: 'Attendance Tracking', desc: 'Track join/leave times and generate reports' },
    { icon: BarChart2, title: 'Analytics', desc: 'Visualize attendance trends and meeting statistics' },
    { icon: Video, title: 'Google Integration', desc: 'Seamlessly sync with Google Calendar & Meet' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-4xl w-full grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Info */}
          <div className="text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-white/20 rounded-xl p-3">
                <Video size={28} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-indigo-200 font-medium">Welcome to</p>
                <h1 className="text-2xl font-bold">Meeting Scheduler</h1>
              </div>
            </div>
            <p className="text-indigo-100 text-lg mb-8 leading-relaxed">
              A centralized platform for scheduling Google Meet meetings, automating calendar management, tracking attendance, and generating insightful reports.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-white/10 rounded-xl p-4">
                  <Icon size={20} className="text-indigo-300 mb-2" />
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-indigo-200 text-xs mt-1">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mb-4">
                <Video size={30} className="text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
              <p className="text-gray-500 mt-1 text-sm">Use your Google account to continue</p>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 rounded-xl py-3.5 px-6 text-gray-700 font-semibold hover:border-indigo-400 hover:bg-indigo-50 transition-all shadow-sm hover:shadow-md"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <div className="mt-6 p-4 bg-indigo-50 rounded-xl">
              <p className="text-xs text-center text-indigo-700">
                By signing in, you grant access to Google Calendar & Meet for seamless meeting management.
              </p>
            </div>

            <div className="mt-6 flex justify-center gap-6 text-xs text-gray-400">
              <span>🔒 Secure OAuth 2.0</span>
              <span>📅 Calendar Sync</span>
              <span>📹 Meet Integration</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
