import React, { useState } from "react";

export default function StoreSettings() {
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Toggle states
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    alerts: true,
    reports: false
  });

  return (
    <div className="space-y-5 font-sans text-xs">

      {/* 2. TOP ROW: PROFILE INFO & CHANGE PASSWORD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* PROFILE INFORMATION */}
        <div className="lg:col-span-6 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Profile Information</h3>
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-slate-700 border-2 border-blue-500 overflow-hidden flex items-center justify-center text-3xl text-white font-bold">
                👨‍💼
              </div>
              <button className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 border border-[#0F172A] rounded-full flex items-center justify-center text-white text-[10px]">
                📷
              </button>
              <div className="mt-2 text-center">
                <span className="font-bold text-white block text-xs">John Manager</span>
                <span className="text-[10px] text-slate-400 block">Store Manager</span>
                <span className="mt-1 inline-block px-2 py-0.5 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded text-[9px] font-bold">
                  Administrator
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-3 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-[10px] block mb-1">Full Name</label>
                  <input
                    type="text"
                    defaultValue="John Manager"
                    className="w-full bg-[#070C18] border border-[#1E293B] rounded-xl px-3 py-1.5 text-white outline-none focus:border-blue-500 text-xs font-sans"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[10px] block mb-1">Email Address</label>
                  <input
                    type="email"
                    defaultValue="john.manager@visionops.com"
                    className="w-full bg-[#070C18] border border-[#1E293B] rounded-xl px-3 py-1.5 text-white outline-none focus:border-blue-500 text-xs font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-[10px] block mb-1">Phone Number</label>
                <input
                  type="text"
                  defaultValue="+91 98765 43210"
                  className="w-full bg-[#070C18] border border-[#1E293B] rounded-xl px-3 py-1.5 text-white outline-none focus:border-blue-500 text-xs font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-[10px] block mb-1">Language</label>
                  <select className="w-full bg-[#070C18] border border-[#1E293B] rounded-xl px-3 py-1.5 text-white outline-none focus:border-blue-500 text-xs">
                    <option>English</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-[10px] block mb-1">Time Zone</label>
                  <select className="w-full bg-[#070C18] border border-[#1E293B] rounded-xl px-3 py-1.5 text-white outline-none focus:border-blue-500 text-xs">
                    <option>(GMT +05:30) India Standard Time</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="text-right pt-2">
            <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl transition text-xs">
              Save Changes
            </button>
          </div>
        </div>

        {/* CHANGE PASSWORD */}
        <div className="lg:col-span-6 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Change Password</h3>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-7 space-y-3">
              <div>
                <label className="text-slate-400 text-[10px] block mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    defaultValue="••••••••"
                    className="w-full bg-[#070C18] border border-[#1E293B] rounded-xl px-3 py-1.5 pr-8 text-white outline-none focus:border-blue-500 text-xs"
                  />
                  <button
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-2.5 top-1.5 text-slate-500 hover:text-slate-300"
                  >
                    👁️
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-[10px] block mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPass ? "text" : "password"}
                    defaultValue="••••••••"
                    className="w-full bg-[#070C18] border border-[#1E293B] rounded-xl px-3 py-1.5 pr-8 text-white outline-none focus:border-blue-500 text-xs"
                  />
                  <button
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-2.5 top-1.5 text-slate-500 hover:text-slate-300"
                  >
                    👁️
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-[10px] block mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    defaultValue="••••••••"
                    className="w-full bg-[#070C18] border border-[#1E293B] rounded-xl px-3 py-1.5 pr-8 text-white outline-none focus:border-blue-500 text-xs"
                  />
                  <button
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-2.5 top-1.5 text-slate-500 hover:text-slate-300"
                  >
                    👁️
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl transition text-xs">
                  Update Password
                </button>
              </div>
            </div>

            {/* PASSWORD REQUIREMENTS CHECKLIST */}
            <div className="md:col-span-5 bg-[#070C18] border border-[#1E293B] p-3.5 rounded-xl space-y-2 text-[10px]">
              <span className="text-slate-300 font-bold block">Password must contain:</span>
              <div className="space-y-1.5 text-emerald-400">
                <div className="flex items-center space-x-1.5">
                  <span>✓</span>
                  <span>At least 8 characters</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span>✓</span>
                  <span>One uppercase letter</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span>✓</span>
                  <span>One lowercase letter</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span>✓</span>
                  <span>One number</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span>✓</span>
                  <span>One special character</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM ROW: NOTIFICATION PREFERENCES, SYSTEM PREFERENCES, & USERS SHORTCUTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* NOTIFICATION PREFERENCES */}
        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Notification Preferences</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 bg-[#070C18] border border-[#1E293B] rounded-xl">
              <div className="flex items-center space-x-3">
                <span className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg">✉️</span>
                <div>
                  <span className="font-bold text-white block text-xs">Email Notifications</span>
                  <span className="text-[9px] text-slate-400 block">Receive email alerts and reports</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifications.email}
                onChange={() => setNotifications({ ...notifications, email: !notifications.email })}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 bg-[#070C18] border border-[#1E293B] rounded-xl">
              <div className="flex items-center space-x-3">
                <span className="p-1.5 bg-purple-600/20 text-purple-400 rounded-lg">🔔</span>
                <div>
                  <span className="font-bold text-white block text-xs">Push Notifications</span>
                  <span className="text-[9px] text-slate-400 block">Receive push notifications in browser</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifications.push}
                onChange={() => setNotifications({ ...notifications, push: !notifications.push })}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 bg-[#070C18] border border-[#1E293B] rounded-xl">
              <div className="flex items-center space-x-3">
                <span className="p-1.5 bg-amber-600/20 text-amber-400 rounded-lg">⚠️</span>
                <div>
                  <span className="font-bold text-white block text-xs">Alert Notifications</span>
                  <span className="text-[9px] text-slate-400 block">Receive alerts for important events</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifications.alerts}
                onChange={() => setNotifications({ ...notifications, alerts: !notifications.alerts })}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 bg-[#070C18] border border-[#1E293B] rounded-xl">
              <div className="flex items-center space-x-3">
                <span className="p-1.5 bg-cyan-600/20 text-cyan-400 rounded-lg">📄</span>
                <div>
                  <span className="font-bold text-white block text-xs">Reports & Summaries</span>
                  <span className="text-[9px] text-slate-400 block">Receive daily/weekly summary reports</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifications.reports}
                onChange={() => setNotifications({ ...notifications, reports: !notifications.reports })}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="text-right pt-2">
            <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl transition text-xs">
              Save Preferences
            </button>
          </div>
        </div>

        {/* SYSTEM PREFERENCES */}
        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">System Preferences</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 bg-[#070C18] border border-[#1E293B] rounded-xl">
              <div className="flex items-center space-x-3">
                <span className="p-1.5 bg-emerald-600/20 text-emerald-400 rounded-lg">⏱️</span>
                <div>
                  <span className="font-bold text-white block text-xs">Data Refresh Interval</span>
                  <span className="text-[9px] text-slate-400 block">Set how often data is updated</span>
                </div>
              </div>
              <select className="bg-[#0F172A] border border-[#1E293B] rounded-lg px-2 py-1 text-white text-[10px] outline-none">
                <option>5 Minutes</option>
                <option>10 Minutes</option>
                <option>15 Minutes</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-[#070C18] border border-[#1E293B] rounded-xl">
              <div className="flex items-center space-x-3">
                <span className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg">📊</span>
                <div>
                  <span className="font-bold text-white block text-xs">Default Dashboard View</span>
                  <span className="text-[9px] text-slate-400 block">Select default dashboard</span>
                </div>
              </div>
              <select className="bg-[#0F172A] border border-[#1E293B] rounded-lg px-2 py-1 text-white text-[10px] outline-none">
                <option>Overview</option>
                <option>Live Cameras</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-[#070C18] border border-[#1E293B] rounded-xl">
              <div className="flex items-center space-x-3">
                <span className="p-1.5 bg-rose-600/20 text-rose-400 rounded-lg">📹</span>
                <div>
                  <span className="font-bold text-white block text-xs">Video Playback Quality</span>
                  <span className="text-[9px] text-slate-400 block">Set default video quality</span>
                </div>
              </div>
              <select className="bg-[#0F172A] border border-[#1E293B] rounded-lg px-2 py-1 text-white text-[10px] outline-none">
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-[#070C18] border border-[#1E293B] rounded-xl">
              <div className="flex items-center space-x-3">
                <span className="p-1.5 bg-amber-600/20 text-amber-400 rounded-lg">🔢</span>
                <div>
                  <span className="font-bold text-white block text-xs">Items Per Page</span>
                  <span className="text-[9px] text-slate-400 block">Set default table pagination</span>
                </div>
              </div>
              <select className="bg-[#0F172A] border border-[#1E293B] rounded-lg px-2 py-1 text-white text-[10px] outline-none">
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
            </div>
          </div>

          <div className="text-right pt-2">
            <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl transition text-xs">
              Save Preferences
            </button>
          </div>
        </div>

        {/* USERS & ROLES SHORTCUTS */}
        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Users & Roles Shortcuts</h3>
            <p className="text-[10px] text-slate-400 mt-1">
              Manage users, roles, and permissions
            </p>
          </div>

          <div className="p-4 bg-[#070C18] border border-[#1E293B] rounded-2xl flex items-center justify-between cursor-pointer hover:border-blue-500/50 transition">
            <div className="flex items-center space-x-3">
              <span className="p-2 bg-blue-600/20 text-blue-400 rounded-xl text-lg">👥</span>
              <span className="font-bold text-white text-xs">Manage Users & Roles</span>
            </div>
            <span className="text-slate-400">›</span>
          </div>

          <div className="text-[10px] text-slate-500 pt-4 border-t border-[#1E293B] flex justify-between">
            <span>© 2025 VisionOps. All rights reserved.</span>
            <span>Version 1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
