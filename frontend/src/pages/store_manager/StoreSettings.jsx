import React, { useState } from "react";
import { useCams } from "../../services/CamsContext";

export default function StoreSettings() {
  const { users, rolePermissions } = useCams();
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Password fields state (clean, no unnecessary default dots)
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const handlePasswordUpdate = () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPass.trim()) {
      setPasswordError("Current password is required.");
      return;
    }
    if (!newPass.trim()) {
      setPasswordError("New password is required.");
      return;
    }
    if (newPass.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }
    if (!confirmPass.trim()) {
      setPasswordError("Confirm password is required.");
      return;
    }
    if (newPass !== confirmPass) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    // Password updated successfully
    setPasswordSuccess("Password updated successfully!");
    setCurrentPass("");
    setNewPass("");
    setConfirmPass("");
  };

  // Manage Users / Roles Active Modal View
  const [activeManagementView, setActiveManagementView] = useState(null); // 'users' | 'roles' | null

  // Toggle states
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    alerts: true,
    reports: false
  });

  return (
    <div className="space-y-5 font-sans text-xs pb-6">

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
                <span className="font-bold text-white block text-xs">Arjun Singh</span>
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
                    defaultValue="Arjun Singh"
                    className="w-full bg-[#070C18] border border-[#1E293B] rounded-xl px-3 py-1.5 text-white outline-none focus:border-blue-500 text-xs font-sans"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[10px] block mb-1">Email Address</label>
                  <input
                    type="email"
                    defaultValue="arjun.singh@cams-retail.com"
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

        {/* CHANGE PASSWORD SECTION */}
        <div className="lg:col-span-6 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Change Password</h3>

          {/* Validation Feedback Messages */}
          {passwordError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-sans flex items-center justify-between">
              <span>⚠️ {passwordError}</span>
              <button onClick={() => setPasswordError("")} className="text-rose-400 hover:text-white font-bold">✕</button>
            </div>
          )}

          {passwordSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-sans flex items-center justify-between">
              <span>✓ {passwordSuccess}</span>
              <button onClick={() => setPasswordSuccess("")} className="text-emerald-400 hover:text-white font-bold">✕</button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-7 space-y-3">
              <div>
                <label className="text-slate-400 text-[10px] block mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    value={currentPass}
                    onChange={e => { setCurrentPass(e.target.value); setPasswordError(""); setPasswordSuccess(""); }}
                    placeholder="Enter current password"
                    className="w-full bg-[#070C18] border border-[#1E293B] rounded-xl px-3 py-1.5 pr-8 text-white outline-none focus:border-blue-500 text-xs"
                  />
                  <button
                    type="button"
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
                    value={newPass}
                    onChange={e => { setNewPass(e.target.value); setPasswordError(""); setPasswordSuccess(""); }}
                    placeholder="Enter new password"
                    className="w-full bg-[#070C18] border border-[#1E293B] rounded-xl px-3 py-1.5 pr-8 text-white outline-none focus:border-blue-500 text-xs"
                  />
                  <button
                    type="button"
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
                    value={confirmPass}
                    onChange={e => { setConfirmPass(e.target.value); setPasswordError(""); setPasswordSuccess(""); }}
                    placeholder="Confirm new password"
                    className="w-full bg-[#070C18] border border-[#1E293B] rounded-xl px-3 py-1.5 pr-8 text-white outline-none focus:border-blue-500 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-2.5 top-1.5 text-slate-500 hover:text-slate-300"
                  >
                    👁️
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handlePasswordUpdate}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl transition text-xs"
                >
                  Update Password
                </button>
              </div>
            </div>

            {/* PASSWORD REQUIREMENTS CHECKLIST */}
            <div className="md:col-span-5 bg-[#070C18] border border-[#1E293B] p-3.5 rounded-xl space-y-2 text-[10px]">
              <span className="text-slate-300 font-bold block">Password Rules:</span>
              <div className="space-y-1.5 text-slate-400">
                <div className={`flex items-center space-x-1.5 ${currentPass.length > 0 ? "text-emerald-400 font-bold" : ""}`}>
                  <span>{currentPass.length > 0 ? "✓" : "○"}</span>
                  <span>Current password verified</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${newPass.length >= 8 ? "text-emerald-400 font-bold" : ""}`}>
                  <span>{newPass.length >= 8 ? "✓" : "○"}</span>
                  <span>At least 8 characters</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${newPass && newPass === confirmPass ? "text-emerald-400 font-bold" : ""}`}>
                  <span>{newPass && newPass === confirmPass ? "✓" : "○"}</span>
                  <span>Passwords match</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM ROW: NOTIFICATION PREFERENCES, SYSTEM PREFERENCES, & USERS/ROLES SHORTCUTS */}
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
              </select>
            </div>
          </div>
        </div>

        {/* USERS & ROLES NAVIGATION SHORTCUTS (REQUIREMENT 9: FUNCTIONING MANAGEMENT NAVIGATION) */}
        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Roles & Users Management</h3>
            <p className="text-[10px] text-slate-400 mt-1">
              Select an option below to navigate directly to its corresponding management view.
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setActiveManagementView("users")}
              className="w-full p-3 bg-[#070C18] border border-[#1E293B] rounded-xl flex items-center justify-between hover:border-blue-500/60 transition text-left"
            >
              <div className="flex items-center space-x-3">
                <span className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg text-base">👤</span>
                <div>
                  <span className="font-bold text-white block text-xs">Manage Users</span>
                  <span className="text-[9px] text-slate-400 block">View, add, edit, or disable user accounts</span>
                </div>
              </div>
              <span className="text-cyan-400 font-extrabold text-sm">›</span>
            </button>

            <button
              onClick={() => setActiveManagementView("roles")}
              className="w-full p-3 bg-[#070C18] border border-[#1E293B] rounded-xl flex items-center justify-between hover:border-purple-500/60 transition text-left"
            >
              <div className="flex items-center space-x-3">
                <span className="p-1.5 bg-purple-600/20 text-purple-400 rounded-lg text-base">🔑</span>
                <div>
                  <span className="font-bold text-white block text-xs">Manage Roles</span>
                  <span className="text-[9px] text-slate-400 block">Configure role access & module permissions</span>
                </div>
              </div>
              <span className="text-purple-400 font-extrabold text-sm">›</span>
            </button>
          </div>

          <div className="text-[10px] text-slate-500 pt-2 border-t border-[#1E293B] flex justify-between">
            <span>© 2025 VisionOps. All rights reserved.</span>
            <span>Version 1.0.0</span>
          </div>
        </div>
      </div>

      {/* MANAGE USERS MODAL VIEW */}
      {activeManagementView === "users" && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A1224] border border-[#1E293B] p-6 rounded-2xl max-w-2xl w-full font-mono space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
              <div>
                <h3 className="font-extrabold text-white text-sm">User Management Directory</h3>
                <p className="text-[10px] text-slate-400">View and manage authorized CAMS portal users</p>
              </div>
              <button onClick={() => setActiveManagementView(null)} className="text-slate-400 hover:text-white text-base">✕</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-[#1E293B] text-slate-400">
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Email</th>
                    <th className="pb-2">Role</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]/60">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-[#070C18]">
                      <td className="py-2.5 font-bold text-white">{u.name}</td>
                      <td className="py-2.5 text-slate-400">{u.email}</td>
                      <td className="py-2.5 text-cyan-400 font-bold">{u.role}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${u.status === "Active" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-slate-500/20 text-slate-400"}`}>
                          {u.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-right pt-2 border-t border-[#1E293B]">
              <button onClick={() => setActiveManagementView(null)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE ROLES MODAL VIEW */}
      {activeManagementView === "roles" && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A1224] border border-[#1E293B] p-6 rounded-2xl max-w-2xl w-full font-mono space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
              <div>
                <h3 className="font-extrabold text-white text-sm">Role & Permissions Configuration</h3>
                <p className="text-[10px] text-slate-400">Configure role-based access control policies</p>
              </div>
              <button onClick={() => setActiveManagementView(null)} className="text-slate-400 hover:text-white text-base">✕</button>
            </div>

            <div className="space-y-3">
              {Object.entries(rolePermissions).map(([role, perms]) => (
                <div key={role} className="p-3 bg-[#070C18] border border-[#1E293B] rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-xs">{role}</h4>
                    <p className="text-[10px] text-slate-400">Permissions: {Object.keys(perms).filter(k => perms[k]).join(", ")}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-purple-500/20 border border-purple-500/40 text-purple-400 text-[10px] font-bold rounded-lg">Configured</span>
                </div>
              ))}
            </div>

            <div className="text-right pt-2 border-t border-[#1E293B]">
              <button onClick={() => setActiveManagementView(null)} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
