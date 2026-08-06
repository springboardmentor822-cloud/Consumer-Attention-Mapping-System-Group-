import React from "react";
import CampaignPerformancePage from "../marketing/modules/CampaignPerformancePage";
import PromotionEffectivenessPage from "../marketing/modules/PromotionEffectivenessPage";
import ProductVisibilityPage from "../marketing/modules/ProductVisibilityPage";
import ProductAttractivenessPage from "../marketing/modules/ProductAttractivenessPage";
import LiveCamerasPage from "../store_manager/modules/LiveCamerasPage";

export default function DynamicPageRenderer({ role, activeTab }) {
  if (activeTab === "Campaign Performance") return <CampaignPerformancePage />;
  if (activeTab === "Promotion Effectiveness") return <PromotionEffectivenessPage />;
  if (activeTab === "Product Visibility") return <ProductVisibilityPage />;
  if (activeTab === "Product Attractiveness") return <ProductAttractivenessPage />;
  if (activeTab === "Live Cameras" || activeTab === "Camera Management") return <LiveCamerasPage />;

  return (
    <div className="bg-[#111827] border border-[#273449] rounded-2xl p-6 font-sans space-y-4">
      <div className="border-b border-[#273449] pb-3 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-extrabold text-white uppercase">{activeTab} Control Console</h3>
        </div>
        <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-xl">
          Interactive Operational Mode
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#172033] border border-[#273449] rounded-xl p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Real-Time Data Sync</span>
          <h4 className="text-base font-extrabold text-white mt-1">Active (0ms delay)</h4>
        </div>
        <div className="bg-[#172033] border border-[#273449] rounded-xl p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase">AI Processing Engine</span>
          <h4 className="text-base font-extrabold text-emerald-400 mt-1">YOLOv8 + ByteTrack</h4>
        </div>
        <div className="bg-[#172033] border border-[#273449] rounded-xl p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Access Status</span>
          <h4 className="text-base font-extrabold text-purple-400 mt-1">Full Read & Write</h4>
        </div>
      </div>
    </div>
  );
}
