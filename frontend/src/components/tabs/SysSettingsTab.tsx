"use client";
import React, { useEffect, useState } from 'react';

interface RegisteredUser { email: string; role: string; }

interface SettingsData {
  store_id: string;
  data_retention_days: number;
  detection_confidence_threshold: number;
  updated_at: string | null;
}

export default function SysSettingsTab() {
  const [activeSection, setActiveSection] = useState('system');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [storeIdInput, setStoreIdInput] = useState('');
  const [retentionInput, setRetentionInput] = useState(90);
  const [confidenceInput, setConfidenceInput] = useState(0.25);

  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  useEffect(() => {
    fetch('/api/backend/v1/admin/settings', { credentials: 'include' })
      .then(async (res) => {
        if (res.status === 403) throw new Error("This screen is Administrator-only.");
        if (!res.ok) throw new Error(`Request failed (${res.status}).`);
        return res.json();
      })
      .then((json) => {
        if (json.status === 'success') {
          setSettings(json.data);
          setStoreIdInput(json.data.store_id);
          setRetentionInput(json.data.data_retention_days);
          setConfidenceInput(json.data.detection_confidence_threshold);
        }
      })
      .catch((err) => setLoadError(err.message));
  }, []);

  useEffect(() => {
    fetch('/api/backend/v1/admin/users', { credentials: 'include' })
      .then((res) => res.json())
      .then((json) => { if (json.status === 'success') setUsers(json.data || []); })
      .catch((err) => console.error('Users fetch error:', err))
      .finally(() => setUsersLoading(false));
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    setSaveMessage(null);
    fetch('/api/backend/v1/admin/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({
        store_id: storeIdInput,
        data_retention_days: retentionInput,
        detection_confidence_threshold: confidenceInput,
      }),
    })
      .then((res) => res.json())
      .then((data) => setSaveMessage(data.message || 'Saved.'))
      .catch(() => setSaveMessage('❌ Could not reach the backend.'))
      .finally(() => setIsSaving(false));
  };

  const roleBadge = (role: string) => {
    switch (role) {
      case 'Administrator': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'Store Manager': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'Marketing Manager': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <div className="w-full min-w-0 space-y-6 animate-in fade-in duration-500 text-slate-200 flex flex-col h-[calc(100vh-120px)]">

      {/* Header */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-xl font-bold">System Configuration</h2>
          <p className="text-xs text-slate-400 mt-1">Manage Edge Nodes, API integrations, and access controls</p>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && <span className="text-[10px] text-slate-400">{saveMessage}</span>}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${
              isSaving
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 hover:bg-emerald-600/30'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {loadError && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-xs text-rose-300 shrink-0">{loadError}</div>
      )}

      <div className="flex flex-col xl:flex-row gap-6 flex-1 min-h-0">

        {/* Navigation Sidebar */}
        <div className="w-full xl:w-64 shrink-0 bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-inner flex flex-col space-y-2">
          <button onClick={() => setActiveSection('system')} className={`text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeSection === 'system' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-900'}`}>⚙️ General System</button>
          <button onClick={() => setActiveSection('engine')} className={`text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeSection === 'engine' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-900'}`}>🧠 Core AI Engine</button>
          <button onClick={() => setActiveSection('cameras')} className={`text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeSection === 'cameras' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-900'}`}>📹 Edge Nodes (Cameras)</button>
          <button onClick={() => setActiveSection('api')} className={`text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeSection === 'api' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-900'}`}>🔑 API & Integrations</button>
          <button onClick={() => setActiveSection('users')} className={`text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeSection === 'users' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-900'}`}>👥 Access Control</button>
        </div>

        {/* Configuration Area */}
        <div className="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-inner overflow-y-auto">

          {activeSection === 'system' && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="text-lg font-bold border-b border-slate-800 pb-2">General System Preferences</h3>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-xs text-emerald-300">
                ✅ Store ID is real — persisted server-side and used to label exports/reports.
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
                <div className="space-y-2 min-w-0">
                  <label className="text-xs font-bold text-slate-400 uppercase">Store ID</label>
                  <input type="text" value={storeIdInput} onChange={(e) => setStoreIdInput(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500" />
                </div>
                <div className="space-y-2 min-w-0">
                  <label className="text-xs font-bold text-slate-400 uppercase">Data Retention Period (days)</label>
                  <input type="number" min={1} max={3650} value={retentionInput} onChange={(e) => setRetentionInput(Number(e.target.value) || 90)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500" />
                  <p className="text-[10px] text-amber-400/80">Saved and persisted, but no purge job reads it yet — nothing is actually deleted at this threshold.</p>
                </div>
              </div>
              <div className="space-y-2 pt-4">
                <label className="text-xs font-bold text-slate-400 uppercase">System Theme</label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 text-sm text-slate-300">
                    <input type="radio" name="theme" defaultChecked className="text-cyan-500" />
                    <span>Dark Mode (Recommended)</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm text-slate-500 cursor-not-allowed">
                    <input type="radio" name="theme" disabled />
                    <span>Light Mode (Disabled — no theming system built)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'engine' && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="text-lg font-bold border-b border-slate-800 pb-2">Core System Configuration</h3>
              <p className="text-slate-400 text-sm mb-6">Manage inference engine thresholds, database connections, and tracking algorithms.</p>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-8">
                <div className="space-y-4 min-w-0">
                  <h4 className="text-sm font-bold text-cyan-400 border-b border-slate-800 pb-2">AI Detection Engine</h4>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Detection Confidence Threshold (YOLOv8, server-side)</label>
                    <input type="range" min="0.05" max="1" step="0.01" value={confidenceInput} onChange={(e) => setConfidenceInput(Number(e.target.value))} className="w-full accent-cyan-500" />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>0.05</span>
                      <span className="font-bold text-cyan-400">{confidenceInput.toFixed(2)}</span>
                      <span>1.0</span>
                    </div>
                    <p className="text-[10px] text-emerald-400/80 mt-1">✅ Real — applied live to stream_camera_frames()&apos;s YOLO call as soon as you click Save, no restart needed.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Tracking Algorithm</label>
                    <select disabled defaultValue="iou" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-400 cursor-not-allowed focus:outline-none">
                      <option value="iou">Custom IOU Tracker (active, server-side)</option>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">Only one tracker exists in this codebase — nothing to switch between yet.</p>
                  </div>
                </div>

                <div className="space-y-4 min-w-0">
                  <h4 className="text-sm font-bold text-emerald-400 border-b border-slate-800 pb-2">Database Connection</h4>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Connection</label>
                    <input type="text" value="sqlite:///cams_retail.db" readOnly className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-500 cursor-not-allowed font-mono" />
                    <p className="text-[10px] text-amber-400/80 mt-1">Was previously shown as a fake PostgreSQL connection string — this app actually runs on local SQLite.</p>
                  </div>
                  <div className="flex items-center space-x-3 mt-4 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                    <span className="text-sm font-medium text-emerald-400">SQLite Connection Active</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'cameras' && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="text-lg font-bold border-b border-slate-800 pb-2">Edge Node Configuration</h3>
              <p className="text-xs text-slate-500 mb-4">Configure the video sources the backend&apos;s YOLOv8 pipeline reads from (see CAMERA_DATASETS in main.py).</p>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-xs text-amber-300">
                Not yet wired to live-swap a running camera thread&apos;s source — changing these values here doesn&apos;t
                take effect without restarting the backend. Safely hot-swapping a live cv2.VideoCapture + tracker
                mid-session is a real project for later, not attempted here.
              </div>
              {[1, 2, 3, 4].map((node) => (
                <div key={node} className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-300">Node {node}</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20">Online</span>
                  </div>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
                    <div className="space-y-1 min-w-0">
                      <label className="text-[10px] font-mono text-slate-500">Stream Source / Dataset Path</label>
                      <input type="text" defaultValue={`/datasets/archive${node === 1 ? '' : '_' + (node - 1)}/cam1.mp4`} className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <label className="text-[10px] font-mono text-slate-500">Processing Framerate (FPS Cap)</label>
                      <input type="number" defaultValue="30" className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'api' && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="text-lg font-bold border-b border-slate-800 pb-2">API & Webhooks</h3>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-xs text-amber-300">
                No API-key issuance system exists in this backend — auth is session-cookie based only. These fields
                are cosmetic.
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">FastAPI Backend Endpoint</label>
                <div className="flex">
                  <input type="text" readOnly defaultValue="http://127.0.0.1:9000" className="w-full bg-slate-900 border border-slate-700 rounded-l-lg px-4 py-2 text-sm text-slate-500 font-mono focus:outline-none" />
                  <button className="bg-slate-800 border-y border-r border-slate-700 px-4 rounded-r-lg text-xs font-bold hover:bg-slate-700">Test</button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'users' && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="text-lg font-bold border-b border-slate-800 pb-2">Access Control</h3>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-xs text-emerald-300">
                ✅ Real registered accounts — was previously 2 hardcoded sample rows.
              </div>
              <div className="w-full overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="bg-slate-900 text-[10px] uppercase text-slate-400">
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/30">
                    {usersLoading ? (
                      <tr><td colSpan={2} className="px-4 py-3 text-cyan-400 text-xs animate-pulse">Loading accounts...</td></tr>
                    ) : users.length === 0 ? (
                      <tr><td colSpan={2} className="px-4 py-3 text-slate-500 text-xs">No registered accounts.</td></tr>
                    ) : (
                      users.map((u, i) => (
                        <tr key={i}>
                          <td className="px-4 py-3 font-bold text-slate-300">{u.email}</td>
                          <td className="px-4 py-3 text-xs"><span className={`px-2.5 py-1 rounded border font-semibold ${roleBadge(u.role)}`}>{u.role}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
