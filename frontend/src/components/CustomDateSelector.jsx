import React, { useState } from "react";

export default function CustomDateSelector({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSelectChange = (e) => {
    const selected = e.target.value;
    if (selected === "Custom Date Range") {
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setErrorMessage("");
      onChange(selected);
    }
  };

  const handleApply = () => {
    if (!startDate || !endDate) {
      setErrorMessage("Please select both Start Date and End Date.");
      return;
    }
    setErrorMessage("");
    setIsOpen(false);
    const customLabel = `${startDate} to ${endDate}`;
    onChange("Custom Date Range", { startDate, endDate, label: customLabel });
  };

  return (
    <div className="relative inline-block font-mono text-xs">
      <select
        value={value}
        onChange={handleSelectChange}
        className="bg-[#070C18] border border-[#1E293B] text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer"
      >
        <option value="Today">Today</option>
        <option value="Yesterday">Yesterday</option>
        <option value="Last 7 Days">Last 7 Days</option>
        <option value="Last 30 Days">Last 30 Days</option>
        <option value="Custom Date Range">Custom Date Range...</option>
      </select>

      {isOpen && (
        <div className="absolute right-0 top-9 z-50 w-72 bg-[#0A1224] border border-[#1E293B] p-4 rounded-2xl shadow-2xl space-y-3">
          <div className="flex justify-between items-center border-b border-[#1E293B] pb-2">
            <span className="font-extrabold text-white text-xs">Custom Date Range</span>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#070C18] border border-[#1E293B] text-white rounded-lg px-2.5 py-1 text-xs outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#070C18] border border-[#1E293B] text-white rounded-lg px-2.5 py-1 text-xs outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {errorMessage && (
            <p className="text-[10px] text-rose-400 font-bold">{errorMessage}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 py-1.5 bg-[#1E293B] hover:bg-[#2A3952] text-slate-300 rounded-lg text-xs font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
