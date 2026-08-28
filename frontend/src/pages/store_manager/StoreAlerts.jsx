import React, { useState } from "react";
import CustomDateSelector from "../../components/CustomDateSelector";
import { getCentralScaledData } from "../../services/centralData";
import { useCams } from "../../services/CamsContext";

export default function StoreAlerts() {
  // Date Filter State (null means inherit globalFilter)
  const { globalFilter } = useCams();
  const selectedPeriod = globalFilter?.dateRange || "Last 7 Days";
  const customRange = globalFilter?.dateRange === "Custom Date Range" ? globalFilter : null;

  const centralData = getCentralScaledData(selectedPeriod, customRange);
  const mult = centralData.mult;

  const [filter, setFilter] = useState("all");
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [assignModalAlert, setAssignModalAlert] = useState(null);
  const [editModalAlert, setEditModalAlert] = useState(null);
  const [assignee, setAssignee] = useState("Priya Mehta (Analyst)");

  // Edit alert form fields
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editType, setEditType] = useState("Critical");
  const [editStatus, setEditStatus] = useState("New");

  // Dynamic alerts list synced with central mult
  const [alertsList, setAlertsList] = useState([
    {
      id: 1,
      title: "Camera CAM-04 Offline",
      desc: "Checkout billing camera stream interrupted.",
      type: "Critical",
      typeBg: "bg-rose-500/20 text-rose-400 border-rose-500/40",
      location: "Checkout C2",
      time: "Just Now",
      status: "New",
      assignedTo: "Unassigned",
      statusBg: "bg-rose-500/20 text-rose-400 border-rose-500/40",
      icon: "📹",
      iconBg: "bg-rose-600/20 text-rose-400 border-rose-500/30"
    },
    {
      id: 2,
      title: "Crowd Surge Detected",
      desc: `Density index exceeded 90% in Aisle 4 corridor (${Math.round(140 * mult)} visitors detected).`,
      type: "Critical",
      typeBg: "bg-rose-500/20 text-rose-400 border-rose-500/40",
      location: "Aisle 4",
      time: "10 min ago",
      status: "In Progress",
      assignedTo: "Arjun Singh",
      statusBg: "bg-blue-500/20 text-blue-400 border-blue-500/40",
      icon: "👥",
      iconBg: "bg-rose-600/20 text-rose-400 border-rose-500/30"
    },
    {
      id: 3,
      title: "Low Stock Alert (Bakery A1)",
      desc: "Artisan Bread SKU level dropped to 6 units.",
      type: "High",
      typeBg: "bg-amber-500/20 text-amber-400 border-amber-500/40",
      location: "Bakery A1",
      time: "25 min ago",
      status: "Assigned",
      assignedTo: "Priya Mehta",
      statusBg: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
      icon: "📦",
      iconBg: "bg-amber-600/20 text-amber-400 border-amber-500/30"
    },
    {
      id: 4,
      title: "Dwell Threshold Anomaly",
      desc: "Shoppers avg dwell in Household zone dropped below baseline.",
      type: "High",
      typeBg: "bg-amber-500/20 text-amber-400 border-amber-500/40",
      location: "Household F1",
      time: "2 hours ago",
      status: "Resolved",
      assignedTo: "Priya Mehta",
      statusBg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
      icon: "⏱️",
      iconBg: "bg-amber-600/20 text-amber-400 border-amber-500/30"
    },
    {
      id: 5,
      title: "Promotional Shelf Attention Drop",
      desc: "Promo Shelf 2 attention score down by 15%.",
      type: "Medium",
      typeBg: "bg-blue-500/20 text-blue-400 border-blue-500/40",
      location: "Aisle B",
      time: "4 hours ago",
      status: "Closed",
      assignedTo: "Rohan Das",
      statusBg: "bg-slate-500/20 text-slate-400 border-slate-500/40",
      icon: "🎯",
      iconBg: "bg-blue-600/20 text-blue-400 border-blue-500/30"
    }
  ]);

  const handleResolve = (id) => {
    setAlertsList(prev => prev.map(a => a.id === id ? { ...a, status: "Resolved", statusBg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" } : a));
    setActiveMenuId(null);
  };

  const handleDelete = (id) => {
    setAlertsList(prev => prev.map(a => a.id === id ? { ...a, status: "Closed", statusBg: "bg-slate-500/20 text-slate-400 border-slate-500/40" } : a));
    setActiveMenuId(null);
  };

  const handleAssignSave = () => {
    if (assignModalAlert) {
      setAlertsList(prev => prev.map(a => a.id === assignModalAlert.id ? {
        ...a,
        assignedTo: assignee,
        status: "Assigned",
        statusBg: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40"
      } : a));
    }
    setAssignModalAlert(null);
  };

  const openEditModal = (alertObj) => {
    setEditModalAlert(alertObj);
    setEditTitle(alertObj.title);
    setEditDesc(alertObj.desc);
    setEditType(alertObj.type);
    setEditStatus(alertObj.status);
    setActiveMenuId(null);
  };

  const handleEditSave = () => {
    if (editModalAlert) {
      let statusBg = "bg-rose-500/20 text-rose-400 border-rose-500/40";
      if (editStatus === "In Progress") statusBg = "bg-blue-500/20 text-blue-400 border-blue-500/40";
      if (editStatus === "Assigned") statusBg = "bg-cyan-500/20 text-cyan-400 border-cyan-500/40";
      if (editStatus === "Resolved") statusBg = "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
      if (editStatus === "Closed") statusBg = "bg-slate-500/20 text-slate-400 border-slate-500/40";

      let typeBg = "bg-rose-500/20 text-rose-400 border-rose-500/40";
      if (editType === "High") typeBg = "bg-amber-500/20 text-amber-400 border-amber-500/40";
      if (editType === "Medium") typeBg = "bg-blue-500/20 text-blue-400 border-blue-500/40";

      setAlertsList(prev => prev.map(a => a.id === editModalAlert.id ? {
        ...a,
        title: editTitle,
        desc: editDesc,
        type: editType,
        typeBg,
        status: editStatus,
        statusBg
      } : a));
    }
    setEditModalAlert(null);
  };

  const filteredAlerts = filter === "all"
    ? alertsList
    : alertsList.filter(a => a.type.toLowerCase() === filter.toLowerCase());

  return (
    <div className="space-y-5 font-sans text-xs pb-6">
      {/* PAGE HEADER */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black text-white tracking-wide">Enterprise Alert Management</h1>
          {selectedPeriod === "Custom Date Range" && customRange?.label && (
            <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
              📅 {customRange.label}
            </span>
          )}
        </div>
      </div>

      {/* 1. TOP METRICS CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1 font-mono">
            <span className="text-slate-400 text-xs font-medium block">Total Critical Alerts</span>
            <h2 className="text-2xl font-black text-white">{alertsList.length}</h2>
            <span className="text-[11px] text-rose-400 font-bold">Active Enterprise Engine</span>
          </div>
          <div className="w-12 h-12 bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-xl flex items-center justify-center text-xl">🔔</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1 font-mono">
            <span className="text-slate-400 text-xs font-medium block">Critical Severity</span>
            <h2 className="text-2xl font-black text-white">{alertsList.filter(a => a.type === "Critical").length}</h2>
            <span className="text-[11px] text-rose-400 font-bold">Requires Action</span>
          </div>
          <div className="w-12 h-12 bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-xl flex items-center justify-center text-xl">⚠️</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1 font-mono">
            <span className="text-slate-400 text-xs font-medium block">High Severity</span>
            <h2 className="text-2xl font-black text-white">{alertsList.filter(a => a.type === "High").length}</h2>
            <span className="text-[11px] text-amber-400 font-bold">Under Review</span>
          </div>
          <div className="w-12 h-12 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-xl flex items-center justify-center text-xl">⚡</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1 font-mono">
            <span className="text-slate-400 text-xs font-medium block">Resolved / Closed</span>
            <h2 className="text-2xl font-black text-white">{alertsList.filter(a => a.status === "Resolved" || a.status === "Closed").length}</h2>
            <span className="text-[11px] text-emerald-400 font-bold">Operational</span>
          </div>
          <div className="w-12 h-12 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl flex items-center justify-center text-xl">✓</div>
        </div>
      </div>

      {/* 2. MAIN ALERTS CONTAINER */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
        <div className="flex justify-between items-center border-b border-[#1E293B] pb-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Enterprise Alert Directory</h3>
          <div className="flex items-center space-x-2 text-xs">
            {["all", "critical", "high"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilter(lvl)}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition uppercase ${
                  filter === lvl
                    ? "bg-blue-600 text-white"
                    : "bg-[#070C18] border border-[#1E293B] text-slate-400 hover:text-white"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* ALERTS LIST WITH THREE-DOT ACTION MENU */}
        <div className="space-y-3">
          {filteredAlerts.map((a) => (
            <div key={a.id} className="p-4 bg-[#070C18] border border-[#1E293B] rounded-2xl flex items-center justify-between relative">
              <div className="flex items-center space-x-3">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center text-lg ${a.iconBg}`}>{a.icon}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white leading-tight">{a.title}</h4>
                    <span className={`px-2 py-0.2 rounded border text-[9px] font-bold ${a.statusBg}`}>{a.status}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{a.desc} · Location: {a.location} · Assigned: <span className="text-cyan-400 font-bold">{a.assignedTo}</span></p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-2.5 py-0.5 rounded border text-[9px] font-bold ${a.typeBg}`}>{a.type}</span>
                <span className="text-[10px] text-slate-500">{a.time}</span>
                
                {/* Three-Dot Action Menu Button */}
                <div className="relative">
                  <button
                    onClick={() => setActiveMenuId(activeMenuId === a.id ? null : a.id)}
                    className="p-1.5 hover:bg-[#1E293B] rounded-lg text-slate-400 hover:text-white transition text-sm"
                  >
                    ⋮
                  </button>

                  {/* Dropdown Action Menu */}
                  {activeMenuId === a.id && (
                    <div className="absolute right-0 top-8 z-40 w-44 bg-[#0A1224] border border-[#1E293B] rounded-xl shadow-2xl p-1 space-y-0.5 text-[11px] font-sans">
                      <button
                        onClick={() => { setSelectedAlert(a); setActiveMenuId(null); }}
                        className="w-full text-left px-3 py-1.5 text-slate-300 hover:bg-[#1E293B] hover:text-white rounded-lg flex items-center gap-2"
                      >
                        <span>👁️</span> View Details
                      </button>
                      <button
                        onClick={() => { setAssignModalAlert(a); setActiveMenuId(null); }}
                        className="w-full text-left px-3 py-1.5 text-cyan-400 hover:bg-[#1E293B] rounded-lg flex items-center gap-2"
                      >
                        <span>👤</span> Assign
                      </button>
                      <button
                        onClick={() => handleResolve(a.id)}
                        className="w-full text-left px-3 py-1.5 text-emerald-400 hover:bg-[#1E293B] rounded-lg flex items-center gap-2"
                      >
                        <span>✓</span> Mark as Resolved
                      </button>
                      <button
                        onClick={() => openEditModal(a)}
                        className="w-full text-left px-3 py-1.5 text-amber-400 hover:bg-[#1E293B] rounded-lg flex items-center gap-2"
                      >
                        <span>✏️</span> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="w-full text-left px-3 py-1.5 text-rose-400 hover:bg-[#1E293B] rounded-lg flex items-center gap-2 border-t border-[#1E293B]/60 mt-1"
                      >
                        <span>🗑️</span> Delete / Close
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* VIEW DETAILS MODAL */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A1224] border border-[#1E293B] p-5 rounded-2xl max-w-md w-full font-mono space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-2">
              <span className="font-extrabold text-white text-xs">Alert Details - {selectedAlert.title}</span>
              <button onClick={() => setSelectedAlert(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-2 text-[11px] text-slate-300">
              <p><strong className="text-slate-400">Description:</strong> {selectedAlert.desc}</p>
              <p><strong className="text-slate-400">Location:</strong> {selectedAlert.location}</p>
              <p><strong className="text-slate-400">Severity:</strong> <span className={`px-2 py-0.5 rounded ${selectedAlert.typeBg}`}>{selectedAlert.type}</span></p>
              <p><strong className="text-slate-400">Status:</strong> <span className={`px-2 py-0.5 rounded ${selectedAlert.statusBg}`}>{selectedAlert.status}</span></p>
              <p><strong className="text-slate-400">Assigned To:</strong> {selectedAlert.assignedTo}</p>
              <p><strong className="text-slate-400">Timestamp:</strong> {selectedAlert.time}</p>
            </div>
            <div className="text-right pt-2 border-t border-[#1E293B]">
              <button onClick={() => setSelectedAlert(null)} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN ALERT MODAL */}
      {assignModalAlert && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A1224] border border-[#1E293B] p-5 rounded-2xl max-w-md w-full font-mono space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-2">
              <span className="font-extrabold text-white text-xs">Assign Alert - {assignModalAlert.title}</span>
              <button onClick={() => setAssignModalAlert(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-2">
              <label className="text-slate-400 text-xs block">Select Team Member</label>
              <select value={assignee} onChange={e => setAssignee(e.target.value)} className="w-full bg-[#070C18] border border-[#1E293B] text-white p-2 rounded-xl text-xs outline-none">
                <option>Priya Mehta (Analyst)</option>
                <option>Arjun Singh (Store Manager)</option>
                <option>Rohan Das (Marketing Manager)</option>
                <option>Admin CAMS</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2 border-t border-[#1E293B]">
              <button onClick={() => setAssignModalAlert(null)} className="flex-1 py-2 bg-[#1E293B] text-slate-300 rounded-xl text-xs font-bold">Cancel</button>
              <button onClick={handleAssignSave} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold">Assign & Update Status</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ALERT MODAL */}
      {editModalAlert && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A1224] border border-[#1E293B] p-5 rounded-2xl max-w-md w-full font-mono space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-2">
              <span className="font-extrabold text-white text-xs">Edit Alert Details</span>
              <button onClick={() => setEditModalAlert(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-slate-400 text-[10px] block mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full bg-[#070C18] border border-[#1E293B] text-white p-2 rounded-xl text-xs outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[10px] block mb-1">Description</label>
                <textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-[#070C18] border border-[#1E293B] text-white p-2 rounded-xl text-xs outline-none focus:border-cyan-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 text-[10px] block mb-1">Severity</label>
                  <select value={editType} onChange={e => setEditType(e.target.value)} className="w-full bg-[#070C18] border border-[#1E293B] text-white p-2 rounded-xl text-xs outline-none">
                    <option>Critical</option>
                    <option>High</option>
                    <option>Medium</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-[10px] block mb-1">Status</label>
                  <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="w-full bg-[#070C18] border border-[#1E293B] text-white p-2 rounded-xl text-xs outline-none">
                    <option>New</option>
                    <option>Assigned</option>
                    <option>In Progress</option>
                    <option>Resolved</option>
                    <option>Closed</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-[#1E293B]">
              <button onClick={() => setEditModalAlert(null)} className="flex-1 py-2 bg-[#1E293B] text-slate-300 rounded-xl text-xs font-bold">Cancel</button>
              <button onClick={handleEditSave} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
