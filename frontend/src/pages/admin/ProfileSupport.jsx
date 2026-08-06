import React, { useState } from "react";

export default function ProfileSupport() {
  const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'security' | 'tickets' | 'help' | 'activity'

  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const [profileForm, setProfileForm] = useState({
    name: "Kiran Reddy",
    designation: "Chief System Administrator",
    email: "kiran@cams-retail.com",
    phone: "+91 98765 43210",
    theme: "Dark Mode (Midnight Blue)",
    language: "English (US)",
    dashboardView: "Central Monitoring Dashboard"
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Support Tickets State
  const [ticketsList, setTicketsList] = useState([
    { id: "TICKET-101", subject: "Camera CAM-005 RTSP Stream Drop Issue", category: "Hardware & Streams", priority: "High", status: "In Progress", created: "Today, 09:30 AM", responses: 3 },
    { id: "TICKET-102", subject: "Request API Quota Extension for Analytics", category: "API & Integrations", priority: "Medium", status: "Resolved", created: "Jul 29, 2026", responses: 5 }
  ]);

  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: "", category: "Hardware & Streams", priority: "Medium", desc: "" });

  const handleCreateTicket = (e) => {
    e.preventDefault();
    const created = {
      id: `TICKET-${Math.floor(100 + Math.random() * 900)}`,
      subject: newTicket.subject,
      category: newTicket.category,
      priority: newTicket.priority,
      status: "Open",
      created: "Just now",
      responses: 0
    };
    setTicketsList([created, ...ticketsList]);
    setIsCreateTicketOpen(false);
    showToast(`Support ticket ${created.id} submitted! Support team assigned.`);
  };

  // Recent Account Activity
  const personalActivity = [
    { id: 1, action: "Updated Profile details & contact phone", timestamp: "Today, 10:14 AM", ip: "192.168.1.10" },
    { id: 2, action: "Generated Custom PDF Report: Store 1 Analytics", timestamp: "Today, 08:00 AM", ip: "192.168.1.10" },
    { id: 3, action: "Authenticated via 2FA OAuth2", timestamp: "Today, 08:02 AM", ip: "192.168.1.10" },
  ];

  return (
    <div className="space-y-6 font-sans text-slate-100 pb-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-900 border border-indigo-500 text-indigo-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-bounce">
          <span>👤</span> {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 flex flex-wrap justify-between items-center gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-xl font-black text-white shadow-lg">
            KR
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wide">{profileForm.name}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{profileForm.designation} • {profileForm.email}</p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateTicketOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-2"
        >
          <span>💬</span> Contact Support / Ticket
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#1E293B] gap-2 overflow-x-auto pb-1">
        {[
          { id: "profile", label: "👤 Personal Profile Details", count: "Account" },
          { id: "security", label: "🔒 Password & Security", count: "2FA Active" },
          { id: "tickets", label: "🎫 Support Tickets & Chat", count: ticketsList.length },
          { id: "help", label: "📚 Help Resources & FAQs", count: "Guides" },
          { id: "activity", label: "⏱️ Recent Account Activity", count: personalActivity.length },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap
              ${activeTab === t.id
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-[#0F172A] text-slate-400 border border-[#1E293B] hover:text-white"
              }`}
          >
            <span>{t.label}</span>
            <span className="px-1.5 py-0.5 text-[9px] rounded-md bg-black/30 font-mono">{t.count}</span>
          </button>
        ))}
      </div>

      {/* ── TAB 1: PROFILE DETAILS ───────────────────────────────────────── */}
      {activeTab === "profile" && (
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 space-y-4 max-w-2xl">
          <h3 className="text-sm font-extrabold text-white">Administrator Personal Profile Details</h3>

          <form onSubmit={(e) => {
            e.preventDefault();
            showToast("Profile details updated successfully!");
          }} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Full Name</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Designation / Role Title</label>
              <input
                type="text"
                value={profileForm.designation}
                onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Phone Number</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-md">
                Update Profile Info
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 2: SECURITY & PASSWORD ───────────────────────────────────── */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 space-y-4 max-w-2xl">
            <h3 className="text-sm font-extrabold text-white">Change Account Password</h3>

            <form onSubmit={(e) => {
              e.preventDefault();
              showToast("Password updated successfully!");
            }} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Current Password</label>
                <input type="password" required className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono" />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">New Password</label>
                <input type="password" required className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono" />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Confirm New Password</label>
                <input type="password" required className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono" />
              </div>

              <div className="pt-2">
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-md">
                  Update Password
                </button>
              </div>
            </form>
          </div>

          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 space-y-3 max-w-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-extrabold text-white text-sm">Two-Factor Authentication (2FA)</h4>
                <p className="text-xs text-slate-400 mt-0.5">Authenticator App (TOTP) is currently active on your account.</p>
              </div>
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-xl">
                ● 2FA Enabled
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: SUPPORT TICKETS ───────────────────────────────────────── */}
      {activeTab === "tickets" && (
        <div className="space-y-4">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>🎫</span> Technical Support Tickets & Live Chat
              </h3>
              <button
                onClick={() => setIsCreateTicketOpen(true)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition"
              >
                + Submit Ticket
              </button>
            </div>

            <div className="space-y-3">
              {ticketsList.map((t) => (
                <div key={t.id} className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl flex flex-wrap justify-between items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{t.subject}</span>
                      <span className="text-[10px] font-mono text-indigo-400 font-bold">{t.id}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Category: {t.category} • Submitted: {t.created}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${t.status === "In Progress" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"}`}>
                      ● {t.status}
                    </span>
                    <button
                      onClick={() => showToast(`Opened support thread for ${t.id}`)}
                      className="px-3 py-1 bg-[#1E293B] hover:bg-[#273552] text-xs font-bold text-slate-200 rounded-lg transition"
                    >
                      View Thread ({t.responses})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: HELP RESOURCES ────────────────────────────────────────── */}
      {activeTab === "help" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-2">
            <h4 className="font-bold text-white text-sm">📚 Platform User Guide & Manual</h4>
            <p className="text-xs text-slate-400">Complete documentation for configuring RTSP camera streams, planograms, and AI models.</p>
            <button className="text-xs font-bold text-indigo-400 hover:underline pt-2 block">Read User Guide →</button>
          </div>
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-2">
            <h4 className="font-bold text-white text-sm">🎥 Video Walkthrough Tutorials</h4>
            <p className="text-xs text-slate-400">Step-by-step video training for store managers and retail analysts.</p>
            <button className="text-xs font-bold text-indigo-400 hover:underline pt-2 block">Watch Tutorials →</button>
          </div>
        </div>
      )}

      {/* ── TAB 5: RECENT ACCOUNT ACTIVITY ──────────────────────────────── */}
      {activeTab === "activity" && (
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <span>⏱️</span> Recent Personal Account Audit Trail
          </h3>
          <div className="space-y-2">
            {personalActivity.map((act) => (
              <div key={act.id} className="p-3 bg-[#070C18] border border-[#1E293B] rounded-xl flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-white block">{act.action}</span>
                  <span className="text-[10px] text-slate-400 font-mono">IP: {act.ip}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{act.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE SUPPORT TICKET ─────────────────────────────────── */}
      {isCreateTicketOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
              <h3 className="text-base font-extrabold text-white">🎫 Submit Support Ticket</h3>
              <button onClick={() => setIsCreateTicketOpen(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Ticket Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RTSP Camera Latency Spike"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Issue Category</label>
                <select
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                  className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                >
                  <option>Hardware & Streams</option>
                  <option>API & Integrations</option>
                  <option>AI Model & Inference</option>
                  <option>Billing & Subscriptions</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Detailed Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the issue you are experiencing..."
                  value={newTicket.desc}
                  onChange={(e) => setNewTicket({ ...newTicket, desc: e.target.value })}
                  className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1E293B]">
                <button type="button" onClick={() => setIsCreateTicketOpen(false)} className="px-4 py-2 bg-[#1E293B] text-slate-300 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
