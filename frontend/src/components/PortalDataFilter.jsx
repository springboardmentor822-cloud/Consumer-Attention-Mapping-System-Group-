import React, { useState } from "react";

const DATE_OPTIONS = [
  { key: "Today",             label: "Today" },
  { key: "Yesterday",         label: "Yesterday" },
  { key: "Last 7 Days",       label: "Last 7 Days" },
  { key: "Last 30 Days",      label: "Last 30 Days" },
  { key: "This Month",        label: "This Month" },
  { key: "Custom Date Range", label: "Custom Date Range" },
];

export function buildFilter(dateRange, startDate = "", endDate = "") {
  if (dateRange === "Custom Date Range" && startDate && endDate) {
    const fmt = (d) => {
      const dt = new Date(d);
      return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    };
    return { dateRange, startDate, endDate, label: `${fmt(startDate)} → ${fmt(endDate)}` };
  }
  return { dateRange, startDate: "", endDate: "", label: dateRange };
}

export const DEFAULT_FILTER = buildFilter("Last 7 Days");

export default function PortalDataFilter({ filter, onChange }) {
  const activeRange = filter?.dateRange ?? "Last 7 Days";

  const [customStart, setCustomStart] = useState(filter?.startDate ?? "");
  const [customEnd,   setCustomEnd]   = useState(filter?.endDate   ?? "");
  const [customError, setCustomError] = useState("");
  const [showCustom,  setShowCustom]  = useState(activeRange === "Custom Date Range");

  const handleSelectChange = (e) => {
    const key = e.target.value;
    if (key === "Custom Date Range") {
      setShowCustom(true);
      setCustomError("");
      onChange({ ...(filter || {}), dateRange: "Custom Date Range", label: "Custom Date Range" });
    } else {
      setShowCustom(false);
      setCustomError("");
      onChange(buildFilter(key));
    }
  };

  const handleApply = () => {
    if (!customStart && !customEnd) { setCustomError("Please select both Start Date and End Date."); return; }
    if (!customStart)               { setCustomError("Please select a Start Date."); return; }
    if (!customEnd)                 { setCustomError("Please select an End Date."); return; }
    if (new Date(customStart) > new Date(customEnd)) { setCustomError("Start Date cannot be after End Date."); return; }
    setCustomError("");
    onChange(buildFilter("Custom Date Range", customStart, customEnd));
  };

  return (
    <div className="relative inline-flex items-center gap-2 font-mono">
      <span className="text-xs font-bold text-slate-400">Date Range:</span>
      <select
        value={activeRange}
        onChange={handleSelectChange}
        className="bg-[#070C18] border border-[#1E293B] text-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none focus:border-emerald-500 hover:border-slate-500 transition-colors cursor-pointer"
      >
        {DATE_OPTIONS.map(({ key, label }) => (
          <option key={key} value={key} className="bg-[#0F172A] text-slate-200">
            {label}
          </option>
        ))}
      </select>

      {showCustom && (
        <div className="absolute right-0 top-10 bg-[#0F172A] border border-[#1E293B] p-3 rounded-2xl shadow-2xl z-50 flex flex-wrap items-end gap-3 font-mono">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 block font-mono">Start Date</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => { setCustomStart(e.target.value); setCustomError(""); }}
              className="bg-[#070C18] border border-[#1E293B] text-white rounded-xl px-3 py-1.5 text-xs outline-none focus:border-emerald-500 transition font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 block font-mono">End Date</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => { setCustomEnd(e.target.value); setCustomError(""); }}
              className="bg-[#070C18] border border-[#1E293B] text-white rounded-xl px-3 py-1.5 text-xs outline-none focus:border-emerald-500 transition font-mono"
            />
          </div>
          <button
            onClick={handleApply}
            className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl transition shadow-md font-mono"
          >
            Apply
          </button>
          {customError && (
            <span className="text-[10px] text-rose-400 font-bold font-mono w-full block">
              ⚠️ {customError}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

