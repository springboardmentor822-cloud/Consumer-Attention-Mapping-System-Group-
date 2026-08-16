'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { 
  LayoutDashboard, Store, Map as MapIcon, Video, BarChart3, Users, LogOut, 
  Plus, MapPin, Activity, Eye, AlertCircle, RefreshCw, CheckCircle2,
  Calendar, Layers, Clock, ShieldCheck, UserCheck, Sun, Moon, Upload,
  ShoppingBag, Search, ChevronLeft, ChevronRight, TrendingUp, DollarSign, Database, Award, ArrowUpDown, FileText, CheckCircle,
  Flame, Sparkles, ArrowUpRight, Package, AlertTriangle, Settings, Bell, Filter, Compass, Download, Tag, Home, Megaphone, Star, Brain, Footprints, Lightbulb, ClipboardCheck, FileDown
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  Legend, CartesianGrid, LineChart, Line 
} from 'recharts';

import StoreManagerDashboard from './components/StoreManagerDashboard';
import RetailAnalystDashboard from './components/RetailAnalystDashboard';
import MarketingManagerDashboard from './components/MarketingManagerDashboard';
import AdministratorDashboard from './components/AdministratorDashboard';
import StoreShelfConfig from './components/StoreShelfConfig';
import VisitorsAnalytics from './components/VisitorsAnalytics';
import OperationalReports from './components/OperationalReports';
import StoreSettings from './components/StoreSettings';

export default function DashboardPage() {
  const { user, logout, token, backendUrl } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'overview' | 'stores' | 'cameras' | 'analytics' | 'users' | 'sales' | 'visitors' | 'shelves' | 'products' | 'alerts' | 'reports' | 'settings'>('overview');
  const [roleView, setRoleView] = useState<string>('Store Manager');
  const [marketingSection, setMarketingSection] = useState<string>('overview');

  useEffect(() => {
    if (user?.role) {
      setRoleView(user.role);
    }
  }, [user?.role]);
  
  // API State
  const [storesList, setStoresList] = useState<any[]>([]);

  const [camerasList, setCamerasList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | ''>('');
  const [selectedCameraId, setSelectedCameraId] = useState<number | ''>('');

  // Product Sales & Dataset State
  const [salesOverview, setSalesOverview] = useState<any>(null);
  const [deptSales, setDeptSales] = useState<any[]>([]);
  const [storeSalesData, setStoreSalesData] = useState<any>(null);
  const [datasetInfo, setDatasetInfo] = useState<any>(null);
  const [salesSearch, setSalesSearch] = useState('');
  const [salesPage, setSalesPage] = useState(1);
  const [salesPerPage, setSalesPerPage] = useState(10);
  const [salesSortKey, setSalesSortKey] = useState<'rank' | 'total_sales' | 'dept_id' | 'category_name'>('rank');
  const [salesSortAsc, setSalesSortAsc] = useState(true);
  
  // Interactive Header Controls State
  const [headerDate, setHeaderDate] = useState('21 May 2025');
  const [headerTime, setHeaderTime] = useState('09:00 AM - 09:00 PM');
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [analystSection, setAnalystSection] = useState('overview');
  
  // Form Inputs
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreLocation, setNewStoreLocation] = useState('');
  
  const [newShelfName, setNewShelfName] = useState('');
  const [newShelfZone, setNewShelfZone] = useState('');
  const [newShelfWidth, setNewShelfWidth] = useState(2.0);
  const [newShelfHeight, setNewShelfHeight] = useState(1.8);
  const [shelvesList, setShelvesList] = useState<any[]>([]);
  
  const [newCameraName, setNewCameraName] = useState('');
  const [newCameraX, setNewCameraX] = useState(50);
  const [newCameraY, setNewCameraY] = useState(40);
  
  // UI Status
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // WebSocket/Canvas state
  const [wsConnected, setWsConnected] = useState(false);
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const heatmapCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const shopperTrailsRef = useRef<{ [key: number]: { x: number; y: number }[] }>({});
  const heatmapPointsRef = useRef<{ x: number; y: number; radius?: number; weight?: number; intensity?: number }[]>([]);
  const heatmapLastUpdateRef = useRef<number>(0);

  const cctvImagesRef = useRef<{ [key: number]: HTMLImageElement }>({});
  const cctvVideosRef = useRef<{ [key: number]: HTMLVideoElement }>({});
  const [useVideoFeed, setUseVideoFeed] = useState<boolean>(true);
  const [customVideoUrl, setCustomVideoUrl] = useState<string | null>(null);
  const customVideoRef = useRef<HTMLVideoElement | null>(null);

  const [showBBoxes, setShowBBoxes] = useState<boolean>(true);
  const [showGazeRays, setShowGazeRays] = useState<boolean>(true);
  const [showTrails, setShowTrails] = useState<boolean>(true);
  const [isStreamPaused, setIsStreamPaused] = useState<boolean>(false);
  const [currentShoppers, setCurrentShoppers] = useState<any[]>([]);
  const latestShoppersRef = useRef<any[]>([]);

  const showBBoxesRef = useRef<boolean>(showBBoxes);
  const showGazeRaysRef = useRef<boolean>(showGazeRays);
  const showTrailsRef = useRef<boolean>(showTrails);
  const isStreamPausedRef = useRef<boolean>(isStreamPaused);

  showBBoxesRef.current = showBBoxes;
  showGazeRaysRef.current = showGazeRays;
  showTrailsRef.current = showTrails;
  isStreamPausedRef.current = isStreamPaused;

  const [currentQueueLength, setCurrentQueueLength] = useState<number>(0);
  const [storeOccupancy, setStoreOccupancy] = useState<number>(0);



  // Trigger status message fade
  const triggerStatus = (text: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setStatusMessage({ text, type: type === 'error' ? 'error' : 'success' });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const fetchStores = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${backendUrl}/stores`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStoresList(data);
        if (data.length > 0 && !selectedStoreId) {
          setSelectedStoreId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching stores:', err);
    }
  };

  const fetchCameras = async (stId?: number) => {
    if (!token) return;
    try {
      const targetId = stId || selectedStoreId;
      const url = targetId ? `${backendUrl}/cameras/store/${targetId}` : `${backendUrl}/cameras`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const first8 = Array.isArray(data) ? data.slice(0, 8) : [];
        setCamerasList(first8);
        if (first8.length > 0 && !selectedCameraId) {
          setSelectedCameraId(first8[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching cameras:', err);
    }
  };

  const fetchShelves = async (stId?: number) => {
    if (!token) return;
    try {
      const targetId = stId || selectedStoreId;
      if (!targetId) return;
      const res = await fetch(`${backendUrl}/stores/${targetId}/shelves`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setShelvesList(await res.json());
      }
    } catch (err) {
      console.error('Error fetching shelves:', err);
    }
  };

  // Fetch initial data
  const fetchData = async () => {
    if (!token) return;
    await fetchStores();
    await fetchCameras();
    fetchSalesData();
  };

  const fetchSalesData = async () => {
    if (!token) return;
    try {
      const [resOverview, resDepts, resStores, resInfo] = await Promise.all([
        fetch(`${backendUrl}/sales/overview`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${backendUrl}/sales/departments`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${backendUrl}/sales/stores`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${backendUrl}/sales/dataset-info`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (resOverview.ok) setSalesOverview(await resOverview.json());
      if (resDepts.ok) {
        const data = await resDepts.json();
        setDeptSales(data.departments || []);
      }
      if (resStores.ok) setStoreSalesData(await resStores.json());
      if (resInfo.ok) setDatasetInfo(await resInfo.json());
    } catch (err) {
      console.error('Error fetching sales dataset:', err);
    }
  };

  const fetchUsers = async () => {
    if (!token || user?.role !== 'Administrator') return;
    try {
      const res = await fetch(`${backendUrl}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUsersList(await res.json());
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchData();
    }
  }, [activeTab, token]);

  useEffect(() => {
    if (!selectedStoreId || !token) return;
    const fetchShelves = async () => {
      try {
        const res = await fetch(`${backendUrl}/stores/${selectedStoreId}/shelves`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setShelvesList(await res.json());
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchShelves();
  }, [selectedStoreId, token]);

  useEffect(() => {
    if (!selectedStoreId || !token) return;
    const fetchOccupancy = async () => {
      try {
        const res = await fetch(`${backendUrl}/stores/${selectedStoreId}/occupancy`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStoreOccupancy(data.occupancy);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchOccupancy();
    const interval = setInterval(fetchOccupancy, 3000);
    return () => clearInterval(interval);
  }, [selectedStoreId, token, backendUrl]);


  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await fetch(`${backendUrl}/stores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newStoreName, location: newStoreLocation })
      });
      
      if (res.ok) {
        const data = await res.json();
        triggerStatus(`Store "${data.name}" registered successfully!`, 'success');
        setNewStoreName('');
        setNewStoreLocation('');
        fetchData();
      } else {
        const err = await res.json();
        triggerStatus(err.detail || 'Failed to create store', 'error');
      }
    } catch (err) {
      triggerStatus('Network error during store creation', 'error');
    }
  };

  const handleCreateShelf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreId || !token) {
      triggerStatus('Please select or register a store first', 'error');
      return;
    }
    try {
      const res = await fetch(`${backendUrl}/stores/${selectedStoreId}/shelves`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newShelfName,
          zone_name: newShelfZone,
          width: Number(newShelfWidth),
          height: Number(newShelfHeight),
          coordinates_json: JSON.stringify({ x: Math.random() * 60 + 10, y: Math.random() * 60 + 10, w: 20, h: 20 })
        })
      });

      if (res.ok) {
        const data = await res.json();
        triggerStatus(`Shelf "${data.name}" mapped successfully!`, 'success');
        setNewShelfName('');
        setNewShelfZone('');
        const resShelves = await fetch(`${backendUrl}/stores/${selectedStoreId}/shelves`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (resShelves.ok) setShelvesList(await resShelves.json());
      } else {
        const err = await res.json();
        triggerStatus(err.detail || 'Failed to map shelf', 'error');
      }
    } catch (err) {
      triggerStatus('Network error mapping shelf', 'error');
    }
  };

  const handleCreateCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreId || !token) {
      triggerStatus('Please select a store to map the camera to', 'error');
      return;
    }
    try {
      const res = await fetch(`${backendUrl}/cameras?store_id=${selectedStoreId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newCameraName,
          stream_url: `/sim/camera_${newCameraName.toLowerCase().replace(/\s+/g, '_')}`,
          status: 'active',
          position_x: Number(newCameraX),
          position_y: Number(newCameraY),
          angle: 45
        })
      });

      if (res.ok) {
        const data = await res.json();
        triggerStatus(`Camera "${data.name}" assigned successfully!`, 'success');
        setNewCameraName('');
        fetchData();
      } else {
        const err = await res.json();
        triggerStatus(err.detail || 'Failed to assign camera', 'error');
      }
    } catch (err) {
      triggerStatus('Network error assigning camera', 'error');
    }
  };

  const handleToggleUserActive = async (userId: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${backendUrl}/auth/users/${userId}/toggle-active`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        triggerStatus('User active status toggled successfully!', 'success');
        fetchUsers();
      } else {
        const err = await res.json();
        triggerStatus(err.detail || 'Failed to toggle status', 'error');
      }
    } catch (err) {
      triggerStatus('Network error toggling status', 'error');
    }
  };

  // Preload CCTV background feed images and MP4 videos
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Preload all 8 camera videos that exist on disk (cctv_1.mp4 through cctv_8.mp4)
    const videoIds = [1, 2, 3, 4, 5, 6, 7, 8];
    [1, 2, 3, 4, 5, 6, 7, 8].forEach((id) => {
      // Preload Image
      const img = new Image();
      img.src = `/images/cctv_${id}.png`;
      cctvImagesRef.current[id] = img;
    });
    videoIds.forEach((id) => {
      // Preload MP4 Video element
      const vid = document.createElement('video');
      vid.src = `/videos/cctv_${id}.mp4`;
      vid.autoplay = true;
      vid.loop = true;
      vid.muted = true;
      vid.playsInline = true;
      vid.play().catch(() => {});
      cctvVideosRef.current[id] = vid;
    });
  }, []);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomVideoUrl(url);
      const vid = document.createElement('video');
      vid.src = url;
      vid.autoplay = true;
      vid.loop = true;
      vid.muted = true;
      vid.playsInline = true;
      vid.play().catch(() => {});
      customVideoRef.current = vid;
      setUseVideoFeed(true);
      triggerStatus(`Custom CCTV Video "${file.name}" loaded & streaming!`, 'success');
    }
  };



  // WebSocket Camera Stream connection
  useEffect(() => {
    if (activeTab !== 'cameras' || !selectedCameraId) {
      if (wsRef.current) {
        wsRef.current.close();
      }
      return;
    }

    // Clear stale state from previous camera
    shopperTrailsRef.current = {};
    heatmapPointsRef.current = [];
    latestShoppersRef.current = [];
    heatmapLastUpdateRef.current = 0;

    let reconnectTimer: NodeJS.Timeout;
    const connectWs = () => {
      const wsBaseUrl = backendUrl.replace(/^http/, 'ws');
      const wsUrl = `${wsBaseUrl}/cameras/stream/${selectedCameraId}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        setTelemetryLogs(prev => [`[${new Date().toLocaleTimeString()}] Live WebSocket connection established for Camera #${selectedCameraId}`, ...prev]);
      };

      ws.onclose = () => {
        setWsConnected(false);
        reconnectTimer = setTimeout(connectWs, 1500);
      };

      ws.onerror = () => {
        setWsConnected(false);
      };

      ws.onmessage = (event) => {
        if (isStreamPausedRef.current) return;

        const payload = JSON.parse(event.data);
        if (payload.error) {
          setTelemetryLogs(prev => [`[ERROR] ${payload.error}`, ...prev]);
          return;
        }
        
        const shoppers = payload.shoppers || [];
        setCurrentQueueLength(shoppers.length);
        setCurrentShoppers(shoppers);
        latestShoppersRef.current = shoppers;

        // Generate telemetry log entries at 2fps (WebSocket rate), NOT inside the 60fps rAF loop
        const newLogs: string[] = [];
        shoppers.forEach((s: any) => {
          if (s.dwell_time > 0 && s.dwell_time % 10 === 0) {
            const labelText = s.label || 'Person';
            const targetStr = s.gaze_target || '';
            let intentText = '🚶 BROWSING';
            if (targetStr.includes('Register') || targetStr.includes('Checkout')) intentText = '💳 PAYING';
            else if (targetStr.includes('Foyer') || targetStr.includes('Entrance')) intentText = '🚪 ENTERING';
            else if (targetStr) intentText = `🔍 ${targetStr}`;
            newLogs.push(`[${new Date().toLocaleTimeString()}] ${labelText} #${s.shopper_id} (${intentText}, dwell: ${s.dwell_time}s)`);
          }
        });
        if (newLogs.length > 0) {
          setTelemetryLogs(prev => [...newLogs, ...prev.slice(0, 49 - newLogs.length)]);
        }
      };
    };

    connectWs();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) wsRef.current.close();
    };
  }, [activeTab, selectedCameraId]);

  // 60 FPS Continuous Video & Telemetry Render Loop
  useEffect(() => {
    if (activeTab !== 'cameras') return;
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      const shoppers = latestShoppersRef.current || [];

      // Clear Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Define Theme Aware Canvas Colors
      const isDark = theme === 'dark';
      const canvasBg = isDark ? '#090d16' : '#ffffff';
      const gridColor = isDark ? '#1e293b' : '#cbd5e1';
      const shopperColor = '#6366f1';
      const vectorColor = isDark ? 'rgba(234, 179, 8, 0.6)' : 'rgba(217, 119, 6, 0.7)';
      const endpointColor = isDark ? '#eab308' : '#d97706';
      
      // Text styling bases
      const primaryTextColor = isDark ? '#ffffff' : '#0f172a';
      const secondaryTextColor = isDark ? '#94a3b8' : '#475569';

      // 3. Draw CCTV Camera Background (Video Stream -> Image Feed -> Grid)
      const customVid = customVideoRef.current;
      const camVideoMap: { [key: number]: number } = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8 };
      const camIdx = camVideoMap[Number(selectedCameraId)] || 1;
      const presetVid = cctvVideosRef.current[camIdx];
      const cctvImg = cctvImagesRef.current[camIdx];

      if (useVideoFeed && customVid) {
        if (customVid.paused) customVid.play().catch(() => {});
        if (customVid.readyState >= 1) {
          ctx.drawImage(customVid, 0, 0, canvas.width, canvas.height);
          ctx.fillStyle = isDark ? 'rgba(9, 13, 22, 0.35)' : 'rgba(15, 23, 42, 0.15)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      } else if (useVideoFeed && presetVid) {
        if (presetVid.paused) presetVid.play().catch(() => {});
        if (presetVid.readyState >= 1) {
          ctx.drawImage(presetVid, 0, 0, canvas.width, canvas.height);
          ctx.fillStyle = isDark ? 'rgba(9, 13, 22, 0.35)' : 'rgba(15, 23, 42, 0.15)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      } else if (cctvImg && cctvImg.complete && cctvImg.naturalWidth !== 0) {
        ctx.drawImage(cctvImg, 0, 0, canvas.width, canvas.height);
        ctx.fillStyle = isDark ? 'rgba(9, 13, 22, 0.45)' : 'rgba(15, 23, 42, 0.25)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {


        // Fallback store grid
        ctx.fillStyle = canvasBg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 0.5;
        const gridSize = 40;
        for (let x = 0; x < canvas.width; x += gridSize) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += gridSize) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }
      }

      // CCTV Camera HUD Header
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(10, 10, canvas.width - 20, 32);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, canvas.width - 20, 32);

      // REC Dot
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(26, 26, 5, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      const activeCamObj = camerasList.find(c => c.id === Number(selectedCameraId));
      let rawLabel = activeCamObj ? activeCamObj.name.toUpperCase() : `CAM #${selectedCameraId}`;
      if (rawLabel.length > 22) rawLabel = rawLabel.substring(0, 22) + '...';
      ctx.fillText(`REC 🔴 [CAMS SURVEILLANCE] ${rawLabel}`, 38, 29);

      const timeNow = new Date().toLocaleTimeString();
      const personCount = shoppers.filter((s: any) => !s.object_type || s.object_type === 'person' || s.object_type === 'cashier').length;
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`${timeNow} | 1080P 30FPS | DETECTED: ${personCount} PERSONS`, canvas.width - 310, 29);

      // 4. Update and Draw Smooth Thermal Attention Dwell Heatmap on Right-Side Canvas (heatmapCanvasRef)
      // Throttle heatmap point accumulation to ~1 Hz to prevent 60fps memory bloat
      const now = performance.now();
      if (!heatmapLastUpdateRef.current || now - heatmapLastUpdateRef.current > 1000) {
        heatmapLastUpdateRef.current = now;
        shoppers.forEach((s: any) => {
          const px = (s.x / 100) * canvas.width;
          const py = (s.y / 100) * canvas.height;
          heatmapPointsRef.current.push({ x: px, y: py, intensity: 0.3 });
        
          if (s.gaze_x !== null && s.gaze_y !== null) {
            const gx = (s.gaze_x / 100) * canvas.width;
            const gy = (s.gaze_y / 100) * canvas.height;
            heatmapPointsRef.current.push({ x: gx, y: gy, intensity: 0.45 });
          }
        });
      }

      if (heatmapPointsRef.current.length > 250) {
        heatmapPointsRef.current = heatmapPointsRef.current.slice(-250);
      }

      // Render Dedicated 2D Store Layout Floorplan Heatmap Canvas
      const hCanvas = heatmapCanvasRef.current;
      if (hCanvas) {
        const hCtx = hCanvas.getContext('2d');
        if (hCtx) {
          hCtx.clearRect(0, 0, hCanvas.width, hCanvas.height);

          // 1. Draw 2D Store Architectural Blueprint Grid
          const bpBg = isDark ? '#090d16' : '#f1f5f9';
          const bpGrid = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(203, 213, 225, 0.6)';
          
          hCtx.fillStyle = bpBg;
          hCtx.fillRect(0, 0, hCanvas.width, hCanvas.height);

          // Blueprint Grid lines
          hCtx.strokeStyle = bpGrid;
          hCtx.lineWidth = 0.5;
          const gridSize = 40;
          for (let x = 0; x < hCanvas.width; x += gridSize) {
            hCtx.beginPath(); hCtx.moveTo(x, 0); hCtx.lineTo(x, hCanvas.height); hCtx.stroke();
          }
          for (let y = 0; y < hCanvas.height; y += gridSize) {
            hCtx.beginPath(); hCtx.moveTo(0, y); hCtx.lineTo(hCanvas.width, y); hCtx.stroke();
          }

          // 2. Draw 2D Architectural Outer Walls & Walkways
          hCtx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
          hCtx.lineWidth = 3;
          hCtx.strokeRect(12, 12, hCanvas.width - 24, hCanvas.height - 24);

          // 3. Render Dynamic Zone-Specific 2D Architectural Layout Map
          const currentCam = Number(selectedCameraId);

          let zoneTitle = 'MASTER STORE OVERVIEW: INTEGRATED 4-ZONE LAYOUT';
          let layoutZones: { name: string; code: string; x: number; y: number; w: number; h: number; color: string; bg: string }[] = [];

          if (currentCam === 1) {
            // Zone 1 Layout: Entrance & Foyer
            zoneTitle = 'ZONE 1 LAYOUT: ENTRANCE & EXIT FOYER';
            layoutZones = [
              { name: 'AUTOMATIC SLIDING GLASS ENTRY DOORS', code: 'ENTRANCE', x: 180, y: 20, w: 280, h: 25, color: '#10b981', bg: 'rgba(16, 185, 129, 0.25)' },
              { name: 'SECURITY SCANNING GATES & ARCHWAY', code: 'GATE A', x: 40, y: 75, w: 260, h: 50, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
              { name: 'WELCOME & PROMOTIONAL DISPLAY KIOSK', code: 'KIOSK 1', x: 340, y: 75, w: 260, h: 100, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
              { name: 'SHOPPING CARTS & BASKET STATION', code: 'CARTS', x: 40, y: 155, w: 260, h: 130, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)' },
              { name: 'FOYER RECEPTION & INFO DESK', code: 'INFO', x: 40, y: 310, w: 560, h: 110, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' },
            ];
          } else if (currentCam === 2) {
            // Zone 2 Layout: Beverage Aisle A
            zoneTitle = 'ZONE 2 LAYOUT: BEVERAGE & COLD DRINKS AISLE';
            layoutZones = [
              { name: 'WALL REFRIGERATED COOLERS (COKE / PEPSI / SODA)', code: 'COOLER WALL', x: 30, y: 55, w: 580, h: 70, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.20)' },
              { name: 'CENTER AISLE SODA RACK 1 (2L BOTTLES & CANS)', code: 'RACK A1', x: 40, y: 160, w: 260, h: 110, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
              { name: 'CENTER AISLE JUICE & ENERGY DRINKS RACK 2', code: 'RACK A2', x: 340, y: 160, w: 260, h: 110, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
              { name: 'SPECIALTY CRAFT & DRINKS PROMO ENDCAP', code: 'ENDCAP 2', x: 40, y: 305, w: 560, h: 110, color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
            ];
          } else if (currentCam === 3) {
            // Zone 3 Layout: Snack Aisle B
            zoneTitle = 'ZONE 3 LAYOUT: SNACKS & CONFECTIONERY AISLE';
            layoutZones = [
              { name: 'POTATO CHIPS & SALTY SNACKS WALL (LAYS / DORITOS)', code: 'SNACK WALL', x: 30, y: 55, w: 580, h: 70, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.20)' },
              { name: 'COOKIES & BISCUITS RACK 1 (OREO / RITZ)', code: 'RACK B1', x: 40, y: 160, w: 260, h: 110, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
              { name: 'CHOCOLATES & CANDY BAR RACK 2', code: 'RACK B2', x: 340, y: 160, w: 260, h: 110, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' },
              { name: 'SNACK COMBO PROMOTIONAL ISLAND DISPLAY', code: 'ISLAND B', x: 40, y: 305, w: 560, h: 110, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
            ];
          } else if (currentCam === 4) {
            // Zone 4 Layout: Checkout Lanes
            zoneTitle = 'ZONE 4 LAYOUT: CHECKOUT LANES & CASHIER REGISTERS';
            layoutZones = [
              { name: 'EXPRESS POS REGISTER 1', code: 'POS 1', x: 40, y: 60, w: 160, h: 110, color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.20)' },
              { name: 'MAIN POS REGISTER 2', code: 'POS 2', x: 240, y: 60, w: 160, h: 110, color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.20)' },
              { name: 'MAIN POS REGISTER 3', code: 'POS 3', x: 440, y: 60, w: 160, h: 110, color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.20)' },
              { name: 'IMPULSE GRAB-AND-GO CANDY & MINTS RACKS', code: 'IMPULSE', x: 40, y: 200, w: 560, h: 80, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
              { name: 'QUEUE STANCHION BELTS & EXIT GATES', code: 'QUEUE', x: 40, y: 310, w: 560, h: 110, color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
            ];
          } else {
            // Master Store Integrated Layout
            layoutZones = [
              { name: 'MAIN ENTRANCE FOYER', code: 'ZONE 1', x: 25, y: 55, w: 180, h: 90, color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
              { name: 'BEVERAGE AISLE A (COKE/SODA)', code: 'ZONE 2', x: 25, y: 175, w: 260, h: 120, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)' },
              { name: 'SNACK AISLE B (LAYS/OREO)', code: 'ZONE 3', x: 310, y: 175, w: 300, h: 120, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' },
              { name: 'CHECKOUT LANES & REGISTERS', code: 'ZONE 4', x: 310, y: 325, w: 300, h: 110, color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)' },
            ];
          }

          layoutZones.forEach(z => {
            hCtx.fillStyle = z.bg;
            hCtx.fillRect(z.x, z.y, z.w, z.h);
            hCtx.strokeStyle = z.color;
            hCtx.lineWidth = 1.5;
            hCtx.strokeRect(z.x, z.y, z.w, z.h);

            // Zone Title Badge
            hCtx.fillStyle = z.color;
            hCtx.font = 'bold 9px monospace';
            hCtx.fillText(`[${z.code}] ${z.name}`, z.x + 8, z.y + 18);
          });

          // Draw Aisle Walkway Arrows
          hCtx.fillStyle = isDark ? '#64748b' : '#94a3b8';
          hCtx.font = 'bold 9px monospace';
          hCtx.fillText('🚶 SPATIAL TRAFFIC FLOW ➔', 45, 432);


          // 4. Draw Dwell Radial Thermal Heatmap Hotspot Overlay
          if (heatmapPointsRef.current.length > 0) {
            hCtx.save();
            hCtx.globalCompositeOperation = 'lighter';
            
            heatmapPointsRef.current.forEach(pt => {
              const grad = hCtx.createRadialGradient(pt.x, pt.y, 2, pt.x, pt.y, pt.radius || 35);
              grad.addColorStop(0.00, 'rgba(239, 68, 68, 0.60)');   // Core Red Hotspot
              grad.addColorStop(0.35, 'rgba(245, 158, 11, 0.40)');   // Amber Glow
              grad.addColorStop(0.65, 'rgba(16, 185, 129, 0.25)');   // Emerald Green
              grad.addColorStop(0.85, 'rgba(56, 189, 248, 0.12)');   // Cyan Edge
              grad.addColorStop(1.00, 'rgba(0, 0, 0, 0)');
              
              hCtx.fillStyle = grad;
              hCtx.beginPath();
              hCtx.arc(pt.x, pt.y, pt.radius || 35, 0, Math.PI * 2);
              hCtx.fill();
            });
            
            hCtx.restore();
          }

          // 5. Heatmap HUD Header
          hCtx.fillStyle = 'rgba(15, 23, 42, 0.88)';
          hCtx.fillRect(10, 10, hCanvas.width - 20, 32);
          hCtx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
          hCtx.lineWidth = 1;
          hCtx.strokeRect(10, 10, hCanvas.width - 20, 32);

          hCtx.fillStyle = '#ef4444';
          hCtx.beginPath(); hCtx.arc(26, 26, 5, 0, 2 * Math.PI); hCtx.fill();

          hCtx.fillStyle = '#ffffff';
          hCtx.font = 'bold 10px monospace';
          hCtx.fillText(`🗺️ [${zoneTitle}]`, 38, 29);


          hCtx.fillStyle = '#f59e0b';
          hCtx.font = 'bold 10px monospace';
          hCtx.fillText(`HOTSPOTS: ${heatmapPointsRef.current.length}`, hCanvas.width - 150, 29);

          // 6. Thermal Heatmap Intensity Legend Bar
          hCtx.fillStyle = 'rgba(15, 23, 42, 0.88)';
          hCtx.fillRect(10, hCanvas.height - 30, 270, 20);
          hCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          hCtx.strokeRect(10, hCanvas.height - 30, 270, 20);

          hCtx.fillStyle = '#94a3b8';
          hCtx.font = 'bold 9px monospace';
          hCtx.fillText('HEATMAP INTENSITY:', 18, hCanvas.height - 17);

          const gradBar = hCtx.createLinearGradient(140, 0, 270, 0);
          gradBar.addColorStop(0, '#38bdf8');
          gradBar.addColorStop(0.33, '#10b981');
          gradBar.addColorStop(0.66, '#f59e0b');
          gradBar.addColorStop(1, '#ef4444');
          hCtx.fillStyle = gradBar;
          hCtx.fillRect(140, hCanvas.height - 24, 130, 8);

          // 7. Draw Dynamic Shelves/Zones Overlay on Heatmap Canvas
          const currentCamId = Number(selectedCameraId);
          shelvesList.forEach((shelf) => {
            try {
              if (!shelf.coordinates_json) return;

              // Camera-aware zone filtering
              const isFoyer = shelf.zone_name.includes("Foyer");
              const isCheckout = shelf.zone_name.includes("Checkout");
              const isBev = shelf.name.includes("Beverages") || shelf.name.includes("Shelf 1");
              const isSnack = shelf.name.includes("Snacks") || shelf.name.includes("Shelf 2");

              if (currentCamId === 1 && !isFoyer) return;
              if (currentCamId === 2 && !isBev) return;
              if (currentCamId === 3 && !isSnack) return;
              if (currentCamId === 4 && !isCheckout) return;

              const coords = JSON.parse(shelf.coordinates_json);
              const rx = (coords.x / 100) * hCanvas.width;
              const ry = (coords.y / 100) * hCanvas.height;
              const rw = (coords.w / 100) * hCanvas.width;
              const rh = (coords.h / 100) * hCanvas.height;
              
              hCtx.fillStyle = isFoyer ? 'rgba(16, 185, 129, 0.12)' : 
                              isCheckout ? 'rgba(244, 63, 94, 0.12)' : 
                              'rgba(99, 102, 241, 0.12)';
                              
              hCtx.strokeStyle = isFoyer ? '#10b981' : 
                                isCheckout ? '#f43f5e' : 
                                '#6366f1';
                                
              hCtx.lineWidth = 1.5;
              hCtx.fillRect(rx, ry, rw, rh);
              hCtx.strokeRect(rx, ry, rw, rh);

              hCtx.fillStyle = isFoyer ? '#10b981' : 
                              isCheckout ? '#f43f5e' : 
                              '#a5b4fc';
              hCtx.font = 'bold 9px monospace';
              hCtx.fillText(`ZONE: ${shelf.name.toUpperCase()}`, rx + 6, ry + 12);
            } catch (err) {
              // ignore parsing error
            }
          });
        }
      }

      // 6. Draw YOLOv8 Multi-Object Tracking Visualization (Bounding Boxes, Color-Coded Trails, Label Pills, Gaze Rays)
      const detectedPeople = shoppers.filter((s: any) => !s.object_type || s.object_type === 'person' || s.object_type === 'cashier');
      
      // YOLOv8 Palette for Per-Track Color Consistency (matching Ultralytics / OpenCV ByteTrack aesthetic)
      const yoloPalette = [
        '#2563eb', // Blue (YOLO default)
        '#dc2626', // Bright Red
        '#0891b2', // Cyan
        '#9333ea', // Purple
        '#d97706', // Amber / Yellow-Orange
        '#16a34a', // Emerald Green
        '#db2777', // Magenta / Pink
        '#0284c7', // Sky Blue
      ];

      detectedPeople.forEach((s: any, pIdx: number) => {
        const id = s.shopper_id || (pIdx + 1);
        const x = (s.x / 100) * canvas.width;
        const y = (s.y / 100) * canvas.height;
        const gazeX = s.gaze_x !== null ? (s.gaze_x / 100) * canvas.width : null;
        const gazeY = s.gaze_y !== null ? (s.gaze_y / 100) * canvas.height : null;

        // Assign distinct color based on Track ID (matching YOLOv8 / ByteTrack color mapping)
        const trackColor = yoloPalette[Math.abs(id - 1) % yoloPalette.length];

        // Breadcrumbs history (motion trajectory)
        if (!shopperTrailsRef.current[id]) {
          shopperTrailsRef.current[id] = [];
        }
        const trail = shopperTrailsRef.current[id];
        const lastPt = trail.length > 0 ? trail[trail.length - 1] : null;
        if (!lastPt || Math.abs(lastPt.x - x) > 0.5 || Math.abs(lastPt.y - y) > 0.5) {
          trail.push({ x, y });
          if (trail.length > 25) {
            trail.shift();
          }
        }

        // 1. Draw Color-Coded Motion Trajectory Path (matching YOLOv8 track line)
        if (showTrailsRef.current && trail.length > 1) {
          ctx.beginPath();
          ctx.strokeStyle = trackColor;
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          trail.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          });
          ctx.stroke();
        }

        // 2. Centroid Position Dot
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = trackColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 3. Gaze / Direction Vector Line
        if (showGazeRaysRef.current && gazeX !== null && gazeY !== null) {
          ctx.beginPath();
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.moveTo(x, y - 25); // Eye height origin
          ctx.lineTo(gazeX, gazeY);
          ctx.stroke();
          ctx.setLineDash([]); 

          // Crosshair target dot
          ctx.beginPath();
          ctx.arc(gazeX, gazeY, 4, 0, 2 * Math.PI);
          ctx.fillStyle = '#f59e0b';
          ctx.fill();
        }

        // 4. Draw Authentic YOLOv8 Bounding Box & Solid Top-Left Label Pill
        const objType = s.object_type || 'person';
        const labelText = s.label || (objType === 'cashier' ? 'Cashier' : 'person');
        const confVal = Math.round((s.confidence || 0.96) * 100);

        let bW = 54;
        let bH = 92;
        let boxX = x - bW / 2;
        let boxY = y - bH * 0.75;

        if (showBBoxesRef.current) {
          // Bounding Box Semi-transparent Background Fill
          ctx.fillStyle = `${trackColor}1a`; // ~10% opacity fill
          ctx.fillRect(boxX, boxY, bW, bH);

          // Bounding Box Frame Line
          ctx.strokeStyle = trackColor;
          ctx.lineWidth = 2.0;
          ctx.strokeRect(boxX, boxY, bW, bH);

          // Authentic YOLOv8 Solid Label Tag (e.g. "person #1 96%")
          const pillText = `${labelText.toLowerCase()} #${id} ${confVal}%`;
          ctx.font = 'bold 11px sans-serif';
          const textMetrics = ctx.measureText(pillText);
          const pillW = textMetrics.width + 10;
          const pillH = 18;
          const pillX = boxX;
          const pillY = boxY - pillH;

          // Draw Solid Color Tag Box
          ctx.fillStyle = trackColor;
          ctx.fillRect(pillX, pillY, pillW, pillH);

          // White Text Inside Tag
          ctx.fillStyle = '#ffffff';
          ctx.fillText(pillText, pillX + 5, pillY + 13);
        }

        // 5. Retail Intent Sub-Badge (below bounding box)
        const targetStr = s.gaze_target || '';
        if (targetStr && showBBoxesRef.current) {
          let intentText = `🔍 ${targetStr}`;
          if (targetStr.includes('Register') || targetStr.includes('Checkout')) intentText = '💳 PAYING';
          else if (targetStr.includes('Foyer')) intentText = '🚪 ENTERING';
          
          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          const intentWidth = ctx.measureText(intentText).width + 8;
          ctx.fillRect(boxX, boxY + bH + 2, intentWidth, 14);
          ctx.fillStyle = '#38bdf8';
          ctx.fillText(intentText, boxX + 4, boxY + bH + 12);
        }
      });
      
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [activeTab, selectedCameraId, theme, shelvesList, useVideoFeed]);


  // Render role badges helper
  const renderRoleBadge = (role: string) => {
    switch (role) {
      case 'Administrator':
        return <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded-full uppercase tracking-wider">Admin</span>;
      case 'Store Manager':
        return <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-500 text-[10px] font-bold rounded-full uppercase tracking-wider">Manager</span>;
      case 'Retail Analyst':
        return <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-full uppercase tracking-wider">Analyst</span>;
      case 'Marketing Manager':
        return <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wider">Marketing</span>;
      default:
        return null;
    }
  };

  const attentionData = [
    { name: 'Beverages', dwellTime: 120, interaction: 85, conversion: 60 },
    { name: 'Snacks', dwellTime: 240, interaction: 180, conversion: 45 },
    { name: 'Produce', dwellTime: 95, interaction: 50, conversion: 80 },
    { name: 'Apparel', dwellTime: 180, interaction: 70, conversion: 30 },
    { name: 'Endcap', dwellTime: 310, interaction: 240, conversion: 55 },
  ];

  const scoreData = [
    { name: 'Oreo Cookies 300g', score: 94, dwellTime: 285, conversion: 78 },
    { name: 'Coke 500ml', score: 85, dwellTime: 145, conversion: 62 },
    { name: 'Lays Chips Family Pack', score: 72, dwellTime: 210, conversion: 48 },
    { name: 'Milk 1L Fresh', score: 65, dwellTime: 110, conversion: 82 },
    { name: 'Shampoo A 400ml', score: 48, dwellTime: 85, conversion: 25 },
  ];

  // Helper check tab visibility based on roles
  const canAccessSetup = user?.role === 'Store Manager' || user?.role === 'Administrator';
  const canAccessLive = user?.role !== 'Marketing Manager';
  const canAccessAnalytics = user?.role !== 'Store Manager';
  const canAccessSalesDataset = user?.role === 'Marketing Manager' || user?.role === 'Retail Analyst';

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-200">
      
      {/* 1. Sidebar Navigation */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 transition-colors duration-200">
        <div>
          {/* Logo / Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Store size={18} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white block">{roleView || 'Store Manager'}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Dashboard</span>
            </div>
          </div>

          {/* User profile */}
          <div className="p-4 bg-slate-100/50 dark:bg-slate-950/45 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 transition-colors duration-200">
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border border-slate-300 dark:border-slate-700">
              <Users size={16} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 block truncate">
                {user?.full_name || (roleView === 'Retail Analyst' ? 'Analyst Sarah' : roleView === 'Marketing Manager' ? 'Marketer Alice' : roleView === 'Administrator' ? 'Super Admin' : 'John Manager')}
              </span>
              <div className="mt-1 flex items-center gap-1.5">
                {renderRoleBadge(roleView || user?.role || 'Store Manager')}
              </div>
            </div>
          </div>

          {/* Nav Links - Role Scoped Navigation */}
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)]">
            {roleView === 'Retail Analyst' ? (
              <>
                <button
                  onClick={() => { setAnalystSection('overview'); setActiveTab('overview'); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'overview' && analystSection === 'overview' 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 font-bold' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <LayoutDashboard size={15} />
                  Overview
                </button>

                <button
                  onClick={() => { setAnalystSection('journey'); setActiveTab('overview'); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'overview' && analystSection === 'journey' 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 font-bold' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Activity size={15} />
                  Consumer Journey Analysis
                </button>

                <button
                  onClick={() => { setAnalystSection('attention'); setActiveTab('overview'); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'overview' && analystSection === 'attention' 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 font-bold' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Eye size={15} />
                  Attention Analytics
                </button>

                <button
                  onClick={() => { setAnalystSection('segmentation'); setActiveTab('overview'); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'overview' && analystSection === 'segmentation' 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 font-bold' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Users size={15} />
                  Customer Segmentation
                </button>

                <button
                  onClick={() => { setAnalystSection('shopping'); setActiveTab('overview'); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'overview' && analystSection === 'shopping' 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 font-bold' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <ShoppingBag size={15} />
                  Shopping Behaviour Analysis
                </button>

                <button
                  onClick={() => { setAnalystSection('dwell'); setActiveTab('overview'); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'overview' && analystSection === 'dwell' 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 font-bold' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Clock size={15} />
                  Dwell Time Analysis
                </button>

                <button
                  onClick={() => { setAnalystSection('traffic'); setActiveTab('overview'); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'overview' && analystSection === 'traffic' 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 font-bold' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Flame size={15} />
                  Traffic Flow Analysis
                </button>

                <button
                  onClick={() => { setAnalystSection('zone'); setActiveTab('overview'); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'overview' && analystSection === 'zone' 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 font-bold' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Layers size={15} />
                  Zone Performance
                </button>

                <button
                  onClick={() => { setAnalystSection('product'); setActiveTab('overview'); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'overview' && analystSection === 'product' 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 font-bold' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Package size={15} />
                  Product Analytics
                </button>

                <button
                  onClick={() => { setAnalystSection('category'); setActiveTab('overview'); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'overview' && analystSection === 'category' 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 font-bold' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Tag size={15} />
                  Category Performance
                </button>

                <button
                  onClick={() => { setAnalystSection('insights'); setActiveTab('overview'); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'overview' && analystSection === 'insights' 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 font-bold' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Sparkles size={15} />
                  AI Insights
                </button>

                <button
                  onClick={() => { setAnalystSection('reports'); setActiveTab('reports'); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'reports' 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 font-bold' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <FileText size={15} />
                  Reports
                </button>

                <button
                  onClick={() => { setAnalystSection('export'); setActiveTab('overview'); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'overview' && analystSection === 'export' 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 font-bold' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Download size={15} />
                  Export Data
                </button>

                <button
                  onClick={() => { setAnalystSection('settings'); setActiveTab('settings'); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'settings' 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 font-bold' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Settings size={15} />
                  Settings
                </button>
              </>
            ) : roleView === 'Marketing Manager' ? (
              <>
                <button
                  onClick={() => { setMarketingSection('overview'); setActiveTab('overview'); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'overview' && marketingSection === 'overview' 
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 font-bold' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Home size={15} />
                  Overview
                </button>

                <button
                  onClick={() => { setMarketingSection('campaign'); setActiveTab('overview'); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'overview' && marketingSection === 'campaign' 
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 font-bold' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Megaphone size={15} />
                  Campaign Performance
                </button>

                <button
                  onClick={() => { setMarketingSection('promotion'); setActiveTab('overview'); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'overview' && marketingSection === 'promotion' 
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 font-bold' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Tag size={15} />
                  Promotion Effectiveness
                </button>

                <button
                  onClick={() => { setMarketingSection('visibility'); setActiveTab('overview'); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'overview' && marketingSection === 'visibility' 
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 font-bold' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Eye size={15} />
                  Product Visibility
                </button>

                <button
                  onClick={() => { setMarketingSection('attractiveness'); setActiveTab('overview'); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'overview' && marketingSection === 'attractiveness' 
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 font-bold' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Star size={15} />
                  Product Attractiveness
                </button>

                {/* ANALYTICS SECTION */}
                <div className="pt-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1">ANALYTICS</p>
                  <button
                    onClick={() => { setMarketingSection('engagement'); setActiveTab('overview'); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      activeTab === 'overview' && marketingSection === 'engagement' 
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 font-bold' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Users size={15} />
                    Customer Engagement
                  </button>

                  <button
                    onClick={() => { setMarketingSection('conversion'); setActiveTab('overview'); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      activeTab === 'overview' && marketingSection === 'conversion' 
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 font-bold' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <TrendingUp size={15} />
                    Conversion Analysis
                  </button>

                  <button
                    onClick={() => { setMarketingSection('attention'); setActiveTab('overview'); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      activeTab === 'overview' && marketingSection === 'attention' 
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 font-bold' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Brain size={15} />
                    Attention Insights
                  </button>

                  <button
                    onClick={() => { setMarketingSection('traffic'); setActiveTab('overview'); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      activeTab === 'overview' && marketingSection === 'traffic' 
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 font-bold' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Footprints size={15} />
                    Traffic Insights
                  </button>
                </div>

                {/* RECOMMENDATIONS SECTION */}
                <div className="pt-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1">RECOMMENDATIONS</p>
                  <button
                    onClick={() => { setMarketingSection('recommendations'); setActiveTab('overview'); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      activeTab === 'overview' && marketingSection === 'recommendations' 
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 font-bold' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Lightbulb size={15} />
                    Marketing Recommendations
                  </button>

                  <button
                    onClick={() => { setMarketingSection('action'); setActiveTab('overview'); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      activeTab === 'overview' && marketingSection === 'action' 
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 font-bold' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <ClipboardCheck size={15} />
                    Action Center
                  </button>
                </div>

                {/* REPORTS & SETTINGS */}
                <div className="pt-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1">REPORTS</p>
                  <button
                    onClick={() => { setMarketingSection('campaign_reports'); setActiveTab('reports'); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      activeTab === 'reports' 
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 font-bold' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <FileText size={15} />
                    Campaign Reports
                  </button>

                  <button
                    onClick={() => { setMarketingSection('export_reports'); setActiveTab('overview'); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      activeTab === 'overview' && marketingSection === 'export_reports' 
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 font-bold' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <FileDown size={15} />
                    Export Reports
                  </button>

                  <button
                    onClick={() => { setMarketingSection('settings'); setActiveTab('settings'); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      activeTab === 'settings' 
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 font-bold' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Settings size={15} />
                    Settings
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'overview' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <LayoutDashboard size={16} />
                  Overview
                </button>

                <button
                  onClick={() => setActiveTab('cameras')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'cameras' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Video size={16} />
                  Cameras
                </button>

                <button
                  onClick={() => setActiveTab('visitors')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'visitors' || activeTab === 'analytics' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Users size={16} />
                  Visitors
                </button>

                <button
                  onClick={() => setActiveTab('shelves')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'shelves' || activeTab === 'stores' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Layers size={16} />
                  Shelves
                </button>

                <button
                  onClick={() => setActiveTab('products')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'products' || activeTab === 'sales'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Package size={16} />
                  Products
                </button>

                <button
                  onClick={() => setActiveTab('alerts')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'alerts' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <AlertTriangle size={16} />
                  Alerts
                </button>

                <button
                  onClick={() => setActiveTab('reports')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'reports' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <FileText size={16} />
                  Reports
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'settings' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Settings size={16} />
                  Settings
                </button>

                {user?.role === 'Administrator' && (
                  <button
                    onClick={() => setActiveTab('users')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      activeTab === 'users' 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <UserCheck size={16} />
                    User Profiles
                  </button>
                )}
              </>
            )}
          </nav>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all duration-150 cursor-pointer"
          >
            <LogOut size={16} />
            Logout Workspace
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-100 dark:bg-slate-950 overflow-y-auto relative transition-colors duration-200">
        
        {/* Banner updates */}
        {statusMessage && (
          <div className={`absolute top-4 right-4 z-50 p-4 rounded-xl border flex items-center gap-3 shadow-lg transition-all duration-300 animate-slide-in ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="text-xs font-semibold">{statusMessage.text}</span>
          </div>
        )}

        {/* Unified Main Application Header Bar */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 bg-white dark:bg-slate-900/90 backdrop-blur-md shrink-0 transition-colors duration-200 z-20 gap-3 overflow-hidden">
          
          {/* Left: Active Page Title / Breadcrumb */}
          <div className="flex items-center gap-4 shrink-0">
            <h2 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider whitespace-nowrap">
              {activeTab === 'overview' && 'Overview Dashboard'}
              {activeTab === 'cameras' && 'Live Computer Vision Feeds'}
              {activeTab === 'visitors' && 'Visitor & Footfall Analytics'}
              {activeTab === 'shelves' && 'Store & Shelf Configuration'}
              {activeTab === 'products' && 'Product Sales & Interaction Analytics'}
              {activeTab === 'alerts' && 'Real-Time Operational Alerts'}
              {activeTab === 'reports' && 'Retail Performance Reports'}
              {activeTab === 'settings' && 'Store Settings & Configuration'}
              {activeTab === 'stores' && 'Store & Shelf Setup'}
              {activeTab === 'analytics' && 'Attractiveness & Behavioral Analytics'}
              {activeTab === 'users' && 'User Management System'}
            </h2>
          </div>
          
          {/* Right: Controls, Filters, Bell, Profile & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink min-w-0">
            
            {/* Role View Switcher - Accessible ONLY by Administrator */}
            {user?.role === 'Administrator' ? (
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 px-2.5 py-1.5 rounded-xl shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden lg:inline">Role View:</span>
                <select
                  value={roleView}
                  onChange={(e) => {
                    setRoleView(e.target.value);
                    triggerStatus(`Dashboard view switched to ${e.target.value}`, 'success');
                  }}
                  className="bg-transparent text-xs font-bold text-indigo-600 dark:text-indigo-400 outline-none cursor-pointer"
                >
                  <option value="Store Manager" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Store Manager</option>
                  <option value="Retail Analyst" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Retail Analyst</option>
                  <option value="Marketing Manager" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Marketing Manager</option>
                  <option value="Administrator" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Administrator</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 px-2.5 py-1.5 rounded-xl shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden lg:inline">Role View:</span>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{user?.role || roleView}</span>
              </div>
            )}

            {/* Store Selector */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 px-2.5 py-1.5 rounded-xl shrink-0 max-w-[180px] xl:max-w-[260px]">
              <Store size={14} className="text-blue-500 shrink-0" />
              <select 
                value={selectedStoreId} 
                onChange={(e) => setSelectedStoreId(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer truncate w-full"
              >
                {storesList.length > 0 ? (
                  storesList.map(st => (
                    <option key={st.id} value={st.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                      {st.name}
                    </option>
                  ))
                ) : (
                  <option value={1} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Walmart Store 1 (Flagship)</option>
                )}
              </select>
            </div>

            {/* Date Select Dropdown */}
            <div className="hidden xl:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 px-2.5 py-1.5 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-medium shrink-0">
              <Calendar size={13} className="text-blue-500" />
              <select 
                value={headerDate} 
                onChange={(e) => {
                  setHeaderDate(e.target.value);
                  triggerStatus(`Date filter set to ${e.target.value}`, 'success');
                }}
                className="bg-transparent outline-none text-xs font-semibold text-slate-800 dark:text-white cursor-pointer"
              >
                <option value="21 May 2025" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">21 May 2025</option>
                <option value="20 May 2025" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">20 May 2025</option>
                <option value="19 May 2025" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">19 May 2025</option>
                <option value="Today (Live)" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Today (Live)</option>
              </select>
            </div>

            {/* Time Filter Select Dropdown */}
            <div className="hidden 2xl:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 px-2.5 py-1.5 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-medium shrink-0">
              <Clock size={13} className="text-blue-500" />
              <select 
                value={headerTime} 
                onChange={(e) => {
                  setHeaderTime(e.target.value);
                  triggerStatus(`Time window set to ${e.target.value}`, 'success');
                }}
                className="bg-transparent outline-none text-xs font-semibold text-slate-800 dark:text-white cursor-pointer"
              >
                <option value="09:00 AM - 09:00 PM" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">09:00 AM - 09:00 PM</option>
                <option value="08:00 AM - 12:00 PM" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">08:00 AM - 12:00 PM</option>
                <option value="12:00 PM - 06:00 PM" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">12:00 PM - 06:00 PM</option>
                <option value="Live Stream" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Live Stream</option>
              </select>
            </div>

            {/* Notifications Bell */}
            <button 
              onClick={() => setShowNotifModal(!showNotifModal)}
              className="relative bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 p-2 rounded-xl text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
              title="View 12 Operational Notifications"
            >
              <Bell size={15} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white dark:border-slate-900">
                12
              </span>
            </button>

            {/* User Profile Card */}
            <button 
              onClick={() => setShowProfileModal(!showProfileModal)}
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700/90 border border-slate-200 dark:border-slate-700/80 px-2.5 py-1 rounded-xl transition-all cursor-pointer shrink-0"
              title="Click to view profile & account settings"
            >
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center font-bold text-[10px] text-white shadow shrink-0">
                {(user?.full_name || (roleView === 'Retail Analyst' ? 'Analyst Sarah' : roleView === 'Marketing Manager' ? 'Marketer Alice' : roleView === 'Administrator' ? 'Super Admin' : 'John Manager')).split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-800 dark:text-white leading-none whitespace-nowrap">
                  {user?.full_name || (roleView === 'Retail Analyst' ? 'Analyst Sarah' : roleView === 'Marketing Manager' ? 'Marketer Alice' : roleView === 'Administrator' ? 'Super Admin' : 'John Manager')}
                </p>
                <p className="text-[9px] text-slate-400 leading-tight whitespace-nowrap">{roleView || user?.role || 'Store Manager'}</p>
              </div>
            </button>

            {/* Filters Button */}
            <button 
              onClick={() => setShowFilterModal(!showFilterModal)}
              className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shrink-0"
              title="Toggle Filters"
            >
              <Filter size={13} className="text-blue-500" />
              <span className="hidden md:inline">Filters</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 transition-all duration-150 cursor-pointer shadow-sm shrink-0"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>

        </header>

        {/* 🔔 Interactive Notifications Modal Drawer */}
        {showNotifModal && (
          <div className="absolute top-20 right-6 z-50 w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Bell className="w-4 h-4 text-red-500" />
                Store Operations Alerts (12 Active)
              </h4>
              <button onClick={() => setShowNotifModal(false)} className="text-xs font-bold text-slate-400 hover:text-slate-200">✕</button>
            </div>
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 text-xs">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-slate-800 dark:text-slate-200">
                <div className="flex justify-between font-bold text-red-500">
                  <span>High Crowd Surge</span>
                  <span>10:24 AM</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Aisle B (Beverages) currently has 14 active shoppers.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-slate-800 dark:text-slate-200">
                <div className="flex justify-between font-bold text-amber-500">
                  <span>Shelf C Attention Alert</span>
                  <span>10:18 AM</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Confectionery shelf engagement dropped below 40% threshold.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-slate-800 dark:text-slate-200">
                <div className="flex justify-between font-bold text-blue-500">
                  <span>Checkout Queue Alert</span>
                  <span>10:10 AM</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">8 customers waiting in queue at Lane 2.</p>
              </div>
            </div>
          </div>
        )}

        {/* 🎛️ Interactive Filters Modal Drawer */}
        {showFilterModal && (
          <div className="absolute top-20 right-6 z-50 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-500" />
                Filter Dashboard Data
              </h4>
              <button onClick={() => setShowFilterModal(false)} className="text-xs font-bold text-slate-400 hover:text-slate-200">✕</button>
            </div>
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Zone Filter</label>
                <select className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-white">
                  <option>All Store Zones</option>
                  <option>Aisle A (Beverages)</option>
                  <option>Aisle B (Snacks)</option>
                  <option>Checkout Lanes</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Alert Severity</label>
                <select className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-white">
                  <option>All Severities</option>
                  <option>High Severity Only</option>
                  <option>Medium Severity Only</option>
                </select>
              </div>
              <button 
                onClick={() => {
                  setShowFilterModal(false);
                  triggerStatus('Dashboard filters applied!', 'success');
                }}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* 👤 Interactive User Profile & Account Drawer */}
        {showProfileModal && (
          <div className="absolute top-20 right-6 z-50 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                User Session & Account
              </h4>
              <button onClick={() => setShowProfileModal(false)} className="text-xs font-bold text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm text-white shadow">
                  {(user?.full_name || (roleView === 'Retail Analyst' ? 'Analyst Sarah' : roleView === 'Marketing Manager' ? 'Marketer Alice' : roleView === 'Administrator' ? 'Super Admin' : 'John Manager')).split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">
                    {user?.full_name || (roleView === 'Retail Analyst' ? 'Analyst Sarah' : roleView === 'Marketing Manager' ? 'Marketer Alice' : roleView === 'Administrator' ? 'Super Admin' : 'John Manager')}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {user?.email || (roleView === 'Retail Analyst' ? 'analyst@attention.com' : roleView === 'Marketing Manager' ? 'marketing@attention.com' : roleView === 'Administrator' ? 'admin@attention.com' : 'manager@attention.com')}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-slate-600 dark:text-slate-300 font-medium text-[11px]">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span>Current Role:</span>
                  <span className="font-bold text-indigo-400">{roleView || 'Store Manager'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span>Assigned Scope:</span>
                  <span className="font-bold text-slate-900 dark:text-white">Walmart Store 1 (Flagship)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span>Role Scope:</span>
                  <span className="font-bold text-emerald-500">
                    {roleView === 'Retail Analyst' ? 'Spatial Analytics & Gaze' : roleView === 'Marketing Manager' ? 'Product Interactions' : roleView === 'Administrator' ? 'Full System Root' : 'Store Ops & Feeds'}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => {
                  setShowProfileModal(false);
                  logout();
                }}
                className="w-full py-2 bg-red-600/90 hover:bg-red-600 text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut size={14} />
                <span>Logout Workspace Session</span>
              </button>
            </div>
          </div>
        )}

        {/* Body content */}
        <div className="p-8 flex-1">
          
          {/* TAB 1: OVERVIEW & ROLE DASHBOARDS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {roleView === 'Store Manager' && (
                <StoreManagerDashboard
                  storesList={storesList}
                  camerasList={camerasList}
                  selectedStoreId={selectedStoreId}
                  setSelectedStoreId={(id) => setSelectedStoreId(id)}
                  storeOccupancy={storeOccupancy}
                  setActiveTab={setActiveTab}
                  salesOverview={salesOverview}
                  deptSales={deptSales}
                  storeSalesData={storeSalesData}
                  datasetInfo={datasetInfo}
                />
              )}

              {roleView === 'Retail Analyst' && (
                <RetailAnalystDashboard 
                  activeSubTab={analystSection} 
                  setActiveSubTab={setAnalystSection} 
                  salesOverview={salesOverview}
                  deptSales={deptSales}
                  storeSalesData={storeSalesData}
                  datasetInfo={datasetInfo}
                />
              )}

              {roleView === 'Marketing Manager' && (
                <MarketingManagerDashboard 
                  activeSubTab={marketingSection}
                  setActiveSubTab={setMarketingSection}
                  salesOverview={salesOverview}
                  deptSales={deptSales}
                  storeSalesData={storeSalesData}
                  datasetInfo={datasetInfo}
                />
              )}

              {roleView === 'Administrator' && (
                <AdministratorDashboard
                  usersList={usersList}
                  camerasList={camerasList}
                  storesList={storesList}
                  token={token}
                  backendUrl={backendUrl}
                  fetchUsers={fetchUsers}
                  triggerStatus={triggerStatus}
                />
              )}
            </div>
          )}


          {/* TAB 2: STORE & SHELF CONFIGURATION */}
          {(activeTab === 'stores' || activeTab === 'shelves') && (
            <StoreShelfConfig
              token={token}
              backendUrl={backendUrl}
              storesList={storesList}
              setStoresList={setStoresList}
              selectedStoreId={selectedStoreId}
              setSelectedStoreId={setSelectedStoreId}
              camerasList={camerasList}
              fetchCameras={fetchCameras}
              shelvesList={shelvesList}
              fetchShelves={fetchShelves}
              fetchStores={fetchStores}
              triggerStatus={triggerStatus}
            />
          )}

          {/* TAB: STORE SETTINGS & AI CONFIGURATION */}
          {activeTab === 'settings' && (
            <StoreSettings />
          )}

          {/* TAB 3: LIVE CAMERA TELEMETRY & SIDE-BY-SIDE VIEWPORTS */}
          {activeTab === 'cameras' && canAccessLive && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Top Control Bar */}
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4 transition-colors duration-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {wsConnected ? 'LIVE STREAM CONNECTED' : 'STREAM DISCONNECTED'}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Active camera feed:</label>
                    <select
                      value={selectedCameraId}
                      onChange={(e) => setSelectedCameraId(e.target.value ? Number(e.target.value) : '')}
                      className="pl-3 pr-8 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-indigo-600 dark:text-indigo-400 font-bold outline-none cursor-pointer"
                    >
                      <option value="">-- Choose Camera --</option>
                      {Array.from(new Map((camerasList && camerasList.length > 0 ? camerasList : [
                        { id: 1, name: 'Camera 1: Entrance Foyer' },
                        { id: 2, name: 'Camera 2: Aisle A (Snacks & Drinks)' },
                        { id: 3, name: 'Camera 3: Aisle B (Groceries)' },
                        { id: 4, name: 'Camera 4: Aisle C (Personal Care)' },
                        { id: 5, name: 'Camera 5: Aisle D (Household)' },
                        { id: 6, name: 'Camera 6: Promotion Area' },
                        { id: 7, name: 'Camera 7: Checkout Counter' },
                        { id: 8, name: 'Camera 8: Main Exit' },
                      ]).map((c: any) => [c.name || String(c.id), c])).values()).slice(0, 8).map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => setUseVideoFeed(!useVideoFeed)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      useVideoFeed 
                        ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/20' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Video size={13} />
                    <span>{useVideoFeed ? 'MP4 Video Stream: ON' : 'Snapshot Feed: ON'}</span>

                  </button>

                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl cursor-pointer transition-all">
                    <Upload size={13} />
                    <span>Upload Custom MP4 Video</span>
                    <input type="file" accept="video/mp4,video/webm" onChange={handleVideoUpload} className="hidden" />
                  </label>

                  {customVideoUrl && (
                    <button 
                      onClick={() => { setCustomVideoUrl(null); customVideoRef.current = null; }}
                      className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                    >
                      Reset Video
                    </button>
                  )}

                  <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-xl font-mono font-bold animate-pulse">
                    2 FPS SYNCHRONIZED
                  </span>
                </div>
              </div>


              {/* Queue Bottleneck Warning */}
              {camerasList.find(c => c.id === selectedCameraId)?.name.includes("Checkout") && currentQueueLength >= 5 && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-2xl flex items-center gap-3 animate-pulse">
                  <AlertCircle size={18} />
                  <span><strong>Queue Bottleneck Alert:</strong> Checkout lanes currently have {currentQueueLength} shoppers waiting. Consider opening additional registers!</span>
                </div>
              )}

              {/* Top Side-by-Side Grid: Left (Clean Video Feed) & Right (Live Information & Metrics Panel) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT VIEWPORT (Span 7 Cols): OpenCV Person Detection & Video Feed */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-3 shadow-sm flex flex-col justify-between">
                  <div className="flex flex-wrap items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/80 pb-3 gap-2">
                    <span className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-indigo-500" />
                      OpenCV Computer Vision & Person Detection Feed
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => setShowBBoxes(!showBBoxes)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                          showBBoxes 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        📦 BBoxes {showBBoxes ? 'ON' : 'OFF'}
                      </button>

                      <button
                        onClick={() => setShowGazeRays(!showGazeRays)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                          showGazeRays 
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        👁️ Gaze {showGazeRays ? 'ON' : 'OFF'}
                      </button>

                      <button
                        onClick={() => setShowTrails(!showTrails)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                          showTrails 
                            ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        👣 Trails {showTrails ? 'ON' : 'OFF'}
                      </button>

                      <button
                        onClick={() => setIsStreamPaused(!isStreamPaused)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                          isStreamPaused 
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse' 
                            : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                        }`}
                      >
                        {isStreamPaused ? '⏸️ FROZEN' : '▶️ LIVE'}
                      </button>
                    </div>
                  </div>

                  <div className="relative border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 aspect-[4/3] flex items-center justify-center transition-colors duration-200">
                    <canvas
                      ref={canvasRef}
                      width={640}
                      height={480}
                      className="w-full h-full object-contain"
                    />
                    
                    {!selectedCameraId && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/90 dark:bg-slate-950/90 text-center p-6 transition-colors duration-200">
                        <Video size={36} className="text-slate-400 dark:text-slate-600 mb-3 animate-bounce" />
                        <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">No Camera Selected</h4>
                        <p className="text-slate-400 dark:text-slate-500 text-[11px] max-w-sm mt-1">Choose a device feed from the dropdown to start live telemetry stream.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT VIEWPORT (Span 5 Cols): Live Information & Metrics Telemetry Panel */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                    <span className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-500" />
                      Live Customer Telemetry & AI Information
                    </span>
                    <span className="text-[10px] text-emerald-500 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      YOLOv8 Active
                    </span>
                  </div>

                  {/* 5 Real-Time KPI Stats Cards (Matching reference layout) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Frame Rate</p>
                      <p className="text-lg font-bold text-sky-500 font-mono mt-0.5">24 fps</p>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-sky-500 h-full w-[80%]" />
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Dwell Time</p>
                      <p className="text-lg font-bold text-emerald-500 font-mono mt-0.5">4.1s</p>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[65%]" />
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">People Detected</p>
                      <p className="text-lg font-bold text-indigo-500 font-mono mt-0.5">3 Persons</p>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-indigo-500 h-full w-[90%]" />
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Customer Count</p>
                      <p className="text-lg font-bold text-amber-500 font-mono mt-0.5">86</p>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-amber-500 h-full w-[75%]" />
                      </div>
                    </div>
                  </div>

                  {/* Tracked Shoppers Details List (Dynamic Live State) */}
                  <div className="space-y-2 flex-1 overflow-y-auto max-h-[220px] pr-1">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Live Customer Product Attention & Buying Intent</h5>
                    {currentShoppers.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Connecting live customer tracking feed...</p>
                    ) : (
                      currentShoppers.slice(0, 5).map((st: any) => {
                        const targetStr = st.gaze_target || 'Display Rack';
                        let intentText = '🚶 WALKING / BROWSING';
                        if (targetStr.includes('Coca-Cola')) intentText = '🛒 BUYING: Coca-Cola 500ml';
                        else if (targetStr.includes('Lays')) intentText = '🛒 BUYING: Lays Classic Chips';
                        else if (targetStr.includes('Oreo')) intentText = '🛒 BUYING: Oreo Cookies 120g';
                        else if (targetStr.includes('Register') || targetStr.includes('Checkout')) intentText = '💳 PAYING: Checkout Register';
                        else if (targetStr.includes('Foyer')) intentText = '🚪 MOVING: Main Store Foyer';
                        else if (targetStr) intentText = `🔍 EXAMINING: ${targetStr}`;

                        return (
                          <div key={st.shopper_id} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1 text-xs">
                            <div className="flex items-center justify-between font-bold">
                              <span className="text-slate-800 dark:text-white flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                {st.label || 'Customer'} #{st.shopper_id}
                              </span>
                              <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">{st.dwell_time || 12}s dwell</span>
                            </div>
                            <p className="text-[11px] text-indigo-500 dark:text-indigo-400 font-bold">👁️ Seeing: {st.gaze_target || 'Main Product Display Shelf'}</p>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold">{intentText}</p>
                            <p className="text-[10px] text-amber-500 font-bold font-mono">🎯 Cross-Sell Target: Coke + Chips (-15% OFF)</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

              {/* BOTTOM FULL-WIDTH PANEL: 2D Store Floorplan Layout & Spatial Dwell Heatmap Canvas */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <span className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-rose-500" />
                    2D Store Architectural Floorplan Layout & Spatial Heatmap
                  </span>
                  <span className="text-[10px] text-rose-500 font-mono bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                    2D Spatial Hotspots Accumulating
                  </span>
                </div>

                <div className="relative border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 aspect-[16/7] max-h-[420px] flex items-center justify-center transition-colors duration-200">
                  <canvas
                    ref={heatmapCanvasRef}
                    width={960}
                    height={420}
                    className="w-full h-full object-contain"
                  />

                  {!selectedCameraId && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/90 dark:bg-slate-950/90 text-center p-6 transition-colors duration-200">
                      <Flame size={36} className="text-slate-400 dark:text-slate-600 mb-3 animate-bounce" />
                      <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Heatmap Standby</h4>
                      <p className="text-slate-400 dark:text-slate-500 text-[11px] max-w-sm mt-1">Heatmap will accumulate dwell hotspots when stream is active.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Full-Width Telemetry Logs Panel */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col h-[260px] transition-colors duration-200 shadow-sm">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3 mb-3 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Activity size={16} className="text-indigo-500 dark:text-indigo-400" />
                    Live Detection & Telemetry Event Logs
                  </h4>
                  <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-mono font-bold">
                    Telemetry Ingestion Active
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[11px] text-slate-600 dark:text-slate-300 pr-1 select-none">
                  {telemetryLogs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center text-slate-400">
                      <span>Waiting for active telemetry feed connections...</span>
                    </div>
                  ) : (
                    telemetryLogs.map((log, idx) => (
                      <div key={idx} className={`p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 leading-relaxed ${
                        log.includes('[ERROR]') ? 'text-red-600 dark:text-red-400 border-red-500/20' :
                        log.includes('established') ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : ''
                      }`}>
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}



          {/* TAB: VISITORS ANALYTICS */}
          {activeTab === 'visitors' && (
            <VisitorsAnalytics />
          )}

          {/* TAB: OPERATIONAL REPORTS */}
          {activeTab === 'reports' && (
            <OperationalReports />
          )}

          {/* TAB 4: ATTENTION ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Avg Product Dwell Time</span>
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
                      <Clock size={18} />
                    </div>
                  </div>
                  <h4 className="text-3xl font-black text-slate-800 dark:text-white">189.5s</h4>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <ArrowUpRight size={14} /> +12.4% vs last week
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Top Engaged Zone</span>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                      <Flame size={18} />
                    </div>
                  </div>
                  <h4 className="text-3xl font-black text-slate-800 dark:text-white">Snacks Zone</h4>
                  <div className="text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                    <span className="px-2 py-0.5 bg-amber-500/10 rounded-full border border-amber-500/20 text-[9px] uppercase">Hotspot Rank #1</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Shelf Visibility Score</span>
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20">
                      <Eye size={18} />
                    </div>
                  </div>
                  <h4 className="text-3xl font-black text-slate-800 dark:text-white">84.2 / 100</h4>
                  <div className="text-[11px] text-purple-600 dark:text-purple-400 font-bold">
                    Grade A Weighted Index
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Conversion Efficiency</span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                      <TrendingUp size={18} />
                    </div>
                  </div>
                  <h4 className="text-3xl font-black text-emerald-600 dark:text-emerald-400">57.8%</h4>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                    High Purchase Intent
                  </div>
                </div>

              </div>

              {/* Charts Row */}
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* Bar Chart */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-colors duration-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <BarChart3 size={16} className="text-indigo-500" />
                        Attention Dwell Time vs Conversion Rates
                      </h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        Compare average shopper dwell time (seconds) against final shelf conversion (%)
                      </p>
                    </div>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={attentionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                        <XAxis dataKey="name" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={11} fontWeight={600} />
                        <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={11} fontWeight={600} />
                        <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0', borderRadius: 12, fontSize: 11, color: theme === 'dark' ? '#f8fafc' : '#0f172a', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                        <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
                        <Bar dataKey="dwellTime" name="Dwell Time (s)" fill="#6366f1" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="conversion" name="Conversion Rate (%)" fill="#10b981" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Line Chart */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-colors duration-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Sparkles size={16} className="text-purple-500" />
                        Product Attractiveness Score Distribution
                      </h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        AI Attractiveness Index (/100) calculated from gaze vectors & interaction rate
                      </p>
                    </div>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={scoreData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                        <XAxis dataKey="name" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={11} fontWeight={600} />
                        <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={11} fontWeight={600} domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0', borderRadius: 12, fontSize: 11, color: theme === 'dark' ? '#f8fafc' : '#0f172a', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                        <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
                        <Line type="monotone" dataKey="score" name="Attractiveness Score" stroke="#a855f7" strokeWidth={3.5} dot={{ r: 6, fill: '#a855f7' }} activeDot={{ r: 9 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Product Attractiveness & Dwell Ranking Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Award size={16} className="text-amber-500" />
                      Product Attractiveness & Engagement Leaderboard
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      Detailed breakdown of shopper gaze attention, dwell time, and conversion performance
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                        <th className="pb-3 pl-3">Rank & Product</th>
                        <th className="pb-3">Dwell Time (s)</th>
                        <th className="pb-3">Conversion Rate (%)</th>
                        <th className="pb-3">Attractiveness Score</th>
                        <th className="pb-3 text-right pr-3">Performance Tier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs font-bold">
                      {scoreData.map((prod, idx) => (
                        <tr key={idx} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950/30 transition-all duration-150">
                          <td className="py-4 pl-3">
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                                idx === 0 
                                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30' 
                                  : idx === 1 
                                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20' 
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                              }`}>
                                #{idx + 1}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white">{prod.name}</span>
                            </div>
                          </td>
                          <td className="py-4 font-mono text-indigo-600 dark:text-indigo-400">
                            {prod.dwellTime}s
                          </td>
                          <td className="py-4 font-mono text-emerald-600 dark:text-emerald-400">
                            {prod.conversion}%
                          </td>
                          <td className="py-4">
                            <div className="w-32">
                              <div className="flex justify-between text-[10px] font-bold mb-1">
                                <span className="text-slate-800 dark:text-slate-200">{prod.score} / 100</span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className="bg-purple-500 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${prod.score}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-4 text-right pr-3">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${
                              prod.score >= 80 
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                                : prod.score >= 60 
                                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400' 
                                  : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                            }`}>
                              {prod.score >= 80 ? 'Superstar' : prod.score >= 60 ? 'High Potential' : 'Needs Optimization'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: USER MANAGEMENT */}
          {activeTab === 'users' && user?.role === 'Administrator' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-colors duration-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Users size={14} className="text-rose-500" />
                User Administration Portal
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                      <th className="pb-3 pl-2">Full Name</th>
                      <th className="pb-3">Email Address</th>
                      <th className="pb-3">Organization Role</th>
                      <th className="pb-3">Security Status</th>
                      <th className="pb-3 text-right pr-2">Action Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs font-bold">
                    {usersList.map((u) => (
                      <tr key={u.id} className="text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950/20 transition-all duration-150">
                        <td className="py-4 pl-2 text-slate-800 dark:text-slate-200 font-semibold">{u.full_name}</td>
                        <td className="py-4 font-mono text-slate-500 dark:text-slate-400 text-[11px]">{u.email}</td>
                        <td className="py-4">{renderRoleBadge(u.role)}</td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.is_active 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                          }`}>
                            {u.is_active ? 'ACTIVE' : 'SUSPENDED'}
                          </span>
                        </td>
                        <td className="py-4 text-right pr-2">
                          {u.id !== user.id ? (
                            <button
                              onClick={() => handleToggleUserActive(u.id)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors duration-150 ${
                                u.is_active
                                  ? 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-600 dark:text-red-400'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {u.is_active ? 'SUSPEND PROFILE' : 'REACTIVATE PROFILE'}
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 italic font-semibold">Logged-in Session</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: REAL-TIME SYSTEM ALERTS */}
          {activeTab === 'alerts' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-gradient-to-r from-red-950/60 via-slate-900 to-amber-950/60 border border-red-500/20 p-6 rounded-3xl text-white shadow-xl">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-red-500 animate-bounce" />
                  <div>
                    <h2 className="text-xl font-black">Real-Time Operational System Alerts</h2>
                    <p className="text-xs text-slate-300 mt-1">Live alerts for queue bottlenecks, camera outages, crowd surges, and shelf stock events.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 1, title: 'High Crowd Surge Detected', msg: 'Aisle B (Beverages & Cold Drinks) experiencing heavy footfall intensity.', time: '10:24 AM', severity: 'high', zone: 'Zone B' },
                  { id: 2, title: 'Shelf C - Low Attention Alert', msg: 'Dwell time & engagement dropped 18% below threshold for Confectionery shelf.', time: '10:18 AM', severity: 'medium', zone: 'Zone C' },
                  { id: 3, title: 'Camera 6 Offline Signal', msg: 'Promotion Area CCTV Stream bitrate dropped. Stream re-established.', time: '10:15 AM', severity: 'high', zone: 'Cam 6' },
                  { id: 4, title: 'Checkout Lane Queue Warning', msg: '8 customers queued at Lane 2. Recommend opening auxiliary cashier register.', time: '10:10 AM', severity: 'medium', zone: 'Checkout' },
                  { id: 5, title: 'Product Out of Stock Warning', msg: 'Rice Bag 5kg reached zero inventory on Shelf D.', time: '10:08 AM', severity: 'info', zone: 'Shelf D' },
                ].map(alert => (
                  <div key={alert.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4">
                    <AlertTriangle className={`w-6 h-6 shrink-0 mt-0.5 ${alert.severity === 'high' ? 'text-red-500' : 'text-amber-500'}`} />
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{alert.title}</span>
                        <span className="text-xs font-mono text-slate-400">{alert.time}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{alert.msg}</p>
                      <div className="pt-2 flex items-center justify-between text-[10px]">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded">{alert.zone}</span>
                        <span className="text-emerald-500 font-bold">STATUS: MONITORED</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: PRODUCT SALES & DATASET ANALYTICS */}
          {(activeTab === 'sales' || activeTab === 'products') && (
            <div className="space-y-6">
              
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-950 border border-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-3">
                      <CheckCircle size={12} />
                      Marketing Manager & Retail Analyst Session (Store #1 Focus)
                    </div>
                    <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                      <ShoppingBag className="text-indigo-400" size={24} />
                      Product Sales & CAMS Project Datasets
                    </h2>
                    <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
                      Department sales share, product performance, and dataset manifests filtered specifically for <strong>Store #1 (Type A Superstore - 151,315 sq. ft.)</strong>.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button 
                      onClick={fetchSalesData}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                    >
                      <RefreshCw size={14} />
                      Reload Store #1 Data
                    </button>
                  </div>
                </div>
              </div>

              {/* KPI Summary Cards (Store #1 Context) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Store #1 Revenue</span>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                      <DollarSign size={20} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-2">
                    {salesOverview ? `$${(salesOverview.total_revenue / 1e6).toFixed(2)}M` : '$222.40M'}
                  </h3>
                  <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">10,244</span> Store #1 weekly logs
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Active Departments</span>
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
                      <Layers size={20} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-2">
                    {salesOverview ? `${salesOverview.total_departments} Depts` : '77 Depts'}
                  </h3>
                  <div className="mt-2 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold truncate">
                    Top: {salesOverview?.top_department?.category_name || 'Beverages & Liquor'}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Store Profile</span>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                      <Store size={20} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-2">
                    Store #1
                  </h3>
                  <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Type A Superstore</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">151,315 sq ft</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Holiday Demand Lift</span>
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20">
                      <TrendingUp size={20} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
                    +{salesOverview?.holiday_analysis?.holiday_sales_lift_pct || '7.12'}%
                  </h3>
                  <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    Increased weekly sales during festive holidays
                  </div>
                </div>

              </div>

              {/* Uploaded Dataset Manifest Card */}
              {datasetInfo && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <Database className="text-indigo-500" size={18} />
                      <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                        CAMS Project Datasets Manifest (Store #1 Context)
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg uppercase">
                      Status: 4 Active Datasets Ready
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {datasetInfo.files?.map((file: any, idx: number) => (
                      <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="text-indigo-500" size={16} />
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{file.file_name}</span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            {file.file_size_mb ? `${file.file_size_mb} MB` : file.file_size_kb ? `${file.file_size_kb} KB` : `${file.file_size_bytes} B`}
                          </span>
                        </div>
                        {file.purpose && (
                          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold truncate">
                            {file.purpose}
                          </p>
                        )}
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                          Total Rows: <strong className="text-slate-700 dark:text-slate-300">{file.row_count.toLocaleString()}</strong>
                        </div>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {file.key_columns?.map((col: string, cIdx: number) => (
                            <span key={cIdx} className="px-1.5 py-0.5 bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-mono rounded">
                              {col}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Product & Department Sales Table (Neatly Arranged) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                
                {/* Table Top Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Award size={16} className="text-amber-500" />
                      All Product Sales & Department Revenue Ranking
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      Showing performance metrics across all 81 product categories sorted by total revenue
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Search Input */}
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Filter by product name or ID..."
                        value={salesSearch}
                        onChange={(e) => { setSalesSearch(e.target.value); setSalesPage(1); }}
                        className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 transition-colors w-64 text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    {/* Per page selector */}
                    <select
                      value={salesPerPage}
                      onChange={(e) => { setSalesPerPage(Number(e.target.value)); setSalesPage(1); }}
                      className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <option value={10}>10 / page</option>
                      <option value={25}>25 / page</option>
                      <option value={50}>50 / page</option>
                      <option value={81}>Show All (81)</option>
                    </select>
                  </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                        <th className="pb-3 pl-3">Rank & Dept ID</th>
                        <th className="pb-3">Product Category Name</th>
                        <th className="pb-3">Total Gross Revenue ($)</th>
                        <th className="pb-3">Market Share (%)</th>
                        <th className="pb-3">Avg Weekly Sales ($)</th>
                        <th className="pb-3">Store Coverage</th>
                        <th className="pb-3 text-right pr-3">Category Tier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs font-bold">
                      {(() => {
                        const filtered = deptSales.filter(d => 
                          salesSearch === '' || 
                          d.category_name.toLowerCase().includes(salesSearch.toLowerCase()) || 
                          d.dept_id.toString().includes(salesSearch)
                        );
                        
                        const sorted = [...filtered].sort((a, b) => {
                          let valA = a[salesSortKey];
                          let valB = b[salesSortKey];
                          if (typeof valA === 'string') {
                            return salesSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
                          }
                          return salesSortAsc ? valA - valB : valB - valA;
                        });

                        const startIdx = (salesPage - 1) * salesPerPage;
                        const pageItems = sorted.slice(startIdx, startIdx + salesPerPage);

                        if (pageItems.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500 italic">
                                No matching product departments found for search term "{salesSearch}".
                              </td>
                            </tr>
                          );
                        }

                        return pageItems.map((dept) => (
                          <tr key={dept.dept_id} className="text-slate-700 dark:text-slate-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all duration-150">
                            
                            {/* Rank & ID */}
                            <td className="py-4 pl-3">
                              <div className="flex items-center gap-2">
                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                                  dept.rank <= 3 
                                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30' 
                                    : dept.rank <= 10 
                                      ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                                }`}>
                                  #{dept.rank}
                                </span>
                                <span className="font-mono text-slate-400 text-[11px]">ID:{dept.dept_id}</span>
                              </div>
                            </td>

                            {/* Category Name */}
                            <td className="py-4">
                              <span className="font-bold text-slate-900 dark:text-white block">{dept.category_name}</span>
                              <span className="text-[10px] text-slate-400">{dept.records_count.toLocaleString()} weekly logs</span>
                            </td>

                            {/* Total Gross Revenue */}
                            <td className="py-4 font-mono font-bold text-slate-900 dark:text-white">
                              ${dept.total_sales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>

                            {/* Market Share % Bar */}
                            <td className="py-4">
                              <div className="w-36">
                                <div className="flex justify-between text-[10px] font-bold mb-1">
                                  <span className="text-slate-800 dark:text-slate-200">{dept.sales_share_pct}%</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min(dept.sales_share_pct * 12, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Avg Weekly Sales */}
                            <td className="py-4 font-mono text-emerald-600 dark:text-emerald-400">
                              ${dept.avg_weekly_sales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>

                            {/* Store Coverage */}
                            <td className="py-4">
                              <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                {dept.stores_count} / 45 Stores
                              </span>
                            </td>

                            {/* Tier Badge */}
                            <td className="py-4 text-right pr-3">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${
                                dept.rank <= 5 
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' 
                                  : dept.rank <= 20 
                                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                              }`}>
                                {dept.rank <= 5 ? 'Top Tier' : dept.rank <= 20 ? 'High Demand' : 'Standard'}
                              </span>
                            </td>

                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    Showing {Math.min((salesPage - 1) * salesPerPage + 1, deptSales.length)} to {Math.min(salesPage * salesPerPage, deptSales.length)} of {deptSales.length} product departments
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      disabled={salesPage === 1}
                      onClick={() => setSalesPage(p => Math.max(p - 1, 1))}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <ChevronLeft size={14} />
                      Previous
                    </button>
                    <span className="text-xs font-bold px-3 py-1.5 text-slate-700 dark:text-slate-300 bg-indigo-500/10 rounded-xl">
                      Page {salesPage} of {Math.ceil(deptSales.length / salesPerPage) || 1}
                    </span>
                    <button
                      disabled={salesPage >= Math.ceil(deptSales.length / salesPerPage)}
                      onClick={() => setSalesPage(p => p + 1)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      Next
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

              </div>

              {/* Store Performance Breakdown Cards */}
              {storeSalesData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {storeSalesData.store_types?.map((st: any, idx: number) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                          Store Type {st.type}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">{st.store_count} Stores</span>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white">
                          ${(st.total_sales / 1e9).toFixed(2)}B
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                          Market Revenue Share: <strong className="text-indigo-600 dark:text-indigo-400">{st.share_pct}%</strong>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex justify-between">
                        <span>Avg Store Size:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{st.avg_size_sqft.toLocaleString()} sq.ft.</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        </div>
      </main>

    </div>
  );
}
