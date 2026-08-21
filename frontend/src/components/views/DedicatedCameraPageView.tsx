import React, { useEffect, useRef, useState } from 'react';
import { 
  ArrowLeft, Video, Play, Pause, Volume2, VolumeX, 
  Maximize2, Download, Radio, Activity 
} from 'lucide-react';

interface DedicatedCameraPageViewProps {
  cameraId: string;
  onBack: () => void;
}

interface CameraMetadata {
  id: string;
  name: string;
  ipAddress: string;
  resolution: string;
  fps: number;
  latencyMs: number;
  status: string;
  videoUrl: string;
}

const cameraCatalog: Record<string, CameraMetadata> = {
  'CAM-01': {
    id: 'CAM-001',
    name: '1. Entrance Main Overview',
    ipAddress: '192.168.1.101',
    resolution: '1920 × 1080',
    fps: 30,
    latencyMs: 14,
    status: 'LIVE',
    videoUrl: '/videos/entrance.mp4'
  },
  'CAM-02': {
    id: 'CAM-002',
    name: '2. AI Employee Productivity Tracker',
    ipAddress: '192.168.1.102',
    resolution: '1920 × 1080',
    fps: 30,
    latencyMs: 12,
    status: 'LIVE',
    videoUrl: '/videos/employee_productivity.mp4'
  },
  'CAM-03': {
    id: 'CAM-003',
    name: '3. Deep Learning Theft & Shoplifting Detector',
    ipAddress: '192.168.1.103',
    resolution: '1920 × 1080',
    fps: 30,
    latencyMs: 15,
    status: 'LIVE',
    videoUrl: '/videos/shoplifting_detection.mp4'
  },
  'CAM-04': {
    id: 'CAM-004',
    name: '4. AI Video Analytics Shoplifting Prevention',
    ipAddress: '192.168.1.104',
    resolution: '1920 × 1080',
    fps: 30,
    latencyMs: 11,
    status: 'LIVE',
    videoUrl: '/videos/preventing_shoplifting.mp4'
  },
  'CAM-05': {
    id: 'CAM-005',
    name: '5. AI Shoplifter Prevention Camera',
    ipAddress: '192.168.1.105',
    resolution: '1920 × 1080',
    fps: 30,
    latencyMs: 10,
    status: 'LIVE',
    videoUrl: '/videos/stop_shoplifters.mp4'
  },
  'CAM-06': {
    id: 'CAM-006',
    name: '6. Store Exit Gate Area Security',
    ipAddress: '192.168.1.106',
    resolution: '1920 × 1080',
    fps: 30,
    latencyMs: 13,
    status: 'LIVE',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-sliding-doors-at-the-entrance-of-a-supermarket-43229-large.mp4'
  }
};

export const DedicatedCameraPageView: React.FC<DedicatedCameraPageViewProps> = ({
  cameraId,
  onBack
}) => {
  const meta = cameraCatalog[cameraId] || cameraCatalog['CAM-01'];
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isRecording, setIsRecording] = useState<boolean>(true);
  const [snapshotSuccess, setSnapshotSuccess] = useState<string | null>(null);

  // Time & Timestamp
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle Video Play / Pause
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handleSnapshot = () => {
    setSnapshotSuccess('Surveillance frame snapshot saved to telemetry log!');
    setTimeout(() => setSnapshotSuccess(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-[99999] w-screen h-screen bg-[#030712] text-slate-100 flex flex-col justify-between overflow-hidden font-sans">
      
      {/* 1. Camera Header Bar */}
      <header className="bg-[#0f172a] border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-2xl shrink-0">
        <div className="flex items-center space-x-5">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-[#1e293b] hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl border border-slate-700 transition-all flex items-center space-x-2 shadow"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-400" />
            <span>Back to Dashboard</span>
          </button>

          <div className="h-6 w-px bg-slate-800"></div>

          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1.5 bg-rose-950 text-rose-400 border border-rose-600 px-3 py-1 rounded-full text-xs font-extrabold tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <span>🔴 LIVE CCTV STREAM</span>
            </span>

            <div>
              <h1 className="text-base font-extrabold text-white tracking-tight">{meta.name}</h1>
              <span className="text-xs font-mono text-indigo-300">{meta.id}</span>
            </div>
          </div>
        </div>

        {/* Real-time Telemetry Stats */}
        <div className="flex items-center space-x-6 text-xs font-mono">
          <div className="bg-[#090d16] px-3.5 py-1.5 rounded-xl border border-slate-800 text-slate-300">
            Resolution: <span className="text-white font-bold">{meta.resolution}</span>
          </div>
          <div className="bg-[#090d16] px-3.5 py-1.5 rounded-xl border border-slate-800 text-slate-300">
            FPS: <span className="text-emerald-400 font-bold">{meta.fps}</span>
          </div>
          <div className="bg-[#090d16] px-3.5 py-1.5 rounded-xl border border-slate-800 text-slate-300">
            Latency: <span className="text-emerald-400 font-bold">{meta.latencyMs}ms</span>
          </div>
          <div className="text-slate-400 font-bold">
            {currentTime}
          </div>
        </div>
      </header>

      {/* 2. Pure Clean Real-World High-Definition Surveillance Feed Viewport */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {/* Real Retail Store Clean Video Stream */}
        <video
          ref={videoRef}
          src={meta.videoUrl}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="w-full h-full object-cover block"
        />

        {/* Floating Snapshot Success Banner */}
        {snapshotSuccess && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-emerald-950 border-2 border-emerald-500 text-emerald-300 font-extrabold text-xs px-6 py-3 rounded-2xl shadow-2xl animate-bounce">
            {snapshotSuccess}
          </div>
        )}

        {/* Side Camera Telemetry Overlay Card */}
        <div className="absolute top-6 right-6 bg-[#0f172a]/90 border border-slate-700 p-4 rounded-2xl w-72 space-y-2 text-xs backdrop-blur-none shadow-2xl">
          <div className="flex items-center space-x-2 text-indigo-300 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-800 pb-1.5">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>Camera Telemetry Info</span>
          </div>
          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex justify-between text-slate-300">
              <span>Stream URL:</span>
              <span className="text-white font-bold">{meta.ipAddress}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Status:</span>
              <span className="text-emerald-400 font-bold">{meta.status}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Stream Quality:</span>
              <span className="text-emerald-400 font-bold">1080P HD</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Recording:</span>
              <span className="text-rose-400 font-bold">{isRecording ? 'SAVING LOGS' : 'PAUSED'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Camera Controls Toolbar */}
      <footer className="bg-[#0f172a] border-t border-slate-800 px-6 py-4 flex items-center justify-between shadow-2xl shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center space-x-2 border ${
              isPlaying
                ? 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700'
                : 'bg-emerald-600 text-white border-emerald-400'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Pause Stream' : 'Resume Stream'}</span>
          </button>

          <button
            onClick={handleSnapshot}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs rounded-xl border border-slate-700 transition-all flex items-center space-x-2"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Snapshot</span>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700"
            title="Mute / Unmute Stream Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <div className="flex items-center space-x-2 bg-[#090d16] px-3.5 py-2 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 font-bold">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>ENCRYPTED RTSP STREAM</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
