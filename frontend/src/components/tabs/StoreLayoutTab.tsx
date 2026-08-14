"use client";
import React, { useState, useEffect } from 'react';
import { STORE_ZONES, CAMERA_ZONE_MAP, StoreZoneKey } from '@/lib/storeZones';

interface ZoneItem {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  category: string;
  cameraAssigned: number;
}

export default function StoreLayoutTab() {
  const [zones, setZones] = useState<ZoneItem[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // STEP 1: Fetch the global layout on load
  useEffect(() => {
    fetch('http://127.0.0.1:9000/api/v1/layout')
      .then(res => res.json())
      .then(data => {
        if (data.status === "success" && data.data.length > 0) {
          setZones(data.data);
          setSelectedZoneId(data.data[0].id);
        } else {
          // Fallback to static lib file if database is empty
          const cameraIdByZone: Partial<Record<StoreZoneKey, number>> = {};
          Object.entries(CAMERA_ZONE_MAP).forEach(([camId, zoneKey]) => { cameraIdByZone[zoneKey] = Number(camId); });
          
          const defaultZones = Object.entries(STORE_ZONES).map(([key, z]) => ({
            id: key,
            label: z.label,
            x: z.x,
            y: z.y,
            w: z.w,
            h: z.h,
            category: key.includes('shelf') ? 'Product Display' : 'Transit Zone',
            cameraAssigned: cameraIdByZone[key as StoreZoneKey] ?? 0
          }));
          setZones(defaultZones);
          setSelectedZoneId(defaultZones[0].id);
        }
      })
      .catch(err => console.error("Failed to load layout:", err));
  }, []);

  const selectedZone = zones.find(z => z.id === selectedZoneId) || zones[0];

  // STEP 2: Publish Layout to Backend
  const handlePublishLayout = async () => {
    setIsPublishing(true);
    try {
      const response = await fetch('http://127.0.0.1:9000/api/v1/layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zones)
      });
      if (response.ok) {
        alert("✅ Success! The planogram has been synchronized across all Heatmaps and dashboards.");
      } else {
        alert("❌ Failed to sync layout. Check backend terminal.");
      }
    } catch (err) {
  console.error("Layout sync error:", err);
  alert("❌ Cannot connect to backend server.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSelectZone = (zone: ZoneItem) => {
    setSelectedZoneId(zone.id);
    setIsEditing(false);
  };

  const handleFieldChange = (field: keyof ZoneItem, value: string | number) => {
    if (!selectedZone) return;
    setZones(zones.map(z => z.id === selectedZone.id ? { ...z, [field]: value } : z));
  };

  const handleAddZoneNode = () => {
    const newId = `zone_${Date.now()}`;
    const newZone: ZoneItem = {
      id: newId,
      label: "New Custom Zone",
      x: 0.1, y: 0.1, w: 0.15, h: 0.15,
      category: "Product Display",
      cameraAssigned: 0
    };
    setZones([...zones, newZone]);
    setSelectedZoneId(newId);
    setIsEditing(true);
  };

  const handleDeleteZone = (idToDelete: string) => {
    if (zones.length === 1) {
      alert("Cannot delete: The floor plan requires at least one active zone.");
      return;
    }
    const updatedZones = zones.filter(z => z.id !== idToDelete);
    setZones(updatedZones);
    setSelectedZoneId(updatedZones[0].id);
    setIsEditing(false);
  };

  return (
    <div className="w-full min-w-0 space-y-6 animate-in fade-in duration-500 text-slate-200">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-lg">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-100">Interactive Store Layout Studio</h3>
            <p className="text-xs text-slate-400 mt-1">Configure spatial boundaries, shelf zones, and camera mappings.</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-3">
            <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold">
              Total Zones: {zones.length}
            </span>
            <button 
              onClick={handleAddZoneNode}
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-lg cursor-pointer border border-slate-600"
            >
              + Add Node
            </button>
            <button 
              onClick={handlePublishLayout}
              disabled={isPublishing}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-lg shadow-emerald-900/40 cursor-pointer flex items-center disabled:opacity-50"
            >
              {isPublishing ? "Syncing..." : "💾 Publish Planogram"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-[#0a0f1c] rounded-xl border border-slate-800/80 p-4 relative shadow-inner" style={{ height: 480 }}>
            <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div className="absolute top-3 left-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Floor Plan Canvas (2D Spatial Matrix)</div>

            <div className="absolute inset-12 border border-slate-800/60 rounded-lg bg-slate-900/30 overflow-hidden">
              {zones.map((zone) => {
                const isSelected = selectedZone?.id === zone.id;
                const hasCamera = zone.cameraAssigned > 0;
                return (
                  <div
                    key={zone.id}
                    onClick={() => handleSelectZone(zone)}
                    className={`absolute rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-all duration-300 border backdrop-blur-sm group ${
                      isSelected ? 'bg-cyan-500/25 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] z-20 scale-[1.02]' 
                      : hasCamera ? 'bg-emerald-500/10 border-emerald-500/40 hover:border-emerald-400 z-10' 
                      : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-500 z-10'
                    }`}
                    style={{ left: `${zone.x * 100}%`, top: `${zone.y * 100}%`, width: `${zone.w * 100}%`, height: `${zone.h * 100}%` }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-100 truncate">{zone.label}</span>
                      <span className={`w-2 h-2 rounded-full ${hasCamera ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono flex justify-between mt-auto pt-1 border-t border-white/5">
                      <span>Cam #{zone.cameraAssigned}</span>
                      <span className="text-cyan-400">{zone.category}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h4 className="text-sm font-bold text-slate-100 mb-4 border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>Zone Property Inspector</span>
              {selectedZone && (
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer px-2 py-1 bg-slate-800 rounded border border-slate-700"
                >
                  {isEditing ? 'Done Editing' : 'Edit Properties'}
                </button>
              )}
            </h4>

            {selectedZone ? (
              isEditing ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Zone Label</label>
                    <input type="text" value={selectedZone.label} onChange={(e) => handleFieldChange('label', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Category Type</label>
                    <select value={selectedZone.category} onChange={(e) => handleFieldChange('category', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500">
                      <option value="Product Display">Product Display</option>
                      <option value="Transit Zone">Transit Zone</option>
                      <option value="Checkout Counter">Checkout Counter</option>
                      <option value="Main Entrance">Main Entrance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Assigned Camera ID</label>
                    <input type="number" value={selectedZone.cameraAssigned} onChange={(e) => handleFieldChange('cameraAssigned', Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-[9px] text-slate-400 uppercase font-bold mb-1">X Position</label><input type="number" step="0.01" max="1" min="0" value={selectedZone.x} onChange={(e) => handleFieldChange('x', parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200" /></div>
                    <div><label className="block text-[9px] text-slate-400 uppercase font-bold mb-1">Y Position</label><input type="number" step="0.01" max="1" min="0" value={selectedZone.y} onChange={(e) => handleFieldChange('y', parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-[9px] text-slate-400 uppercase font-bold mb-1">Width</label><input type="number" step="0.01" max="1" min="0.05" value={selectedZone.w} onChange={(e) => handleFieldChange('w', parseFloat(e.target.value) || 0.1)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200" /></div>
                    <div><label className="block text-[9px] text-slate-400 uppercase font-bold mb-1">Height</label><input type="number" step="0.01" max="1" min="0.05" value={selectedZone.h} onChange={(e) => handleFieldChange('h', parseFloat(e.target.value) || 0.1)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button onClick={() => setIsEditing(false)} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg py-2 text-xs font-bold transition-colors cursor-pointer">Done Editing</button>
                    <button onClick={() => handleDeleteZone(selectedZone.id)} className="w-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-lg py-2 text-xs font-bold transition-colors cursor-pointer">Delete Node</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800"><span className="text-slate-500 block uppercase font-bold text-[9px]">Selected Zone ID</span><span className="text-cyan-400 font-mono">{selectedZone.id}</span></div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800"><span className="text-slate-500 block uppercase font-bold text-[9px]">Display Label</span><span className="text-slate-200 font-bold text-sm">{selectedZone.label}</span></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800"><span className="text-slate-500 block uppercase font-bold text-[9px]">Type</span><span className="text-slate-300">{selectedZone.category}</span></div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800"><span className="text-slate-500 block uppercase font-bold text-[9px]">Camera Node</span><span className="text-emerald-400 font-bold">Camera #{selectedZone.cameraAssigned}</span></div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block uppercase font-bold text-[9px]">Spatial Bounding Coords</span>
                    <div className="font-mono text-[10px] text-slate-400 mt-1 grid grid-cols-2 gap-1"><span>X: {selectedZone.x}</span><span>Y: {selectedZone.y}</span><span>Width: {selectedZone.w}</span><span>Height: {selectedZone.h}</span></div>
                  </div>
                </div>
              )
            ) : (
              <p className="text-slate-500 text-xs py-8 text-center">Select any zone block to inspect or modify properties.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}