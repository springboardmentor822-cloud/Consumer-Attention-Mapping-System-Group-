"use client";
import React, { useEffect, useState } from 'react';

interface BackupItem {
  id: number;
  filename: string;
  size_bytes: number;
  created_at: string;
  created_by: string | null;
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function BackupTab() {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBackups = () => {
    fetch('/api/backend/v1/admin/backups', { credentials: 'include' })
      .then(async (res) => {
        if (res.status === 403) throw new Error("This screen is Administrator-only.");
        if (!res.ok) throw new Error(`Request failed (${res.status}).`);
        return res.json();
      })
      .then((json) => { if (json.status === 'success') { setBackups(json.data || []); setError(null); } })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBackups(); }, []);

  const handleBackup = async () => {
    setIsBackingUp(true);
    setMessage(null);
    try {
      const res = await fetch('/api/backend/v1/admin/backup', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ Backup created: ${data.filename} (${formatBytes(data.size_bytes)})`);
        fetchBackups();
      } else {
        setMessage(`❌ ${data.detail || 'Backup failed.'}`);
      }
    } catch (err) {
      setMessage('❌ Could not reach the backend.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (filename: string) => {
    if (!confirm(`Restore the database from "${filename}"? This overwrites the current live database. A backend restart is recommended right after.`)) return;
    setIsRestoring(filename);
    setMessage(null);
    try {
      const res = await fetch('/api/backend/v1/admin/restore', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ filename }),
      });
      const data = await res.json();
      setMessage(res.ok ? `✅ ${data.message}` : `❌ ${data.detail || 'Restore failed.'}`);
    } catch (err) {
      setMessage('❌ Could not reach the backend.');
    } finally {
      setIsRestoring(null);
    }
  };

  const latest = backups[0];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg animate-in fade-in">
      <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center"><span className="mr-2">💾</span> Database Backup & Restore</h3>

      {error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mb-6 text-xs text-rose-300">{error}</div>
      ) : (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-6 text-xs text-emerald-300 flex items-start gap-2">
          <span>✅</span>
          <span>Real backups — each snapshot is a genuine SQLite copy of cams_retail.db, written to a local backups/ folder.</span>
        </div>
      )}

      {message && <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 mb-6 text-xs text-slate-300">{message}</div>}

      <div className="bg-slate-950 border border-slate-700 p-5 rounded-xl mb-6">
        <p className="text-xs text-slate-400 uppercase font-bold mb-1">Last Snapshot</p>
        <p className="text-lg font-bold text-cyan-400 mb-1">
          {loading ? 'Loading…' : latest ? new Date(latest.created_at).toLocaleString() : 'No backups yet'}
        </p>
        {latest && <p className="text-xs text-slate-500 mb-4">{latest.filename} · {formatBytes(latest.size_bytes)} · by {latest.created_by || 'unknown'}</p>}
        <div className="flex space-x-3">
          <button onClick={handleBackup} disabled={isBackingUp} className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded text-xs font-bold transition disabled:opacity-50">
            {isBackingUp ? 'Backing up…' : 'Trigger Manual Backup'}
          </button>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Backup History</h4>
        {loading ? (
          <p className="text-xs text-slate-500 animate-pulse">Loading…</p>
        ) : backups.length === 0 ? (
          <p className="text-xs text-slate-500">No backups yet — click &quot;Trigger Manual Backup&quot; above.</p>
        ) : (
          <div className="space-y-2">
            {backups.map((b) => (
              <div key={b.id} className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
                <div>
                  <p className="text-xs font-mono text-slate-300">{b.filename}</p>
                  <p className="text-[10px] text-slate-500">{new Date(b.created_at).toLocaleString()} · {formatBytes(b.size_bytes)}</p>
                </div>
                <button
                  onClick={() => handleRestore(b.filename)}
                  disabled={isRestoring !== null}
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded text-[10px] font-bold transition disabled:opacity-50"
                >
                  {isRestoring === b.filename ? 'Restoring…' : 'Restore'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
