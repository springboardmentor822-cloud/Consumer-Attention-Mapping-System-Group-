import React, { useRef } from 'react';
import { Video, Maximize2 } from 'lucide-react';

interface CameraPreviewCardProps {
  id: string;
  name: string;
  ipAddress: string;
  resolution?: string;
  status?: string;
  onOpenDedicatedPage: (id: string) => void;
}

// Distinct real-world retail CCTV video streams for camera locations
const videoCatalog: Record<string, string> = {
  'CAM-01': '/videos/entrance.mp4',
  'CAM-02': '/videos/employee_productivity.mp4',
  'CAM-03': '/videos/shoplifting_detection.mp4',
  'CAM-04': '/videos/preventing_shoplifting.mp4',
  'CAM-05': '/videos/stop_shoplifters.mp4',
  'CAM-06': 'https://assets.mixkit.co/videos/preview/mixkit-sliding-doors-at-the-entrance-of-a-supermarket-43229-large.mp4'
};

export const CameraPreviewCard: React.FC<CameraPreviewCardProps> = ({
  id,
  name,
  ipAddress,
  resolution = '1920x1080',
  status = 'ONLINE',
  onOpenDedicatedPage
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoSrc = videoCatalog[id] || videoCatalog['CAM-01'];

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden shadow-lg hover:border-indigo-500 transition-all group flex flex-col justify-between">
      {/* Top Card Info Bar - Compact & Clean */}
      <div className="px-3 py-2 bg-[#162032] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-1.5 min-w-0 pr-2">
          <Video className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <h4 className="font-bold text-[11px] text-white truncate">{name}</h4>
        </div>

        {/* Small & Proportional LIVE CCTV Badge */}
        <span className="bg-rose-950/80 text-rose-400 border border-rose-600/70 px-1.5 py-0.5 rounded text-[8px] font-extrabold flex items-center space-x-1 shrink-0">
          <span className="w-1 h-1 rounded-full bg-rose-500 animate-ping"></span>
          <span>LIVE</span>
        </span>
      </div>

      {/* Pure Clean Real-World Retail Store Surveillance Video Feed */}
      <div 
        onClick={() => onOpenDedicatedPage(id)}
        className="relative bg-black aspect-video cursor-pointer overflow-hidden flex items-center justify-center group-hover:opacity-95 transition-all"
      >
        {/* Real Retail Store Camera Stream Video Loop */}
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover block"
        />

        {/* Subtle Gradient & RTSP Metadata Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060a12]/80 via-transparent to-transparent opacity-60 pointer-events-none"></div>
        
        <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[9px] font-mono text-slate-300 pointer-events-none">
          <span className="bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-700 text-slate-300">
            RTSP://{ipAddress}:554
          </span>
          <span className="bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-700 text-emerald-400 font-bold">
            {resolution}
          </span>
        </div>

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 bg-indigo-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
          <span className="px-3 py-1.5 bg-indigo-600 text-white font-extrabold text-[11px] rounded-lg shadow-xl flex items-center space-x-1.5 border border-indigo-400">
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Open Camera View</span>
          </span>
        </div>
      </div>

      {/* Action Footer Button */}
      <div className="p-2 bg-[#0f172a] border-t border-slate-800 flex items-center justify-end">
        <button
          onClick={() => onOpenDedicatedPage(id)}
          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[11px] rounded-lg transition-all flex items-center justify-center space-x-1.5 shadow"
        >
          <span>Open Dedicated Camera</span>
          <Maximize2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
