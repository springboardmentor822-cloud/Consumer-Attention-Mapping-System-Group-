import React, { useState, useEffect } from "react";
import { getSession, updateProfileAPI, updateSessionProfile } from "../../../src/utils/auth";

export default function Settings() {
  const session = getSession();

  const [profile, setProfile] = useState({
    firstName: session?.fullName?.split(" ")[0] || "",
    lastName: session?.fullName?.split(" ").slice(1).join(" ") || "",
    email: session?.email || "",
    phone: session?.phone || "",
    department: "Marketing",
    role: session?.role || "Marketing Manager"
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    if (session) {
      setProfile(prev => ({
        ...prev,
        firstName: session.fullName?.split(" ")[0] || prev.firstName,
        lastName: session.fullName?.split(" ").slice(1).join(" ") || prev.lastName,
        email: session.email || prev.email,
        phone: session.phone || prev.phone,
        role: session.role || prev.role
      }));
    }
  }, [session?.fullName, session?.email, session?.phone, session?.role]);

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    weekly: true,
    alerts: true,
    reports: false
  });

  const [savedStatus, setSavedStatus] = useState(false);

  const toggle = (key) => setNotifications(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSave = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setProfileError("");
    setSavedStatus(false);
    
    try {
      const full_name = `${profile.firstName} ${profile.lastName}`.trim();
      const updatedData = await updateProfileAPI({
        full_name,
        email: profile.email,
        phone: profile.phone
      });
      updateSessionProfile({
        fullName: updatedData.full_name,
        email: updatedData.email,
        phone: updatedData.phone
      });
      setSavedStatus(true);
      setTimeout(() => setSavedStatus(false), 3000);
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const Toggle = ({ value, onToggle }) => (
    <button onClick={onToggle} type="button" className={`relative w-10 h-5 rounded-full transition-colors ${value ? "bg-amber-500" : "bg-[#1E293B]"}`}>
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`}></div>
    </button>
  );

  return (
    <div className="space-y-6 font-sans text-xs text-slate-200 pb-8">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl shadow-lg">
        <div>
          <h1 className="text-xl font-black text-white">Marketing Manager Profile & Settings</h1>
          <p className="text-[11px] text-slate-400 font-sans mt-0.5">Manage user account profile, contact details, security credentials, and alert preferences directly</p>
        </div>
        {savedStatus && (
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-mono animate-pulse">
            ✓ Settings Saved Successfully!
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ACCOUNT PROFILE INFORMATION */}
        <div className="lg:col-span-8 bg-[#0F172A] border border-[#1E293B] p-6 rounded-2xl space-y-5">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono border-b border-[#1E293B] pb-3">Account Profile Information</h3>
          {profileError && (
            <div className="p-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl mb-3">{profileError}</div>
          )}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 font-mono">
                <label className="text-[10px] text-slate-400 font-bold uppercase font-sans">First Name</label>
                <input
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  className="w-full bg-[#070C18] border border-[#1E293B] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500 transition"
                />
              </div>
              <div className="space-y-1 font-mono">
                <label className="text-[10px] text-slate-400 font-bold uppercase font-sans">Last Name</label>
                <input
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  className="w-full bg-[#070C18] border border-[#1E293B] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500 transition"
                />
              </div>
              <div className="space-y-1 font-mono">
                <label className="text-[10px] text-slate-400 font-bold uppercase font-sans">Email Address</label>
                <input
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full bg-[#070C18] border border-[#1E293B] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500 transition"
                />
              </div>
              <div className="space-y-1 font-mono">
                <label className="text-[10px] text-slate-400 font-bold uppercase font-sans">Phone Number</label>
                <input
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full bg-[#070C18] border border-[#1E293B] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500 transition"
                />
              </div>
              <div className="space-y-1 font-mono">
                <label className="text-[10px] text-slate-400 font-bold uppercase font-sans">Department</label>
                <input
                  value={profile.department}
                  readOnly
                  className="w-full bg-[#070C18]/60 border border-[#1E293B] rounded-xl px-3 py-2 text-slate-400 text-xs cursor-not-allowed"
                />
              </div>
              <div className="space-y-1 font-mono">
                <label className="text-[10px] text-slate-400 font-bold uppercase font-sans">Role Permission</label>
                <input
                  value={profile.role}
                  readOnly
                  className="w-full bg-[#070C18]/60 border border-[#1E293B] rounded-xl px-3 py-2 text-amber-400 font-bold text-xs cursor-not-allowed"
                />
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button type="submit" disabled={isUpdating} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-5 py-2 rounded-xl text-xs transition disabled:opacity-50">
                {isUpdating ? "Saving..." : "Save Profile Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* SECURITY & PROFILE BADGE */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono text-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1E293B] pb-2 text-left">Manager Profile</h3>
            <div className="w-16 h-16 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-2xl mx-auto shadow-lg">
              {profile.firstName ? profile.firstName.substring(0, 2).toUpperCase() : "MM"}
            </div>
            <div>
              <strong className="text-white text-sm block font-sans">{profile.firstName} {profile.lastName}</strong>
              <span className="text-[10px] text-amber-400 font-bold block">{profile.role}</span>
              <span className="text-[10px] text-slate-400 block font-sans mt-0.5">{profile.email}</span>
            </div>
          </div>

          {/* PASSWORD SECURITY */}
          <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1E293B] pb-2">Security & Credentials</h3>
            <div className="space-y-2.5">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold font-sans">Current Password</label>
                <input type="password" placeholder="••••••••" className="w-full bg-[#070C18] border border-[#1E293B] rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold font-sans">New Password</label>
                <input type="password" placeholder="••••••••" className="w-full bg-[#070C18] border border-[#1E293B] rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500" />
              </div>
            </div>
            <button onClick={() => alert("Security credentials updated!")} className="w-full py-2 bg-[#1E293B] hover:bg-[#273449] text-white font-bold rounded-xl text-xs border border-[#334155] transition mt-2 font-sans">
              Update Password
            </button>
          </div>
        </div>
      </div>

      {/* DIRECT NOTIFICATION PREFERENCES */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-6 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono border-b border-[#1E293B] pb-3">Direct Notification Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: "email", label: "Email Summaries", desc: "Receive daily marketing performance digest via email" },
            { key: "sms", label: "SMS Alerts", desc: "Instant SMS alerts when campaign budget or conversion drops" },
            { key: "push", label: "Browser Notifications", desc: "Real-time browser notifications for high priority store actions" },
            { key: "weekly", label: "Weekly Executive Report", desc: "Automated weekly campaign ROI and attention analysis report" },
            { key: "alerts", label: "Promotion Threshold Alerts", desc: "Notification when active promotions reach milestone targets" },
            { key: "reports", label: "Report Export Notifications", desc: "Alert when scheduled PDF or Excel report files are generated" },
          ].map((n) => (
            <div key={n.key} className="p-3.5 bg-[#070C18] border border-[#1E293B] rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">{n.label}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{n.desc}</span>
              </div>
              <Toggle value={notifications[n.key]} onToggle={() => toggle(n.key)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
