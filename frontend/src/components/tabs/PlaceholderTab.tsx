import React from 'react';

export default function PlaceholderTab({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner border border-slate-700">
        <span className="text-3xl">🛠️</span>
      </div>
      <h2 className="text-2xl font-bold text-slate-200 mb-2">{title}</h2>
      <p className="text-slate-400 max-w-md">
        The <span className="text-cyan-400 font-semibold">{title}</span> module is currently being built for the next architecture milestone. Database schemas and UI components are pending integration.
      </p>
    </div>
  );
}