import React from 'react';

export default function NotificationsTab() {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg animate-in fade-in">
      <h3 className="text-lg font-bold text-slate-200 mb-6">Global Notification Webhooks</h3>
      <div className="space-y-4">
        <label className="flex items-center space-x-3 text-sm text-slate-300"><input type="checkbox" defaultChecked className="accent-cyan-500 w-4 h-4"/> <span>Send Email Alerts for Hardware Failures</span></label>
        <label className="flex items-center space-x-3 text-sm text-slate-300"><input type="checkbox" defaultChecked className="accent-cyan-500 w-4 h-4"/> <span>Send SMS for Store Congestion Events</span></label>
        <div className="mt-4 pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-400 font-bold uppercase mb-2">Slack Webhook URL</p>
          <input type="text" value="https://hooks.slack.com/services/T000/B000/XXXXX" readOnly className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-500" />
        </div>
      </div>
    </div>
  );
}