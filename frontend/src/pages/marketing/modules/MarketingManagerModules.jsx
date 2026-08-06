import React, { useState } from "react";
import AiVisionCamera from "../../../components/vision/AiVisionCamera";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line,
  ComposedChart, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, ZAxis
} from "recharts";

// Shared Header
const ModuleHeader = ({ icon, title, subtitle, statusText }) => (
  <div className="bg-[#111827] border border-[#273449] rounded-2xl p-4 flex flex-wrap justify-between items-center gap-3 font-sans">
    <div>
      <h2 className="text-base font-extrabold text-white flex items-center gap-2">
        <span>{icon}</span> {title}
      </h2>
    </div>
    <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-xl">
      ● {statusText || "Sync Engine Active"}
    </span>
  </div>
);

// 1. DASHBOARD (Contains all 9 Marketing Dashboard Components)
export function MarketingDashboardOverviewPage() {
  const trendData = [
    { name: "Mon", impressions: 1.2, engagement: 20 },
    { name: "Tue", impressions: 1.5, engagement: 24 },
    { name: "Wed", impressions: 1.8, engagement: 28 },
    { name: "Thu", impressions: 2.2, engagement: 32 },
    { name: "Fri", impressions: 2.8, engagement: 42 },
    { name: "Sat", impressions: 3.5, engagement: 55 },
    { name: "Sun", impressions: 3.1, engagement: 48 }
  ];

  const radarData = [
    { subject: "Visibility", score: 92 },
    { subject: "Attraction", score: 85 },
    { subject: "Engagement", score: 78 },
    { subject: "Conversion", score: 68 },
    { subject: "Interaction", score: 88 },
    { subject: "Promo Lift", score: 94 }
  ];

  const scatterData = [
    { time: 2, conv: 10 }, { time: 4, conv: 25 },
    { time: 6, conv: 48 }, { time: 8, conv: 72 },
    { time: 10, conv: 88 }
  ];

  return (
    <div className="space-y-6 font-sans">
      <ModuleHeader icon="📣" title="Marketing Intelligence Console" subtitle="AI-powered campaign evaluation, engagement metrics, visibility heatmaps, & promotional ROI" />

      {/* COMPONENT 1: KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: "Active Campaigns", val: "12 Total", sub: "5 Active", col: "text-amber-400" },
          { label: "Campaign Reach", val: "55,775", sub: "+31.2% Lift", col: "text-emerald-400" },
          { label: "Engagement Score", val: "68.5%", sub: "Optimal", col: "text-emerald-400" },
          { label: "Conversion Rate", val: "14.8%", sub: "+3.1% Lift", col: "text-emerald-400" },
          { label: "Product Visibility", val: "94/100", sub: "Shelf A1 Top", col: "text-blue-400" },
          { label: "Attractiveness Index", val: "88/100", sub: "High Appeal", col: "text-purple-400" },
          { label: "Marketing ROI", val: "340% ROMI", sub: "+22% MoM", col: "text-emerald-400" },
          { label: "Promotion Success", val: "89.2%", sub: "High Lift", col: "text-amber-400" },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-[#111827] border border-[#273449] rounded-xl p-3.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase block truncate">{kpi.label}</span>
            <h4 className="text-sm font-extrabold text-white mt-1">{kpi.val}</h4>
            <span className={`text-[9px] font-bold ${kpi.col} block mt-0.5`}>{kpi.sub}</span>
          </div>
        ))}
      </div>

      {/* COMPONENT 2, 3 & 4: CAMPAIGN PERFORMANCE TRENDS, PROMOTION EFFECTIVENESS, & TOP PERFORMING CAMPAIGNS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Campaign Performance Trends</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData}>
                <CartesianGrid stroke="#273449" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "#273449" }} />
                <Bar dataKey="impressions" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Reach (10k)" />
                <Line type="monotone" dataKey="engagement" stroke="#10B981" strokeWidth={2} name="Engagement %" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Promotion Effectiveness (Lift)</h3>
          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 bg-[#172033] rounded-xl flex justify-between items-center"><span className="text-white font-bold">Festive Bakery Blast (BOGO)</span><span className="text-emerald-400 font-bold font-mono">+129% Sales Lift</span></div>
            <div className="p-2.5 bg-[#172033] rounded-xl flex justify-between items-center"><span className="text-white font-bold">Organic Dairy Fest (20% Off)</span><span className="text-blue-400 font-bold font-mono">+114% Sales Lift</span></div>
            <div className="p-2.5 bg-[#172033] rounded-xl flex justify-between items-center"><span className="text-white font-bold">Snack Attack Combo</span><span className="text-amber-400 font-bold font-mono">+90% Sales Lift</span></div>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top Performing Campaigns Ranking</h3>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-[#172033] rounded-xl flex justify-between items-center"><div><span className="text-white font-bold block">#1 Festive Bakery Blast</span><span className="text-[10px] text-amber-400 font-mono">301% ROI</span></div><span className="text-white font-bold font-mono">$113,160</span></div>
            <div className="p-2.5 bg-[#172033] rounded-xl flex justify-between items-center"><div><span className="text-white font-bold block">#2 Organic Dairy Fest</span><span className="text-[10px] text-amber-400 font-mono">252% ROI</span></div><span className="text-white font-bold font-mono">$73,830</span></div>
          </div>
        </div>
      </div>

      {/* COMPONENT 5, 6 & 7: ATTENTION VS CONVERSION GRAPH, VISIBILITY HEATMAP, & ATTRACTIVENESS RADAR CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Attention vs Conversion Trend</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <CartesianGrid stroke="#273449" strokeDasharray="3 3" />
                <XAxis type="number" dataKey="time" name="Attention (s)" stroke="#64748B" fontSize={10} />
                <YAxis type="number" dataKey="conv" name="Conversion (%)" stroke="#64748B" fontSize={10} />
                <ZAxis range={[50, 100]} />
                <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "#273449" }} />
                <Scatter name="Engagement Matrix" data={scatterData} fill="#F59E0B" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Product Visibility Heatmap</h3>
          <AiVisionCamera cameraName="PROMOTIONAL VISIBILITY MATRIX" showHeatmap={true} />
        </div>

        <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Product Attractiveness Radar Index</h3>
          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#273449" />
                <PolarAngleAxis dataKey="subject" stroke="#94A3B8" fontSize={9} />
                <PolarRadiusAxis stroke="#273449" fontSize={8} />
                <Radar name="Attractiveness Score" dataKey="score" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* COMPONENT 8 & 9: CAMPAIGN SUMMARY & MARKETING RECOMMENDATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Campaign Summary & Budget Utilization</h3>
          <div className="grid grid-cols-3 gap-3 text-xs mb-3">
            <div className="p-2.5 bg-[#172033] rounded-xl"><span className="text-slate-400 block font-bold">Total Budget</span><span className="text-white font-extrabold text-sm">$150,000</span></div>
            <div className="p-2.5 bg-[#172033] rounded-xl"><span className="text-slate-400 block font-bold">Utilized</span><span className="text-amber-400 font-extrabold text-sm">$113,275</span></div>
            <div className="p-2.5 bg-[#172033] rounded-xl"><span className="text-slate-400 block font-bold">Remaining</span><span className="text-emerald-400 font-extrabold text-sm">$36,725</span></div>
          </div>
          <div className="w-full bg-[#172033] h-2.5 rounded-full overflow-hidden flex">
            <div className="bg-amber-500 h-full w-[75.5%]" />
            <div className="bg-emerald-500 h-full w-[24.5%]" />
          </div>
        </div>

        <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">AI Marketing Recommendations</h3>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-[#172033] rounded-xl flex justify-between items-center"><div><span className="text-white font-bold block">Increase Bakery Availability</span><span className="text-[10px] text-slate-400">Bakery A1 displays 94% visibility</span></div><span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-[9px] rounded">+18% Lift</span></div>
            <div className="p-2.5 bg-[#172033] rounded-xl flex justify-between items-center"><div><span className="text-white font-bold block">Relocate Low-Performing Quinoa</span><span className="text-[10px] text-slate-400 font-mono">Move from Rack D2 to perimeter</span></div><span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold text-[9px] rounded">+24% Attention</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 2. CAMPAIGN PERFORMANCE
export function MarketingCampaignPerformancePage() {
  const [campaigns, setCampaigns] = useState([
    { id: 1, name: "Summer Mega Sale", reach: "55,775", engagement: "68.5%", conversion: "14.8%", status: "Active" },
    { id: 2, name: "Festive Bakery Blast", reach: "42,120", engagement: "72.1%", conversion: "18.2%", status: "Active" }
  ]);
  const [name, setName] = useState("");

  return (
    <div className="space-y-5 font-sans">
      <ModuleHeader icon="📢" title="Campaign Performance Engine" subtitle="Evaluate campaign impressions, customer reach, engagement levels, & ROI" />
      <div className="bg-[#111827] border border-[#273449] rounded-2xl p-4 flex gap-3">
        <input type="text" placeholder="New Campaign Title" value={name} onChange={(e) => setName(e.target.value)} className="px-3 py-2 bg-[#172033] border border-[#273449] rounded-xl text-xs text-white" />
        <button onClick={() => { if(name) { setCampaigns([...campaigns, { id: Date.now(), name, reach: "10,000", engagement: "50.0%", conversion: "10.0%", status: "Active" }]); setName(""); } }} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition">+ Deploy Campaign</button>
      </div>
      <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#273449] text-slate-400 font-bold">
              <th className="pb-3">Campaign Name</th><th className="pb-3">Customer Reach</th><th className="pb-3">Engagement Rate</th><th className="pb-3">Conversion Rate</th><th className="pb-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#273449]">
            {campaigns.map(c => (
              <tr key={c.id}>
                <td className="py-3 font-bold text-white">{c.name}</td>
                <td className="py-3 text-slate-300 font-mono">{c.reach}</td>
                <td className="py-3 text-emerald-400 font-mono font-bold">{c.engagement}</td>
                <td className="py-3 text-amber-400 font-mono font-bold">{c.conversion}</td>
                <td className="py-3"><span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded">{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 3. PROMOTION EFFECTIVENESS
export function MarketingPromotionEffectivenessPage() {
  return (
    <div className="space-y-5 font-sans">
      <ModuleHeader icon="🏷️" title="Promotion Effectiveness & Sales Lift" subtitle="Compare baseline sales vs promotional lift impact" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111827] border border-[#273449] rounded-xl p-4"><span className="text-[10px] font-bold text-slate-400 uppercase">Top Promotional Lift</span><h4 className="text-lg font-extrabold text-emerald-400 mt-1">+129% Sales Lift</h4></div>
        <div className="bg-[#111827] border border-[#273449] rounded-xl p-4"><span className="text-[10px] font-bold text-slate-400 uppercase">Average Promotion ROI</span><h4 className="text-lg font-extrabold text-amber-400 mt-1">280% ROMI</h4></div>
        <div className="bg-[#111827] border border-[#273449] rounded-xl p-4"><span className="text-[10px] font-bold text-slate-400 uppercase">Customer Response</span><h4 className="text-lg font-extrabold text-blue-400 mt-1">68.5% High Lift</h4></div>
      </div>
    </div>
  );
}

// 4. PRODUCT VISIBILITY
export function MarketingProductVisibilityPage() {
  return (
    <div className="space-y-5 font-sans">
      <ModuleHeader icon="👁️" title="Product Visibility & Eye Gaze Analytics" subtitle="Identify high-visibility endcaps & unnoticed product shelves using AI fixations" />
      <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 flex justify-center">
        <AiVisionCamera cameraName="SHELF VISIBILITY FIXATION MAP" showHeatmap={true} />
      </div>
    </div>
  );
}

// 5. PRODUCT ATTRACTIVENESS
export function MarketingProductAttractivenessPage() {
  return (
    <div className="space-y-5 font-sans">
      <ModuleHeader icon="⭐" title="Product Attractiveness Index" subtitle="Radar metrics for visual appeal, viewing duration, & pickup likelihood" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#111827] border border-[#273449] rounded-xl p-5"><h4 className="text-xs font-bold text-white uppercase">#1 Artisan Whole Wheat Bread</h4><p className="text-xs text-emerald-400 font-bold mt-1">96/100 Attractiveness Rating</p></div>
        <div className="bg-[#111827] border border-[#273449] rounded-xl p-5"><h4 className="text-xs font-bold text-white uppercase">#2 Organic Almond Milk 1L</h4><p className="text-xs text-emerald-400 font-bold mt-1">91/100 Attractiveness Rating</p></div>
      </div>
    </div>
  );
}

// 6. CUSTOMER ENGAGEMENT
export function MarketingCustomerEngagementPage() {
  return (
    <div className="space-y-5 font-sans">
      <ModuleHeader icon="👥" title="Customer Engagement Analytics" subtitle="Track interaction duration, participation rate, and promotional response" />
      <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-3 text-xs">
        <div className="flex justify-between items-center p-3 bg-[#172033] rounded-xl"><span className="text-white font-bold">Endcap B2 Display</span><span className="text-emerald-400 font-mono font-bold">68.5% Engagement Rate</span></div>
      </div>
    </div>
  );
}

// 7. CONVERSION ANALYSIS
export function MarketingConversionAnalysisPage() {
  return (
    <div className="space-y-5 font-sans">
      <ModuleHeader icon="📈" title="Conversion Analysis Funnel" subtitle="Track consumer progress from awareness to attention, pickup, and purchase" />
      <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-2">
        {["Awareness: 55,775", "Attention: 38,120", "Pickup: 12,337", "Purchase: 5,050"].map((step, idx) => (
          <div key={idx} className="p-3 bg-[#172033] rounded-xl font-bold text-xs text-white flex justify-between"><span>{step.split(":")[0]}</span><span className="font-mono text-amber-400">{step.split(":")[1]}</span></div>
        ))}
      </div>
    </div>
  );
}

// 8. ATTENTION INSIGHTS
export function MarketingAttentionInsightsPage() {
  return (
    <div className="space-y-5 font-sans">
      <ModuleHeader icon="🧠" title="Attention Insights Engine" subtitle="Heatmaps and zone gaze durations across store displays" />
      <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 text-xs text-slate-300">
        • Bakery Endcap A1 recorded 5.1s average gaze fixation duration.
      </div>
    </div>
  );
}

// 9. TRAFFIC INSIGHTS
export function MarketingTrafficInsightsPage() {
  return (
    <div className="space-y-5 font-sans">
      <ModuleHeader icon="🚶" title="Marketing Traffic Insights" subtitle="High-traffic locations, movement vectors, & optimal advertising placement" />
      <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 text-xs text-slate-300">
        • Perimeter walkway recorded highest traffic flow between 5 PM - 7 PM.
      </div>
    </div>
  );
}

// 10. MARKETING RECOMMENDATIONS
export function MarketingRecommendationsPage() {
  return (
    <div className="space-y-5 font-sans">
      <ModuleHeader icon="💡" title="AI Marketing Recommendations" subtitle="Automated guidance for product placement, promotions, & campaign timing" />
      <div className="space-y-3">
        <div className="p-4 bg-[#111827] border border-[#273449] rounded-xl text-xs"><h4 className="font-bold text-white">Relocate Low-Performing Quinoa</h4><p className="text-slate-400 mt-1">Move from Rack D2 to main perimeter walkway (+24% Attention Lift).</p></div>
      </div>
    </div>
  );
}

// 11. ACTION CENTER
export function MarketingActionCenterPage() {
  return (
    <div className="space-y-5 font-sans">
      <ModuleHeader icon="☑️" title="Marketing Action Center Workspace" subtitle="Pending campaign approvals, scheduled launches, & promotional task tracking" />
      <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-2 text-xs">
        <div className="p-3 bg-[#172033] rounded-xl flex justify-between items-center"><span className="text-white font-bold">Approve Weekend Bakery Promo Banner</span><button className="px-3 py-1 bg-emerald-600 text-black font-extrabold rounded-lg">Approve</button></div>
      </div>
    </div>
  );
}

// 12. CAMPAIGN REPORTS
export function MarketingCampaignReportsPage() {
  return (
    <div className="space-y-5 font-sans">
      <ModuleHeader icon="📄" title="Campaign Performance Reports" subtitle="Detailed analytical reports for promotional lift, visibility, & ROMI" />
      <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5">
        <button className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition">Generate Campaign Audit Report</button>
      </div>
    </div>
  );
}

// 13. EXPORT REPORTS
export function MarketingExportReportsPage() {
  return (
    <div className="space-y-5 font-sans">
      <ModuleHeader icon="📥" title="Export Marketing Reports" subtitle="Download analytics into PDF, Excel, CSV, or JSON formats" />
      <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 flex gap-3">
        {["PDF", "Excel (XLSX)", "CSV", "JSON"].map((fmt, i) => (
          <button key={i} className="px-4 py-2 bg-[#172033] border border-[#273449] text-white font-bold text-xs rounded-xl hover:bg-slate-700 transition">Export {fmt}</button>
        ))}
      </div>
    </div>
  );
}

// 14. SETTINGS
export function MarketingSettingsPage() {
  return (
    <div className="space-y-5 font-sans">
      <ModuleHeader icon="⚙️" title="Marketing Portal Settings" subtitle="Notification preferences, report schedules, & dashboard widget configuration" />
      <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 text-xs text-slate-300">
        Notification Channels: Enabled for High-Impact Campaign Alerts
      </div>
    </div>
  );
}
