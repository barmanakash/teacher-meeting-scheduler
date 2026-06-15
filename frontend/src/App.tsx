import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store';
import { useAppDispatch, useAppSelector } from './hooks/redux';
import { fetchCurrentUser, setToken } from './store/slices/authSlice';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MeetingsPage from './pages/MeetingsPage';
import MeetingDetailPage from './pages/MeetingDetailPage';
import CreateMeetingPage from './pages/CreateMeetingPage';
import EditMeetingPage from './pages/EditMeetingPage';
import AttendancePage from './pages/AttendancePage';
import ReportsPage from './pages/ReportsPage';
import AvailabilityPage from './pages/AvailabilityPage';
import ProfilePage from './pages/ProfilePage';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requireRole?: 'teacher' | 'candidate' }> = ({
  children, requireRole,
}) => {
  const { isAuthenticated, user, loading } = useAppSelector((s) => s.auth);
  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireRole && user?.role !== requireRole) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((s) => s.auth);

  useEffect(() => {
    // Extract token from URL if present (after Google OAuth redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      dispatch(setToken(token));
      window.history.replaceState({}, '', window.location.pathname);
    }
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="meetings" element={<MeetingsPage />} />
          <Route path="meetings/new" element={<ProtectedRoute requireRole="teacher"><CreateMeetingPage /></ProtectedRoute>} />
          <Route path="meetings/:id" element={<MeetingDetailPage />} />
          <Route path="meetings/:id/edit" element={<ProtectedRoute requireRole="teacher"><EditMeetingPage /></ProtectedRoute>} />
          <Route path="meetings/:id/attendance" element={<ProtectedRoute requireRole="teacher"><AttendancePage /></ProtectedRoute>} />
          <Route path="reports" element={<ProtectedRoute requireRole="teacher"><ReportsPage /></ProtectedRoute>} />
          <Route path="availability" element={<ProtectedRoute requireRole="teacher"><AvailabilityPage /></ProtectedRoute>} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => (
  <Provider store={store}>
    <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    <AppContent />
  </Provider>
);

export default App;
