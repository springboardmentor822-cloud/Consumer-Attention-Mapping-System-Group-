import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#0d0d12]/80 border border-slate-800 p-8 rounded-2xl shadow-2xl text-center space-y-6">
        <div className="inline-flex items-center justify-center p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 mb-2">
          <ShieldAlert className="w-12 h-12" />
        </div>
        
        <h2 className="text-2xl font-bold tracking-tight">Access Restricted</h2>
        
        <p className="text-sm text-slate-400">
          Your workspace user role does not possess permissions to browse this sector. Please contact your system administrator to elevate roles.
        </p>

        <Link
          to="/"
          className="inline-flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs px-5 py-2.5 rounded-lg transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
