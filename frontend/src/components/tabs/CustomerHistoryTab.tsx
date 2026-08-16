"use client";
import React, { useEffect, useState } from 'react';

// 1. Define the exact shape of our data instead of using "any"
interface Transaction {
  invoice: string;
  date: string;
  time: string;
  type: string;
  gender: string;
  product: string;
  total: number;
}

export default function CustomerHistoryTab({ timeFilter = 'all' }: { timeFilter?: string }) {
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    
    // 2. Wrap the fetch in an async function to satisfy the linter
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/backend/v1/dashboard/customer-history?time_filter=${timeFilter}`, { credentials: 'include' });
        const data = await res.json();
        if (isMounted && data.status === "success") {
          setHistory(data.data);
        }
      } catch (err) {
        console.error("History fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [timeFilter]);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 text-slate-200">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-100">Customer Transaction History</h3>
          <p className="text-xs text-slate-400 mt-1">Live feed of recent purchases retrieved from supermarket_sales.csv</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-cyan-400 font-mono text-sm animate-pulse">Syncing transactions...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-mono text-sm">No transactions found for this time period.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900 text-[10px] uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3">Invoice ID</th>
                  <th className="px-4 py-3">Date / Time</th>
                  <th className="px-4 py-3">Demographic</th>
                  <th className="px-4 py-3">Product Category</th>
                  <th className="px-4 py-3 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/30">
                {history.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-mono text-cyan-400 text-xs">{tx.invoice}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{tx.date} <span className="ml-2">{tx.time}</span></td>
                    <td className="px-4 py-3 text-xs">
                      <span className={`px-2 py-1 rounded-md border ${tx.type === 'Member' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                        {tx.type}
                      </span> 
                      <span className="ml-2 text-slate-500">{tx.gender}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-300">{tx.product}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-400">${tx.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}