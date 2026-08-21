import React, { useEffect, useRef, useState } from 'react';
import { Video, Maximize2, X, Camera, RefreshCw, ArrowLeft, Eye } from 'lucide-react';

interface CameraStreamProps {
  id: string;
  name: string;
  ipAddress: string;
  resolution?: string;
  status?: string;
}

export const LiveCameraStream: React.FC<CameraStreamProps> = ({
  id,
  name,
  ipAddress,
  resolution = '1920x1080',
  status = 'ONLINE'
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [useWebcam, setUseWebcam] = useState<boolean>(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showDetections, setShowDetections] = useState<boolean>(true);

  // Request live system webcam feed
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (useWebcam) {
      navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } })
        .then((mediaStream) => {
          stream = mediaStream;
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.play();
          }
          setWebcamError(null);
        })
        .catch((err) => {
          console.error("Webcam access error:", err);
          setWebcamError("System webcam not accessible. Defaulting to live stream.");
          setUseWebcam(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [useWebcam]);

  // Canvas Overlay Drawing Loop for normal card canvas
  useEffect(() => {
    let animId: number;
    let step = 0;

    const render = () => {
      step += 0.05;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;

          ctx.clearRect(0, 0, w, h);

          // If system webcam is NOT active, render simulated CCTV aisle scene
          if (!useWebcam) {
            ctx.fillStyle = '#060a12';
            ctx.fillRect(0, 0, w, h);

            // Aisle Perspective Grid
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1;
            for (let x = 0; x < w; x += 40) {
              ctx.beginPath();
              ctx.moveTo(x, 0);
              ctx.lineTo(x, h);
              ctx.stroke();
            }
            for (let y = 0; y < h; y += 30) {
              ctx.beginPath();
              ctx.moveTo(0, y);
              ctx.lineTo(w, y);
              ctx.stroke();
            }

            // Shelves
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(10, 20, w * 0.28, h - 30);
            ctx.fillRect(w * 0.72, 20, w * 0.26, h - 30);

            // Moving Shopper Figure
            const s1X = (w * 0.35) + Math.sin(step * 0.8) * (w * 0.08);
            const s1Y = (h * 0.3) + (Math.cos(step * 0.5) * 0.5 + 0.5) * (h * 0.4);

            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(s1X + 15, s1Y + 12, 7, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillRect(s1X + 8, s1Y + 20, 14, 28);

            if (showDetections) {
              ctx.strokeStyle = '#10b981';
              ctx.lineWidth = 2;
              ctx.strokeRect(s1X, s1Y, 32, 56);
              ctx.fillStyle = '#10b981';
              ctx.fillRect(s1X, s1Y - 14, 110, 14);
              ctx.fillStyle = '#000000';
              ctx.font = 'bold 9px monospace';
              ctx.fillText('SHOPPER #812 [96%]', s1X + 4, s1Y - 3);
            }
          } else {
            // Draw AI bounding box over live webcam video
            if (showDetections) {
              const boxX = w * 0.3;
              const boxY = h * 0.2;
              const boxW = w * 0.4;
              const boxH = h * 0.6;

              ctx.strokeStyle = '#10b981';
              ctx.lineWidth = 3;
              ctx.strokeRect(boxX, boxY, boxW, boxH);

              ctx.fillStyle = '#10b981';
              ctx.fillRect(boxX, boxY - 18, 160, 18);
              ctx.fillStyle = '#000000';
              ctx.font = 'bold 10px monospace';
              ctx.fillText('LIVE WEBCAM PERSON [98%]', boxX + 6, boxY - 5);
            }
          }

          // Live OSD Clock
          const now = new Date();
          const timeStr = now.toISOString().replace('T', ' ').substring(0, 19);

          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.fillRect(8, 8, 250, 24);

          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(18, 20, 4, 0, 2 * Math.PI);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(`REC ${useWebcam ? 'WEBCAM' : 'RTSP'} ${timeStr}`, 28, 23);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [showDetections, useWebcam]);

  // Separate animation loop for Modal Fullscreen Canvas
  useEffect(() => {
    let animId: number;
    let step = 0;

    const renderModal = () => {
      step += 0.05;
      const canvas = modalCanvasRef.current;
      if (canvas && isFullscreen) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;

          ctx.fillStyle = '#060a12';
          ctx.fillRect(0, 0, w, h);

          // Grid Lines
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          for (let x = 0; x < w; x += 60) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
          }
          for (let y = 0; y < h; y += 45) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
          }

          // Shelves
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(20, 40, w * 0.28, h - 60);
          ctx.fillRect(w * 0.72, 40, w * 0.26, h - 60);

          // Shopper
          const s1X = (w * 0.35) + Math.sin(step * 0.8) * (w * 0.08);
          const s1Y = (h * 0.3) + (Math.cos(step * 0.5) * 0.5 + 0.5) * (h * 0.4);

          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(s1X + 25, s1Y + 20, 12, 0, 2 * Math.PI);
          ctx.fill();
          ctx.fillRect(s1X + 12, s1Y + 32, 26, 50);

          if (showDetections) {
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 3;
            ctx.strokeRect(s1X, s1Y, 50, 90);

            ctx.fillStyle = '#10b981';
            ctx.fillRect(s1X, s1Y - 20, 160, 20);
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 12px monospace';
            ctx.fillText('SHOPPER #812 [96%]', s1X + 6, s1Y - 5);
          }

          // Live OSD Clock
          const now = new Date();
          const timeStr = now.toISOString().replace('T', ' ').substring(0, 19);

          ctx.fillStyle = '#0f172a';
          ctx.fillRect(12, 12, 340, 32);

          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(28, 28, 6, 0, 2 * Math.PI);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px monospace';
          ctx.fillText(`REC ${useWebcam ? 'WEBCAM' : 'RTSP'} ${timeStr}`, 42, 33);
        }
      }
      if (isFullscreen) {
        animId = requestAnimationFrame(renderModal);
      }
    };

    if (isFullscreen) {
      loopModal();
    }
    function loopModal() {
      renderModal();
    }

    return () => cancelAnimationFrame(animId);
  }, [isFullscreen, showDetections, useWebcam]);

  return (
    <>
      <div className="relative rounded-2xl overflow-hidden border-2 border-slate-800 bg-[#060a12] aspect-video shadow-xl group">
        {/* Top Header Overlay */}
        <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between pointer-events-none">
          <div className="bg-[#0f172a] px-2.5 py-1 rounded-lg text-[11px] font-extrabold text-white flex items-center space-x-1.5 border border-slate-700">
            <Video className="w-3.5 h-3.5 text-emerald-400" />
            <span>{name}</span>
          </div>

          <div className="flex items-center space-x-1.5 pointer-events-auto">
            <button
              onClick={() => setUseWebcam(!useWebcam)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all border ${
                useWebcam
                  ? 'bg-emerald-600 text-white border-emerald-400'
                  : 'bg-slate-800 text-indigo-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="Toggle Live System Camera / Webcam"
            >
              {useWebcam ? '📹 System Webcam Active' : '📷 Use System Webcam'}
            </button>
            <button
              onClick={() => setIsFullscreen(true)}
              className="bg-[#0f172a] hover:bg-indigo-600 text-white p-1 rounded-lg transition-all border border-slate-700 shadow"
              title="Fullscreen Live Stream"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* System Webcam Video Element */}
        {useWebcam && (
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover block"
          />
        )}

        {/* Overlay Canvas for AI Bounding Boxes */}
        <canvas
          ref={canvasRef}
          width={480}
          height={270}
          className={`w-full h-full block cursor-pointer ${useWebcam ? 'absolute inset-0 z-10' : ''}`}
          onClick={() => setIsFullscreen(true)}
        />

        {/* Bottom Stream OSD Info */}
        <div className="absolute bottom-2 left-2 right-2 z-20 bg-[#0f172a] px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-300 flex items-center justify-between border border-slate-700">
          <span>{useWebcam ? 'SYSTEM WEBCAM INPUT' : `RTSP://${ipAddress}:554`}</span>
          <span className="text-emerald-400 font-bold">{resolution}</span>
        </div>
      </div>

      {/* 100% SOLID OPAQUE FULL-SCREEN CAMERA MONITOR PAGE (ZERO TRANSPARENCY, ZERO GLASSMORPHISM) */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[99999] w-screen h-screen bg-[#030712] p-6 flex flex-col justify-between overflow-hidden">
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between bg-[#0f172a] border-2 border-slate-800 px-6 py-4 rounded-2xl shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping"></div>
              <h2 className="text-lg font-extrabold text-white tracking-tight">{name} - 1080P High-Definition Live Stream</h2>
              <span className="font-mono text-xs text-indigo-300 bg-[#090d16] px-3 py-1 rounded-lg border border-slate-700">
                {useWebcam ? 'LIVE SYSTEM WEBCAM' : `RTSP://${ipAddress}:554`}
              </span>
            </div>

            <button
              onClick={() => setIsFullscreen(false)}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-lg border border-rose-400 flex items-center space-x-2 transition-all"
            >
              <X className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
          </div>

          {/* 100% Solid Opaque Fullscreen Video/Canvas Container */}
          <div className="flex-1 my-4 bg-[#060a12] border-2 border-indigo-600/80 rounded-3xl overflow-hidden relative flex items-center justify-center shadow-2xl">
            {useWebcam ? (
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-cover block"
              />
            ) : (
              <canvas
                ref={modalCanvasRef}
                width={1280}
                height={720}
                className="w-full h-full block object-contain"
              />
            )}
          </div>

          {/* Bottom Stream Control Bar */}
          <div className="bg-[#0f172a] border-2 border-slate-800 p-4 rounded-2xl flex items-center justify-between text-xs shadow-2xl">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowDetections(!showDetections)}
                className={`px-4 py-2 rounded-xl font-extrabold transition-all border ${
                  showDetections
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                AI Object Detection Bounding Boxes: {showDetections ? 'ON' : 'OFF'}
              </button>

              <button
                onClick={() => setUseWebcam(!useWebcam)}
                className={`px-4 py-2 rounded-xl font-extrabold transition-all border ${
                  useWebcam
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/30'
                    : 'bg-slate-800 text-indigo-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {useWebcam ? '📹 System Webcam Active' : '📷 Use System Webcam'}
              </button>
            </div>

            <div className="flex items-center space-x-6 text-slate-300 font-mono text-xs">
              <span>Resolution: <strong className="text-white">{resolution}</strong></span>
              <span>Stream Latency: <strong className="text-emerald-400">12.4ms</strong></span>
              <span>FPS: <strong className="text-emerald-400">30.0</strong></span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
