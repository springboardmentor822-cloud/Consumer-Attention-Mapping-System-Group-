import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Heatmap = ({ storeId }) => {
  const [heatData, setHeatData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState(null);
  const [stores, setStores] = useState([]);

  // Mock heatmap data - In real app, this comes from camera tracking
  const generateMockData = (storeName) => {
    const points = [];
    const numPoints = 30 + Math.floor(Math.random() * 40);
    
    for (let i = 0; i < numPoints; i++) {
      points.push({
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
        intensity: 0.3 + Math.random() * 0.7
      });
    }
    return points;
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8001/api/stores', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStores(response.data);
      if (response.data.length > 0) {
        setSelectedStore(response.data[0]);
        generateHeatmap(response.data[0]);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching stores:', err);
      setLoading(false);
    }
  };

  const generateHeatmap = (store) => {
    const data = generateMockData(store.name);
    setHeatData(data);
  };

  const handleStoreChange = (storeId) => {
    const store = stores.find(s => s.id === storeId);
    setSelectedStore(store);
    generateHeatmap(store);
  };

  // Calculate color based on intensity
  const getColor = (intensity) => {
    if (intensity > 0.8) return `rgba(255, 0, 0, ${intensity * 0.9})`;
    if (intensity > 0.6) return `rgba(255, 165, 0, ${intensity * 0.8})`;
    if (intensity > 0.4) return `rgba(255, 255, 0, ${intensity * 0.7})`;
    if (intensity > 0.2) return `rgba(0, 255, 0, ${intensity * 0.6})`;
    return `rgba(0, 0, 255, ${intensity * 0.5})`;
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
        ⏳ Loading heatmap data...
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
        <h3>No stores available</h3>
        <p>Create a store to view heatmap data</p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      marginBottom: '24px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h3 style={{ margin: 0, color: '#1f2937' }}>🔥 Store Attention Heatmap</h3>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
            Red = High attention | Blue = Low attention
          </p>
        </div>
        <select
          value={selectedStore?.id || ''}
          onChange={(e) => handleStoreChange(e.target.value)}
          style={{
            padding: '8px 16px',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            background: 'white',
            cursor: 'pointer'
          }}
        >
          {stores.map(store => (
            <option key={store.id} value={store.id}>
              🏪 {store.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{
        position: 'relative',
        background: '#f3f4f6',
        borderRadius: '8px',
        padding: '20px',
        minHeight: '400px',
        border: '2px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        {/* Store Layout Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gridTemplateRows: 'repeat(4, 1fr)',
          gap: '4px',
          height: '100%',
          minHeight: '360px'
        }}>
          {/* Shelves/Racks */}
          {Array.from({ length: 20 }).map((_, index) => {
            const row = Math.floor(index / 5);
            const col = index % 5;
            const dataPoint = heatData[index] || { intensity: 0.2 };
            const intensity = dataPoint.intensity || 0.2;
            
            return (
              <div
                key={index}
                style={{
                  background: getColor(intensity),
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: intensity > 0.6 ? 'white' : '#374151',
                  fontWeight: '600',
                  transition: 'all 0.3s',
                  border: '1px solid rgba(255,255,255,0.3)',
                  position: 'relative'
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div>S{index + 1}</div>
                  <div style={{ fontSize: '8px', opacity: 0.7 }}>
                    {Math.round(intensity * 100)}%
                  </div>
                </div>
                {/* Tooltip on hover */}
                <div style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#1f2937',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  whiteSpace: 'nowrap',
                  display: 'none'
                }}>
                  Shelf {index + 1}: {Math.round(intensity * 100)}% attention
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'rgba(255,255,255,0.9)',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          fontSize: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Low</span>
            <div style={{ display: 'flex', gap: '2px' }}>
              <div style={{ width: '16px', height: '16px', background: '#0000ff', borderRadius: '2px' }}></div>
              <div style={{ width: '16px', height: '16px', background: '#00ff00', borderRadius: '2px' }}></div>
              <div style={{ width: '16px', height: '16px', background: '#ffff00', borderRadius: '2px' }}></div>
              <div style={{ width: '16px', height: '16px', background: '#ff8c00', borderRadius: '2px' }}></div>
              <div style={{ width: '16px', height: '16px', background: '#ff0000', borderRadius: '2px' }}></div>
            </div>
            <span>High</span>
          </div>
        </div>

        {/* Store Info Overlay */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(255,255,255,0.9)',
          padding: '8px 16px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          fontSize: '12px'
        }}>
          <strong>📍 {selectedStore?.name}</strong>
          <span style={{ marginLeft: '8px', color: '#6b7280' }}>
            {selectedStore?.location}
          </span>
        </div>
      </div>

      {/* Heatmap Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px',
        marginTop: '16px'
      }}>
        <div style={{
          background: '#f9fafb',
          padding: '12px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px' }}>🔥</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Hot Zones</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc2626' }}>
            {heatData.filter(d => d.intensity > 0.7).length}
          </div>
        </div>
        <div style={{
          background: '#f9fafb',
          padding: '12px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px' }}>📊</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Avg Attention</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>
            {Math.round(heatData.reduce((acc, d) => acc + d.intensity, 0) / heatData.length * 100)}%
          </div>
        </div>
        <div style={{
          background: '#f9fafb',
          padding: '12px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px' }}>👁️</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Views</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#8b5cf6' }}>
            {heatData.length * 12}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Heatmap;