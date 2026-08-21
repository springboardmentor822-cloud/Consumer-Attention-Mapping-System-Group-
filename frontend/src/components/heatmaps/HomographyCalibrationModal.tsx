import React, { useState } from 'react';
import { api } from '../../api/client';
import { Camera, CheckCircle, RefreshCw, X } from 'lucide-react';

interface CalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  cameraId?: string;
}

export const HomographyCalibrationModal: React.FC<CalibrationModalProps> = ({ isOpen, onClose, cameraId = 'CAM-02' }) => {
  const [sourcePoints, setSourcePoints] = useState<number[][]>([[120, 80], [180, 420], [840, 410], [780, 90]]);
  const [dstPoints, setDstPoints] = useState<number[][]>([[100, 100], [100, 500], [900, 500], [900, 100]]);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCalibrate = async () => {
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await api.submitCalibration(cameraId, sourcePoints, dstPoints);
      if (res.status === 'SUCCESS') {
        setStatus('Homography 3x3 projection matrix successfully calibrated & updated!');
      }
    } catch (e) {
      setStatus('Failed to calibrate homography matrix. Please check coordinates.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712] bg-opacity-95 p-4">
      <div className="bg-[#0f172a] border-2 border-indigo-500/60 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 text-slate-100 relative">
        <div className="flex items-center justify-between border-b border-slate-700 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Camera Homography Matrix Calibration</h3>
              <p className="text-xs text-slate-300 font-medium">Map camera pixel space (xc, yc) to 2D Planogram ground plane (xp, yp)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reference Point Mapping - Solid Opaque Containers */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700 space-y-3">
            <div className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider">Camera Pixel Space Points</div>
            {sourcePoints.map((pt, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300">Point #{idx + 1}:</span>
                <span className="font-mono text-indigo-300 bg-[#0f172a] px-2.5 py-1 rounded border border-slate-700">[{pt[0]}, {pt[1]}]</span>
              </div>
            ))}
          </div>

          <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700 space-y-3">
            <div className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">Planogram Target Points</div>
            {dstPoints.map((pt, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300">Target #{idx + 1}:</span>
                <span className="font-mono text-emerald-300 bg-[#0f172a] px-2.5 py-1 rounded border border-slate-700">[{pt[0]}, {pt[1]}]</span>
              </div>
            ))}
          </div>
        </div>

        {status && (
          <div className="bg-emerald-950/80 border-2 border-emerald-500 rounded-xl p-3.5 flex items-center space-x-2 text-xs text-emerald-300 font-extrabold">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{status}</span>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleCalibrate}
            disabled={submitting}
            className="px-5 py-2 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-lg flex items-center space-x-2 disabled:opacity-50"
          >
            {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>Compute & Update Matrix</span>
          </button>
        </div>
      </div>
    </div>
  );
};
