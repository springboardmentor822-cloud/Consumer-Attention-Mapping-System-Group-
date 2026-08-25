"use client";
import React, { useState } from 'react';

export default function SysSettingsTab() {
  const [activeSection, setActiveSection] = useState('system');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert("Not wired to real backend logic — there's no settings-persistence endpoint anywhere in this codebase yet. Nothing on this page is actually saved (the Detection Confidence slider and Tracking Algorithm dropdown below already note the same for their own sections).");
    }, 400);
  };

  return (
    <div className="w-full min-w-0 space-y-6 animate-in fade-in duration-500 text-slate-200 flex flex-col h-[calc(100vh-120px)]">
      
      {/* Header */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-xl font-bold">System Configuration</h2>
          <p className="text-xs text-slate-400 mt-1">Manage Edge Nodes, API integrations, and access controls</p>
        </div>
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

      <div className="flex flex-col xl:flex-row gap-6 flex-1 min-h-0">
        
        {/* Navigation Sidebar */}
        <div className="w-full xl:w-64 shrink-0 bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-inner flex flex-col space-y-2">
          <button 
            onClick={() => setActiveSection('system')}
            className={`text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeSection === 'system' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-900'}`}
          >
            ⚙️ General System
          </button>
          
          {/* YOUR NEW SECTION IS ADDED HERE */}
          <button 
            onClick={() => setActiveSection('engine')}
            className={`text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeSection === 'engine' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-900'}`}
          >
            🧠 Core AI Engine
          </button>

          <button 
            onClick={() => setActiveSection('cameras')}
            className={`text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeSection === 'cameras' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-900'}`}
          >
            📹 Edge Nodes (Cameras)
          </button>
          <button 
            onClick={() => setActiveSection('api')}
            className={`text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeSection === 'api' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-900'}`}
          >
            🔑 API & Integrations
          </button>
          <button 
            onClick={() => setActiveSection('users')}
            className={`text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeSection === 'users' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-900'}`}
          >
            👥 Access Control
          </button>
        </div>

        {/* Configuration Area */}
        <div className="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-inner overflow-y-auto">
          
          {activeSection === 'system' && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="text-lg font-bold border-b border-slate-800 pb-2">General System Preferences</h3>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
                <div className="space-y-2 min-w-0">
                  <label className="text-xs font-bold text-slate-400 uppercase">Store ID</label>
                  <input type="text" defaultValue="STR-001-ALPHA" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500" />
                </div>
                <div className="space-y-2 min-w-0">
                  <label className="text-xs font-bold text-slate-400 uppercase">Data Retention Period</label>
                  <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500">
                    <option>30 Days</option>
                    <option>90 Days</option>
                    <option>1 Year</option>
                  </select>
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
                    <span>Light Mode (Disabled)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* YOUR CUSTOM ENGINE SECTION INTEGRATED HERE */}
          {activeSection === 'engine' && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="text-lg font-bold border-b border-slate-800 pb-2">Core System Configuration</h3>
              <p className="text-slate-400 text-sm mb-6">Manage inference engine thresholds, database connections, and tracking algorithms.</p>
              
              <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-8">
                <div className="space-y-4 min-w-0">
                  <h4 className="text-sm font-bold text-cyan-400 border-b border-slate-800 pb-2">AI Detection Engine</h4>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Detection Confidence Threshold (YOLOv8, server-side)</label>
                    <input type="range" min="1" max="100" defaultValue="75" className="w-full accent-cyan-500" />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>0.1</span>
                      <span className="font-bold text-cyan-400">0.75</span>
                      <span>1.0</span>
                    </div>
                    <p className="text-[10px] text-amber-400/80 mt-1">Not yet wired to the live pipeline — main.py&apos;s stream_camera_frames() currently detects all confidence levels YOLOv8 returns rather than reading this slider.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Tracking Algorithm</label>
                    <select disabled defaultValue="iou" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-400 cursor-not-allowed focus:outline-none">
                      <option value="iou">Custom IOU Tracker (active, server-side)</option>
                    </select>
                    <p className="text-[10px] text-emerald-400/80 mt-1">A real per-camera IOU tracker now assigns persistent track IDs across frames — see CamerasTab, which streams the backend&apos;s annotated MJPEG feed directly instead of running a separate browser-side model.</p>
                  </div>
                </div>

                <div className="space-y-4 min-w-0">
                  <h4 className="text-sm font-bold text-emerald-400 border-b border-slate-800 pb-2">Database Connection</h4>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Primary Connection String (Hidden)</label>
                    <input type="password" value="postgresql://admin:supersecret@localhost:5432/visionretail" readOnly className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-500 cursor-not-allowed" />
                  </div>
                  <div className="flex items-center space-x-3 mt-4 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                    <span className="text-sm font-medium text-emerald-400">PostgreSQL Sync Active</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'cameras' && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="text-lg font-bold border-b border-slate-800 pb-2">Edge Node Configuration</h3>
              <p className="text-xs text-slate-500 mb-4">Configure the video sources the backend&apos;s YOLOv8 pipeline reads from (see CAMERA_DATASETS in main.py).</p>
              {[1, 2, 3, 4].map((node) => (
                <div key={node} className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-300">Node {node}</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20">Online</span>
                  </div>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
                    <div className="space-y-1 min-w-0">
                      <label className="text-[10px] font-mono text-slate-500">Stream Source / Dataset Path</label>
                      <input type="text" defaultValue={`/datasets/archive${node === 1 ? '' : '_' + (node-1)}/cam1.mp4`} className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono" />
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
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">FastAPI Backend Endpoint</label>
                <div className="flex">
                  <input type="text" readOnly defaultValue="http://127.0.0.1:9000" className="w-full bg-slate-900 border border-slate-700 rounded-l-lg px-4 py-2 text-sm text-slate-500 font-mono focus:outline-none" />
                  <button className="bg-slate-800 border-y border-r border-slate-700 px-4 rounded-r-lg text-xs font-bold hover:bg-slate-700">Test</button>
                </div>
              </div>
              <div className="space-y-2 pt-4">
                <label className="text-xs font-bold text-slate-400 uppercase">Authentication Token</label>
                <div className="flex">
                  <input type="password" defaultValue="************************" className="w-full bg-slate-900 border border-slate-700 rounded-l-lg px-4 py-2 text-sm text-slate-300 font-mono focus:outline-none" />
                  <button className="bg-slate-800 border-y border-r border-slate-700 px-4 rounded-r-lg text-xs font-bold hover:bg-slate-700">Reveal</button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'users' && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="text-lg font-bold border-b border-slate-800 pb-2">Access Control</h3>
              <div className="w-full overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="bg-slate-900 text-[10px] uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/30">
                  <tr>
                    <td className="px-4 py-3 font-bold text-slate-300">Admin User</td>
                    <td className="px-4 py-3 text-xs text-cyan-400">Administrator</td>
                    <td className="px-4 py-3"><span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">Active</span></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold text-slate-300">Store Manager 1</td>
                    <td className="px-4 py-3 text-xs text-blue-400">Store Manager</td>
                    <td className="px-4 py-3"><span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">Active</span></td>
                  </tr>
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