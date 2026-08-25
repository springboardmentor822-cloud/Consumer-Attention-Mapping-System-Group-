import React from 'react';

export default function NotificationsTab() {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg animate-in fade-in">
      <h3 className="text-lg font-bold text-slate-200 mb-6">Global Notification Webhooks</h3>
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-6 text-xs text-amber-300 flex items-start gap-2">
        <span>ℹ️</span>
        <span>
          Sample screen — there&apos;s no email, SMS, or Slack integration anywhere in the backend yet. These toggles
          and the webhook URL below aren&apos;t connected to anything real; alerts are only ever shown in the Alerts tab
          itself, not pushed anywhere.
        </span>
      </div>
      <div className="space-y-4">
        <label className="flex items-center space-x-3 text-sm text-slate-300"><input type="checkbox" defaultChecked disabled className="accent-cyan-500 w-4 h-4 opacity-50 cursor-not-allowed"/> <span className="text-slate-500">Send Email Alerts for Hardware Failures</span></label>
        <label className="flex items-center space-x-3 text-sm text-slate-300"><input type="checkbox" defaultChecked disabled className="accent-cyan-500 w-4 h-4 opacity-50 cursor-not-allowed"/> <span className="text-slate-500">Send SMS for Store Congestion Events</span></label>
        <div className="mt-4 pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-400 font-bold uppercase mb-2">Slack Webhook URL</p>
          <input type="text" placeholder="Not configured" readOnly className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-500" />
        </div>
      </div>
    </div>
  );
}