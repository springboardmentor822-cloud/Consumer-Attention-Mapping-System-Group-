"use client";
import React, { useEffect, useState } from 'react';

export default function NotificationsTab() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/backend/v1/admin/settings', { credentials: 'include' })
      .then(async (res) => {
        if (res.status === 403) throw new Error("This screen is Administrator-only.");
        if (!res.ok) throw new Error(`Request failed (${res.status}).`);
        return res.json();
      })
      .then((json) => { if (json.status === 'success') setWebhookUrl(json.data.slack_webhook_url || ''); })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    setStatusMessage(null);
    fetch('/api/backend/v1/admin/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ slack_webhook_url: webhookUrl || null }),
    })
      .then((res) => res.json())
      .then((data) => setStatusMessage(data.message || 'Saved.'))
      .catch(() => setStatusMessage('❌ Could not reach the backend.'))
      .finally(() => setIsSaving(false));
  };

  const handleTest = () => {
    setIsTesting(true);
    setStatusMessage(null);
    fetch('/api/backend/v1/admin/notifications/test', { method: 'POST', credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setStatusMessage(data.sent ? '✅ Test message sent to Slack — check your channel.' : `⚠️ Not sent: ${data.message}`))
      .catch(() => setStatusMessage('❌ Could not reach the backend.'))
      .finally(() => setIsTesting(false));
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg animate-in fade-in">
      <h3 className="text-lg font-bold text-slate-200 mb-6">Notification Webhooks</h3>

      {loadError ? (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mb-6 text-xs text-rose-300">{loadError}</div>
      ) : (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-6 text-xs text-emerald-300 flex items-start gap-2">
          <span>✅</span>
          <span>
            Slack is a real, working integration — save a real Incoming Webhook URL below and &quot;Send Test&quot; will
            genuinely post to your Slack channel. It only sends when you click Send Test, though — nothing
            auto-triggers on new alerts yet (avoiding re-notifying every 5s while an alert is still active needs
            real de-duplication logic, which isn&apos;t built).
          </span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <p className="text-xs text-slate-400 font-bold uppercase mb-2">Slack Incoming Webhook URL</p>
          <div className="flex gap-2">
            <input
              type="text" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/..." disabled={loading}
              className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
            <button onClick={handleSave} disabled={isSaving || loading} className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded text-xs font-bold transition disabled:opacity-50">
              {isSaving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={handleTest} disabled={isTesting || loading || !webhookUrl} className="bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-600/30 px-4 py-2 rounded text-xs font-bold transition disabled:opacity-50">
              {isTesting ? 'Sending…' : 'Send Test'}
            </button>
          </div>
          {statusMessage && <p className="text-[10px] text-slate-400 mt-2">{statusMessage}</p>}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
          <label className="flex items-center space-x-3 text-sm text-slate-500">
            <input type="checkbox" disabled className="accent-cyan-500 w-4 h-4 opacity-50 cursor-not-allowed" />
            <span>Send Email Alerts — no SMTP/email provider configured, not built yet</span>
          </label>
          <label className="flex items-center space-x-3 text-sm text-slate-500">
            <input type="checkbox" disabled className="accent-cyan-500 w-4 h-4 opacity-50 cursor-not-allowed" />
            <span>Send SMS Alerts — no SMS provider (e.g. Twilio) configured, not built yet</span>
          </label>
        </div>
      </div>
    </div>
  );
}
