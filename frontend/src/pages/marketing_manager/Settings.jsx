import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Header = ({ navigate }) => (
  <div className="bg-[#0D1527] border border-[#1E293B] rounded-2xl p-3 px-5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
    <div className="flex items-center space-x-3">
      <button onClick={() => navigate("/marketing-manager")} className="bg-[#182238] hover:bg-[#202C48] text-slate-300 font-semibold text-xs px-3 py-1.5 rounded-xl border border-[#273552] flex items-center space-x-1.5 transition">
        <span>←</span><span>Back</span>
      </button>
      <span className="text-white font-black text-sm tracking-wide">Consumer Attention Mapping System</span>
      <span className="bg-[#B45309]/30 text-[#F59E0B] border border-[#B45309]/50 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Marketing Manager Portal</span>
    </div>
    <button className="bg-[#3F1A24] hover:bg-[#52212E] text-[#F87171] border border-[#7F1D1D]/50 font-bold px-3 py-1.5 rounded-xl text-xs transition">Logout</button>
  </div>
);

export default function Settings() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("Profile");
  const [notifications, setNotifications] = useState({ email: true, sms: false, push: true, weekly: true, alerts: true, reports: false });

  const toggle = (key) => setNotifications(prev => ({ ...prev, [key]: !prev[key] }));

  const Toggle = ({ value, onToggle }) => (
    <button onClick={onToggle} className={`relative w-10 h-5 rounded-full transition-colors ${value ? "bg-[#D97706]" : "bg-[#1E293B]"}`}>
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`}></div>
    </button>
  );

  return (
    <div className="space-y-6 font-sans text-xs text-slate-200">


      <div>
        <h1 className="text-xl font-black text-white">⚙️ Settings</h1>
        <p className="text-slate-400 text-xs">Manage your Marketing Manager portal preferences and account settings.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-[#1E293B] pb-2">
        {["Profile", "Notifications", "Dashboard", "API Access", "Team"].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${tab === t ? "bg-[#D97706] text-slate-950 border-[#D97706]" : "bg-[#0F172A] text-slate-400 border-[#1E293B] hover:text-white"}`}>{t}</button>
        ))}
      </div>

      {tab === "Profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-[#0F172A] border border-[#1E293B] p-6 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase">Account Information</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "First Name", val: "Arjun" }, { label: "Last Name", val: "Sharma" },
                { label: "Email", val: "arjun.sharma@company.com" }, { label: "Phone", val: "+91 98765 43210" },
                { label: "Department", val: "Marketing" }, { label: "Role", val: "Marketing Manager" },
              ].map((f, i) => (
                <div key={i} className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">{f.label}</label>
                  <input defaultValue={f.val} className="w-full bg-[#070C18] border border-[#1E293B] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D97706] transition" />
                </div>
              ))}
            </div>
            <button className="bg-[#D97706] text-slate-950 font-bold px-4 py-2 rounded-xl text-xs hover:bg-[#B45309] transition">Save Changes</button>
          </div>

          <div className="space-y-4">
            <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold text-white uppercase">Profile Picture</h3>
              <div className="flex flex-col items-center space-y-3">
                <div className="w-20 h-20 rounded-full bg-[#D97706] text-slate-950 font-black flex items-center justify-center text-2xl">A</div>
                <button className="bg-[#182238] border border-[#273552] text-slate-300 px-4 py-2 rounded-xl text-xs hover:text-white transition">Upload Photo</button>
              </div>
            </div>
            <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-white uppercase">Change Password</h3>
              {["Current Password", "New Password", "Confirm Password"].map((p, i) => (
                <div key={i} className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold">{p}</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-[#070C18] border border-[#1E293B] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D97706] transition" />
                </div>
              ))}
              <button className="bg-[#182238] border border-[#273552] text-slate-300 px-4 py-2 rounded-xl text-xs w-full hover:text-white transition">Update Password</button>
            </div>
          </div>
        </div>
      )}

      {tab === "Notifications" && (
        <div className="bg-[#0F172A] border border-[#1E293B] p-6 rounded-2xl space-y-5">
          <h3 className="text-xs font-bold text-white uppercase">Notification Preferences</h3>
          <div className="space-y-4 divide-y divide-[#1E293B]">
            {[
              { key: "email", label: "Email Notifications", desc: "Receive daily summary reports via email" },
              { key: "sms", label: "SMS Alerts", desc: "Get SMS for high-priority campaign alerts" },
              { key: "push", label: "Push Notifications", desc: "Browser push notifications for real-time updates" },
              { key: "weekly", label: "Weekly Reports", desc: "Automated weekly performance digest" },
              { key: "alerts", label: "Campaign Alerts", desc: "Instant alerts when campaigns hit milestones" },
              { key: "reports", label: "Export Completion", desc: "Notify when report exports are ready to download" },
            ].map((n) => (
              <div key={n.key} className="flex items-center justify-between pt-4 first:pt-0">
                <div>
                  <span className="text-xs font-bold text-white block">{n.label}</span>
                  <span className="text-[10px] text-slate-400">{n.desc}</span>
                </div>
                <Toggle value={notifications[n.key]} onToggle={() => toggle(n.key)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Dashboard" && (
        <div className="bg-[#0F172A] border border-[#1E293B] p-6 rounded-2xl space-y-5">
          <h3 className="text-xs font-bold text-white uppercase">Dashboard Preferences</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Default Date Range", options: ["Last 7 Days", "Last 30 Days", "This Quarter"], selected: "Last 7 Days" },
              { label: "Default Chart Type", options: ["Line Chart", "Bar Chart", "Area Chart"], selected: "Line Chart" },
              { label: "Default Store Filter", options: ["All Stores", "Store 1", "Store 2"], selected: "All Stores" },
              { label: "Data Refresh Rate", options: ["5 minutes", "15 minutes", "30 minutes"], selected: "5 minutes" },
            ].map((s, i) => (
              <div key={i} className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">{s.label}</label>
                <select className="w-full bg-[#070C18] border border-[#1E293B] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D97706] transition">
                  {s.options.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <button className="bg-[#D97706] text-slate-950 font-bold px-4 py-2 rounded-xl text-xs hover:bg-[#B45309] transition">Save Preferences</button>
        </div>
      )}

      {tab === "API Access" && (
        <div className="bg-[#0F172A] border border-[#1E293B] p-6 rounded-2xl space-y-5">
          <h3 className="text-xs font-bold text-white uppercase">API Keys & Access</h3>
          <div className="space-y-3">
            {[
              { name: "Production API Key", key: "mk_prod_••••••••••••••••••••4f2a", created: "Jan 12, 2025", status: "Active" },
              { name: "Development API Key", key: "mk_dev_••••••••••••••••••••8b3c", created: "Mar 5, 2025", status: "Active" },
            ].map((k, i) => (
              <div key={i} className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-white block">{k.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{k.key}</span>
                  <span className="text-[10px] text-slate-500">Created: {k.created}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">{k.status}</span>
                  <button className="bg-[#182238] border border-[#273552] text-slate-300 px-2 py-1 rounded-lg text-[10px] hover:text-white transition">Revoke</button>
                </div>
              </div>
            ))}
          </div>
          <button className="bg-[#D97706] text-slate-950 font-bold px-4 py-2 rounded-xl text-xs">+ Generate New Key</button>
        </div>
      )}

      {tab === "Team" && (
        <div className="bg-[#0F172A] border border-[#1E293B] p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase">Team Members</h3>
            <button className="bg-[#D97706] text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs">+ Invite Member</button>
          </div>
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-[#1E293B] text-slate-400">
                <th className="pb-2">Name</th><th className="pb-2">Email</th><th className="pb-2">Role</th><th className="pb-2">Status</th><th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60">
              {[
                { name: "Arjun Sharma", email: "arjun@company.com", role: "Marketing Manager", status: "Active" },
                { name: "Priya Mehta", email: "priya@company.com", role: "Campaign Analyst", status: "Active" },
                { name: "Rohan Verma", email: "rohan@company.com", role: "Content Strategist", status: "Inactive" },
                { name: "Sneha Patel", email: "sneha@company.com", role: "Data Analyst", status: "Active" },
              ].map((m, i) => (
                <tr key={i} className="hover:bg-[#0D1527]/50 transition">
                  <td className="py-2 font-bold text-white">{m.name}</td>
                  <td className="py-2 text-slate-400">{m.email}</td>
                  <td className="py-2 text-slate-300">{m.role}</td>
                  <td className="py-2"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${m.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-slate-500/10 text-slate-400 border-slate-500/30"}`}>{m.status}</span></td>
                  <td className="py-2">
                    <button className="text-[10px] text-slate-400 hover:text-white transition mr-2">Edit</button>
                    <button className="text-[10px] text-rose-400 hover:text-rose-300 transition">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
