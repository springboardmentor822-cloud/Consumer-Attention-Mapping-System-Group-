import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Settings as SettingsIcon, Shield, Bell } from 'lucide-react';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="min-h-screen bg-[#07070c] text-white p-8">
      <div className="max-w-xl mx-auto space-y-6">
        <Link to="/" className="inline-flex items-center space-x-2 text-xs text-slate-500 hover:text-slate-350 transition">
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard Shell</span>
        </Link>

        <div className="bg-[#0d0d12]/90 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-2xl">
          <div className="flex items-center space-x-3 border-b border-slate-850 pb-4">
            <SettingsIcon className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold tracking-tight">Account Settings</h2>
          </div>

          <div className="space-y-6">
            {/* Notification Configuration */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 flex items-center space-x-2">
                <Bell className="w-4 h-4" />
                <span>Alert Rules</span>
              </h3>
              <div className="flex items-center justify-between p-3.5 bg-slate-850/40 rounded-lg">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-200">System Overcrowding Alerts</p>
                  <p className="text-[10px] text-slate-550">Alert when shopper threshold is crossed in Zone 3.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-800 rounded focus:ring-indigo-500 bg-slate-900 cursor-pointer"
                />
              </div>
            </div>

            {/* Security controls */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Workspace Access Scope</span>
              </h3>
              <div className="p-3.5 bg-slate-850/40 rounded-lg text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Role</span>
                  <span className="font-semibold text-indigo-400">{user?.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Security Clearance</span>
                  <span className="font-semibold text-emerald-400">Class {user?.role === 'Administrator' ? 'A' : 'B'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
