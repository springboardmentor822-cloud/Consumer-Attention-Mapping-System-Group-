import React, { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Funnel, FunnelChart, LabelList
} from "recharts";
import { aiInsights, aiPredictions, anomalies, formatCurrency } from "../../services/centralData";

const completedCount = aiInsights.filter(i => i.status === "In Progress" || i.status === "Completed").length;
const totalRevenueImpact = aiInsights.reduce((s, i) => s + i.impact, 0);

const kpis = [
  { label: "Confidence Score", value: "98% max", change: "93% avg confidence", icon: "🛡️" },
  { label: "AI Insights Generated", value: aiInsights.length, change: "+2 today", icon: "🤖" },
  { label: "Opportunities Identified", value: aiInsights.length, change: "Active suggestions", icon: "💡" },
  { label: "Est. Revenue Impact", value: formatCurrency(totalRevenueImpact), change: "Monthly projection", icon: "💰" },
  { label: "Completed / In Progress", value: `${completedCount} / ${aiInsights.length}`, change: "Action tracker", icon: "✅" },
];

const mockAssistantPrompts = [
  "Which department has the highest dwell time?",
  "Recommend a promotion for Cosmetics.",
  "Identify current layout bottlenecks.",
];

export default function AnalystAiInsights() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hello! I am your AI Retail Analyst Assistant. Ask me questions like: 'Identify current layout bottlenecks' or 'Which department has the highest dwell time?'" }
  ]);
  const [inputValue, setInputValue] = useState("");

  const handleSendMessage = (textToSend = inputValue) => {
    const text = textToSend.trim();
    if (!text) return;
    const newMessages = [...messages, { role: "user", text }];
    setMessages(newMessages);
    setInputValue("");

    setTimeout(() => {
      let reply = "I analyzed the telemetry and couldn't find a direct correlation. Can you clarify?";
      if (text.toLowerCase().includes("dwell")) {
        reply = "According to dwell analysis, Electronics (Z-05) has the highest average dwell time of 28.4 minutes, followed by Bakery (Z-01) at 24.2 minutes.";
      } else if (text.toLowerCase().includes("promotion") || text.toLowerCase().includes("cosmetics")) {
        reply = "For Cosmetics (Z-04), AI recommends extending display lighting to 9 PM since traffic is high but attention dropoff occurs at 6 PM. Estimated revenue lift: +$8.6K/mo.";
      } else if (text.toLowerCase().includes("bottleneck") || text.toLowerCase().includes("layout")) {
        reply = "The highest density bottlenecks are Aisle 4 (92% density) and Checkout lines (88% density). I recommend adding checkout staff during 5-7 PM and placing promo endcaps at Aisle 4.";
      }
      setMessages([...newMessages, { role: "assistant", text: reply }]);
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-white">AI Insights</h1>
          <p className="text-slate-400 text-xs">Intelligence center — AI-powered spatial suggestions, anomalies, and predictive analytics.</p>
        </div>
        <button className="bg-[#0F172A] border border-[#1E293B] px-3 py-1.5 rounded-xl text-slate-300 text-xs font-semibold flex items-center space-x-2">
          <span>📅</span><span>Aug 1 – Aug 7, 2026</span>
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map((k, i) => (
          <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
            <div className="flex items-center gap-1.5"><span className="text-sm">{k.icon}</span><span className="text-slate-400 text-[10px] font-medium">{k.label}</span></div>
            <h2 className="text-lg font-black text-white font-mono mt-1">{k.value}</h2>
            <span className="text-[10px] font-bold font-mono text-emerald-400">{k.change}</span>
          </div>
        ))}
      </div>

      {/* Recommendations + Anomalies */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">AI Recommendations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aiInsights.map((rec, i) => (
                <div key={i} className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl space-y-2 hover:border-cyan-500/30 transition">
                  <div className="flex justify-between items-start gap-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${rec.priority === "High" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"}`}>{rec.priority}</span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">{rec.confidence}% confidence</span>
                  </div>
                  <h4 className="text-xs font-bold text-white leading-snug">{rec.title}</h4>
                  <p className="text-[10px] text-slate-400">{rec.desc}</p>
                  <div className="pt-2 border-t border-[#1E293B] flex justify-between text-[10px] font-mono">
                    <span className="text-cyan-400">Impact: {formatCurrency(rec.impact)}</span>
                    <span className="text-slate-400">{rec.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Anomalies */}
        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Anomaly Detection</h3>
            <div className="space-y-2.5">
              {anomalies.map((anom, i) => (
                <div key={i} className={`p-3 border rounded-xl flex items-start gap-2.5 ${anom.severity === "Warning" ? "bg-rose-500/5 border-rose-500/20" : "bg-amber-500/5 border-amber-500/20"}`}>
                  <span className="text-sm mt-0.5">{anom.severity === "Warning" ? "⚠️" : "🚨"}</span>
                  <div>
                    <h4 className="text-[11px] font-bold text-white leading-tight">{anom.type}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{anom.desc}</p>
                    <span className="text-[9px] text-slate-500 font-mono block mt-1">{anom.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#1E293B]">
            <h4 className="text-[10px] font-bold text-white uppercase tracking-wider mb-2">Predictive Trends</h4>
            <div className="space-y-1.5 text-[10px] font-mono">
              {aiPredictions.map((pred, i) => (
                <div key={i} className="flex justify-between items-center bg-[#070C18] p-2 rounded-lg border border-[#1E293B]">
                  <span className="text-slate-400">{pred.metric}</span>
                  <span className="text-emerald-400 font-bold">{pred.prediction}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Built-in Assistant Panel */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">AI Assistant (Natural Language Query)</h3>
        <div className="h-64 bg-[#070C18] border border-[#1E293B] rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div className="flex-1 overflow-y-auto space-y-2.5 text-xs scrollbar-thin">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] p-2.5 rounded-xl border ${m.role === "user" ? "bg-cyan-600/10 border-cyan-500/30 text-white" : "bg-[#1E293B]/40 border-[#273449] text-slate-200"}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {mockAssistantPrompts.map((p, i) => (
                <button key={i} onClick={() => handleSendMessage(p)} className="px-2.5 py-1 bg-[#1E293B] hover:bg-slate-700 text-slate-300 rounded-lg text-[9px] font-mono">
                  {p}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="Type a natural language query..." value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSendMessage()} className="flex-1 bg-[#0F172A] border border-[#1E293B] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500" />
              <button onClick={() => handleSendMessage()} className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-extrabold text-xs rounded-lg transition">Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
