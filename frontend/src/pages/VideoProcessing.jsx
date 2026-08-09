import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/client";
import { camerasApi, zonesApi } from "../api/resources";

export default function VideoProcessing() {
  const [searchParams] = useSearchParams();
  const [cameras, setCameras] = useState([]);
  const [zones, setZones] = useState([]);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [filename, setFilename] = useState("");
  const [cameraId, setCameraId] = useState(searchParams.get("camera_id") || "");
  const [zoneId, setZoneId] = useState("");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const videoRef = useRef(null);
  const annotatedRef = useRef(null);

  useEffect(() => {
    Promise.all([camerasApi.list(), zonesApi.list()])
      .then(([camerasRes, zonesRes]) => {
        setCameras(camerasRes.data);
        setZones(zonesRes.data);
        const requested = searchParams.get("camera_id");
        if (requested && camerasRes.data.some((c) => String(c.id) === requested)) {
          setCameraId(requested);
        } else if (!requested && camerasRes.data.length) {
          setCameraId(String(camerasRes.data[0].id));
        }
      })
      .catch(() => setError("Failed to load cameras/zones"));
    // Deliberately mount-only. `searchParams` is read here just to pick the
    // initial camera from the URL; including it would re-fetch the whole
    // camera/zone list every time any query param changes and would stomp on
    // a camera the user has since picked manually.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedCamera = useMemo(() => cameras.find((c) => String(c.id) === String(cameraId)), [cameras, cameraId]);
  const zonesForCamera = useMemo(
    () => (selectedCamera ? zones.filter((z) => z.store_id === selectedCamera.store_id) : []),
    [zones, selectedCamera],
  );

  useEffect(() => {
    if (zonesForCamera.length && !zonesForCamera.some((z) => String(z.id) === String(zoneId))) {
      setZoneId(String(zonesForCamera[0].id));
    } else if (!zonesForCamera.length) {
      setZoneId("");
    }
  }, [zonesForCamera, zoneId]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);
    setFilename("");
    setResult(null);
    setError("");
    setProgress(0);

    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
  };

  const handleUpload = async () => {
    if (!file) return setError("Please select a video");
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/api/video/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFilename(res.data.filename);
      setResult({ type: "upload", data: res.data });
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    if (!filename) return setError("Upload video first");
    if (!cameraId) return setError("Select a camera");

    setProcessing(true);
    setError("");
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 15, 95));
    }, 400);

    try {
      const res = await api.post("/api/video/process", {
        filename,
        camera_id: Number(cameraId),
        zone_id: zoneId ? Number(zoneId) : null,
        frame_skip: 5,
        max_frames: 80,
      });

      setResult({ type: "process", data: res.data });
      setProgress(100);
    } catch (err) {
      setError(err.response?.data?.detail || "Processing failed");
    } finally {
      setProcessing(false);
      clearInterval(progressInterval);
    }
  };

  const stats = result?.type === "process" ? result.data?.stats : null;
  const annotatedName = stats?.annotated_video;
  // Reprocessing the same source video overwrites the same output filename,
  // so a fresh cache-busting value per result is needed - otherwise the
  // <video> below can keep showing a stale, previously-cached render.
  // `result` is the intended trigger, not an accidental dependency: the point
  // is to mint a NEW timestamp each time a new result arrives. The lint rule
  // flags it because Date.now() doesn't read `result`, but dropping it would
  // freeze the value forever and reintroduce the stale-video bug above.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cacheBust = useMemo(() => Date.now(), [result]);
  const annotatedUrl = annotatedName ? `${api.defaults.baseURL}/annotated/${annotatedName}?v=${cacheBust}` : null;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Video Processing</h1>
        <p className="text-slate-400">Upload → AI Analysis → View Annotated Video</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Controls */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold text-white mb-4">1. Upload Video</h2>
            <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:border-blue-500 transition">
              <p className="text-sm text-slate-400 px-4 text-center">
                {file ? file.name : "Choose video file"}
              </p>
              <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
            </label>

            <button
              onClick={handleUpload}
              disabled={loading || !file}
              className="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-medium transition"
            >
              {loading ? "Uploading..." : "Upload"}
            </button>
          </div>

          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold text-white mb-4">2. AI Processing</h2>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Camera</label>
                <select
                  value={cameraId}
                  onChange={(e) => setCameraId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">Select a camera</option>
                  {cameras.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.id} — {c.camera_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Zone</label>
                <select
                  value={zoneId}
                  onChange={(e) => setZoneId(e.target.value)}
                  disabled={!zonesForCamera.length}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white disabled:opacity-50"
                >
                  {!zonesForCamera.length && <option value="">No zones for this store</option>}
                  {zonesForCamera.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.zone_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleProcess}
              disabled={processing || !filename || !cameraId}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-medium transition"
            >
              {processing ? "AI Processing..." : "Start Processing"}
            </button>

            {processing && (
              <div className="mt-4">
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-center text-xs text-slate-400 mt-1">{Math.floor(progress)}% Complete</p>
              </div>
            )}

            {stats && (
              <div className="mt-5 flex flex-wrap gap-3 text-xs">
                <Link to="/camera-grid" className="rounded-lg bg-blue-600/20 px-3 py-2 font-medium text-blue-300 hover:bg-blue-600/30">
                  View in Camera Grid →
                </Link>
                <Link to="/cameras" className="rounded-lg bg-white/5 px-3 py-2 font-medium text-slate-300 hover:bg-white/10">
                  Back to Cameras
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Original Video */}
          <div className="rounded-2xl border border-white/5 bg-slate-900/60 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 bg-slate-800">
              <h2 className="text-lg font-semibold text-white">Original Video</h2>
            </div>
            <div className="p-4 bg-black min-h-[300px] flex items-center justify-center">
              {previewUrl ? (
                <video ref={videoRef} src={previewUrl} controls className="max-h-[420px] rounded-xl" />
              ) : (
                <p className="text-slate-500">Upload a video to preview</p>
              )}
            </div>
          </div>

          {/* Annotated Video */}
          {annotatedUrl && (
            <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/60 overflow-hidden">
              <div className="px-5 py-4 border-b border-emerald-500/30 bg-emerald-900/30">
                <h2 className="text-lg font-semibold text-emerald-400">Annotated Video (AI Result)</h2>
              </div>
              <div className="p-4 bg-black min-h-[300px] flex items-center justify-center">
                <video ref={annotatedRef} src={annotatedUrl} controls className="max-h-[420px] rounded-xl" />
              </div>
            </div>
          )}
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">{error}</div>}

      {result && stats && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Processing Summary</h3>
          <pre className="bg-black/30 p-4 rounded-xl text-sm overflow-auto max-h-64">{JSON.stringify(result.data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
