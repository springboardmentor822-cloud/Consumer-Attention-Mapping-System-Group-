'use client';

import React, { useState } from 'react';
import { 
  Settings, Store, Video, Bell, Shield, Sliders, CheckCircle2, 
  Save, RefreshCw, Clock, MapPin, Mail, AlertTriangle, Eye, ShieldCheck
} from 'lucide-react';

export default function StoreSettings() {
  const [storeName, setStoreName] = useState('Store 01 - City Mall');
  const [address, setAddress] = useState('123 Main Street, New York, NY 10001');
  const [managerEmail, setManagerEmail] = useState('john.manager@cams.com');
  const [openHours, setOpenHours] = useState('09:00 AM');
  const [closeHours, setCloseHours] = useState('09:00 PM');

  // AI & Detection Settings
  const [dwellThreshold, setDwellThreshold] = useState(30);
  const [crowdThreshold, setCrowdThreshold] = useState(10);
  const [queueThreshold, setQueueThreshold] = useState(5);
  const [detectionModel, setDetectionModel] = useState('YOLOv8 ByteTRACK (High Accuracy)');

  // Alerts Toggle
  const [alertCrowd, setAlertCrowd] = useState(true);
  const [alertAttention, setAlertAttention] = useState(true);
  const [alertCameraOffline, setAlertCameraOffline] = useState(true);
  const [alertQueue, setAlertQueue] = useState(true);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100 font-sans pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Settings className="w-4 h-4" />
            Store Management System Controls
          </div>
          <h2 className="text-2xl font-black text-white">Store Settings & AI Configuration</h2>
          <p className="text-xs text-slate-300 mt-1">
            Configure store location details, computer vision detection thresholds, alert preferences, and camera stream settings.
          </p>
        </div>

        <button 
          onClick={handleSave}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-2xl flex items-center gap-3 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>Store settings and AI detection thresholds updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: General Store Profile & Operating Hours (Span 6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Store Profile Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Store className="w-5 h-5 text-blue-400" />
              General Store Profile
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Store Name</label>
                <input 
                  type="text" 
                  value={storeName} 
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Location Address</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition-colors"
                  />
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Store Manager Contact Email</label>
                <div className="relative">
                  <input 
                    type="email" 
                    value={managerEmail} 
                    onChange={(e) => setManagerEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition-colors"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                </div>
              </div>
            </div>
          </div>

          {/* Operating Hours Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Clock className="w-5 h-5 text-amber-400" />
              Store Operational Schedule
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Opening Time</label>
                <input 
                  type="text" 
                  value={openHours} 
                  onChange={(e) => setOpenHours(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Closing Time</label>
                <input 
                  type="text" 
                  value={closeHours} 
                  onChange={(e) => setCloseHours(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: AI Model & Alert Thresholds (Span 6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Computer Vision Thresholds Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sliders className="w-5 h-5 text-indigo-400" />
              Computer Vision & AI Thresholds
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Object Detection Model Engine</label>
                <select 
                  value={detectionModel} 
                  onChange={(e) => setDetectionModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 font-semibold cursor-pointer"
                >
                  <option>YOLOv8 ByteTRACK (High Accuracy)</option>
                  <option>YOLOv11 Lightweight (High FPS)</option>
                  <option>OpenCV MobileNet SSD (Backup Engine)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Min. Product Dwell Time Threshold</span>
                  <span className="text-indigo-400 font-bold">{dwellThreshold} seconds</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="120" 
                  value={dwellThreshold} 
                  onChange={(e) => setDwellThreshold(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Zone Crowd Surge Warning Limit</span>
                  <span className="text-amber-400 font-bold">{crowdThreshold} shoppers</span>
                </div>
                <input 
                  type="range" 
                  min="3" 
                  max="30" 
                  value={crowdThreshold} 
                  onChange={(e) => setCrowdThreshold(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Checkout Queue Bottleneck Limit</span>
                  <span className="text-red-400 font-bold">{queueThreshold} in queue</span>
                </div>
                <input 
                  type="range" 
                  min="2" 
                  max="15" 
                  value={queueThreshold} 
                  onChange={(e) => setQueueThreshold(Number(e.target.value))}
                  className="w-full accent-red-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Alert Notification Toggles */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Bell className="w-5 h-5 text-purple-400" />
              Real-Time Alert Preferences
            </h3>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer">
                <div>
                  <span className="font-bold text-white block">High Crowd Surge Alert</span>
                  <span className="text-slate-400 text-[10px]">Triggers alert when a zone exceeds crowd threshold</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={alertCrowd} 
                  onChange={(e) => setAlertCrowd(e.target.checked)}
                  className="w-4 h-4 accent-blue-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer">
                <div>
                  <span className="font-bold text-white block">Shelf Low Attention Alert</span>
                  <span className="text-slate-400 text-[10px]">Triggers alert when shelf attention drops below 40%</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={alertAttention} 
                  onChange={(e) => setAlertAttention(e.target.checked)}
                  className="w-4 h-4 accent-blue-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer">
                <div>
                  <span className="font-bold text-white block">Camera Outage Warning</span>
                  <span className="text-slate-400 text-[10px]">Triggers alert if CCTV bitrate drops or camera goes offline</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={alertCameraOffline} 
                  onChange={(e) => setAlertCameraOffline(e.target.checked)}
                  className="w-4 h-4 accent-blue-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

        </div>

      </form>

    </div>
  );
}
