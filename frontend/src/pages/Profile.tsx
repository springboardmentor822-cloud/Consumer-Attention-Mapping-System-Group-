import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Mail, ArrowLeft, Calendar } from 'lucide-react';

const Profile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#07070c] text-white p-8">
      <div className="max-w-xl mx-auto space-y-6">
        <Link to="/" className="inline-flex items-center space-x-2 text-xs text-slate-500 hover:text-slate-350 transition">
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard Shell</span>
        </Link>

        <div className="bg-[#0d0d12]/90 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-2xl">
          <div className="flex items-center space-x-4 border-b border-slate-850 pb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-rose-500 flex items-center justify-center font-bold text-white text-2xl">
              {user?.email[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">{user?.email.split('@')[0]}</h2>
              <span className="text-xs text-indigo-400 font-medium">{user?.role}</span>
            </div>
          </div>

          <div className="space-y-4 text-xs text-slate-300">
            <div className="flex items-center space-x-3 p-3 bg-slate-850/40 rounded-lg">
              <Mail className="w-4 h-4 text-indigo-400" />
              <div>
                <p className="text-[10px] text-slate-500">Corporate Email</p>
                <p className="font-semibold">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-slate-850/40 rounded-lg">
              <Shield className="w-4 h-4 text-indigo-400" />
              <div>
                <p className="text-[10px] text-slate-500">Identity Identifier</p>
                <p className="font-semibold font-mono">{user?.id}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-slate-850/40 rounded-lg">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <div>
                <p className="text-[10px] text-slate-500">Active status</p>
                <p className="font-semibold text-emerald-400">Badge verified & active</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
