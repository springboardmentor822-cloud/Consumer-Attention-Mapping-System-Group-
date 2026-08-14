import React from "react";

const OPTIONS = ["Today", "Yesterday", "Last 7 Days", "Last 30 Days", "This Month"];

export default function BoxFilter({ value, onChange }) {
  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="bg-[#070C18] border border-[#1E293B] text-slate-400 text-[10px] font-bold font-mono rounded-lg px-2 py-1 outline-none focus:border-emerald-500 hover:text-slate-200 transition-colors"
    >
      <option value="Global">🌍 Global</option>
      <option disabled>───────</option>
      {OPTIONS.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
}
