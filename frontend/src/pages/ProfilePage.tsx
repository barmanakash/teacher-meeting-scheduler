import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchCurrentUser } from '../store/slices/authSlice';
import { usersApi, authApi } from '../services/api';
import { User, Mail, Calendar, Shield } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);

  const handleSaveName = async () => {
    setSaving(true);
    try {
      await usersApi.updateProfile({ name });
      await dispatch(fetchCurrentUser());
      toast.success('Name updated!');
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  const handleRoleToggle = async () => {
    const newRole = user?.role === 'teacher' ? 'candidate' : 'teacher';
    setUpdatingRole(true);
    try {
      await authApi.updateRole(newRole);
      await dispatch(fetchCurrentUser());
      toast.success(`Role changed to ${newRole}`);
    } catch { toast.error('Failed to change role'); }
    finally { setUpdatingRole(false); }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

      {/* Avatar Card */}
      <div className="card flex items-center gap-5">
        {user?.profileImage ? (
          <img src={user.profileImage} alt="" className="w-20 h-20 rounded-full border-4 border-indigo-100" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-600 border-4 border-indigo-50">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
          <p className="text-gray-500 text-sm">{user?.email}</p>
          <span className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${
            user?.role === 'teacher' ? 'bg-yellow-100 text-yellow-800' : 'bg-indigo-100 text-indigo-800'
          }`}>
            {user?.role}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900">Account Information</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Mail size={16} className="text-indigo-500" />
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-sm font-medium">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Shield size={16} className="text-indigo-500" />
            <div>
              <p className="text-xs text-gray-400">Role</p>
              <p className="text-sm font-medium capitalize">{user?.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Calendar size={16} className="text-indigo-500" />
            <div>
              <p className="text-xs text-gray-400">Last Login</p>
              <p className="text-sm font-medium">{user?.lastLogin ? format(new Date(user.lastLogin), 'MMM d, yyyy h:mm a') : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Name */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900">Edit Profile</h2>
        <div>
          <label className="label">Display Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </div>
        <button onClick={handleSaveName} disabled={saving} className="btn-primary flex items-center gap-2">
          {saving && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Role Switch */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-gray-900">Switch Role</h2>
        <p className="text-sm text-gray-500">
          You are currently a <strong>{user?.role}</strong>. Switch to {user?.role === 'teacher' ? 'candidate' : 'teacher'} mode.
        </p>
        <button onClick={handleRoleToggle} disabled={updatingRole}
          className="btn-secondary flex items-center gap-2">
          <User size={14} />
          {updatingRole ? 'Switching...' : `Switch to ${user?.role === 'teacher' ? 'Candidate' : 'Teacher'}`}
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
