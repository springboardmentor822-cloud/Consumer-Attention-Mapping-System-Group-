import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Camera,
  CheckCircle2,
  Database,
  Eye,
  Layers3,
  Lock,
  MapPinned,
  MousePointer2,
  PersonStanding,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Store,
  Target,
  Timer,
  Users,
  Plus,
  Trash2,
  LogOut,
  Map,
  Play,
  Check,
  AlertCircle,
  BookOpen,
  TrendingUp,
  BarChart3,
  Settings,
  Flame,
  Info,
  UserPlus,
  ArrowRight,
  Sun,
  Moon,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  X,
  Video,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import LiveHeatmap from './components/LiveHeatmap';
import TrainingRunsPanel from './components/TrainingRunsPanel';
import LiveWebcamModal from './components/LiveWebcamModal';

const API_BASE = 'http://localhost:8000/api';

const demoAccounts = [
  { label: 'Administrator', email: 'admin@attention.ai', password: 'Admin@123' },
  { label: 'Store Manager', email: 'manager@attention.ai', password: 'Manager@123' },
  { label: 'Retail Analyst', email: 'analyst@attention.ai', password: 'Analyst@123' },
  { label: 'Marketing Manager', email: 'marketing@attention.ai', password: 'Marketing@123' },
];

const roleCopy = {
  administrator: 'Full system control, schemas, and security logs.',
  store_manager: 'Manages physical store coordinate grids and camera streams.',
  retail_analyst: 'Verifies real-time tracking signals, FPS feeds, and paths.',
  marketing_manager: 'Reviews campaign placement scores and shelf attention KPIs.',
};

function formatRole(role) {
  return role ? role.replaceAll('_', ' ') : 'not signed in';
}

async function apiFetch(path, token, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail || `Request failed: ${response.status}`);
  }

  return response.json();
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [selectedAccount, setSelectedAccount] = useState(demoAccounts[1]);
  const [dbStatus, setDbStatus] = useState({ status: 'checking', fallback_mode: false });
  const [summary, setSummary] = useState(null);
  const [stores, setStores] = useState([]);
  const [feeds, setFeeds] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [attentionEvents, setAttentionEvents] = useState([]);
  const [zoneSummary, setZoneSummary] = useState([]);
  const [milestone2, setMilestone2] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [datasets, setDatasets] = useState([]);
  
  // Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  // Interactive UI Selection States
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [selectedShelfId, setSelectedShelfId] = useState(null);
  const [dashboardTab, setDashboardTab] = useState('visual'); 
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const [userList, setUserList] = useState([]);

  // Auth portal state
  const [authMode, setAuthMode] = useState('login'); 
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', role: 'store_manager' });

  // Store Management Form States
  const [showCreateStore, setShowCreateStore] = useState(false);
  const [newStore, setNewStore] = useState({ name: '', location: '', floor_area_sqft: 2000, shopper_capacity: 50, manager_name: '' });
  
  const [showCreateZone, setShowCreateZone] = useState(false);
  const [newZone, setNewZone] = useState({ name: '', category_focus: '', expected_dwell_seconds: 30, heatmap_weight: 1.0 });

  const [showCreateShelf, setShowCreateShelf] = useState(false);
  const [mapClickMode, setMapClickMode] = useState(false); 
  const [newShelf, setNewShelf] = useState({ code: '', aisle: '', category: '', x_position: 50, y_position: 50, attention_score: 50, zone_id: '' });

  const [showCreateCamera, setShowCreateCamera] = useState(false);
  const [newCamera, setNewCamera] = useState({ name: '', feed_url: '', fps: 24, coverage: '', zone_id: '' });

  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ sku: '', name: '', brand: '', category: '', dataset_source: 'SKU-110K' });
  
  const [showCreatePlacement, setShowCreatePlacement] = useState(false);
  const [newPlacement, setNewPlacement] = useState({ product_id: '', row: 1, column: 1, facing_count: 5, placement_quality: 80 });

  // Simulator State
  const [simulationActive, setSimulationActive] = useState(false);
  const [simShopperRef, setSimShopperRef] = useState('shopper-sim-' + Math.floor(Math.random() * 10000));
  const [simPoints, setSimPoints] = useState([]);
  const [simStateStatus, setSimStateStatus] = useState('active'); 
  const [simEntryZoneId, setSimEntryZoneId] = useState('');
  const [simExitZoneId, setSimExitZoneId] = useState('');

  // OpenCV verification state
  const [cvTesting, setCvTesting] = useState(false);
  const [cvStreamLogs, setCvStreamLogs] = useState(null);
  const [cvStreamSource, setCvStreamSource] = useState('');
  const [hoveredFrame, setHoveredFrame] = useState(null);

  // Camera Live Simulation state
  const [activeSimCamera, setActiveSimCamera] = useState(null);
  const [simFrames, setSimFrames] = useState(null);
  const [simPlayerOpen, setSimPlayerOpen] = useState(false);
  const [simPlayerFrameIndex, setSimPlayerFrameIndex] = useState(0);
  const [simPlayerPlaying, setSimPlayerPlaying] = useState(false);
  const [simPlayerLoading, setSimPlayerLoading] = useState(false);
  const [simPlayerSpeed, setSimPlayerSpeed] = useState(10); // 10 FPS default
  const [liveWebcamOpen, setLiveWebcamOpen] = useState(false);

  const [message, setMessage] = useState('Select a portal role or create an account to begin verification.');
  const [errorMessage, setErrorMessage] = useState('');

  // Derived Selection Values
  const selectedStore = useMemo(() => {
    if (!stores.length) return null;
    return stores.find((s) => s.id === selectedStoreId) || stores[0];
  }, [stores, selectedStoreId]);

  const selectedSession = useMemo(() => {
    if (!sessions.length) return null;
    return sessions.find((s) => s.id === selectedSessionId) || sessions[0];
  }, [sessions, selectedSessionId]);

  const selectedShelf = useMemo(() => {
    if (!selectedStore || !selectedShelfId) return null;
    return selectedStore.shelves.find((s) => s.id === selectedShelfId) || null;
  }, [selectedStore, selectedShelfId]);

  const shelfCamera = useMemo(() => {
    if (!selectedShelf || !selectedShelf.zone) return null;
    return feeds.find((f) => f.zone_id === selectedShelf.zone.id) || null;
  }, [selectedShelf, feeds]);

  // Dynamic Tabs Filter based on signed in user's Role
  const visibleTabs = useMemo(() => {
    if (!user) return [];
    const tabs = [];
    if (user.role === 'administrator') {
      tabs.push({ id: 'visual', label: 'Store Overview', icon: Map });
      tabs.push({ id: 'metrics', label: 'Intelligence Metrics', icon: BarChart3 });
      tabs.push({ id: 'ops', label: 'Operations & Testing', icon: Settings });
      tabs.push({ id: 'architecture', label: 'Architecture Spec', icon: BookOpen });
    } else if (user.role === 'store_manager') {
      tabs.push({ id: 'visual', label: 'Store Layout Map', icon: Map });
      tabs.push({ id: 'ops', label: 'Layout Workflows', icon: Settings });
    } else if (user.role === 'retail_analyst') {
      tabs.push({ id: 'visual', label: 'Shopper Path Tracker', icon: Map });
      tabs.push({ id: 'ops', label: 'Analyst Workflows', icon: Settings });
    } else if (user.role === 'marketing_manager') {
      tabs.push({ id: 'metrics', label: 'Campaign Analytics', icon: BarChart3 });
      tabs.push({ id: 'ops', label: 'Marketing Workflows', icon: Settings });
    }
    return tabs;
  }, [user]);

  // Default selections loader
  useEffect(() => {
    if (stores.length && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  useEffect(() => {
    if (sessions.length && !selectedSessionId) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [sessions, selectedSessionId]);

  // Auto switch tab when role is changed
  useEffect(() => {
    if (visibleTabs.length) {
      const hasTab = visibleTabs.some(t => t.id === dashboardTab);
      if (!hasTab) {
        setDashboardTab(visibleTabs[0].id);
      }
    }
  }, [visibleTabs, dashboardTab]);

  const shelfChart = useMemo(() => {
    if (!selectedStore) return [];
    return selectedStore.shelves.map((shelf) => ({
      shelf: shelf.code.replace('S-', ''),
      attention: shelf.attention_score,
      placement: Math.round(
        shelf.placements.reduce((sum, item) => sum + item.placement_quality, 0) /
          Math.max(shelf.placements.length, 1)
      ),
    }));
  }, [selectedStore]);

  const sessionTimeline = useMemo(() => {
    if (!selectedSession) return [];
    return selectedSession.path_points
      .slice()
      .sort((a, b) => new Date(a.observed_at) - new Date(b.observed_at))
      .map((point, index) => ({
        step: index + 1,
        x: Math.round(point.x_position),
        y: Math.round(point.y_position),
        confidence: Math.round(point.confidence * 100),
      }));
  }, [selectedSession]);

  async function loadPublicData(activeToken = token) {
    if (!activeToken) return;
    try {
      const [db, milestoneSummary, workflowData, datasetData] = await Promise.all([
        apiFetch('/db-check', activeToken),
        apiFetch('/milestone/summary', activeToken),
        apiFetch('/milestone/workflows', activeToken),
        apiFetch('/milestone/datasets', activeToken),
      ]);
      setDbStatus(db);
      setSummary(milestoneSummary);
      setWorkflows(workflowData);
      setDatasets(datasetData);

      if (activeToken) {
        const [storeData, feedData, sessionData, eventData, zoneData, milestone2Data] = await Promise.all([
          apiFetch('/stores', activeToken),
          apiFetch('/camera-feeds', activeToken),
          apiFetch('/tracking/sessions', activeToken),
          apiFetch('/attention/events', activeToken),
          apiFetch('/attention/zone-summary', activeToken),
          apiFetch('/milestone2/summary', activeToken),
        ]);
        setStores(storeData);
        setFeeds(feedData);
        setSessions(sessionData);
        setAttentionEvents(eventData);
        setZoneSummary(zoneData);
        setMilestone2(milestone2Data);

        let parsedUser = null;
        try {
          parsedUser = JSON.parse(localStorage.getItem('user'));
        } catch (e) {
          parsedUser = null;
        }
        if (parsedUser && parsedUser.role === 'administrator') {
          const uList = await apiFetch('/admin/users', activeToken);
          setUserList(uList);
        }
      }
    } catch (err) {
      setErrorMessage(err.message);
    }
  }

  async function login(account = selectedAccount) {
    try {
      setErrorMessage('');
      setMessage(`Signing in as ${account.label}...`);
      const payload = await apiFetch('/auth/login', '', {
        method: 'POST',
        body: JSON.stringify({ email: account.email, password: account.password }),
      });
      setToken(payload.access_token);
      setUser(payload.user);
      localStorage.setItem('token', payload.access_token);
      localStorage.setItem('user', JSON.stringify(payload.user));
      await loadPublicData(payload.access_token);
      setMessage(`Signed in as ${payload.user.name}. Viewport customized.`);
    } catch (error) {
      setErrorMessage(error.message);
      setMessage('Authentication failed.');
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    try {
      setErrorMessage('');
      setMessage('Saving custom credentials to PostgreSQL...');
      await apiFetch('/auth/register', '', {
        method: 'POST',
        body: JSON.stringify(signupForm),
      });

      setMessage('Account created! Bootstrapping session...');
      const payload = await apiFetch('/auth/login', '', {
        method: 'POST',
        body: JSON.stringify({ email: signupForm.email, password: signupForm.password }),
      });
      setToken(payload.access_token);
      setUser(payload.user);
      localStorage.setItem('token', payload.access_token);
      localStorage.setItem('user', JSON.stringify(payload.user));
      
      setSignupForm({ name: '', email: '', password: '', role: 'store_manager' });
      setAuthMode('login');

      await loadPublicData(payload.access_token);
      setMessage(`Welcome, ${payload.user.name}! Customized workflow active.`);
    } catch (error) {
      setErrorMessage(error.message);
      setMessage('Registration failed.');
    }
  }

  function signout() {
    setToken('');
    setUser(null);
    setStores([]);
    setFeeds([]);
    setSessions([]);
    setAttentionEvents([]);
    setZoneSummary([]);
    setMilestone2(null);
    setUserList([]);
    setCvStreamLogs(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setMessage('Signed out successfully.');
  }

  async function refreshCamera(feed) {
    try {
      const updated = await apiFetch(
        `/camera-feeds/${feed.id}/heartbeat?status_value=online&fps=${Math.max(24, feed.fps).toFixed(1)}`,
        token,
        { method: 'PATCH' }
      );
      setFeeds((current) => current.map((item) => (item.id === feed.id ? updated : item)));
      setMessage(`${feed.name} ping verified.`);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function updateCameraProperties(feedId, statusValue, fpsValue) {
    try {
      const updated = await apiFetch(
        `/camera-feeds/${feedId}/heartbeat?status_value=${statusValue}&fps=${fpsValue}`,
        token,
        { method: 'PATCH' }
      );
      setFeeds((current) => current.map((item) => (item.id === feedId ? updated : item)));
      setMessage(`Settings saved.`);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  // Operations Handlers
  async function handleCreateStore(e) {
    e.preventDefault();
    try {
      setErrorMessage('');
      const created = await apiFetch('/stores', token, {
        method: 'POST',
        body: JSON.stringify(newStore),
      });
      setStores([...stores, created]);
      setSelectedStoreId(created.id);
      setShowCreateStore(false);
      setMessage(`Store "${created.name}" registered.`);
      await loadPublicData(token);
    } catch (err) {
      setErrorMessage(err.message);
    }
  }

  async function handleCreateZone(e) {
    e.preventDefault();
    try {
      setErrorMessage('');
      const created = await apiFetch(`/stores/${selectedStore.id}/zones`, token, {
        method: 'POST',
        body: JSON.stringify(newZone),
      });
      setMessage(`Zone "${created.name}" created.`);
      setShowCreateZone(false);
      await loadPublicData(token);
    } catch (err) {
      setErrorMessage(err.message);
    }
  }

  async function handleCreateShelf(e) {
    e.preventDefault();
    try {
      setErrorMessage('');
      const shelfPayload = {
        ...newShelf,
        store_id: selectedStore.id,
        zone_id: newShelf.zone_id ? parseInt(newShelf.zone_id) : null,
        x_position: parseInt(newShelf.x_position),
        y_position: parseInt(newShelf.y_position),
        attention_score: parseFloat(newShelf.attention_score),
      };
      const created = await apiFetch('/shelves', token, {
        method: 'POST',
        body: JSON.stringify(shelfPayload),
      });
      setMessage(`Shelf "${created.code}" registered.`);
      setShowCreateShelf(false);
      await loadPublicData(token);
    } catch (err) {
      setErrorMessage(err.message);
    }
  }

  async function handleCreateCamera(e) {
    e.preventDefault();
    try {
      setErrorMessage('');
      const camPayload = {
        ...newCamera,
        store_id: selectedStore.id,
        zone_id: newCamera.zone_id ? parseInt(newCamera.zone_id) : null,
        fps: parseFloat(newCamera.fps),
      };
      const created = await apiFetch('/camera-feeds', token, {
        method: 'POST',
        body: JSON.stringify(camPayload),
      });
      setMessage(`Camera "${created.name}" onboarded.`);
      setShowCreateCamera(false);
      await loadPublicData(token);
    } catch (err) {
      setErrorMessage(err.message);
    }
  }

  async function handleCreateProduct(e) {
    e.preventDefault();
    try {
      setErrorMessage('');
      const created = await apiFetch('/products', token, {
        method: 'POST',
        body: JSON.stringify(newProduct),
      });
      setMessage(`Product "${created.name}" cataloged.`);
      setShowCreateProduct(false);
      await loadPublicData(token);
    } catch (err) {
      setErrorMessage(err.message);
    }
  }

  async function handleCreatePlacement(e) {
    e.preventDefault();
    try {
      setErrorMessage('');
      const placementPayload = {
        ...newPlacement,
        shelf_id: selectedShelf.id,
        product_id: parseInt(newPlacement.product_id),
        row: parseInt(newPlacement.row),
        column: parseInt(newPlacement.column),
        facing_count: parseInt(newPlacement.facing_count),
        placement_quality: parseFloat(newPlacement.placement_quality),
      };
      await apiFetch('/product-placements', token, {
        method: 'POST',
        body: JSON.stringify(placementPayload),
      });
      setMessage(`Product placement mapped.`);
      setShowCreatePlacement(false);
      await loadPublicData(token);
    } catch (err) {
      setErrorMessage(err.message);
    }
  }

  // Visual Map Grid Click Handlers
  const handleMapGridClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    if (mapClickMode && showCreateShelf) {
      setNewShelf((prev) => ({ ...prev, x_position: x, y_position: y }));
      setMapClickMode(false);
      setMessage(`Coordinates saved: X=${x}%, Y=${y}%`);
    } else if (simulationActive) {
      const newPt = {
        x_position: x,
        y_position: y,
        confidence: 0.96,
        observed_at: new Date().toISOString(),
      };
      setSimPoints((prev) => [...prev, newPt]);
    }
  };

  const runJourneySimulation = async () => {
    if (!simPoints.length) {
      setErrorMessage('Click on the store layout coordinates grid to place sequential shopper positions.');
      return;
    }
    try {
      setErrorMessage('');
      setMessage('Compiling journey logs...');
      
      const sessionObj = await apiFetch('/tracking/sessions', token, {
        method: 'POST',
        body: JSON.stringify({
          store_id: selectedStore.id,
          anonymous_shopper_ref: simShopperRef,
          status: simStateStatus,
          entry_zone_id: simEntryZoneId ? parseInt(simEntryZoneId) : null,
          exit_zone_id: simExitZoneId ? parseInt(simExitZoneId) : null,
          total_dwell_seconds: simPoints.length * 15,
          path_confidence: 0.95,
        }),
      });

      for (const pt of simPoints) {
        await apiFetch('/tracking/points', token, {
          method: 'POST',
          body: JSON.stringify({
            session_id: sessionObj.id,
            camera_feed_id: feeds.length ? feeds[0].id : null,
            zone_id: simEntryZoneId ? parseInt(simEntryZoneId) : null,
            x_position: pt.x_position,
            y_position: pt.y_position,
            confidence: pt.confidence,
          }),
        });
      }

      if (selectedStore.shelves.length) {
        const randomShelf = selectedStore.shelves[Math.floor(Math.random() * selectedStore.shelves.length)];
        const product_id = randomShelf.placements.length ? randomShelf.placements[0].product.id : null;

        await apiFetch('/attention/events', token, {
          method: 'POST',
          body: JSON.stringify({
            session_id: sessionObj.id,
            camera_feed_id: feeds.length ? feeds[0].id : null,
            zone_id: randomShelf.zone ? randomShelf.zone.id : null,
            shelf_id: randomShelf.id,
            product_id: product_id,
            event_type: 'dwell',
            dwell_seconds: 28,
            gaze_confidence: 0.91,
            engagement_score: 82.0,
          }),
        });
      }

      setMessage(`Simulated Shopper "${simShopperRef}" path synchronized.`);
      setSimPoints([]);
      setSimShopperRef('shopper-sim-' + Math.floor(Math.random() * 10000));
      setSimulationActive(false);
      await loadPublicData(token);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // Handle simulated camera video playback interval
  useEffect(() => {
    let interval = null;
    if (simPlayerPlaying && simFrames && simFrames.length > 0) {
      interval = setInterval(() => {
        setSimPlayerFrameIndex((prev) => {
          if (prev >= simFrames.length - 1) {
            return 0; // Loop back
          }
          return prev + 1;
        });
      }, 1000 / simPlayerSpeed);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [simPlayerPlaying, simFrames, simPlayerSpeed]);

  const loadCameraSimulation = async (cameraName) => {
    try {
      setErrorMessage('');
      setSimPlayerLoading(true);
      setSimPlayerOpen(true);
      setActiveSimCamera(cameraName);
      setSimPlayerPlaying(false);
      setSimPlayerFrameIndex(0);
      setSimFrames(null);
      
      setMessage(`Loading live CV simulation for ${cameraName}...`);
      const payload = await apiFetch(`/video/test-stream?camera_name=${cameraName}&limit=60`, token, {
        method: 'POST',
      });
      
      if (payload && payload.frame_logs && payload.frame_logs.length > 0) {
        setSimFrames(payload.frame_logs);
        setSimPlayerPlaying(true); // Auto-play when loaded
        setMessage(`Live CV simulation active for ${cameraName}.`);
      } else {
        throw new Error("No frames received from the simulation engine.");
      }
      setSimPlayerLoading(false);
    } catch (err) {
      setSimPlayerLoading(false);
      setErrorMessage(err.message || 'Failed to load camera stream simulation.');
      setMessage('Camera stream simulation failed.');
    }
  };

  async function runCvTest() {
    try {
      setErrorMessage('');
      setCvTesting(true);
      setCvStreamLogs(null);
      setMessage('Invoking OpenCV frames decoder...');
      const payload = await apiFetch('/video/test-stream', token, {
        method: 'POST',
      });
      setCvStreamLogs(payload.frame_logs);
      setCvStreamSource(payload.stream_source);
      setCvTesting(false);
      setMessage(`OpenCV ingestion verified. ${payload.frames_processed} frames decoded.`);
    } catch (error) {
      setCvTesting(false);
      setErrorMessage(error.message);
      setMessage('OpenCV initialization failed.');
    }
  }

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
  };

  useEffect(() => {
    loadPublicData().catch((error) => setErrorMessage(error.message));
  }, []);

  // Theme variable map mappings
  const themeBg = theme === 'dark' ? 'bg-[#060910] text-[#cbd5e1]' : 'bg-[#f4f7fa] text-[#334155]';
  const cardBg = theme === 'dark' ? 'bg-slate-900/30 border-slate-900' : 'bg-white border-slate-200/80 shadow-sm text-slate-700';
  const headerBg = theme === 'dark' ? 'bg-[#060910]/85 border-slate-900/60' : 'bg-white/90 border-slate-200/80 shadow-sm';
  const textTitle = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const textMuted = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const inputBg = theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-500/50 focus:bg-white';
  const innerCard = theme === 'dark' ? 'bg-slate-950/40 border-slate-900' : 'bg-slate-50/70 border-slate-150';
  const tableBorder = theme === 'dark' ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-500';
  const tableTr = theme === 'dark' ? 'border-slate-900' : 'border-slate-100';

  return (
    <div className={`min-h-screen font-sans antialiased transition-all duration-350 selection:bg-teal-500/20 selection:text-teal-300 ${themeBg}`}>
      
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className={`absolute top-0 left-0 w-[40%] h-[40%] rounded-full blur-[150px] ${theme === 'dark' ? 'bg-teal-500/[0.03]' : 'bg-teal-500/[0.02]'}`} />
        <div className={`absolute bottom-0 right-0 w-[40%] h-[40%] rounded-full blur-[150px] ${theme === 'dark' ? 'bg-amber-500/[0.02]' : 'bg-amber-500/[0.01]'}`} />
      </div>

      {/* Auth Portal Gateway / Landing Page */}
      {!user && (
        <div className="relative min-h-screen flex items-center justify-center p-6 md:p-12 z-10">
          <div className="w-full max-w-6xl grid md:grid-cols-12 gap-8 items-center text-left">
            
            {/* Left Column: Stunning Landing Page Information */}
            <div className="md:col-span-7 space-y-6 text-left pr-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-inner">
                  <Eye className="h-5.5 w-5.5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-black font-display text-white tracking-tight leading-none">Attention AI</h2>
                  <span className="text-[9px] text-teal-400 font-mono tracking-wider font-bold uppercase mt-1 block">
                    Retail Behavior Computer Vision Engine
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Transform In-Store Cameras into <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-amber-500">Actionable Intelligence</span>
                </h1>
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-lg">
                  A high-fidelity computer vision analytics platform tracking anonymous shopper journeys, gaze dwell times, product engagement, and aisle layout performances.
                </p>
              </div>

              {/* Showcase Cards Grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className={`p-4.5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
                  theme === 'dark' ? 'bg-slate-900/30 border-slate-800/80 hover:bg-slate-900/50' : 'bg-white/80 border-slate-200 shadow-sm hover:shadow-md'
                }`}>
                  <div className="h-8 w-8 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 mb-3">
                    <MapPinned className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-200 dark:text-white">Aisle Layout Calibration</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Map shelves, products, and capacities onto store blueprint layouts to trace coverage.
                  </p>
                </div>

                <div className={`p-4.5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
                  theme === 'dark' ? 'bg-slate-900/30 border-slate-800/80 hover:bg-slate-900/50' : 'bg-white/80 border-slate-200 shadow-sm hover:shadow-md'
                }`}>
                  <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-3">
                    <Activity className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-200 dark:text-white">Path Tracking Analytics</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Record anonymous shopper paths, entrance/exit timelines, and trajectory confidence.
                  </p>
                </div>

                <div className={`p-4.5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
                  theme === 'dark' ? 'bg-slate-900/30 border-slate-800/80 hover:bg-slate-900/50' : 'bg-white/80 border-slate-200 shadow-sm hover:shadow-md'
                }`}>
                  <div className="h-8 w-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-3">
                    <Camera className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-200 dark:text-white">Live OpenCV Simulation</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Custom camera HUD feeds drawing real-time bounding boxes, gaze vectors, and SKU pickup alerts.
                  </p>
                </div>

                <div className={`p-4.5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
                  theme === 'dark' ? 'bg-slate-900/30 border-slate-800/80 hover:bg-slate-900/50' : 'bg-white/80 border-slate-200 shadow-sm hover:shadow-md'
                }`}>
                  <div className="h-8 w-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 mb-3">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-200 dark:text-white">Role-Based Workspaces</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Optimized dashboard views tailored to Administrators, Store Managers, Analysts, and Marketers.
                  </p>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-[9px] font-mono font-semibold text-slate-400">
                <span className="flex items-center gap-1 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-full text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  DATABASE: CONNECTED
                </span>
                <span className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-full text-teal-400">
                  API SERVICE: FASTAPI
                </span>
                <span className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-full text-amber-500">
                  CORE: POSTGRESQL
                </span>
              </div>
            </div>

            {/* Right Column: Portal Gateway Card */}
            <div className="md:col-span-5 w-full flex justify-center">
              <div className={`w-full max-w-[420px] rounded-3xl p-6 shadow-2xl backdrop-blur-xl border transition-all duration-300 ${cardBg}`}>
                
                {/* Segmented Toggler */}
                <div className={`flex p-1.5 rounded-xl border mb-6 ${theme === 'dark' ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                  <button 
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      authMode === 'login' 
                        ? 'bg-slate-900 text-teal-400 shadow-sm border border-slate-800' 
                        : 'text-slate-500 hover:text-slate-350 hover:bg-slate-800/10'
                    }`}
                  >
                    Demo Switcher
                  </button>
                  <button 
                    type="button"
                    onClick={() => setAuthMode('register')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      authMode === 'register' 
                        ? 'bg-slate-900 text-teal-400 shadow-sm border border-slate-800' 
                        : 'text-slate-500 hover:text-slate-355 hover:bg-slate-800/10'
                    }`}
                  >
                    Register User
                  </button>
                </div>

                {authMode === 'login' ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="mx-auto h-11 w-11 rounded-2xl bg-teal-500/5 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-3 shadow-inner">
                        <Lock className="h-5 w-5" />
                      </div>
                      <h3 className={`text-base font-bold font-display ${textTitle}`}>Attention AI Workbench</h3>
                      <p className="text-[10px] mt-1 opacity-70">Click any demo account card below to log in instantly</p>
                    </div>

                    <div className="space-y-2 mt-4">
                      {demoAccounts.map((account) => (
                        <div
                          key={account.email}
                          onClick={() => setSelectedAccount(account)}
                          className={`rounded-2xl border p-3 text-left transition-all cursor-pointer relative group flex justify-between items-center ${
                            selectedAccount.email === account.email
                              ? 'border-teal-500/80 bg-teal-950/10 text-teal-500 shadow-sm'
                              : theme === 'dark'
                                ? 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-955 hover:text-slate-205'
                                : 'border-slate-200 bg-slate-50/50 text-slate-550 hover:bg-slate-100 hover:text-slate-800'
                          }`}
                        >
                          <div>
                            <div className={`text-xs font-bold ${selectedAccount.email === account.email ? 'text-teal-400' : ''}`}>
                              {account.label}
                            </div>
                            <div className="text-[9px] opacity-60 font-mono mt-0.5">
                              ID: {account.email} • PW: {account.password}
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              login(account);
                            }}
                            className={`px-2.5 py-1.5 rounded-lg font-bold text-[9px] transition-all cursor-pointer ${
                              selectedAccount.email === account.email
                                ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow'
                                : 'bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-white'
                            }`}
                          >
                            Launch
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => login()}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 py-3 text-xs font-bold text-slate-950 transition-all duration-300 cursor-pointer shadow-lg"
                    >
                      Sign In Selected Account <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-3.5 text-xs text-left">
                    <div className="text-center">
                      <h3 className={`text-base font-bold ${textTitle}`}>Create Direct Account</h3>
                      <p className="text-[10px] opacity-70">Custom users are registered straight to PostgreSQL</p>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block">Full Name</label>
                        <input 
                          type="text" 
                          required 
                          value={signupForm.name} 
                          onChange={(e) => setSignupForm({...signupForm, name: e.target.value})}
                          className={`w-full rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-teal-500/30 ${inputBg}`} 
                          placeholder="e.g. Anjali Nair" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block">Email Address</label>
                        <input 
                          type="email" 
                          required 
                          value={signupForm.email} 
                          onChange={(e) => setSignupForm({...signupForm, email: e.target.value})}
                          className={`w-full rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-teal-500/30 font-mono ${inputBg}`} 
                          placeholder="email@attention.ai" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block">Password</label>
                        <input 
                          type="password" 
                          required 
                          value={signupForm.password} 
                          onChange={(e) => setSignupForm({...signupForm, password: e.target.value})}
                          className={`w-full rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-teal-500/30 ${inputBg}`} 
                          placeholder="••••••••" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block">Workspace Role Permission</label>
                        <select
                          value={signupForm.role}
                          onChange={(e) => setSignupForm({...signupForm, role: e.target.value})}
                          className={`w-full rounded-lg px-2.5 py-2 mt-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500/30 ${inputBg}`}
                        >
                          <option value="store_manager">Store Manager (Setup coordinates & feeds)</option>
                          <option value="retail_analyst">Retail Analyst (Simulate paths & FPS status)</option>
                          <option value="marketing_manager">Marketing Manager (Campaign Analytics)</option>
                          <option value="administrator">System Administrator (Full access)</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 py-3 text-xs font-bold text-slate-950 transition-all duration-300 cursor-pointer shadow-lg mt-4"
                    >
                      Register & Sign In
                    </button>
                  </form>
                )}

                {errorMessage && (
                  <div className="mt-4 rounded-xl bg-red-950/10 border border-red-800/40 p-3 text-[10px] text-red-400 flex items-center gap-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
                
                <p className="mt-4 text-center text-[9px] opacity-70 leading-normal">
                  {message}
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Main Workspace Dashboard */}
      {user && (
        <div className="relative z-10 flex flex-col min-h-screen">
          
          {/* Header */}
          <header className={`sticky top-0 z-40 px-6 py-3.5 backdrop-blur-md transition-all ${headerBg}`}>
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-teal-500/5 flex items-center justify-center border border-teal-500/20 text-teal-400">
                  <Eye className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className={`text-sm font-bold ${textTitle}`}>Attention AI</h1>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>POSTGRESQL</span>
                  </div>
                  <p className="text-[10px] opacity-70 font-medium tracking-wide">
                    {user.role === 'administrator' && "System Administration Console"}
                    {user.role === 'store_manager' && "Store Setup & Layout Calibration"}
                    {user.role === 'retail_analyst' && "CV Stream Log Verification"}
                    {user.role === 'marketing_manager' && "Attention Campaigns Dashboard"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <StatusPill icon={Database} label="Storage" value={dbStatus.fallback_mode ? 'SQLite Fallback' : 'PostgreSQL Live'} color={dbStatus.fallback_mode ? 'text-amber-500' : 'text-emerald-500'} theme={theme} />
                <StatusPill icon={ShieldCheck} label="Access" value={formatRole(user.role)} color="text-teal-500" theme={theme} />
                
                <button
                  type="button"
                  onClick={() => setLiveWebcamOpen(true)}
                  className="h-8 px-3 rounded-lg border border-teal-500/40 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  title="Launch Live Laptop Webcam HUD Tagging"
                >
                  <Camera className="h-3.5 w-3.5 text-teal-400" />
                  Live Webcam HUD
                </button>
                
                {/* Theme Switcher Button */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                    theme === 'dark' 
                      ? 'border-slate-800 bg-slate-950/60 hover:bg-slate-900 text-amber-400' 
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                  title="Switch theme"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>

                <button 
                  type="button"
                  onClick={signout}
                  className={`h-8 px-3 rounded-lg border flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'border-slate-800/80 bg-slate-950/60 hover:bg-red-950/10 hover:border-red-500/20 hover:text-red-400 text-slate-500'
                      : 'border-slate-250 bg-slate-50 hover:bg-red-50 hover:border-red-200 hover:text-red-650 text-slate-600'
                  }`}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Exit
                </button>
              </div>

            </div>
          </header>

          {/* Main workspace grids */}
          <main className="max-w-7xl w-full mx-auto px-6 py-5 grid gap-6 lg:grid-cols-[280px_1fr] flex-1">
            
            {/* Sidebar */}
            <aside className="space-y-5">
              
              {/* User Identity Info */}
              <section className={`rounded-2xl p-4.5 border ${cardBg}`}>
                <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-teal-400/85" />
                  Credentials Active
                </div>
                <div className={`text-xs font-bold ${textTitle} truncate`}>{user.name}</div>
                <div className="text-[10px] opacity-70 font-mono truncate mt-0.5">{user.email}</div>
                <p className={`text-[10px] leading-relaxed border-t mt-2.5 pt-2.5 ${theme === 'dark' ? 'border-slate-900' : 'border-slate-100'}`}>
                  {roleCopy[user.role]}
                </p>
              </section>

              {/* Dynamic summary counts tailored per user role */}
              <section className={`rounded-2xl p-4.5 border ${cardBg}`}>
                <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-3 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-amber-500/85" />
                  Database Metrics
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {user.role === 'administrator' && (
                    <>
                      <SidebarStat label="Stores" value={summary?.stores} theme={theme} />
                      <SidebarStat label="Zones" value={summary?.zones} theme={theme} />
                      <SidebarStat label="Shelves" value={summary?.shelves} theme={theme} />
                      <SidebarStat label="Products" value={summary?.products} theme={theme} />
                      <SidebarStat label="Feeds" value={summary?.camera_feeds} theme={theme} />
                      <SidebarStat label="Users" value={summary?.users} theme={theme} />
                    </>
                  )}
                  {user.role === 'store_manager' && (
                    <>
                      <SidebarStat label="Stores" value={summary?.stores} theme={theme} />
                      <SidebarStat label="Zones" value={summary?.zones} theme={theme} />
                      <SidebarStat label="Shelves" value={summary?.shelves} theme={theme} />
                      <SidebarStat label="Feeds" value={summary?.camera_feeds} theme={theme} />
                    </>
                  )}
                  {user.role === 'retail_analyst' && (
                    <>
                      <SidebarStat label="Feeds" value={summary?.camera_feeds} theme={theme} />
                      <SidebarStat label="Sessions" value={summary?.shopper_sessions} theme={theme} />
                      <SidebarStat label="Detections" value={milestone2?.tracking_points} theme={theme} />
                      <SidebarStat label="Gaze Logs" value={summary?.attention_events} theme={theme} />
                    </>
                  )}
                  {user.role === 'marketing_manager' && (
                    <>
                      <SidebarStat label="Shelves" value={summary?.shelves} theme={theme} />
                      <SidebarStat label="Products" value={summary?.products} theme={theme} />
                      <SidebarStat label="Placements" value={summary?.attention_events} theme={theme} />
                      <SidebarStat label="Avg Dwell" value={milestone2 ? `${Math.round(milestone2.average_dwell_seconds)}s` : '-'} theme={theme} />
                    </>
                  )}
                </div>
              </section>

              {/* Segmented seed login shortcuts */}
              <section className={`rounded-2xl p-4 border ${cardBg}`}>
                <div className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mb-2">
                  Quick Role Switcher
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {demoAccounts.map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => login(account)}
                      className={`rounded-lg py-1 px-1.5 text-[9px] font-bold text-left truncate transition-all ${
                        user.email === account.email
                          ? 'border border-teal-500/20 bg-teal-950/20 text-teal-500'
                          : theme === 'dark'
                            ? 'border border-slate-800 bg-slate-950/30 text-slate-500 hover:text-slate-355'
                            : 'border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {account.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </section>

            </aside>

            {/* Workspace Panels */}
            <div className="space-y-5">
              
              {/* Notification Banner */}
              {message && !errorMessage && (
                <div className={`p-3 rounded-xl text-[10px] flex items-center gap-2 border ${
                  theme === 'dark' ? 'bg-slate-900/20 border-slate-900 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <Info className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                  <span>{message}</span>
                </div>
              )}
              {errorMessage && (
                <div className="bg-red-950/10 border border-red-900/30 p-3 rounded-xl text-[10px] text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Workspace dynamic tab selectors */}
              <div className={`flex gap-4 overflow-x-auto border-b ${theme === 'dark' ? 'border-slate-900' : 'border-slate-200'}`}>
                {visibleTabs.map((t) => (
                  <TabButton 
                    key={t.id}
                    active={dashboardTab === t.id} 
                    onClick={() => setDashboardTab(t.id)} 
                    label={t.label} 
                    icon={t.icon} 
                  />
                ))}
              </div>

              {/* Role-Specific Onboarding Banner */}
              <div className={`p-4 rounded-2xl border flex items-start gap-3.5 animate-fade-in ${
                theme === 'dark' ? 'bg-[#0b101c]/60 border-slate-905 border-slate-900' : 'bg-white border-slate-200/80 shadow-sm'
              }`}>
                <div className={`p-2 rounded-xl shrink-0 ${
                  user.role === 'administrator' ? 'bg-red-500/10 text-red-400' :
                  user.role === 'store_manager' ? 'bg-teal-500/10 text-teal-400' :
                  user.role === 'retail_analyst' ? 'bg-indigo-500/10 text-indigo-400' :
                  'bg-amber-500/10 text-amber-400'
                }`}>
                  {user.role === 'administrator' && <ShieldCheck className="h-4.5 w-4.5" />}
                  {user.role === 'store_manager' && <Settings className="h-4.5 w-4.5" />}
                  {user.role === 'retail_analyst' && <Activity className="h-4.5 w-4.5" />}
                  {user.role === 'marketing_manager' && <BarChart3 className="h-4.5 w-4.5" />}
                </div>
                <div>
                  <h4 className={`text-xs font-bold leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Workbench: {formatRole(user.role)}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed text-left">
                    {user.role === 'administrator' && "You have full access to database record metrics, user permission updates, PostgreSQL schema integrity reviews, and console testing operations."}
                    {user.role === 'store_manager' && "Use this workspace to define stores, assign physical coordinates to shelves, map capacities, and configure camera stream RTSP protocols."}
                    {user.role === 'retail_analyst' && "Review shopper sessions, trace entrance/exit time points, verify frame brightness, and simulate visual tracking logs."}
                    {user.role === 'marketing_manager' && "Analyze shopper dwell times, review attention hotspots on the store map blueprint, and identify shelf optimization conversions."}
                  </p>
                </div>
              </div>

              {/* Tab 1: Layout Maps */}
              {dashboardTab === 'visual' && (
                <div className="space-y-5">
                  
                  {/* Selector panel */}
                  <div className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900/20 border-slate-900' : 'bg-white border-slate-200/80 shadow-sm'}`}>
                    <div className="flex items-center gap-3">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Active Layout</label>
                      <select
                        value={selectedStoreId || ''}
                        onChange={(e) => {
                          setSelectedStoreId(parseInt(e.target.value));
                          setSelectedShelfId(null);
                        }}
                        className={`border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-teal-500/50 cursor-pointer ${
                          theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      >
                        {stores.map((store) => (
                          <option key={store.id} value={store.id}>{store.name}</option>
                        ))}
                      </select>
                    </div>

                    <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={heatmapEnabled}
                        onChange={(e) => setHeatmapEnabled(e.target.checked)}
                        className={`rounded h-3.5 w-3.5 text-teal-500 focus:ring-0 ${theme === 'dark' ? 'border-slate-850 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}
                      />
                      <Flame className="h-3.5 w-3.5 text-amber-500" />
                      Overlay Density Heatmap
                    </label>
                  </div>

                  <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
                    
                    {/* Store Map Canvas */}
                    <div className={`border rounded-2xl p-4 flex flex-col ${cardBg}`}>
                      
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <h3 className={`text-xs font-bold ${textTitle}`}>Physical Store Map Layout</h3>
                          <p className="text-[10px] opacity-70">Positioning of shelves, cameras, and real-time shopper paths</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setLiveWebcamOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-[11px] shadow-lg shadow-teal-500/20 transition cursor-pointer"
                          >
                            <Camera className="h-3.5 w-3.5" /> Launch Laptop Webcam
                          </button>
                          {mapClickMode && (
                            <span className="text-[10px] bg-amber-500/10 text-amber-550 border border-amber-550/20 px-2 py-0.5 rounded-full animate-pulse">
                              Coordinate Capture Mode Active
                            </span>
                          )}
                        </div>
                      </div>

                      {selectedStore ? (
                        <div 
                          onClick={handleMapGridClick}
                          className={`relative w-full h-[360px] rounded-xl border overflow-hidden transition-colors ${
                            theme === 'dark' ? 'bg-slate-950 border-slate-900/80' : 'bg-slate-100 border-slate-200'
                          } ${mapClickMode || simulationActive ? 'cursor-crosshair border-teal-500/20' : ''}`}
                        >
                          {/* Animated flow style */}
                          <style>{`
                            @keyframes flowDash {
                              to {
                                stroke-dashoffset: -16;
                              }
                            }
                            .shopper-flow-line {
                              stroke-dasharray: 6, 4;
                              animation: flowDash 1.2s linear infinite;
                            }
                          `}</style>

                          {/* Mapped Store Blueprint CAD lines */}
                          <svg className={`absolute inset-0 w-full h-full pointer-events-none fill-none ${theme === 'dark' ? 'stroke-slate-800/40' : 'stroke-slate-300'}`} viewBox="0 0 100 100" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="shopperPathGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.9" />
                                <stop offset="60%" stopColor="#d97706" stopOpacity="0.9" />
                                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.9" />
                              </linearGradient>
                            </defs>

                            {/* Perimeter Double Wall */}
                            <rect x="1.5" y="1.5" width="97" height="97" rx="1.5" strokeWidth="0.5" className={theme === 'dark' ? 'stroke-slate-800' : 'stroke-slate-400'} />
                            <rect x="2.5" y="2.5" width="95" height="95" rx="1" strokeWidth="0.3" className={theme === 'dark' ? 'stroke-slate-800/50' : 'stroke-slate-350/50'} />
                            
                            {/* Visual Walkway Aisle Corridors */}
                            <rect x="6" y="6" width="9" height="74" rx="1.5" strokeWidth="0.2" className={theme === 'dark' ? 'stroke-slate-900/45 fill-slate-950/40' : 'stroke-slate-200 fill-slate-200/30'} />
                            <rect x="44" y="6" width="12" height="74" rx="1.5" strokeWidth="0.2" className={theme === 'dark' ? 'stroke-slate-900/45 fill-slate-950/40' : 'stroke-slate-200 fill-slate-200/30'} />
                            <rect x="85" y="6" width="9" height="74" rx="1.5" strokeWidth="0.2" className={theme === 'dark' ? 'stroke-slate-900/45 fill-slate-950/40' : 'stroke-slate-200 fill-slate-200/30'} />
                            <rect x="6" y="70" width="88" height="10" rx="1.5" strokeWidth="0.2" className={theme === 'dark' ? 'stroke-slate-900/45 fill-slate-950/40' : 'stroke-slate-200 fill-slate-200/30'} />

                            {/* Shelf Footprint Steel Racks */}
                            <rect x="17" y="26" width="22" height="15" rx="0.5" strokeWidth="0.3" className={theme === 'dark' ? 'stroke-slate-900 fill-slate-950/20' : 'stroke-slate-300 fill-slate-200/10'} />
                            <rect x="47" y="26" width="22" height="15" rx="0.5" strokeWidth="0.3" className={theme === 'dark' ? 'stroke-slate-900 fill-slate-950/20' : 'stroke-slate-300 fill-slate-200/10'} />
                            <rect x="77" y="26" width="16" height="15" rx="0.5" strokeWidth="0.3" className={theme === 'dark' ? 'stroke-slate-900 fill-slate-950/20' : 'stroke-slate-300 fill-slate-200/10'} />
                            <rect x="39" y="56" width="22" height="15" rx="0.5" strokeWidth="0.3" className={theme === 'dark' ? 'stroke-slate-900 fill-slate-950/20' : 'stroke-slate-300 fill-slate-200/10'} />
                            
                            {/* Entrance Gate */}
                            <path d="M 5,97.5 L 18,97.5" strokeWidth="2" className="stroke-teal-500/40" />
                            <text x="7" y="94" className="fill-teal-500/50 font-mono font-bold text-[2.5px] tracking-wider">ENTRANCE A</text>

                            {/* Exit Gate */}
                            <path d="M 82,97.5 L 95,97.5" strokeWidth="2" className="stroke-red-500/40" />
                            <text x="85" y="94" className="fill-red-500/50 font-mono font-bold text-[2.5px] tracking-wider">EXIT ROUTE</text>

                            {/* Checkout Lanes */}
                            <rect x="35" y="80" width="12" height="8" rx="0.5" strokeWidth="0.5" className={theme === 'dark' ? 'stroke-slate-800 fill-slate-950/40' : 'stroke-slate-300 fill-slate-200/40'} />
                            <line x1="41" y1="80" x2="41" y2="88" strokeWidth="0.3" className={theme === 'dark' ? 'stroke-slate-800' : 'stroke-slate-300'} />
                            <text x="36.5" y="85" className={`${theme === 'dark' ? 'fill-slate-600' : 'fill-slate-400'} font-mono text-[1.8px]`}>POS 01</text>
                            
                            <rect x="53" y="80" width="12" height="8" rx="0.5" strokeWidth="0.5" className={theme === 'dark' ? 'stroke-slate-800 fill-slate-950/40' : 'stroke-slate-300 fill-slate-200/40'} />
                            <line x1="59" y1="80" x2="59" y2="88" strokeWidth="0.3" className={theme === 'dark' ? 'stroke-slate-800' : 'stroke-slate-300'} />
                            <text x="54.5" y="85" className={`${theme === 'dark' ? 'fill-slate-600' : 'fill-slate-400'} font-mono text-[1.8px]`}>POS 02</text>

                            {/* Department Sectors */}
                            <text x="12" y="15" className="fill-slate-600 font-sans font-bold text-[3px] tracking-widest opacity-40">COLD BEVERAGES DEPT</text>
                            <text x="72" y="15" className="fill-slate-600 font-sans font-bold text-[3px] tracking-widest opacity-40">FMCG SNACKS DEPT</text>
                            <text x="42" y="45" className="fill-slate-600 font-sans font-bold text-[3px] tracking-widest opacity-40">FRESH PRODUCE AISLE</text>

                            {/* Columns */}
                            <rect x="25" y="32" width="3" height="3" className={theme === 'dark' ? 'stroke-slate-800 fill-slate-955' : 'stroke-slate-300 fill-slate-200'} />
                            <rect x="72" y="32" width="3" height="3" className={theme === 'dark' ? 'stroke-slate-800 fill-slate-955' : 'stroke-slate-300 fill-slate-200'} />
                            <rect x="25" y="62" width="3" height="3" className={theme === 'dark' ? 'stroke-slate-800 fill-slate-955' : 'stroke-slate-300 fill-slate-200'} />
                            <rect x="72" y="62" width="3" height="3" className={theme === 'dark' ? 'stroke-slate-800 fill-slate-955' : 'stroke-slate-300 fill-slate-200'} />

                            {/* Compass Legend */}
                            <g transform="translate(92, 10)">
                              <circle cx="0" cy="0" r="4" strokeWidth="0.3" className={theme === 'dark' ? 'stroke-slate-850' : 'stroke-slate-300'} />
                              <line x1="0" y1="-3.5" x2="0" y2="3.5" strokeWidth="0.4" className={theme === 'dark' ? 'stroke-slate-700' : 'stroke-slate-400'} />
                              <line x1="-3.5" y1="0" x2="3.5" y2="0" strokeWidth="0.4" className={theme === 'dark' ? 'stroke-slate-700' : 'stroke-slate-400'} />
                              <polygon points="0,-4 -1.5,-1 1.5,-1" className="fill-teal-500/60" />
                              <text x="-1" y="-5.5" className="fill-slate-600 text-[2px] font-bold">N</text>
                            </g>

                            {/* Scale Bar */}
                            <g transform="translate(85, 90)">
                              <line x1="0" y1="0" x2="10" y2="0" strokeWidth="0.6" className={theme === 'dark' ? 'stroke-slate-700' : 'stroke-slate-400'} />
                              <line x1="0" y1="-1" x2="0" y2="1" strokeWidth="0.4" className={theme === 'dark' ? 'stroke-slate-700' : 'stroke-slate-400'} />
                              <line x1="10" y1="-1" x2="10" y2="1" strokeWidth="0.4" className={theme === 'dark' ? 'stroke-slate-700' : 'stroke-slate-400'} />
                              <text x="3" y="-2" className="fill-slate-600 text-[1.8px] font-mono">5m</text>
                            </g>
                          </svg>

                          {/* CAD Border Ticks */}
                          <div className="absolute top-1 left-1.5 text-[7px] text-slate-500 font-mono pointer-events-none select-none">0,0</div>
                          <div className="absolute top-1 right-1.5 text-[7px] text-slate-500 font-mono pointer-events-none select-none">100,0</div>
                          <div className="absolute bottom-1 left-1.5 text-[7px] text-slate-500 font-mono pointer-events-none select-none">0,100</div>
                          <div className="absolute bottom-1 right-1.5 text-[7px] text-slate-500 font-mono pointer-events-none select-none">100,100</div>

                          {/* Blueprint grid overlay */}
                          <div className={`absolute inset-0 pointer-events-none ${
                            theme === 'dark' 
                              ? 'bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)]' 
                              : 'bg-[linear-gradient(rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.015)_1px,transparent_1px)]'
                          } bg-[size:15px_15px]`} />

                          {/* Path tracking SVG with Gradient stroke */}
                          {(user.role === 'administrator' || user.role === 'retail_analyst') && selectedSession && selectedSession.path_points.length > 0 && (
                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                              <polyline
                                points={selectedSession.path_points.map((p) => `${p.x_position},${p.y_position}`).join(' ')}
                                fill="none"
                                stroke="url(#shopperPathGradient)"
                                strokeWidth="1.2"
                                className="shopper-flow-line"
                              />
                            </svg>
                          )}

                          {/* Map clicking helper info text */}
                          {(mapClickMode || simulationActive) && (
                            <div className={`absolute bottom-3 left-3 z-20 border rounded-xl p-2.5 text-[10px] leading-relaxed shadow-lg max-w-[260px] ${
                              theme === 'dark' ? 'bg-slate-900/95 border-slate-800' : 'bg-white border-slate-200'
                            }`}>
                              {mapClickMode && <p className="text-amber-500 font-bold">Click anywhere on the map grid to capture coordinates for your new shelf.</p>}
                              {simulationActive && <p className="text-teal-500 font-medium">Click on the map sequentially to record shopper trajectory. Points placed: {simPoints.length}</p>}
                            </div>
                          )}

                          <LiveHeatmap
                            apiBase={API_BASE}
                            storeId={selectedStore.id}
                            token={token}
                            enabled={heatmapEnabled}
                            capacity={selectedStore.shopper_capacity}
                            theme={theme}
                          />

                          {/* Clickable Shelves buttons */}
                          {selectedStore.shelves.map((shelf) => (
                            <button
                              key={shelf.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedShelfId(shelf.id);
                              }}
                              className={`absolute w-24 h-14 rounded-xl border flex flex-col justify-between p-2 text-left shadow-md transition-all duration-300 translate-x-[-50%] translate-y-[-50%] hover:scale-105 z-10 cursor-pointer ${
                                selectedShelfId === shelf.id
                                  ? 'bg-teal-950/70 border-teal-500 text-teal-300 shadow-[0_0_12px_rgba(20,184,166,0.25)]'
                                  : theme === 'dark'
                                    ? 'bg-slate-900/90 border-slate-800 text-slate-350'
                                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                              }`}
                              style={{ left: `${shelf.x_position}%`, top: `${shelf.y_position}%` }}
                            >
                              <div className="w-full flex justify-between items-center leading-none">
                                <span className="text-[9px] font-bold tracking-wider">{shelf.code}</span>
                                <span className="text-[7px] font-mono opacity-60">{shelf.aisle}</span>
                              </div>
                              <span className="text-[8px] opacity-80 truncate capitalize w-full font-medium">{shelf.category}</span>
                              
                              <div className="w-full bg-slate-950/30 rounded-full h-1 overflow-hidden mt-1 flex border border-slate-900/20">
                                <div 
                                  className={`h-full rounded-full ${
                                    shelf.attention_score > 75 
                                      ? 'bg-emerald-500' 
                                      : shelf.attention_score > 40 
                                        ? 'bg-amber-500' 
                                        : 'bg-red-500'
                                  }`}
                                  style={{ width: `${shelf.attention_score}%` }}
                                />
                              </div>
                            </button>
                          ))}

                          {/* Sequenced path coordinates */}
                          {(user.role === 'administrator' || user.role === 'retail_analyst') && selectedSession?.path_points.map((pt, idx) => (
                            <div
                              key={`pt-${idx}`}
                              className="absolute w-5 h-5 rounded-full border border-teal-400 bg-slate-950 text-[9px] font-bold text-teal-300 flex items-center justify-center translate-x-[-50%] translate-y-[-50%] z-20 shadow-[0_0_8px_rgba(20,184,166,0.3)]"
                              style={{ left: `${pt.x_position}%`, top: `${pt.y_position}%` }}
                            >
                              {idx === selectedSession.path_points.length - 1 && (
                                <span className="absolute inset-0 rounded-full bg-teal-400/20 animate-ping" />
                              )}
                              {idx + 1}
                            </div>
                          ))}

                          {/* Simulator coordinates preview */}
                          {simulationActive && simPoints.map((pt, idx) => (
                            <div
                              key={`sim-pt-${idx}`}
                              className="absolute w-5 h-5 rounded-full border border-teal-400 bg-teal-950 text-[9px] font-bold text-teal-300 flex items-center justify-center translate-x-[-50%] translate-y-[-50%] z-20"
                              style={{ left: `${pt.x_position}%`, top: `${pt.y_position}%` }}
                            >
                              {idx + 1}
                            </div>
                          ))}

                          {/* Live Camera Icons on Blueprint Map */}
                          {(() => {
                            const getCameraCoordinates = (camName) => {
                              if (camName === 'CAM-ENT-01') return { x: 10, y: 12 };
                              if (camName === 'CAM-FMCG-04') return { x: 48, y: 34 };
                              if (camName === 'CAM-BEV-02') return { x: 74, y: 50 };
                              return { x: 50, y: 50 };
                            };
                            return feeds.map((feed) => {
                              const coords = getCameraCoordinates(feed.name);
                              return (
                                <button
                                  key={`map-cam-${feed.id}`}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    loadCameraSimulation(feed.name);
                                  }}
                                  className={`absolute w-7 h-7 rounded-full border flex items-center justify-center shadow-lg transition-all duration-300 translate-x-[-50%] translate-y-[-50%] hover:scale-110 z-20 cursor-pointer ${
                                    theme === 'dark'
                                      ? 'bg-slate-900 border-slate-800 text-teal-400 hover:border-teal-500 hover:shadow-[0_0_10px_rgba(20,184,166,0.35)]'
                                      : 'bg-white border-slate-200 text-teal-600 hover:border-teal-500 hover:shadow-[0_0_10px_rgba(20,184,166,0.25)]'
                                  }`}
                                  style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                                  title={`Watch Live CV Feed: ${feed.name}`}
                                >
                                  <Camera className="h-3.5 w-3.5" />
                                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                      feed.status === 'online' ? 'bg-emerald-400' : feed.status === 'warning' ? 'bg-amber-400' : 'bg-red-400'
                                    }`} />
                                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                                      feed.status === 'online' ? 'bg-emerald-500' : feed.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                                    }`} />
                                  </span>
                                </button>
                              );
                            });
                          })()}

                        </div>
                      ) : (
                        <EmptyState icon={Store} label="No layout registered." />
                      )}
                    </div>

                    {/* Inspector section */}
                    <div className="space-y-5">
                      
                      {/* Shelf Inspector */}
                      <section className={`border rounded-2xl p-4 ${cardBg}`}>
                        <div className="flex justify-between items-center mb-3 border-b pb-2 border-slate-200/60 dark:border-slate-900">
                          <h3 className={`text-xs font-bold flex items-center gap-1.5 ${textTitle}`}>
                            <PackageCheck className="h-4 w-4 text-teal-405 text-teal-450" />
                            Shelf Inspector
                          </h3>
                          {selectedShelf && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-500' : 'bg-slate-100 border-slate-250 text-slate-600'}`}>
                              {selectedShelf.code}
                            </span>
                          )}
                        </div>

                        {selectedShelf ? (
                          <div className="space-y-3.5">
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div>
                                <span className="text-slate-500 block">Category</span>
                                <span className={`font-semibold capitalize ${textTitle}`}>{selectedShelf.category}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Aisle Location</span>
                                <span className={`font-semibold uppercase font-mono ${textTitle}`}>{selectedShelf.aisle}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Attention Index</span>
                                <span className="text-amber-500 font-bold">{selectedShelf.attention_score}%</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Dwell Zone</span>
                                <span className="text-teal-500 font-semibold">{selectedShelf.zone?.name || 'Unassigned'}</span>
                              </div>
                            </div>

                            <div className={`mt-3 pt-3 border-t ${theme === 'dark' ? 'border-slate-900' : 'border-slate-100'}`}>
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Products Placed</h4>
                                {(user.role === 'store_manager' || user.role === 'administrator') && (
                                  <button
                                    onClick={() => setShowCreatePlacement(true)}
                                    className="text-[9px] text-teal-500 hover:text-teal-400 font-bold flex items-center gap-0.5 cursor-pointer"
                                  >
                                    <Plus className="h-3 w-3" /> Place
                                  </button>
                                )}
                              </div>
                              
                              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                                {selectedShelf.placements.map((p) => (
                                  <div key={p.id} className={`p-2 rounded border text-[10px] ${innerCard}`}>
                                    <div className="flex justify-between font-bold text-slate-800 dark:text-white">
                                      <span>{p.product.name}</span>
                                      <span className="font-mono text-slate-550 text-[8px]">{p.product.sku}</span>
                                    </div>
                                    <div className="mt-1.5 flex justify-between text-[8px] text-slate-500">
                                      <span>Grid: R{p.row}-C{p.column}</span>
                                      <span>Facings: {p.facing_count}</span>
                                      <span className="text-teal-555 text-teal-500 font-bold">Quality: {p.placement_quality}%</span>
                                    </div>
                                  </div>
                                ))}
                                {!selectedShelf.placements.length && (
                                  <p className="text-[10px] text-slate-500 italic py-2 text-center">No products mapped.</p>
                                )}
                              </div>
                            </div>

                            {shelfCamera && (
                              <div className={`mt-3 pt-3 border-t ${theme === 'dark' ? 'border-slate-900' : 'border-slate-100'}`}>
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Zone Camera</h4>
                                <div 
                                  onClick={() => loadCameraSimulation(shelfCamera.name)}
                                  className={`group relative rounded-xl border overflow-hidden p-2 flex items-center gap-3 cursor-pointer transition-all duration-300 ${
                                    theme === 'dark' 
                                      ? 'bg-slate-950/40 border-slate-900 hover:border-teal-500/50 hover:bg-slate-950/70' 
                                      : 'bg-slate-50/70 border-slate-200 hover:border-teal-555 hover:bg-slate-100/50'
                                  }`}
                                >
                                  {/* Simulated screen thumbnail */}
                                  <div className="w-12 h-9 rounded bg-slate-905 bg-slate-900 flex items-center justify-center border border-slate-800 text-teal-400 group-hover:bg-teal-950/20 group-hover:text-teal-350 transition-colors">
                                    <Video className="h-4 w-4 animate-pulse" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className={`text-[10px] font-bold block leading-normal ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                                      {shelfCamera.name}
                                    </span>
                                    <span className="text-[8px] text-slate-500 block truncate leading-normal">
                                      Click to watch Live CV simulation
                                    </span>
                                  </div>
                                  <div className="text-teal-500 group-hover:translate-x-0.5 transition-transform">
                                    <ArrowRight className="h-3 w-3" />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-500 italic py-4 text-center">Select a shelf on the map representation above to view inventory placements.</p>
                        )}
                      </section>

                      {/* Shopper sessions list */}
                      {(user.role === 'retail_analyst' || user.role === 'administrator') && (
                        <section className={`border rounded-2xl p-4 ${cardBg}`}>
                          <h3 className={`text-xs font-bold flex items-center gap-1.5 mb-3 border-b pb-2 ${textTitle} border-slate-200/60 dark:border-slate-900`}>
                            <PersonStanding className="h-4 w-4 text-teal-400" />
                            Shopper Path Sessions
                          </h3>
                          <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                            {sessions.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => setSelectedSessionId(s.id)}
                                className={`w-full text-left p-2.5 rounded-lg border flex flex-col transition-all cursor-pointer ${
                                  selectedSessionId === s.id
                                    ? 'bg-teal-950/20 border-teal-500/50'
                                    : theme === 'dark' 
                                      ? 'bg-slate-950/20 border-slate-900 hover:border-slate-800' 
                                      : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex justify-between items-center w-full">
                                  <span className={`text-[10px] font-bold font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{s.anonymous_shopper_ref}</span>
                                  <span className={`text-[8px] px-1.5 py-0.5 rounded capitalize font-semibold ${
                                    s.status === 'active' ? 'bg-emerald-950/30 text-emerald-500 border border-emerald-500/10' : 'bg-sky-950/30 text-sky-555 text-sky-500 border border-sky-500/10'
                                  }`}>
                                    {s.status}
                                  </span>
                                </div>
                                <div className="mt-1.5 flex gap-3 text-[9px] text-slate-500">
                                  <span>Dwell: <strong className="text-slate-400 dark:text-slate-350">{s.total_dwell_seconds}s</strong></span>
                                  <span>Confidence: <strong className="text-teal-500">{Math.round(s.path_confidence * 100)}%</strong></span>
                                </div>
                              </button>
                            ))}
                            {!sessions.length && (
                              <p className="text-[10px] text-slate-500 italic py-2 text-center">No simulated paths active.</p>
                            )}
                          </div>
                        </section>
                      )}

                    </div>

                  </div>
                </div>
              )}

              {/* Tab 2: Analytics */}
              {dashboardTab === 'metrics' && (
                <div className="space-y-5">
                  
                  {/* KPIs */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <InsightCard icon={PersonStanding} label="Shoppers Mapped" value={milestone2?.shopper_sessions ?? '-'} note="Active shopper sequences" theme={theme} />
                    <InsightCard icon={MousePointer2} label="COCO Tracking Nodes" value={milestone2?.tracking_points ?? '-'} note="Coordinates calculated" theme={theme} />
                    <InsightCard icon={Timer} label="Avg Path Dwell" value={milestone2 ? `${milestone2.average_dwell_seconds}s` : '-'} note="Sequential duration average" theme={theme} />
                    <InsightCard icon={Target} label="Top Attention Aisle" value={milestone2?.top_zone ?? '-'} note="Most mapped dwell events" theme={theme} />
                  </div>

                  <div className="grid gap-5 lg:grid-cols-2">
                    
                    {/* Shelf Intelligence comparison chart */}
                    <div className={`border rounded-2xl p-4 ${cardBg}`}>
                      <h3 className={`text-xs font-bold mb-1 flex items-center gap-1.5 ${textTitle}`}>
                        <PackageCheck className="h-4 w-4 text-teal-400" />
                        Shelf Attention Performance
                      </h3>
                      <p className="text-[10px] opacity-75 mb-3">Attention score comparison against mapped placement quality ratios</p>
                      
                      <div className="h-64">
                        {shelfChart.length ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={shelfChart}>
                              <CartesianGrid strokeDasharray="2 2" stroke={theme === 'dark' ? '#182335' : '#e2e8f0'} />
                              <XAxis dataKey="shelf" stroke="#64748b" tick={{ fontSize: 9 }} />
                              <YAxis stroke="#64748b" tick={{ fontSize: 9 }} />
                              <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#090d16' : '#ffffff', borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0', color: theme === 'dark' ? '#ffffff' : '#334155' }} />
                              <Bar dataKey="attention" name="Attention %" fill="#14b8a6" radius={[2, 2, 0, 0]} />
                              <Bar dataKey="placement" name="Placement Quality %" fill="#d97706" radius={[2, 2, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <EmptyState icon={PackageCheck} label="No analytics metrics." />
                        )}
                      </div>
                    </div>

                    {/* Zone Dwell summary */}
                    <div className={`border rounded-2xl p-4 ${cardBg}`}>
                      <h3 className={`text-xs font-bold mb-1 flex items-center gap-1.5 ${textTitle}`}>
                        <Target className="h-4 w-4 text-teal-400" />
                        Zone Dwell & Engagement Index
                      </h3>
                      <p className="text-[10px] opacity-75 mb-3">Total dwell seconds accumulated vs engagement rating levels</p>

                      <div className="h-64">
                        {zoneSummary.length ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={zoneSummary}>
                              <CartesianGrid strokeDasharray="2 2" stroke={theme === 'dark' ? '#182335' : '#e2e8f0'} />
                              <XAxis dataKey="zone" stroke="#64748b" tick={{ fontSize: 9 }} />
                              <YAxis stroke="#64748b" tick={{ fontSize: 9 }} />
                              <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#090d16' : '#ffffff', borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0', color: theme === 'dark' ? '#ffffff' : '#334155' }} />
                              <Bar dataKey="total_dwell_seconds" name="Dwell (sec)" fill="#14b8a6" radius={[2, 2, 0, 0]} />
                              <Bar dataKey="average_engagement" name="Engagement Index" fill="#d97706" radius={[2, 2, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <EmptyState icon={Target} label="No zone attention metrics." />
                        )}
                      </div>
                    </div>

                  </div>

                  <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
                    
                    {/* Path Confidence Timeline */}
                    {user.role === 'administrator' && (
                      <div className={`border rounded-2xl p-4 ${cardBg}`}>
                        <h3 className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${textTitle}`}>
                          <Activity className="h-4 w-4 text-teal-400" />
                          Coordinate Confidence Timeline
                        </h3>
                        {selectedSession ? (
                          <div className="h-60">
                            {sessionTimeline.length ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={sessionTimeline}>
                                  <CartesianGrid strokeDasharray="2 2" stroke={theme === 'dark' ? '#182335' : '#e2e8f0'} />
                                  <XAxis dataKey="step" stroke="#64748b" tick={{ fontSize: 9 }} />
                                  <YAxis stroke="#64748b" tick={{ fontSize: 9 }} />
                                  <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#090d16' : '#ffffff', borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0', color: theme === 'dark' ? '#ffffff' : '#334155' }} />
                                  <Line type="monotone" dataKey="confidence" name="Model Confidence %" stroke="#14b8a6" strokeWidth={1.5} dot={{ r: 2 }} />
                                </LineChart>
                              </ResponsiveContainer>
                            ) : (
                              <EmptyState icon={Activity} label="No paths timeline." />
                            )}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-500 italic py-4 text-center">Select session to view tracking telemetry.</p>
                        )}
                      </div>
                    )}

                    {/* Recent Events */}
                    <div className={`${user.role === 'administrator' ? '' : 'lg:col-span-2'} border rounded-2xl p-4 ${cardBg}`}>
                      <h3 className={`text-xs font-bold mb-3 flex items-center gap-1.5 border-b pb-2 ${textTitle} border-slate-200/60 dark:border-slate-900`}>
                        <Eye className="h-4 w-4 text-teal-400" />
                        Gaze & Attention Log
                      </h3>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {attentionEvents.slice(0, 4).map((event) => (
                          <div key={event.id} className={`p-3 rounded-lg border text-[10px] space-y-1 ${innerCard}`}>
                            <div className="flex justify-between items-center mb-1 font-bold text-slate-805 text-slate-800 dark:text-white">
                              <span className="capitalize">{event.event_type.replaceAll('_', ' ')}</span>
                              <span className="text-teal-500 font-mono">{event.dwell_seconds}s</span>
                            </div>
                            <div className="text-slate-500 dark:text-slate-400">Aisle Zone: <strong className="text-slate-700 dark:text-slate-200">{event.zone?.name || 'Entrance'}</strong></div>
                            <div className="text-slate-500 dark:text-slate-400 truncate">Target: <strong className="text-teal-500">{event.product?.name || event.shelf?.code || 'Layout Node'}</strong></div>
                          </div>
                        ))}
                        {!attentionEvents.length && <EmptyState icon={Eye} label="No events mapped." />}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Tab 3: Operations workflows and OpenCV testing */}
              {dashboardTab === 'ops' && (
                <div className="space-y-5">
                  
                  {/* STORE MANAGER WORKFLOWS */}
                  {(user.role === 'store_manager' || user.role === 'administrator') && (
                    <div className="grid gap-5 md:grid-cols-2">
                      
                      <div className="space-y-4">
                        
                        {/* Store Form */}
                        <div className={`border rounded-2xl p-4 ${cardBg}`}>
                          <div className="flex justify-between items-center mb-3">
                            <h4 className={`text-xs font-bold flex items-center gap-1.5 ${textTitle}`}><Store className="h-3.5 w-3.5 text-teal-400" /> Register Layout Store</h4>
                            <button type="button" onClick={() => setShowCreateStore(!showCreateStore)} className="text-[10px] text-teal-500 font-bold hover:underline cursor-pointer">
                              {showCreateStore ? 'Close' : 'Configure'}
                            </button>
                          </div>
                          
                          {showCreateStore && (
                            <form onSubmit={handleCreateStore} className="space-y-2.5 text-[10px]">
                              <div>
                                <label className="text-slate-500">Store Name</label>
                                <input type="text" required value={newStore.name} onChange={(e) => setNewStore({...newStore, name: e.target.value})} className={`w-full rounded p-2 focus:outline-none mt-1 ${inputBg}`} placeholder="Store Name" />
                              </div>
                              <div>
                                <label className="text-slate-505 text-slate-500">City Location</label>
                                <input type="text" required value={newStore.location} onChange={(e) => setNewStore({...newStore, location: e.target.value})} className={`w-full rounded p-2 focus:outline-none mt-1 ${inputBg}`} placeholder="e.g. Bangalore" />
                              </div>
                              <button type="submit" className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-2 rounded transition cursor-pointer">
                                Confirm Registration
                              </button>
                            </form>
                          )}
                        </div>

                        {/* Shelf Coordinate Planner Form */}
                        {selectedStore && (
                          <div className={`border rounded-2xl p-4 ${cardBg}`}>
                            <div className="flex justify-between items-center mb-3">
                              <h4 className={`text-xs font-bold flex items-center gap-1.5 ${textTitle}`}><MapPinned className="h-3.5 w-3.5 text-teal-400" /> Place Shelf Coordinates</h4>
                              <button type="button" onClick={() => setShowCreateShelf(!showCreateShelf)} className="text-[10px] text-teal-555 text-teal-500 font-bold hover:underline cursor-pointer">
                                {showCreateShelf ? 'Close' : 'Plan Coordinates'}
                              </button>
                            </div>

                            {showCreateShelf && (
                              <form onSubmit={handleCreateShelf} className="space-y-2.5 text-[10px]">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-slate-500">Shelf Reference Code</label>
                                    <input type="text" required value={newShelf.code} onChange={(e) => setNewShelf({...newShelf, code: e.target.value})} className={`w-full rounded p-2 focus:outline-none mt-1 ${inputBg}`} placeholder="e.g. S-9" />
                                  </div>
                                  <div>
                                    <label className="text-slate-505 text-slate-500">Aisle Reference</label>
                                    <input type="text" required value={newShelf.aisle} onChange={(e) => setNewShelf({...newShelf, aisle: e.target.value})} className={`w-full rounded p-2 focus:outline-none mt-1 ${inputBg}`} placeholder="e.g. Aisle B" />
                                  </div>
                                </div>

                                <div className={`p-2.5 rounded-lg space-y-1.5 ${theme === 'dark' ? 'bg-slate-950 border border-slate-900' : 'bg-slate-100 border border-slate-200'}`}>
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-slate-500">Coordinates %</span>
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        setMapClickMode(true);
                                        setDashboardTab('visual');
                                        setMessage('Click Mode activated! Go to physical layout map and click where the shelf is located.');
                                      }}
                                      className="text-teal-555 text-teal-500 text-[8px] font-bold hover:underline cursor-pointer"
                                    >
                                      Use Map Click
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <input type="number" min="0" max="100" required value={newShelf.x_position} onChange={(e) => setNewShelf({...newShelf, x_position: e.target.value})} className={`w-full rounded p-1.5 text-center ${inputBg}`} placeholder="X %" />
                                    <input type="number" min="0" max="100" required value={newShelf.y_position} onChange={(e) => setNewShelf({...newShelf, y_position: e.target.value})} className={`w-full rounded p-1.5 text-center ${inputBg}`} placeholder="Y %" />
                                  </div>
                                </div>
                                <button type="submit" className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-2 rounded transition cursor-pointer">
                                  Register Coordinates
                                </button>
                              </form>
                            )}
                          </div>
                        )}

                      </div>

                      {/* Camera stream setup */}
                      <div className="space-y-4">
                        {/* Live Browser Webcam Launcher Card */}
                        <div className={`border rounded-2xl p-4 bg-gradient-to-r from-teal-950/40 to-slate-900/40 border-teal-500/30 ${cardBg}`}>
                          <div className="flex justify-between items-center mb-2">
                            <h4 className={`text-xs font-bold flex items-center gap-1.5 ${textTitle}`}>
                              <Camera className="h-4 w-4 text-teal-400" /> Live Laptop Webcam HUD
                            </h4>
                            <span className="text-[9px] font-mono bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full border border-teal-500/30">HTML5 AI HUD</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mb-3">
                            Stream your laptop webcam directly in the browser to detect & tag humans and objects in real-time.
                          </p>
                          <button
                            type="button"
                            onClick={() => setLiveWebcamOpen(true)}
                            className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-2 px-3 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-teal-500/20"
                          >
                            <Play className="h-3.5 w-3.5" /> Launch In-Browser Webcam
                          </button>
                        </div>

                        {selectedStore && (
                          <div className={`border rounded-2xl p-4 ${cardBg}`}>
                            <div className="flex justify-between items-center mb-3">
                              <h4 className={`text-xs font-bold flex items-center gap-1.5 ${textTitle}`}><Camera className="h-3.5 w-3.5 text-teal-400" /> Onboard RTSP Camera Stream</h4>
                              <button type="button" onClick={() => setShowCreateCamera(!showCreateCamera)} className="text-[10px] text-teal-500 font-bold hover:underline cursor-pointer">
                                {showCreateCamera ? 'Close' : 'Configure Stream'}
                              </button>
                            </div>

                            {showCreateCamera && (
                              <form onSubmit={handleCreateCamera} className="space-y-2.5 text-[10px]">
                                <div>
                                  <label className="text-slate-500">Stream Code Name</label>
                                  <input type="text" required value={newCamera.name} onChange={(e) => setNewCamera({...newCamera, name: e.target.value})} className={`w-full rounded p-2 focus:outline-none mt-1 ${inputBg}`} placeholder="e.g. CAM-01" />
                                </div>
                                <div>
                                  <label className="text-slate-500">RTSP Stream Source URL</label>
                                  <input type="text" required value={newCamera.feed_url} onChange={(e) => setNewCamera({...newCamera, feed_url: e.target.value})} className={`w-full rounded p-2 focus:outline-none font-mono mt-1 ${inputBg}`} placeholder="rtsp://address" />
                                </div>
                                <button type="submit" className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-2 rounded transition cursor-pointer">
                                  Onboard Stream
                                </button>
                              </form>
                            )}
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  {/* RETAIL ANALYST WORKFLOWS & OPENCV TESTING */}
                  {(user.role === 'retail_analyst' || user.role === 'administrator') && (
                    <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
                      
                      {/* Path Ingestion simulator */}
                      <div className={`border rounded-2xl p-4 ${cardBg}`}>
                        <div className="flex justify-between items-start mb-3 border-b pb-2 border-slate-200/60 dark:border-slate-900">
                          <div>
                            <h4 className={`text-xs font-bold flex items-center gap-1.5 ${textTitle}`}>
                              <Map className="h-4 w-4 text-teal-400" />
                              Visual AI Shopper Path Simulator
                            </h4>
                            <p className="text-[10px] text-slate-500">Record a simulated customer sequence over coordinates</p>
                          </div>
                          
                          {!simulationActive ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSimulationActive(true);
                                setSimPoints([]);
                                setDashboardTab('visual');
                                setMessage('Click steps sequentially on the Store Map representation above.');
                              }}
                              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-2.5 py-1.5 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer"
                            >
                              <Play className="h-3 w-3" /> Start Path Simulator
                            </button>
                          ) : (
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={runJourneySimulation}
                                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-2.5 py-1.5 rounded-lg text-[10px] cursor-pointer"
                              >
                                Sync Path
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSimulationActive(false);
                                  setSimPoints([]);
                                }}
                                className="bg-slate-800 text-slate-350 text-slate-300 font-bold px-2.5 py-1.5 rounded-lg text-[10px] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>

                        {simulationActive && (
                          <div className="space-y-3 text-[10px]">
                            <div className={`grid grid-cols-2 gap-2 p-3 rounded-lg border ${theme === 'dark' ? 'bg-slate-950/60 border-slate-850' : 'bg-slate-100 border-slate-200'}`}>
                              <div>
                                <label className="text-slate-500">Shopper Code</label>
                                <input type="text" value={simShopperRef} onChange={(e) => setSimShopperRef(e.target.value)} className={`w-full rounded p-1.5 font-mono mt-0.5 ${inputBg}`} />
                              </div>
                              <div>
                                <label className="text-slate-505 text-slate-500">Journey Status</label>
                                <select value={simStateStatus} onChange={(e) => setSimStateStatus(e.target.value)} className={`w-full rounded p-1.5 mt-0.5 cursor-pointer ${inputBg}`}>
                                  <option value="active">Active (in store)</option>
                                  <option value="completed">Completed</option>
                                </select>
                              </div>
                            </div>
                            <div className="p-2.5 bg-teal-950/10 border border-teal-500/10 text-teal-500 rounded-lg">
                              Coordinates registered: <strong className={theme === 'dark' ? 'text-white' : 'text-slate-800'}>{simPoints.length} points</strong>. Click points sequentially on the map grid layout representation tab to build paths.
                            </div>
                          </div>
                        )}

                        {!simulationActive && (
                          <div className="p-6 text-center bg-slate-950/10 border border-slate-200/60 dark:border-slate-900 rounded-xl text-slate-500 text-[10px]">
                            Launch the simulator, then sequence nodes by clicking store coordinates.
                          </div>
                        )}
                      </div>

                      {/* Camera heartbeats status list */}
                      <div className={`border rounded-2xl p-4 ${cardBg}`}>
                        <h4 className={`text-xs font-bold mb-3 flex items-center gap-1.5 border-b pb-2 ${textTitle} border-slate-200/60 dark:border-slate-900`}>
                          <Camera className="h-4 w-4 text-teal-400" />
                          RTSP Stream Feeds Status
                        </h4>

                        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                          {feeds.map((feed) => (
                            <div key={feed.id} className={`p-2.5 rounded border flex justify-between items-center text-[10px] ${innerCard}`}>
                              <div>
                                <span className={`font-bold block ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{feed.name}</span>
                                <span className="text-[8px] text-slate-500 font-mono truncate max-w-[120px] block mt-0.5">{feed.feed_url}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-teal-555 text-teal-500 font-bold">{feed.fps} FPS</span>
                                <button
                                  type="button"
                                  onClick={() => loadCameraSimulation(feed.name)}
                                  className="bg-teal-950/40 border border-teal-500/30 text-teal-400 p-1 rounded hover:bg-teal-500 hover:text-slate-950 transition cursor-pointer"
                                  title="View Live CV Simulation"
                                >
                                  <Play className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => refreshCamera(feed)}
                                  className="bg-slate-900 border border-slate-800 text-slate-400 p-1 rounded hover:text-teal-450 cursor-pointer"
                                  title="Ping Heartbeat"
                                >
                                  <RefreshCw className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {!feeds.length && <p className="text-[10px] text-slate-500 italic py-2 text-center">No streams onboarded.</p>}
                        </div>
                      </div>

                      {/* OpenCV Stream Ingestion Verification */}
                      <div className={`border rounded-2xl p-4 md:col-span-2 mt-4 ${cardBg}`}>
                        <div className="flex justify-between items-start mb-3 border-b pb-2 border-slate-200/60 dark:border-slate-900">
                          <div>
                            <h4 className={`text-xs font-bold flex items-center gap-1.5 ${textTitle}`}>
                              <Camera className="h-4 w-4 text-teal-400" />
                              OpenCV Frame Ingestion Ingest Test
                            </h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">Launches a sequential frame-resizing operation, checking stream pipeline stability.</p>
                          </div>
                          
                          <button
                            type="button"
                            disabled={cvTesting}
                            onClick={runCvTest}
                            className="bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            {cvTesting ? (
                              <>
                                <RefreshCw className="h-3 w-3 animate-spin" /> Ingesting...
                              </>
                            ) : (
                              <>
                                <Play className="h-3 w-3" /> Run OpenCV Ingestion
                              </>
                            )}
                          </button>
                        </div>

                        {cvStreamLogs ? (
                          <div className="space-y-4">
                            
                            {/* Inline Visual Frame Player */}
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className={`relative aspect-[4/3] rounded-2xl border overflow-hidden bg-slate-950 flex items-center justify-center ${
                                theme === 'dark' ? 'border-slate-900' : 'border-slate-200'
                              }`}>
                                <img 
                                  src={cvStreamLogs[hoveredFrame?.frame_index ? hoveredFrame.frame_index - 1 : simPlayerFrameIndex % cvStreamLogs.length]?.frame_image} 
                                  className="w-full h-full object-cover" 
                                  alt="Decoded OpenCV frame"
                                />
                                <div className="absolute top-2 left-2 bg-slate-950/80 text-[8px] text-teal-400 px-1.5 py-0.5 rounded border border-teal-500/20">
                                  Frame #{hoveredFrame?.frame_index || (simPlayerFrameIndex % cvStreamLogs.length) + 1}
                                </div>
                                <div className="absolute bottom-2 right-2 bg-slate-950/80 text-[8px] text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20">
                                  Hover nodes below to freeze frame
                                </div>
                              </div>

                              <div className="space-y-3">
                                {/* Pipeline status details summary */}
                                <div className={`grid grid-cols-2 gap-3 p-3 border rounded-xl text-[10px] ${theme === 'dark' ? 'bg-slate-950/60 border-slate-900' : 'bg-slate-50 border-slate-200'}`}>
                                  <div>
                                    <span className="text-slate-550 text-slate-500 block">Ingestion Source</span>
                                    <span className={`font-mono truncate block mt-0.5 max-w-[200px] ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`} title={cvStreamSource}>
                                      {cvStreamSource.split('\\').pop().split('/').pop()}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block">Downscale Target</span>
                                    <span className="text-teal-500 font-bold font-mono mt-0.5 block">{cvStreamLogs[0]?.processed_resolution || '320x240'}</span>
                                  </div>
                                  <div className="col-span-2 border-t pt-2 mt-1 border-slate-200/40 dark:border-slate-900/60 flex justify-between">
                                    <span className="text-slate-505 text-slate-500">Verify Status:</span>
                                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                                      <Check className="h-3 w-3" /> Stable Ingest
                                    </span>
                                  </div>
                                </div>

                                {/* Active Frame Telemetry */}
                                <div className={`p-3 border rounded-xl text-[10px] space-y-1.5 ${
                                  theme === 'dark' ? 'bg-slate-950/60 border-slate-900' : 'bg-slate-50 border-slate-200'
                                }`}>
                                  <div className="flex justify-between font-bold text-slate-800 dark:text-white">
                                    <span>Frame #{hoveredFrame?.frame_index || (simPlayerFrameIndex % cvStreamLogs.length) + 1} Metrics</span>
                                    <span className="text-teal-500 font-mono font-bold">
                                      Brightness: {hoveredFrame?.average_brightness || cvStreamLogs[simPlayerFrameIndex % cvStreamLogs.length]?.average_brightness}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-slate-550 text-slate-500 text-[9px]">
                                    <span>Time: <strong className="font-mono text-slate-700 dark:text-slate-350">
                                      {(hoveredFrame?.timestamp || cvStreamLogs[simPlayerFrameIndex % cvStreamLogs.length]?.timestamp).split('T')[1]?.slice(0, 8) || '00:00:00'}
                                    </strong></span>
                                    <span>Resolution: <strong className="font-mono text-slate-700 dark:text-slate-350">
                                      {hoveredFrame?.processed_resolution || cvStreamLogs[0]?.processed_resolution}
                                    </strong></span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* LED visual frame timeline representation */}
                            <div className="space-y-2">
                              <h5 className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Processed Ingestion Timeline</h5>
                              
                              <div className={`flex flex-wrap gap-2.5 p-3.5 border rounded-xl items-center ${theme === 'dark' ? 'bg-slate-950/80 border-slate-900/60' : 'bg-slate-50 border-slate-200'}`}>
                                {cvStreamLogs.map((log) => {
                                  const currentActive = hoveredFrame?.frame_index ? hoveredFrame.frame_index : (simPlayerFrameIndex % cvStreamLogs.length) + 1;
                                  return (
                                    <div
                                      key={log.frame_index}
                                      onMouseEnter={() => setHoveredFrame(log)}
                                      onMouseLeave={() => setHoveredFrame(null)}
                                      className={`w-6 h-6 rounded flex items-center justify-center font-mono text-[9px] font-bold cursor-pointer transition-all duration-200 border ${
                                        currentActive === log.frame_index
                                          ? 'bg-teal-500 border-teal-400 text-slate-950 shadow scale-110'
                                          : 'bg-teal-950/20 border-teal-500/20 text-teal-500 hover:border-teal-500/60 hover:bg-teal-950/30'
                                      }`}
                                    >
                                      {log.frame_index}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                          </div>
                        ) : (
                          <div className="p-6 text-center bg-slate-950/10 border border-slate-200/60 dark:border-slate-900 rounded-xl text-slate-550 text-slate-500 text-[10px]">
                            No frame metadata logs loaded. Start the OpenCV stream test to ingest video file sequences.
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  {/* MARKETING MANAGER WORKFLOWS */}
                  {(user.role === 'marketing_manager' || user.role === 'administrator') && (
                    <div className={`border rounded-2xl p-4 ${cardBg}`}>
                      <div className="flex justify-between items-center mb-3 border-b pb-2 border-slate-200/60 dark:border-slate-900">
                        <div>
                          <h4 className={`text-xs font-bold flex items-center gap-1.5 ${textTitle}`}><PackageCheck className="h-4 w-4 text-teal-400" /> Products & Placement Campaign</h4>
                          <p className="text-[10px] text-slate-500">Muted catalog listings for placement checkups</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowCreateProduct(true)}
                          className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-2.5 py-1 rounded text-[10px] cursor-pointer"
                        >
                          Register Product
                        </button>
                      </div>

                      {showCreateProduct && (
                        <form onSubmit={handleCreateProduct} className={`max-w-md border rounded-xl p-3 mb-3 space-y-2 text-[10px] ${innerCard}`}>
                          <h5 className={`font-bold ${textTitle}`}>Add Product Details</h5>
                          <input type="text" required value={newProduct.sku} onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})} className={`w-full rounded p-1.5 focus:outline-none ${inputBg}`} placeholder="SKU Code" />
                          <input type="text" required value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className={`w-full rounded p-1.5 focus:outline-none ${inputBg}`} placeholder="Product Name" />
                          <button type="submit" className="w-full bg-teal-500 text-slate-950 font-bold py-1.5 rounded cursor-pointer">Submit</button>
                        </form>
                      )}

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[10px] border-collapse">
                          <thead>
                            <tr className={`border-b ${tableBorder}`}>
                              <th className="py-2">SKU</th>
                              <th className="py-2">Product Name</th>
                              <th className="py-2">Brand</th>
                              <th className="py-2">Category</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedStore?.shelves.flatMap(s => s.placements).map((p, idx) => (
                              <tr key={`placed-${idx}`} className={`border-b ${tableTr}`}>
                                <td className="py-2 font-mono text-slate-500">{p.product.sku}</td>
                                <td className={`py-2 font-bold ${textTitle}`}>{p.product.name}</td>
                                <td className="py-2 text-slate-500 dark:text-slate-400">{p.product.brand}</td>
                                <td className="py-2 text-slate-500 dark:text-slate-400">{p.product.category}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ADMIN WORKFLOWS */}
                  {user.role === 'administrator' && (
                    <div className={`border rounded-2xl p-4 ${cardBg}`}>
                      <h4 className={`text-xs font-bold mb-3 flex items-center gap-1.5 ${textTitle}`}>
                        <Users className="h-4 w-4 text-teal-400" />
                        System Users Registry
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[10px] border-collapse">
                          <thead>
                            <tr className={`border-b ${tableBorder}`}>
                              <th className="py-2">Name</th>
                              <th className="py-2">Email</th>
                              <th className="py-2">Role Level</th>
                              <th className="py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userList.map((u) => (
                              <tr key={u.id} className={`border-b ${tableTr}`}>
                                <td className={`py-2 font-bold ${textTitle}`}>{u.name}</td>
                                <td className="py-2 font-mono text-slate-500 dark:text-slate-400">{u.email}</td>
                                <td className="py-2 capitalize text-teal-500 font-medium">{u.role.replaceAll('_', ' ')}</td>
                                <td className="py-2">
                                  <span className={`text-[8px] px-1.5 rounded ${u.is_active ? 'bg-emerald-950/30 text-emerald-500' : 'bg-slate-200 text-slate-500'}`}>
                                    {u.is_active ? 'Active' : 'Disabled'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Backend-persisted model training workbench */}
                  {(user.role === 'administrator' || user.role === 'retail_analyst') && (
                    <div className={`border rounded-2xl p-4 mt-5 text-left ${cardBg}`}>
                      <TrainingRunsPanel
                        apiBase={API_BASE}
                        token={token}
                        storeId={selectedStore?.id}
                        theme={theme}
                      />
                    </div>
                  )}

                </div>
              )}

              {/* Tab 4: Architecture */}
              {dashboardTab === 'architecture' && (
                <div className="space-y-5">
                  <div className={`border rounded-2xl p-5 ${cardBg}`}>
                    <h3 className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${textTitle}`}>
                      <Layers3 className="h-4 w-4 text-teal-400" />
                      Infrastructure Specs
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 text-[10px] text-center">
                      {['React & Lucide', 'FastAPI API', 'SQLAlchemy ORM', 'COCO AI models', 'Heatmaps Engine'].map((layer, index) => (
                        <div key={layer} className={`p-3.5 rounded-xl border ${innerCard}`}>
                          <span className="text-teal-500 font-bold block text-xs">{index + 1}</span>
                          <span className={`font-semibold block mt-1.5 ${textTitle}`}>{layer}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`border rounded-2xl p-5 ${cardBg}`}>
                    <h3 className={`text-xs font-bold mb-3 flex items-center gap-1.5 ${textTitle}`}>
                      <Users className="h-4 w-4 text-teal-400" />
                      AI Vision Integrations
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 text-[10px]">
                      {datasets.map((item) => (
                        <article key={item.dataset} className={`p-3.5 rounded-xl border ${innerCard}`}>
                          <h4 className={`font-bold ${textTitle}`}>{item.dataset}</h4>
                          <p className="text-teal-500 mt-0.5">{item.purpose}</p>
                          <p className="text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{item.milestone_1_use}</p>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>

          </main>

        </div>
      )}

      {/* Floating Dialog / Popup Modals for Placements */}
      {showCreatePlacement && selectedShelf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/60 backdrop-blur-sm">
          <div className={`w-full max-w-xs border rounded-2xl p-5 shadow-2xl space-y-4 text-xs ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-center border-b pb-2 border-slate-200/60 dark:border-slate-800">
              <h4 className={`font-bold ${textTitle}`}>Place Product on Shelf {selectedShelf.code}</h4>
              <button type="button" onClick={() => setShowCreatePlacement(false)} className="text-slate-500 hover:text-slate-800 cursor-pointer">Close</button>
            </div>
            <form onSubmit={handleCreatePlacement} className="space-y-3 text-[10px]">
              <div>
                <label className="text-slate-550 text-slate-500">Select SKU Product</label>
                <select
                  required
                  value={newPlacement.product_id}
                  onChange={(e) => setNewPlacement({...newPlacement, product_id: e.target.value})}
                  className={`w-full rounded p-2 mt-1 cursor-pointer ${inputBg}`}
                >
                  <option value="">Select a product</option>
                  {summary && summary.products > 0 ? (
                    [
                      { id: 1, name: 'FreshMint Toothpaste (DailyCare)' },
                      { id: 2, name: 'Cold Brew Can (UrbanSip)' },
                      { id: 3, name: 'Festival Snack Combo (HappyBasket)' }
                    ].map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))
                  ) : null}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" min="1" required value={newPlacement.row} onChange={(e) => setNewPlacement({...newPlacement, row: e.target.value})} className={`rounded p-1.5 ${inputBg}`} placeholder="Row" />
                <input type="number" min="1" required value={newPlacement.column} onChange={(e) => setNewPlacement({...newPlacement, column: e.target.value})} className={`rounded p-1.5 ${inputBg}`} placeholder="Column" />
              </div>
              <button type="submit" className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-2 rounded transition cursor-pointer">
                Confirm Placement
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Premium Camera Live CV Simulation Modal */}
      {simPlayerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className={`relative w-full max-w-3xl rounded-3xl border shadow-2xl p-5 overflow-hidden transition-all duration-300 ${
            theme === 'dark' ? 'bg-[#090d16] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            {/* Header */}
            <div className="flex justify-between items-center mb-4 border-b pb-3 border-slate-200/50 dark:border-slate-900/60">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold flex items-center gap-1.5 leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    <Camera className="h-4 w-4 text-teal-400" />
                    Live CV Analytics Feed: {activeSimCamera}
                  </h3>
                  <span className="text-[9px] text-slate-505 text-slate-550 text-slate-500 font-mono mt-1 block">
                    STATUS: ACTIVE PROCESSING • FEED PROTOCOL: RTSP
                  </span>
                </div>
              </div>
              
              <button 
                type="button" 
                onClick={() => {
                  setSimPlayerOpen(false);
                  setSimPlayerPlaying(false);
                  setSimFrames(null);
                }} 
                className={`p-1.5 rounded-full border transition cursor-pointer hover:bg-slate-900/30 ${
                  theme === 'dark' ? 'border-slate-800 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-800'
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="grid gap-4 md:grid-cols-[1fr_240px]">
              
              {/* Left Column: Video Screen and Controls */}
              <div className="space-y-3.5">
                {/* Visual Viewport Screen */}
                <div className={`relative w-full aspect-[4/3] rounded-2xl border overflow-hidden flex items-center justify-center ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-slate-100 border-slate-200'
                }`}>
                  {simPlayerLoading ? (
                    <div className="text-center space-y-2">
                      <RefreshCw className="h-8 w-8 text-teal-400 animate-spin mx-auto" />
                      <p className="text-[10px] text-slate-500 font-medium">Initialising Video Ingestion Pipeline...</p>
                    </div>
                  ) : simFrames && simFrames.length > 0 ? (
                    <img 
                      src={simFrames[simPlayerFrameIndex]?.frame_image} 
                      className="w-full h-full object-cover" 
                      alt="Simulated live video feed frame"
                    />
                  ) : (
                    <p className="text-[10px] text-slate-500 italic">Failed to load video stream.</p>
                  )}
                  
                  {/* Resolution Overlay Tag */}
                  {!simPlayerLoading && simFrames && (
                    <div className="absolute top-3 right-3 bg-slate-950/80 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded font-mono text-[8px]">
                      {simFrames[0]?.original_resolution} downscaled {simFrames[0]?.processed_resolution}
                    </div>
                  )}
                </div>

                {/* Progress Timeline Slider */}
                {simFrames && (
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[9px] text-slate-500 w-8">
                      F:{String(simPlayerFrameIndex + 1).padStart(2, '0')}/60
                    </span>
                    <input 
                      type="range" 
                      min="0" 
                      max={simFrames.length - 1} 
                      value={simPlayerFrameIndex} 
                      onChange={(e) => {
                        setSimPlayerFrameIndex(parseInt(e.target.value));
                        setSimPlayerPlaying(false);
                      }} 
                      className="flex-1 accent-teal-500 cursor-pointer h-1 bg-slate-800 dark:bg-slate-900 rounded-lg appearance-none" 
                    />
                    <span className="font-mono text-[9px] text-slate-500 w-8 text-right">
                      {((simPlayerFrameIndex * 0.1).toFixed(1))}s
                    </span>
                  </div>
                )}

                {/* Player Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSimPlayerFrameIndex(0);
                        setSimPlayerPlaying(false);
                      }}
                      disabled={simPlayerLoading || !simFrames}
                      className={`p-1.5 rounded-lg border transition cursor-pointer hover:bg-slate-900/30 text-slate-400 ${
                        theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
                      }`}
                      title="Rewind to Start"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSimPlayerFrameIndex(p => Math.max(0, p - 1));
                        setSimPlayerPlaying(false);
                      }}
                      disabled={simPlayerLoading || !simFrames || simPlayerFrameIndex === 0}
                      className={`p-1.5 rounded-lg border transition cursor-pointer hover:bg-slate-900/30 text-slate-400 ${
                        theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
                      }`}
                      title="Step Backward"
                    >
                      <SkipBack className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimPlayerPlaying(!simPlayerPlaying)}
                      disabled={simPlayerLoading || !simFrames}
                      className="bg-teal-500 hover:bg-teal-400 disabled:bg-slate-855 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold p-2 rounded-xl transition cursor-pointer"
                      title={simPlayerPlaying ? "Pause Playback" : "Resume Playback"}
                    >
                      {simPlayerPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-slate-950" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSimPlayerFrameIndex(p => Math.min((simFrames?.length || 1) - 1, p + 1));
                        setSimPlayerPlaying(false);
                      }}
                      disabled={simPlayerLoading || !simFrames || simPlayerFrameIndex === (simFrames?.length || 1) - 1}
                      className={`p-1.5 rounded-lg border transition cursor-pointer hover:bg-slate-900/30 text-slate-400 ${
                        theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
                      }`}
                      title="Step Forward"
                    >
                      <SkipForward className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Speed Controls */}
                  {simFrames && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-slate-505 text-slate-500 font-bold uppercase">Playback FPS:</span>
                      {[5, 10, 15, 20].map((fpsVal) => (
                        <button
                          key={`fps-${fpsVal}`}
                          type="button"
                          onClick={() => setSimPlayerSpeed(fpsVal)}
                          className={`px-1.5 py-0.5 rounded text-[8px] font-bold border transition cursor-pointer ${
                            simPlayerSpeed === fpsVal
                              ? 'bg-teal-500 border-teal-500 text-slate-950'
                              : theme === 'dark'
                                ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800'
                          }`}
                        >
                          {fpsVal}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Telemetry log feed */}
              <div className="flex flex-col h-full min-h-[300px]">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Live CV Telemetry</h4>
                
                {/* Meta Panel stats */}
                <div className={`p-2.5 rounded-xl border text-[9px] space-y-1.5 mb-2.5 ${
                  theme === 'dark' ? 'bg-slate-950/60 border-slate-900' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Brightness:</span>
                    <span className={`font-mono font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-850'}`}>
                      {simFrames ? `${simFrames[simPlayerFrameIndex]?.average_brightness}` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pipeline Status:</span>
                    <span className="text-emerald-500 font-semibold uppercase">
                      {simFrames ? `${simFrames[simPlayerFrameIndex]?.status}`.replace('_', ' ') : '-'}
                    </span>
                  </div>
                </div>

                {/* Event Logs Terminal */}
                <div className="flex-1 rounded-xl bg-slate-950 border border-slate-900 p-2.5 font-mono text-[8px] overflow-y-auto text-slate-450 text-slate-400 custom-scrollbar space-y-2">
                  <div className="text-emerald-500">// Visual tracking thread initiated</div>
                  
                  {/* Dynamic messages based on frame play index */}
                  {(() => {
                    const logs = [];
                    if (!simFrames) return null;
                    
                    const logTime = (idx) => {
                      const base = new Date();
                      const dt = new Date(base.getTime() + idx * 100);
                      return dt.toTimeString().split(' ')[0] + '.' + (idx % 10);
                    };

                    if (activeSimCamera === 'CAM-ENT-01') {
                      if (simPlayerFrameIndex >= 0) {
                        logs.push(<div key="e0"><span className="text-slate-600">[{logTime(0)}]</span> <span className="text-teal-400">YOLO: Shopper #301 entered (x=60, y=380)</span></div>);
                        logs.push(<div key="e1"><span className="text-slate-600">[{logTime(0)}]</span> <span className="text-amber-500">YOLO: Shopper #302 entered (x=100, y=120)</span></div>);
                      }
                      if (simPlayerFrameIndex >= 15) {
                        logs.push(<div key="e2"><span className="text-slate-600">[{logTime(15)}]</span> <span className="text-amber-500 font-bold">ATTN: Gaze detected on S-PROMO-01 (shopper #301)</span></div>);
                        logs.push(<div key="e3"><span className="text-slate-600">[{logTime(15)}]</span> <span className="text-teal-500">ENGAGE: Dwell Timer started for #301</span></div>);
                      }
                      if (simPlayerFrameIndex >= 30) {
                        logs.push(<div key="e4"><span className="text-slate-600">[{logTime(30)}]</span> <span className="text-teal-400">STATE: Shopper #301 dwell active (duration: 15s)</span></div>);
                      }
                      if (simPlayerFrameIndex >= 45) {
                        logs.push(<div key="e5"><span className="text-slate-550 text-slate-500">STATE: Shopper #301 dwelling finished. Walking out.</span></div>);
                      }
                      if (simPlayerFrameIndex >= 55) {
                        logs.push(<div key="e6"><span className="text-slate-600">[{logTime(55)}]</span> <span className="text-red-500">EXIT: Shopper #301 exited exit route.</span></div>);
                      }
                    } else if (activeSimCamera === 'CAM-FMCG-04') {
                      if (simPlayerFrameIndex >= 0) {
                        logs.push(<div key="f0"><span className="text-slate-600">[{logTime(0)}]</span> <span className="text-teal-400">YOLO: Shopper #101 walking aisle (x=80, y=120)</span></div>);
                      }
                      if (simPlayerFrameIndex >= 8) {
                        logs.push(<div key="f1"><span className="text-slate-600">[{logTime(8)}]</span> <span className="text-pink-400">YOLO: Shopper #102 entered FMCG zone (x=280)</span></div>);
                      }
                      if (simPlayerFrameIndex >= 25) {
                        logs.push(<div key="f2"><span className="text-slate-600">[{logTime(25)}]</span> <span className="text-amber-500 font-bold">ATTN: Gaze detected on S-FMCG-04 (shopper #102)</span></div>);
                      }
                      if (simPlayerFrameIndex >= 30) {
                        logs.push(<div key="f3"><span className="text-slate-600">[{logTime(30)}]</span> <span className="text-pink-500 font-bold">GESTURE: Pickup interaction started for #102</span></div>);
                        logs.push(<div key="f4"><span className="text-slate-600">[{logTime(32)}]</span> <span className="text-emerald-400 font-bold">MATCH: SKU FreshMint Toothpaste detected</span></div>);
                      }
                      if (simPlayerFrameIndex >= 45) {
                        logs.push(<div key="f5"><span className="text-slate-600">[{logTime(45)}]</span> <span className="text-slate-500">STATE: Shopper #102 placed SKU in cart, walking out.</span></div>);
                      }
                    } else if (activeSimCamera === 'CAM-BEV-02') {
                      if (simPlayerFrameIndex >= 0) {
                        logs.push(<div key="b0"><span className="text-slate-600">[{logTime(0)}]</span> <span className="text-teal-400">YOLO: Shopper #201 walking Beverage aisle (x=80)</span></div>);
                        logs.push(<div key="b1"><span className="text-slate-600">[{logTime(0)}]</span> <span className="text-green-400">YOLO: Shopper #202 cross-walking right-to-left</span></div>);
                      }
                      if (simPlayerFrameIndex >= 18) {
                        logs.push(<div key="b2"><span className="text-slate-600">[{logTime(18)}]</span> <span className="text-amber-500 font-bold">ATTN: Gaze detected on S-BEV-02 (shopper #201)</span></div>);
                        logs.push(<div key="b3"><span className="text-slate-600">[{logTime(18)}]</span> <span className="text-teal-500">ENGAGE: Dwell tracking started for #201</span></div>);
                      }
                      if (simPlayerFrameIndex >= 40) {
                        logs.push(<div key="b4"><span className="text-slate-600">[{logTime(40)}]</span> <span className="text-teal-400">STATE: Shopper #201 dwell active (duration: 22s)</span></div>);
                      }
                      if (simPlayerFrameIndex >= 48) {
                        logs.push(<div key="b5"><span className="text-slate-600">[{logTime(48)}]</span> <span className="text-slate-500">STATE: Shopper #201 walking toward checkout.</span></div>);
                      }
                    }
                    return logs;
                  })()}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* In-Browser Live Laptop Webcam Modal */}
      <LiveWebcamModal
        isOpen={liveWebcamOpen}
        onClose={() => setLiveWebcamOpen(false)}
        storeId={selectedStoreId}
        activeToken={token}
        theme={theme}
      />

    </div>
  );
}

// Subcomponents
function StatusPill({ icon: Icon, label, value, color, theme }) {
  const pillStyle = theme === 'dark' 
    ? 'bg-slate-900/30 border-slate-900 text-slate-400' 
    : 'bg-white border-slate-200 text-slate-700 shadow-sm';
  return (
    <div className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 ${pillStyle}`}>
      <Icon className={`h-4 w-4 ${color}`} />
      <div>
        <div className="text-[8px] uppercase tracking-wider text-slate-500">{label}</div>
        <div className={`text-[10px] font-bold font-mono leading-none mt-0.5 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{value}</div>
      </div>
    </div>
  );
}

function SidebarStat({ label, value, theme }) {
  const statStyle = theme === 'dark' 
    ? 'bg-slate-950/40 border-slate-900 hover:border-slate-800' 
    : 'bg-slate-50 border-slate-150 hover:border-slate-250';
  return (
    <div className={`rounded-xl p-2.5 border transition ${statStyle}`}>
      <div className="text-[9px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className={`mt-0.5 text-sm font-bold font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{value ?? '-'}</div>
    </div>
  );
}

function InsightCard({ icon: Icon, label, value, note, theme }) {
  const cardStyle = theme === 'dark' 
    ? 'border-slate-900 bg-slate-900/20 hover:border-teal-500/15' 
    : 'border-slate-200 bg-white hover:border-teal-500/25 shadow-sm';
  return (
    <div className={`rounded-2xl border p-4.5 transition ${cardStyle}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
        <Icon className="h-4 w-4 text-teal-500" />
      </div>
      <div className={`mt-2 text-lg font-bold font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>{value}</div>
      <div className="mt-0.5 text-[9px] text-slate-500">{note}</div>
    </div>
  );
}

function EmptyState({ icon: Icon, label }) {
  return (
    <div className="grid min-h-28 place-items-center rounded-xl border border-dashed border-slate-200 dark:border-slate-850 bg-slate-50/10 dark:bg-slate-950/10 text-center text-[10px] text-slate-500 p-4">
      <div>
        <Icon className="mx-auto mb-1.5 h-5 w-5 text-slate-400 dark:text-slate-650" />
        {label}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pb-2 px-1 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
        active
          ? 'border-teal-500 text-teal-500'
          : 'border-transparent text-slate-450 hover:text-slate-700'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

export default App;
