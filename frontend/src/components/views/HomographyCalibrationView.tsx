import React, { useState } from 'react';
import { api } from '../../api/client';
import { Camera, CheckCircle, RefreshCw, ArrowLeft, Sliders } from 'lucide-react';

interface HomographyCalibrationViewProps {
  onBack?: () => void;
  cameraId?: string;
}

export const HomographyCalibrationView: React.FC<HomographyCalibrationViewProps> = ({
  onBack,
  cameraId = 'CAM-02'
}) => {
  const [sourcePoints, setSourcePoints] = useState<number[][]>([[120, 80], [180, 420], [840, 410], [780, 90]]);
  const [dstPoints, setDstPoints] = useState<number[][]>([[100, 100], [100, 500], [900, 500], [900, 100]]);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleCalibrate = async () => {
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await api.submitCalibration(cameraId, sourcePoints, dstPoints);
      if (res.status === 'SUCCESS') {
        setStatus('Homography 3x3 projection matrix successfully calibrated & updated for OpenCV spatial mapping!');
      }
    } catch (e) {
      setStatus('Failed to calibrate homography matrix. Please check input point pairs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Navigation Bar */}
      <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 bg-[#1e293b] hover:bg-slate-700 text-white rounded-xl transition-all border border-slate-700 flex items-center space-x-1 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Analyst Dashboard</span>
            </button>
          )}
          <div>
            <h2 className="text-base font-extrabold text-white">Camera Planogram Homography Matrix Calibration</h2>
            <p className="text-xs text-slate-400">Transform camera pixel space (xc, yc) to 2D Planogram ground plane (xp, yp)</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400 bg-indigo-950 border border-indigo-500 px-3 py-1.5 rounded-xl">
          <Sliders className="w-4 h-4" />
          <span>Camera ID: {cameraId}</span>
        </div>
      </div>

      {/* Main Calibration Card */}
      <div className="bi-card p-6 space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">Interactive OpenCV 3x3 Projection Matrix</h3>
            <p className="text-xs text-slate-400">Map camera lens distortion to planar 2D store coordinates</p>
          </div>
        </div>

        {/* 2 Point Coordinates Mapping Grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#162032] p-5 rounded-2xl border-2 border-slate-700 space-y-4">
            <div className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider">Camera Pixel Space Source Points</div>
            {sourcePoints.map((pt, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-200">Point #{idx + 1}:</span>
                <span className="font-mono text-indigo-300 bg-[#090d16] px-3 py-1.5 rounded-lg border border-slate-700">
                  [{pt[0]}, {pt[1]}]
                </span>
              </div>
            ))}
          </div>

          <div className="bg-[#162032] p-5 rounded-2xl border-2 border-slate-700 space-y-4">
            <div className="text-xs font-extrabold text-emerald-300 uppercase tracking-wider">Planogram Target Destination Points</div>
            {dstPoints.map((pt, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-200">Target #{idx + 1}:</span>
                <span className="font-mono text-emerald-300 bg-[#090d16] px-3 py-1.5 rounded-lg border border-slate-700">
                  [{pt[0]}, {pt[1]}]
                </span>
              </div>
            ))}
          </div>
        </div>

        {status && (
          <div className="bg-emerald-950 border-2 border-emerald-500 rounded-xl p-4 flex items-center space-x-3 text-xs text-emerald-300 font-extrabold">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{status}</span>
          </div>
        )}

        <div className="flex justify-end space-x-4 pt-4 border-t border-slate-800">
          {onBack && (
            <button
              onClick={onBack}
              className="px-5 py-2.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-slate-700"
            >
              Return
            </button>
          )}
          <button
            onClick={handleCalibrate}
            disabled={submitting}
            className="px-6 py-2.5 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-lg shadow-indigo-600/40 flex items-center space-x-2 disabled:opacity-50"
          >
            {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
            <span>Compute & Update Matrix</span>
          </button>
        </div>
      </div>
    </div>
  );
};
