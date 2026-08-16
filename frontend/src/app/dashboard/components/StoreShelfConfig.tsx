'use client';

import React, { useState, useEffect, useRef } from 'react';

import { 
  Store as StoreIcon, 
  Video as VideoIcon, 
  Map as MapIcon, 
  Plus as PlusIcon, 
  Trash2 as TrashIcon, 
  Edit3 as EditIcon, 
  Layers as LayersIcon, 
  Grid as GridIcon, 
  Eye as EyeIcon, 
  Maximize2 as MaximizeIcon, 
  RefreshCw as RefreshIcon, 
  Sparkles as SparklesIcon,
  CheckCircle2 as CheckIcon,
  AlertCircle as AlertIcon,
  Compass as CompassIcon,
  Sliders as SlidersIcon,
  Package as PackageIcon,
  Activity as ActivityIcon,
  Radio as RadioIcon,
  Cpu as CpuIcon
} from 'lucide-react';

interface StoreShelfConfigProps {
  token: string | null;
  backendUrl: string;
  storesList: any[];
  setStoresList: React.Dispatch<React.SetStateAction<any[]>>;
  selectedStoreId: number | '';
  setSelectedStoreId: (id: number | '') => void;
  camerasList: any[];
  fetchCameras: (storeId?: number) => void;
  shelvesList: any[];
  fetchShelves: (storeId?: number) => void;
  fetchStores: () => void;
  triggerStatus: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export default function StoreShelfConfig({
  token,
  backendUrl,
  storesList,
  setStoresList,
  selectedStoreId,
  setSelectedStoreId,
  camerasList,
  fetchCameras,
  shelvesList,
  fetchShelves,
  fetchStores,
  triggerStatus,
}: StoreShelfConfigProps) {
  // Navigation & Subtabs
  const [subTab, setSubTab] = useState<'blueprint' | 'stores_cams' | 'shelves'>('blueprint');

  // Form states - Retail Store Registration
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreLocation, setNewStoreLocation] = useState('');
  const [isSubmittingStore, setIsSubmittingStore] = useState(false);

  // Form states - Camera Assignment
  const [newCameraName, setNewCameraName] = useState('');
  const [newCameraX, setNewCameraX] = useState<number>(50);
  const [newCameraY, setNewCameraY] = useState<number>(40);
  const [newCameraAngle, setNewCameraAngle] = useState<number>(120);
  const [newCameraStreamUrl, setNewCameraStreamUrl] = useState('/videos/cctv_1.mp4');
  const [isSubmittingCamera, setIsSubmittingCamera] = useState(false);

  // Form states - Shelf Mapping
  const [newShelfName, setNewShelfName] = useState('');
  const [newShelfZone, setNewShelfZone] = useState('Beverages Zone');
  const [newShelfWidth, setNewShelfWidth] = useState<number>(2.4);
  const [newShelfHeight, setNewShelfHeight] = useState<number>(1.8);
  const [newShelfX, setNewShelfX] = useState<number>(30);
  const [newShelfY, setNewShelfY] = useState<number>(40);
  const [isSubmittingShelf, setIsSubmittingShelf] = useState(false);
  const [showAddShelfModal, setShowAddShelfModal] = useState(false);

  // Blueprint Controls
  const [showFovCones, setShowFovCones] = useState(true);
  const [showGridLines, setShowGridLines] = useState(true);
  const [showProductZones, setShowProductZones] = useState(true);
  const [selectedItem, setSelectedItem] = useState<{ type: 'camera' | 'shelf'; data: any } | null>(null);

  // Search & Filter
  const [shelfSearch, setShelfSearch] = useState('');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('ALL');

  // Interactive Blueprint Canvas / Grid Click Handler
  const blueprintRef = useRef<HTMLDivElement>(null);

  const handleBlueprintClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!blueprintRef.current) return;
    const rect = blueprintRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const percentX = Math.round(Math.min(Math.max((clickX / rect.width) * 100, 0), 100));
    const percentY = Math.round(Math.min(Math.max((clickY / rect.height) * 100, 0), 100));

    setNewCameraX(percentX);
    setNewCameraY(percentY);
    setNewShelfX(percentX);
    setNewShelfY(percentY);

    triggerStatus(`Coordinates selected on floorplan: X=${percentX}%, Y=${percentY}%`, 'info');
  };

  // Submit Store Registration
  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;
    setIsSubmittingStore(true);

    try {
      const res = await fetch(`${backendUrl}/api/stores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newStoreName, location: newStoreLocation }),
      });

      if (res.ok) {
        const created = await res.json();
        triggerStatus(`Store "${created.name}" registered successfully!`, 'success');
        setNewStoreName('');
        setNewStoreLocation('');
        fetchStores();
        if (!selectedStoreId) setSelectedStoreId(created.id);
      } else {
        const errData = await res.json().catch(() => ({}));
        triggerStatus(errData.detail || 'Failed to register store', 'error');
      }
    } catch (err) {
      triggerStatus('Network error creating store', 'error');
    } finally {
      setIsSubmittingStore(false);
    }
  };

  // Submit Camera Assignment
  const handleCreateCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreId) {
      triggerStatus('Please select a target store first', 'warning');
      return;
    }
    if (!newCameraName.trim()) return;
    setIsSubmittingCamera(true);

    try {
      const res = await fetch(`${backendUrl}/api/cameras?store_id=${selectedStoreId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newCameraName,
          stream_url: newCameraStreamUrl || `/videos/cctv_${(camerasList.length % 3) + 1}.mp4`,
          status: 'Active',
          position_x: newCameraX,
          position_y: newCameraY,
          angle: newCameraAngle,
        }),
      });

      if (res.ok) {
        triggerStatus(`Camera "${newCameraName}" assigned to floor location!`, 'success');
        setNewCameraName('');
        fetchCameras(Number(selectedStoreId));
      } else {
        const err = await res.json().catch(() => ({}));
        triggerStatus(err.detail || 'Failed to assign camera', 'error');
      }
    } catch (err) {
      triggerStatus('Network error creating camera', 'error');
    } finally {
      setIsSubmittingCamera(false);
    }
  };

  // Submit Shelf Mapping
  const handleCreateShelf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreId) {
      triggerStatus('Please select a store context first', 'warning');
      return;
    }
    if (!newShelfName.trim()) return;
    setIsSubmittingShelf(true);

    try {
      const res = await fetch(`${backendUrl}/api/stores/${selectedStoreId}/shelves`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newShelfName,
          zone_name: newShelfZone,
          width: newShelfWidth,
          height: newShelfHeight,
          coordinates_json: JSON.stringify({ x: newShelfX, y: newShelfY }),
        }),
      });

      if (res.ok) {
        triggerStatus(`Shelf "${newShelfName}" mapped into ${newShelfZone}!`, 'success');
        setNewShelfName('');
        fetchShelves(Number(selectedStoreId));
      } else {
        const err = await res.json().catch(() => ({}));
        triggerStatus(err.detail || 'Failed to map shelf', 'error');
      }
    } catch (err) {
      triggerStatus('Network error creating shelf', 'error');
    } finally {
      setIsSubmittingShelf(false);
    }
  };

  // Delete Camera Device
  const handleDeleteCamera = async (camId: number, camName: string) => {
    if (!confirm(`Are you sure you want to delete camera "${camName}"?`)) return;
    try {
      const res = await fetch(`${backendUrl}/api/cameras/${camId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok || res.status === 204) {
        triggerStatus(`Camera "${camName}" deleted successfully`, 'info');
        fetchCameras(selectedStoreId ? Number(selectedStoreId) : undefined);
      } else {
        triggerStatus('Failed to delete camera feed', 'error');
      }
    } catch (err) {
      triggerStatus('Error deleting camera', 'error');
    }
  };

  // Delete Shelf Mapping
  const handleDeleteShelf = async (shelfId: number, shelfName: string) => {
    if (!confirm(`Are you sure you want to delete shelf "${shelfName}"?`)) return;
    try {
      const res = await fetch(`${backendUrl}/api/stores/shelves/${shelfId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok || res.status === 204) {
        triggerStatus(`Shelf "${shelfName}" removed from store floorplan`, 'info');
        fetchShelves(selectedStoreId ? Number(selectedStoreId) : undefined);
      } else {
        triggerStatus('Failed to delete shelf mapping', 'error');
      }
    } catch (err) {
      triggerStatus('Error deleting shelf', 'error');
    }
  };

  // Delete Store Location
  const handleDeleteStore = async (stId: number, stName: string) => {
    if (!confirm(`Are you sure you want to delete store "${stName}" and all associated devices?`)) return;
    try {
      const res = await fetch(`${backendUrl}/api/stores/${stId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok || res.status === 204) {
        triggerStatus(`Store "${stName}" deleted`, 'info');
        fetchStores();
        if (selectedStoreId === stId) setSelectedStoreId('');
      } else {
        triggerStatus('Failed to delete store location', 'error');
      }
    } catch (err) {
      triggerStatus('Error deleting store location', 'error');
    }
  };

  // Active Store Object
  const currentStoreObj = storesList.find((s) => s.id === Number(selectedStoreId));

  // Compute Zone colors by evaluating both zone_name and shelf name
  const getZoneColor = (zoneName: string, shelfName?: string) => {
    const z = ((zoneName || '') + ' ' + (shelfName || '')).toLowerCase();
    if (z.includes('aisle a') || z.includes('beverage')) return { bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', border: 'border-indigo-500/40', text: 'text-indigo-400', hex: '#6366f1' };
    if (z.includes('aisle b') || z.includes('grocery')) return { bg: 'bg-purple-500/10 dark:bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-400', hex: '#a855f7' };
    if (z.includes('aisle c') || z.includes('personal')) return { bg: 'bg-cyan-500/10 dark:bg-cyan-500/20', border: 'border-cyan-500/40', text: 'text-cyan-400', hex: '#06b6d4' };
    if (z.includes('aisle d') || z.includes('household')) return { bg: 'bg-blue-500/10 dark:bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-400', hex: '#3b82f6' };
    if (z.includes('promo')) return { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-400', hex: '#10b981' };
    if (z.includes('entrance') || z.includes('foyer')) return { bg: 'bg-indigo-600/10 dark:bg-indigo-600/20', border: 'border-indigo-600/40', text: 'text-indigo-300', hex: '#4f46e5' };
    if (z.includes('checkout')) return { bg: 'bg-purple-600/10 dark:bg-purple-600/20', border: 'border-purple-600/40', text: 'text-purple-300', hex: '#9333ea' };
    if (z.includes('exit')) return { bg: 'bg-slate-500/10 dark:bg-slate-500/20', border: 'border-slate-500/40', text: 'text-slate-400', hex: '#64748b' };
    return { bg: 'bg-blue-500/10 dark:bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-400', hex: '#3b82f6' };
  };

  // Filtered Shelves matching search query AND zone filter (matching zone_name OR shelf name)
  const filteredShelves = shelvesList.filter((s) => {
    const searchLower = (shelfSearch || '').toLowerCase();
    const matchesSearch = !searchLower || 
      (s.name || '').toLowerCase().includes(searchLower) || 
      (s.zone_name || '').toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    if (selectedZoneFilter === 'ALL') return true;

    const filterUpper = selectedZoneFilter.toUpperCase();
    const zoneUpper = (s.zone_name || '').toUpperCase();
    const nameUpper = (s.name || '').toUpperCase();

    return zoneUpper.includes(filterUpper) || nameUpper.includes(filterUpper);
  });

  // Calculate Metrics
  const totalFloorArea = shelvesList.reduce((acc, s) => acc + (s.width || 0) * (s.height || 0), 0).toFixed(1);
  const uniqueZonesCount = Array.from(new Set(shelvesList.map((s) => s.zone_name || 'General'))).length;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Header Card & Quick Metrics */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                <StoreIcon size={20} />
              </span>
              <div>
                <h2 className="text-lg font-black text-white tracking-wide uppercase flex items-center gap-2">
                  STORE & SHELF CONFIGURATION
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider">
                    Interactive Engine
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Manage retail locations, calibrate hardware camera feeds, and map category shelf zones
                </p>
              </div>
            </div>
          </div>

          {/* Store Selector & Context Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-1.5 pl-3">
              <CompassIcon size={14} className="text-indigo-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Store Context:</span>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value ? Number(e.target.value) : '')}
                className="bg-slate-900 text-white font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-800 outline-none focus:border-indigo-500"
              >
                <option value="">-- Select Store --</option>
                {storesList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.location || 'Main'})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                fetchStores();
                if (selectedStoreId) {
                  fetchCameras(Number(selectedStoreId));
                  fetchShelves(Number(selectedStoreId));
                }
                triggerStatus('Refreshed store configuration and hardware streams', 'info');
              }}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700 cursor-pointer"
              title="Refresh Data"
            >
              <RefreshIcon size={14} />
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-lg text-indigo-400">
              <StoreIcon size={16} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Retail Stores</div>
              <div className="text-base font-black text-white">{storesList.length}</div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 rounded-lg text-purple-400">
              <VideoIcon size={16} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Hardware Cams</div>
              <div className="text-base font-black text-white flex items-center gap-1.5">
                {camerasList.length}
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400">
              <LayersIcon size={16} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Category Zones</div>
              <div className="text-base font-black text-white">{uniqueZonesCount}</div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-400">
              <GridIcon size={16} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Mapped Space</div>
              <div className="text-base font-black text-white">{totalFloorArea} m²</div>
            </div>
          </div>
        </div>
      </div>

      {/* Module Navigation Subtabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-xl p-1">
          <button
            onClick={() => setSubTab('blueprint')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'blueprint'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MapIcon size={14} />
            2D Visual Floorplan Mapper
          </button>

          <button
            onClick={() => setSubTab('stores_cams')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'stores_cams'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <StoreIcon size={14} />
            Stores & Hardware Devices ({storesList.length}/{camerasList.length})
          </button>

          <button
            onClick={() => setSubTab('shelves')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'shelves'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LayersIcon size={14} />
            Shelves & Zone Inventory ({shelvesList.length})
          </button>
        </div>

        {selectedStoreId && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Active Store: <strong className="text-white">{currentStoreObj?.name || `Store #${selectedStoreId}`}</strong>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: 2D VISUAL FLOORPLAN BLUEPRINT MAPPER */}
      {/* ========================================================================= */}
      {subTab === 'blueprint' && (
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Visual Floorplan Canvas */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <GridIcon size={16} className="text-indigo-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Interactive Retail Blueprint ({currentStoreObj?.name || 'Store Layout'})
                  </h3>
                </div>

                {/* Blueprint View Controls */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showFovCones}
                      onChange={(e) => setShowFovCones(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-indigo-500 focus:ring-0"
                    />
                    Camera Cones
                  </label>

                  <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showGridLines}
                      onChange={(e) => setShowGridLines(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-indigo-500 focus:ring-0"
                    />
                    Floor Grid
                  </label>

                  <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-mono">
                    Click Canvas to Pick (X,Y)
                  </span>
                </div>
              </div>

              {/* Blueprint Interactive Display Area */}
              <div
                ref={blueprintRef}
                onClick={handleBlueprintClick}
                className={`relative w-full h-[460px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden cursor-crosshair group transition-all ${
                  showGridLines ? 'bg-grid-pattern' : ''
                }`}
                style={{
                  backgroundImage: showGridLines
                    ? 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 1px, transparent 1px)'
                    : 'none',
                  backgroundSize: '24px 24px',
                }}
              >
                {/* Store Perimeter Walls */}
                <div className="absolute inset-4 border-2 border-dashed border-indigo-500/30 rounded-lg pointer-events-none flex flex-col justify-between p-2">
                  <div className="flex justify-between text-[10px] font-mono text-indigo-400/60 uppercase">
                    <span>NORTH WALL (0,0)</span>
                    <span>ENTRANCE / EXIT FOYER</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-indigo-400/60 uppercase">
                    <span>SOUTH WALL (100,100)</span>
                    <span>CHECKOUT LANES</span>
                  </div>
                </div>

                {/* Render Mapped Shelves as 2D Zone Rectangles */}
                {shelvesList.map((shelf, idx) => {
                  let coords = { x: 20 + (idx % 3) * 25, y: 30 + Math.floor(idx / 3) * 25 };
                  try {
                    if (shelf.coordinates_json) {
                      const parsed = JSON.parse(shelf.coordinates_json);
                      if (parsed.x !== undefined) coords.x = parsed.x;
                      if (parsed.y !== undefined) coords.y = parsed.y;
                    }
                  } catch (e) {}

                  const zoneColor = getZoneColor(shelf.zone_name, shelf.name);

                  return (
                    <div
                      key={shelf.id || idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItem({ type: 'shelf', data: shelf });
                      }}
                      className={`absolute rounded-lg p-2 transition-all cursor-pointer border ${zoneColor.bg} ${zoneColor.border} hover:scale-105 hover:z-20 hover:shadow-lg`}
                      style={{
                        left: `${coords.x}%`,
                        top: `${coords.y}%`,
                        width: `${Math.max((shelf.width || 2) * 12, 80)}px`,
                        height: `${Math.max((shelf.height || 1.8) * 20, 50)}px`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <div className="flex flex-col h-full justify-between">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-extrabold uppercase tracking-wide truncate ${zoneColor.text}`}>
                            {shelf.name}
                          </span>
                          <span className="text-[8px] font-mono bg-slate-900/80 px-1 rounded text-slate-300">
                            {shelf.width}x{shelf.height}m
                          </span>
                        </div>
                        <div className="text-[9px] font-semibold text-slate-300 truncate">
                          {shelf.zone_name}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Render Hardware Cameras with FOV Cones */}
                {camerasList.map((cam, idx) => {
                  const camX = cam.position_x ?? (20 + idx * 20);
                  const camY = cam.position_y ?? 25;
                  const camAngle = cam.angle ?? (idx * 90);

                  return (
                    <div
                      key={cam.id || idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItem({ type: 'camera', data: cam });
                      }}
                      className="absolute z-30 cursor-pointer group/cam"
                      style={{
                        left: `${camX}%`,
                        top: `${camY}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      {/* FOV Cone Visual */}
                      {showFovCones && (
                        <div
                          className="absolute pointer-events-none origin-bottom opacity-40 group-hover/cam:opacity-80 transition-opacity"
                          style={{
                            width: '120px',
                            height: '100px',
                            bottom: '50%',
                            left: 'calc(50% - 60px)',
                            background: 'polygon(50% 100%, 0% 0%, 100% 0%)',
                            clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)',
                            backgroundColor: 'rgba(168, 85, 247, 0.25)',
                            transform: `rotate(${camAngle}deg)`,
                          }}
                        />
                      )}

                      {/* Camera Node Icon */}
                      <div className="w-9 h-9 rounded-full bg-slate-900 border-2 border-purple-500 flex items-center justify-center text-purple-400 shadow-md shadow-purple-500/30 hover:scale-125 transition-transform relative">
                        <VideoIcon size={16} />
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
                      </div>

                      {/* Camera Tag Label */}
                      <div className="mt-1 bg-slate-900/90 border border-slate-800 rounded px-1.5 py-0.5 text-[9px] font-bold text-slate-200 text-center whitespace-nowrap shadow">
                        {cam.name || `Cam ${idx + 1}`}
                      </div>
                    </div>
                  );
                })}

                {/* Live Pointer Crosshair Indicator */}
                <div className="absolute bottom-3 right-3 bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] font-mono text-slate-300 shadow">
                  Target (X,Y): {newCameraX}%, {newCameraY}%
                </div>
              </div>
            </div>
          </div>

          {/* Quick Mapping Action Panel */}
          <div className="space-y-6">
            
            {/* Quick Add Shelf or Camera Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="flex items-center gap-2">
                  <PlusIcon size={14} className="text-emerald-400" />
                  Quick Map Shelf to Floor
                </span>
                <span className="text-[10px] font-mono text-emerald-400">Context: Store #{selectedStoreId || 1}</span>
              </h3>

              <form onSubmit={handleCreateShelf} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                    Shelf Identifier / Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Snack Aisle Display 1"
                    value={newShelfName}
                    onChange={(e) => setNewShelfName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                    Zone Category
                  </label>
                  <select
                    value={newShelfZone}
                    onChange={(e) => setNewShelfZone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs outline-none focus:border-emerald-500 font-semibold"
                  >
                    <option value="Beverages Zone">Beverages Zone</option>
                    <option value="Snacks Zone">Snacks Zone</option>
                    <option value="Entrance/Exit Foyer">Entrance/Exit Foyer</option>
                    <option value="Checkout Lanes">Checkout Lanes</option>
                    <option value="Apparel & Fashion">Apparel & Fashion</option>
                    <option value="Promotional Endcap">Promotional Endcap</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                      Width (Meters)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newShelfWidth}
                      onChange={(e) => setNewShelfWidth(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                      Height (Meters)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newShelfHeight}
                      onChange={(e) => setNewShelfHeight(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                      Floor Coord X (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newShelfX}
                      onChange={(e) => setNewShelfX(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                      Floor Coord Y (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newShelfY}
                      onChange={(e) => setNewShelfY(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs outline-none font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingShelf}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <PlusIcon size={14} />
                  {isSubmittingShelf ? 'Mapping Shelf...' : 'Add Shelf Mapping'}
                </button>
              </form>
            </div>

            {/* Selected Element Inspection Card */}
            {selectedItem ? (
              <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-4 shadow-lg animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                    Selected Element Inspection
                  </span>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <div className="text-sm font-black text-white">{selectedItem.data.name}</div>
                <div className="text-xs text-slate-400 font-mono mt-1">
                  Type: {selectedItem.type.toUpperCase()} | ID #{selectedItem.data.id}
                </div>
                {selectedItem.type === 'shelf' && (
                  <div className="mt-3 space-y-1 text-xs text-slate-300">
                    <div>Zone: <strong className="text-emerald-400">{selectedItem.data.zone_name}</strong></div>
                    <div>Dimensions: {selectedItem.data.width}m wide x {selectedItem.data.height}m high</div>
                    <button
                      onClick={() => handleDeleteShelf(selectedItem.data.id, selectedItem.data.name)}
                      className="mt-3 w-full py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold rounded-lg border border-red-500/30 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <TrashIcon size={13} />
                      Remove Shelf
                    </button>
                  </div>
                )}
                {selectedItem.type === 'camera' && (
                  <div className="mt-3 space-y-1 text-xs text-slate-300">
                    <div>Stream URL: <span className="font-mono text-purple-400">{selectedItem.data.stream_url}</span></div>
                    <div>Floor Pos: ({selectedItem.data.position_x}%, {selectedItem.data.position_y}%)</div>
                    <button
                      onClick={() => handleDeleteCamera(selectedItem.data.id, selectedItem.data.name)}
                      className="mt-3 w-full py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold rounded-lg border border-red-500/30 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <TrashIcon size={13} />
                      Delete Hardware Device
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center text-slate-500 text-xs">
                Click any camera node or shelf rectangle on the blueprint to inspect details & edit.
              </div>
            )}

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: STORES & CAMERA HARDWARE DEVICES */}
      {/* ========================================================================= */}
      {subTab === 'stores_cams' && (
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Register Store Form & Store List */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
                <StoreIcon size={16} className="text-indigo-400" />
                Register New Retail Store
              </h3>

              <form onSubmit={handleCreateStore} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                    Store Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Walmart Store, Store #1"
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                    Store Location / Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5th Avenue, NYC"
                    value={newStoreLocation}
                    onChange={(e) => setNewStoreLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingStore}
                  className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  {isSubmittingStore ? 'Registering...' : 'Add Retail Location'}
                </button>
              </form>
            </div>

            {/* Registered Stores Cards */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-2">
                <span>Registered Stores ({storesList.length})</span>
                <span className="text-[10px] text-indigo-400 font-mono">Live DB</span>
              </h3>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {storesList.map((st) => (
                  <div
                    key={st.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                      selectedStoreId === st.id
                        ? 'bg-indigo-500/10 border-indigo-500/50 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        {st.name}
                        {selectedStoreId === st.id && (
                          <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-bold uppercase">
                            Active Context
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{st.location || 'Main Branch'}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedStoreId(st.id)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Select
                      </button>
                      <button
                        onClick={() => handleDeleteStore(st.id, st.name)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete Store"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Assign Camera Form & Camera Devices List */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
                <VideoIcon size={16} className="text-purple-400" />
                Assign Hardware Camera Feed
              </h3>

              <form onSubmit={handleCreateCamera} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                      Target Store
                    </label>
                    <select
                      value={selectedStoreId}
                      onChange={(e) => setSelectedStoreId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl outline-none focus:border-purple-500 font-bold"
                    >
                      <option value="">-- Choose Store --</option>
                      {storesList.map((st) => (
                        <option key={st.id} value={st.id}>{st.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                      Camera Identifier
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aisle 5 Overhead"
                      value={newCameraName}
                      onChange={(e) => setNewCameraName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                      Stream Source (RTSP / MP4)
                    </label>
                    <input
                      type="text"
                      placeholder="/videos/cctv_1.mp4"
                      value={newCameraStreamUrl}
                      onChange={(e) => setNewCameraStreamUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                      FOV Angle Degrees (0-360°)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="360"
                      value={newCameraAngle}
                      onChange={(e) => setNewCameraAngle(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                      Floor Coord X (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newCameraX}
                      onChange={(e) => setNewCameraX(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                      Floor Coord Y (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newCameraY}
                      onChange={(e) => setNewCameraY(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl outline-none font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingCamera}
                  className="w-full py-2.5 bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-purple-500/20 cursor-pointer"
                >
                  {isSubmittingCamera ? 'Assigning...' : 'Assign Hardware Feed'}
                </button>
              </form>
            </div>

            {/* Assigned Camera Devices Cards */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-2">
                <span>Hardware Cameras ({camerasList.length})</span>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Streams Active
                </span>
              </h3>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {camerasList.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No camera feeds configured for this store.</p>
                ) : (
                  camerasList.map((cam, idx) => (
                    <div
                      key={cam.id || idx}
                      className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                          <VideoIcon size={14} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            {cam.name}
                            <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono">
                              ONLINE
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Coords: ({cam.position_x}%, {cam.position_y}%) | Angle: {cam.angle || 0}°
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteCamera(cam.id, cam.name)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete Device"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: SHELVES & CATEGORY ZONES */}
      {/* ========================================================================= */}
      {subTab === 'shelves' && (
        <div className="space-y-6">
          
          {/* Search & Filter & Action Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search mapped shelves by name or zone..."
                value={shelfSearch}
                onChange={(e) => setShelfSearch(e.target.value)}
                className="px-3.5 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs outline-none focus:border-indigo-500 w-full sm:w-64"
              />

              <button
                onClick={() => setShowAddShelfModal(!showAddShelfModal)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              >
                <PlusIcon size={14} />
                {showAddShelfModal ? 'Close Form' : '+ Add New Shelf'}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Zone Filter:</span>
              {['ALL', 'ENTRANCE', 'AISLE A', 'AISLE B', 'AISLE C', 'AISLE D', 'PROMOTION AREA', 'CHECKOUT', 'EXIT'].map((z) => (
                <button
                  key={z}
                  onClick={() => setSelectedZoneFilter(z)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedZoneFilter === z
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>

          {/* Expandable Add New Shelf Form Card */}
          {showAddShelfModal && (
            <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-xl space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <PlusIcon size={16} className="text-emerald-400" />
                  Map New Category Shelf
                </h3>
                <span className="text-[10px] text-emerald-400 font-mono">Store Context ID #{selectedStoreId || 1}</span>
              </div>

              <form onSubmit={handleCreateShelf} className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                      Store Context
                    </label>
                    <select
                      value={selectedStoreId}
                      onChange={(e) => setSelectedStoreId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl outline-none focus:border-emerald-500 font-bold"
                    >
                      <option value="">-- Select Store --</option>
                      {storesList.map((st) => (
                        <option key={st.id} value={st.id}>{st.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                      Shelf Identifier / Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Soda Display Shelf A"
                      value={newShelfName}
                      onChange={(e) => setNewShelfName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                      Zone Category
                    </label>
                    <select
                      value={newShelfZone}
                      onChange={(e) => setNewShelfZone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs outline-none focus:border-emerald-500 font-semibold"
                    >
                      <option value="Beverages Zone">Beverages Zone</option>
                      <option value="Snacks Zone">Snacks Zone</option>
                      <option value="Entrance/Exit Foyer">Entrance/Exit Foyer</option>
                      <option value="Checkout Lanes">Checkout Lanes</option>
                      <option value="Main Product Aisle">Main Product Aisle</option>
                      <option value="Apparel & Fashion">Apparel & Fashion</option>
                      <option value="Promotional Endcap">Promotional Endcap</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                      Width (Meters)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newShelfWidth}
                      onChange={(e) => setNewShelfWidth(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                      Height (Meters)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newShelfHeight}
                      onChange={(e) => setNewShelfHeight(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                      Floor Coord X (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newShelfX}
                      onChange={(e) => setNewShelfX(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                      Floor Coord Y (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newShelfY}
                      onChange={(e) => setNewShelfY(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddShelfModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingShelf}
                    className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-2"
                  >
                    <PlusIcon size={14} />
                    {isSubmittingShelf ? 'Mapping...' : 'Add Shelf Mapping'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Shelves List Table / Cards Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-3">
              <span>Mapped Category Shelves ({filteredShelves.length})</span>
              <span className="text-[10px] text-slate-400">Store Context ID #{selectedStoreId || 1}</span>
            </h3>

            {filteredShelves.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">No shelves match your filter query.</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredShelves.map((shelf) => {
                  const zColor = getZoneColor(shelf.zone_name, shelf.name);
                  return (
                    <div
                      key={shelf.id}
                      className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl hover:border-slate-700 transition-all space-y-3 relative group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white">{shelf.name}</h4>
                          <span className={`inline-block text-[9px] px-2 py-0.5 rounded border font-extrabold uppercase mt-1 ${zColor.bg} ${zColor.border} ${zColor.text}`}>
                            {shelf.zone_name}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteShelf(shelf.id, shelf.name)}
                          className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>

                      <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Dimensions: {shelf.width}m x {shelf.height}m</span>
                        <span className="text-indigo-400">Area: {(shelf.width * shelf.height).toFixed(1)} m²</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
