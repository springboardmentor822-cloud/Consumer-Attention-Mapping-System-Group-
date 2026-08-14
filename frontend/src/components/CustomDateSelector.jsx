import React, { useState } from "react";
import { useCams } from "../services/CamsContext";

const OPTIONS = [
  "Today",
  "Yesterday",
  "Last 7 Days",
  "Last 30 Days",
  "This Month",
  "Custom Date Range",
];

export default function CustomDateSelector({ value, onChange }) {
  const camsContext = useCams();
  const globalFilter = camsContext?.globalFilter;

  // Resolve active value: if value is null/undefined/"Global", fallback to globalFilter
  let activeValue = "Last 7 Days";
  if (value && typeof value === "object") {
    activeValue = value.dateRange || "Last 7 Days";
  } else if (value && value !== "Global") {
    activeValue = value;
  } else if (globalFilter) {
    activeValue = globalFilter.dateRange || "Last 7 Days";
  }

  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(
    typeof value === "object" ? value?.startDate || "" : ""
  );
  const [endDate, setEndDate] = useState(
    typeof value === "object" ? value?.endDate || "" : ""
  );
  const [errorMessage, setErrorMessage] = useState("");

  const handleSelectChange = (e) => {
    const selected = e.target.value;
    if (selected === "Custom Date Range") {
      setIsOpen(true);
      setErrorMessage("");
    } else {
      setIsOpen(false);
      setErrorMessage("");
      if (onChange) {
        onChange(selected);
      }
    }
  };

  const handleApply = () => {
    if (!startDate && !endDate) {
      setErrorMessage("Please select both Start Date and End Date.");
      return;
    }
    if (!startDate) {
      setErrorMessage("Please select a Start Date before applying.");
      return;
    }
    if (!endDate) {
      setErrorMessage("Please select an End Date before applying.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setErrorMessage("Start Date cannot be after End Date.");
      return;
    }

    setErrorMessage("");
    setIsOpen(false);
    const fmt = (d) => {
      try {
        return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      } catch {
        return d;
      }
    };
    const customLabel = `${fmt(startDate)} → ${fmt(endDate)}`;
    if (onChange) {
      onChange("Custom Date Range", { dateRange: "Custom Date Range", startDate, endDate, label: customLabel });
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setErrorMessage("");
  };

  return (
    <div className="relative inline-block font-mono text-xs">
      <select
        value={activeValue}
        onChange={handleSelectChange}
        className="bg-[#070C18] border border-[#1E293B] text-emerald-400 text-[11px] font-bold px-3 py-1.5 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm hover:border-slate-600 transition"
      >
        {OPTIONS.map((opt) => (
          <option key={opt} value={opt} className="bg-[#0F172A] text-slate-200">
            {opt}
          </option>
        ))}
      </select>

      {isOpen && (
        <div className="absolute right-0 top-10 z-50 w-72 bg-[#0D1527] border border-[#273449] p-4 rounded-2xl shadow-2xl space-y-3">
          <div className="flex justify-between items-center border-b border-[#1E293B] pb-2">
            <span className="font-extrabold text-white text-xs flex items-center gap-1.5">
              <span>📅</span> Custom Date Range
            </span>
            <button onClick={handleCancel} className="text-slate-400 hover:text-white text-sm">✕</button>
          </div>

          <div className="space-y-2.5">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setErrorMessage("");
                }}
                className="w-full bg-[#070C18] border border-[#1E293B] text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setErrorMessage("");
                }}
                className="w-full bg-[#070C18] border border-[#1E293B] text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg">
              <p className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                <span>⚠️</span> {errorMessage}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCancel}
              className="flex-1 py-1.5 bg-[#1E293B] hover:bg-[#2A3952] text-slate-300 rounded-lg text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex-1 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold transition shadow-md"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
