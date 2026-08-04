import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#0d0d12]/80 border border-slate-800 p-8 rounded-2xl shadow-2xl text-center space-y-6">
        <div className="inline-flex items-center justify-center p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-500 mb-2">
          <HelpCircle className="w-12 h-12" />
        </div>
        
        <h2 className="text-2xl font-bold tracking-tight">404 Sector Missing</h2>
        
        <p className="text-sm text-slate-400">
          The routing index point you requested does not map to any active resources.
        </p>

        <Link
          to="/"
          className="inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-5 py-2.5 rounded-lg transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
