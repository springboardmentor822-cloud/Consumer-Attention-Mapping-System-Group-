import React, { useState } from "react";

export default function BackupRecovery() {
  const [activeTab, setActiveTab] = useState("history"); // 'history' | 'schedules' | 'recovery' | 'storage'
  const [toastMessage, setToastMessage] = useState("");
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Backup History Dataset
  const [backupsList, setBackupsList] = useState([
    { id: "BAK-8901", name: "Full Platform System & DB Snapshot", type: "Full System", executionTime: "Today, 04:00 AM", duration: "12m 40s", size: "48.2 GB", status: "Success", verification: "Verified Integrity", storageLocation: "AWS S3 / Primary Vault" },
    { id: "BAK-8902", name: "PostgreSQL Attention Heatmaps DB", type: "Database", executionTime: "Today, 01:00 AM", duration: "3m 15s", size: "8.4 GB", status: "Success", verification: "Verified Integrity", storageLocation: "AWS S3 / Primary Vault" },
    { id: "BAK-8903", name: "Hourly Transaction & Audit Log Dump", type: "Transaction Logs", executionTime: "Today, 11:00 AM", duration: "45s", size: "420 MB", status: "Success", verification: "Verified Integrity", storageLocation: "Azure Blob Backup" },
    { id: "BAK-8904", name: "Weekly Raw Frame Video Archive", type: "Archive Backup", executionTime: "Aug 1, 2026", duration: "45m 10s", size: "312.0 GB", status: "Success", verification: "Verified Integrity", storageLocation: "Cold Glacier Vault" },
    { id: "BAK-8905", name: "Emergency Manual DB Dump", type: "Database", executionTime: "Jul 28, 2026", duration: "2m 50s", size: "7.8 GB", status: "Failed (Space Exceeded)", verification: "Failed", storageLocation: "Local Storage" },
  ]);

  // Automated Schedules
  const automatedSchedules = [
    { id: "SCH-B1", name: "Automated Daily Full Platform Backup", type: "Full System", frequency: "Daily at 04:00 AM", retention: "30 Days", status: "Active" },
    { id: "SCH-B2", name: "Hourly Transaction Log Backup", type: "Transaction Logs", frequency: "Every 1 Hour", retention: "7 Days", status: "Active" },
    { id: "SCH-B3", name: "Weekly Deep Storage Archive", type: "Archive Backup", frequency: "Sundays at 01:00 AM", retention: "365 Days", status: "Active" },
  ];

  const triggerImmediateBackup = (e) => {
    e.preventDefault();
    const newBak = {
      id: `BAK-${Math.floor(1000 + Math.random() * 9000)}`,
      name: "Manual Admin On-Demand Backup",
      type: "Full System",
      executionTime: "Just now",
      duration: "Underway...",
      size: "Calculating...",
      status: "Success",
      verification: "Verified Integrity",
      storageLocation: "AWS S3 Vault"
    };
    setBackupsList([newBak, ...backupsList]);
    setIsBackupModalOpen(false);
    showToast("Manual backup job launched successfully!");
  };

  const handleRestore = (e) => {
    e.preventDefault();
    showToast(`Initiated System Point-in-Time Recovery from ${selectedBackupForRestore.id}...`);
    setIsRestoreModalOpen(false);
  };

  return (
    <div className="space-y-6 font-sans text-slate-100 pb-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 border border-emerald-500 text-emerald-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-bounce">
          <span>💾</span> {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 flex flex-wrap justify-between items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">💾</span>
            <h1 className="text-xl font-black text-white tracking-wide">Backup & Business Continuity Recovery</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 uppercase tracking-widest">
              Disaster Recovery Ready
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated platform snapshots, database point-in-time recovery tools, backup storage capacity monitoring, and disaster recovery readiness.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBackupModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-2"
          >
            <span>⚡</span> Create Backup Now
          </button>
          <button
            onClick={() => {
              setSelectedBackupForRestore(backupsList[0]);
              setIsRestoreModalOpen(true);
            }}
            className="px-4 py-2 bg-[#1E293B] hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center gap-2"
          >
            <span>🔄</span> Disaster Recovery
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Total Snapshots</span>
          <h2 className="text-lg font-black text-white font-mono">{backupsList.length} Backups</h2>
          <span className="text-[10px] text-emerald-400 font-bold block">4 Successful / 1 Failed</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Backup Storage Utilized</span>
          <h2 className="text-lg font-black text-purple-400 font-mono">376.8 GB</h2>
          <span className="text-[10px] text-purple-300 font-bold block">37.6% Storage Capacity</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Automated Schedules</span>
          <h2 className="text-lg font-black text-blue-400 font-mono">3 Schedules Active</h2>
          <span className="text-[10px] text-blue-300 font-bold block">Full System + DB + Logs</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Latest Backup Health</span>
          <h2 className="text-lg font-black text-emerald-400 font-mono">Verified OK</h2>
          <span className="text-[10px] text-emerald-400 font-bold block">Today, 04:00 AM</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#1E293B] gap-2 overflow-x-auto pb-1">
        {[
          { id: "history", label: "📜 Backup History Logs", count: backupsList.length },
          { id: "schedules", label: "⏱️ Automated Schedules", count: automatedSchedules.length },
          { id: "recovery", label: "🔄 Recovery Tools & Verification", count: "Ready" },
          { id: "storage", label: "📊 Backup Storage Capacity", count: "376.8 GB" },
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

      {/* ── TAB 1: BACKUP HISTORY ────────────────────────────────────────── */}
      {activeTab === "history" && (
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#070C18] border-b border-[#1E293B] text-slate-400 font-extrabold uppercase text-[10px]">
                  <th className="py-3 px-4">Backup Name & ID</th>
                  <th className="py-3 px-4">Backup Type</th>
                  <th className="py-3 px-4">Execution Time</th>
                  <th className="py-3 px-4">Duration & Size</th>
                  <th className="py-3 px-4">Storage Target</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {backupsList.map((b) => (
                  <tr key={b.id} className="hover:bg-[#1E293B]/40 transition font-medium">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white block">{b.name}</span>
                      <span className="text-[10px] text-indigo-400 font-mono">{b.id}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                        {b.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{b.executionTime}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{b.duration} ({b.size})</td>
                    <td className="py-3.5 px-4 text-slate-400">{b.storageLocation}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${b.status.includes("Success") ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-rose-500/10 text-rose-400 border-rose-500/30"}`}>
                        ● {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {b.status.includes("Success") && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedBackupForRestore(b);
                              setIsRestoreModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-200 font-bold rounded-lg text-[11px] border border-indigo-500/30 transition"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => showToast(`Downloading backup archive ${b.id}...`)}
                            className="px-2.5 py-1 bg-[#1E293B] hover:bg-[#273552] text-slate-300 font-bold rounded-lg text-[11px] transition"
                          >
                            Download
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: AUTOMATED SCHEDULES ──────────────────────────────────── */}
      {activeTab === "schedules" && (
        <div className="space-y-4">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>⏱️</span> Configured Automated Backup Schedules
            </h3>

            <div className="space-y-3">
              {automatedSchedules.map((sch) => (
                <div key={sch.id} className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl flex flex-wrap justify-between items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{sch.name}</span>
                      <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded">
                        {sch.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Schedule: <strong className="text-white">{sch.frequency}</strong> • Retention Policy: {sch.retention}
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    ● {sch.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: RECOVERY TOOLS ────────────────────────────────────────── */}
      {activeTab === "recovery" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-3">
            <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
              <span>🔄</span> Full System & Database Point-in-Time Recovery
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Restore complete platform database, consumer attention heatmaps, store node bindings, and user accounts to a specific historical snapshot.
            </p>
            <button
              onClick={() => {
                setSelectedBackupForRestore(backupsList[0]);
                setIsRestoreModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition"
            >
              Launch Point-in-Time Recovery →
            </button>
          </div>

          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-3">
            <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
              <span>🛡️</span> Backup Integrity Verification Engine
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Run automated SHA-256 checksum and database tablespace consistency check on cloud backup storage vaults.
            </p>
            <button
              onClick={() => showToast("Backup Integrity Verification Passed: SHA-256 Match OK")}
              className="px-4 py-2 bg-[#1E293B] hover:bg-[#273552] text-emerald-400 font-bold rounded-xl text-xs border border-emerald-500/30 transition"
            >
              Run Integrity Check →
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 4: STORAGE CAPACITY ──────────────────────────────────────── */}
      {activeTab === "storage" && (
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <span>📊</span> Backup Storage Capacity & Retention Monitoring
          </h3>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1">
                <span className="text-slate-300">AWS S3 Primary Backup Vault (376.8 GB used / 1,000 GB capacity)</span>
                <span className="text-purple-400 font-mono">37.6% Used</span>
              </div>
              <div className="w-full bg-[#1E293B] h-3 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full w-[37.6%]"></div>
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <p>• Daily retention window: 30 days active retention</p>
              <p>• Deep archive retention: 365 days cold storage</p>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE BACKUP ─────────────────────────────────────────── */}
      {isBackupModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
              <h3 className="text-base font-extrabold text-white">⚡ Trigger On-Demand Backup</h3>
              <button onClick={() => setIsBackupModalOpen(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={triggerImmediateBackup} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Backup Target Type</label>
                <select className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500">
                  <option>Full System & Database Snapshot</option>
                  <option>PostgreSQL Database Only</option>
                  <option>Transaction & Audit Logs Dump</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1E293B]">
                <button type="button" onClick={() => setIsBackupModalOpen(false)} className="px-4 py-2 bg-[#1E293B] text-slate-300 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition">Launch Backup</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: SYSTEM RESTORE ────────────────────────────────────────── */}
      {isRestoreModalOpen && selectedBackupForRestore && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
              <h3 className="text-base font-extrabold text-rose-400 flex items-center gap-2">
                <span>⚠️</span> Confirm System Recovery
              </h3>
              <button onClick={() => setIsRestoreModalOpen(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <div className="text-xs text-slate-300 space-y-2 bg-[#070C18] p-3.5 rounded-xl border border-rose-500/30">
              <p className="font-bold text-rose-400">WARNING: System Recovery in Progress</p>
              <p>You are about to restore the platform to snapshot: <strong className="text-white">{selectedBackupForRestore.name} ({selectedBackupForRestore.id})</strong> created on <span className="font-mono">{selectedBackupForRestore.executionTime}</span>.</p>
              <p className="text-[11px] text-slate-400">All unbacked transaction changes after this timestamp will be reverted.</p>
            </div>

            <form onSubmit={handleRestore} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Type "RESTORE" to confirm</label>
                <input type="text" required placeholder="RESTORE" className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-rose-500 font-mono" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1E293B]">
                <button type="button" onClick={() => setIsRestoreModalOpen(false)} className="px-4 py-2 bg-[#1E293B] text-slate-300 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-500 transition">Confirm & Restore</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
