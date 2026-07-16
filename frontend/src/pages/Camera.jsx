import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const Camera = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [detections, setDetections] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('main');
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const cameras = [
    { id: 'main', name: '📷 Main Entrance' },
    { id: 'aisle1', name: '📷 Aisle 1' },
    { id: 'aisle2', name: '📷 Aisle 2' },
    { id: 'checkout', name: '📷 Checkout Area' }
  ];

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
      }
    } catch (err) {
      console.error('Error fetching stores:', err);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'environment'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
        startDetection();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('⚠️ Unable to access camera. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setDetections([]);
  };

  const startDetection = () => {
    setIsLoading(true);
    const interval = setInterval(() => {
      const mockDetections = [
        { id: 1, label: '👤 Customer', confidence: 0.92, attention: 64, x: 20 + Math.random() * 60, y: 20 + Math.random() * 60 },
        { id: 2, label: '👤 Customer', confidence: 0.88, attention: 71, x: 20 + Math.random() * 60, y: 20 + Math.random() * 60 },
        { id: 3, label: '👤 Customer', confidence: 0.75, attention: 68, x: 20 + Math.random() * 60, y: 20 + Math.random() * 60 },
        { id: 4, label: '🛒 Cart', confidence: 0.65, attention: 45, x: 20 + Math.random() * 60, y: 20 + Math.random() * 60 },
      ];
      
      setDetections(mockDetections);
      setIsLoading(false);
      drawDetections(mockDetections);
    }, 2000);

    return () => clearInterval(interval);
  };

  const drawDetections = (detections) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    detections.forEach(det => {
      const x = (det.x / 100) * canvas.width;
      const y = (det.y / 100) * canvas.height;
      const w = 80;
      const h = 80;

      // Attention color: Red = High, Yellow = Medium, Green = Low
      let boxColor;
      if (det.attention > 70) boxColor = '#dc2626';
      else if (det.attention > 50) boxColor = '#f59e0b';
      else boxColor = '#10b981';

      ctx.strokeStyle = boxColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(x - w/2, y - h/2, w, h);

      // Attention glow effect
      const gradient = ctx.createRadialGradient(x, y, 5, x, y, 40);
      gradient.addColorStop(0, `${boxColor}40`);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 40, 0, Math.PI * 2);
      ctx.fill();

      // Label background
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.roundRect(x - 35, y - h/2 - 30, 70, 24, 6);
      ctx.fill();

      // Label text
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${det.label} ${det.attention}%`, x, y - h/2 - 14);

      // Confidence bar
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.roundRect(x - 30, y + h/2 + 6, 60, 12, 4);
      ctx.fill();

      const confidenceWidth = (det.confidence * 100) / 100 * 56;
      ctx.fillStyle = boxColor;
      ctx.roundRect(x - 28, y + h/2 + 8, confidenceWidth, 8, 3);
      ctx.fill();

      ctx.fillStyle = 'white';
      ctx.font = '8px Arial';
      ctx.fillText(`${Math.round(det.confidence * 100)}%`, x + 20, y + h/2 + 16);
    });
  };

  // roundRect polyfill for canvas
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      if (r > w/2) r = w/2;
      if (r > h/2) r = h/2;
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      return this;
    };
  }

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      marginBottom: '24px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h3 style={{ margin: 0, color: '#1f2937', fontSize: '20px' }}>📹 Live Store Camera</h3>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
            AI-powered customer attention detection
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select
            value={selectedStore?.id || ''}
            onChange={(e) => setSelectedStore(stores.find(s => s.id === e.target.value))}
            style={{
              padding: '8px 16px',
              border: '2px solid #667eea',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              background: 'white',
              cursor: 'pointer',
              color: '#1f2937',
              fontWeight: '500'
            }}
          >
            {stores.map(store => (
              <option key={store.id} value={store.id}>🏪 {store.name}</option>
            ))}
          </select>

          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            style={{
              padding: '8px 16px',
              border: '2px solid #667eea',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              background: 'white',
              cursor: 'pointer',
              color: '#1f2937',
              fontWeight: '500'
            }}
          >
            {cameras.map(cam => (
              <option key={cam.id} value={cam.id}>{cam.name}</option>
            ))}
          </select>

          {!isStreaming ? (
            <button
              onClick={startCamera}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '8px 24px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                fontSize: '14px'
              }}
            >
              ▶️ Start Camera
            </button>
          ) : (
            <button
              onClick={stopCamera}
              style={{
                background: '#dc2626',
                color: 'white',
                padding: '8px 24px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              ⏹️ Stop
            </button>
          )}
        </div>
      </div>

      {/* Video Feed */}
      <div style={{
        position: 'relative',
        background: '#1a1a2e',
        borderRadius: '12px',
        overflow: 'hidden',
        minHeight: '400px',
        border: '2px solid #667eea'
      }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            width: '100%',
            height: 'auto',
            display: isStreaming ? 'block' : 'none'
          }}
        />
        
        {!isStreaming && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '400px',
            color: '#9ca3af'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📷</div>
            <h3 style={{ color: 'white', margin: 0 }}>Camera Offline</h3>
            <p style={{ color: '#9ca3af' }}>Click "Start Camera" to begin live feed</p>
          </div>
        )}

        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
        />

        {isLoading && isStreaming && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0,0,0,0.8)',
            padding: '20px 40px',
            borderRadius: '12px',
            color: 'white',
            fontSize: '16px'
          }}>
            ⏳ Analyzing video feed...
          </div>
        )}

        {isStreaming && (
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(0,0,0,0.8)',
            padding: '6px 16px',
            borderRadius: '20px'
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              background: '#34d399',
              borderRadius: '50%',
              animation: 'pulse 1s infinite'
            }}></div>
            <span style={{ color: 'white', fontSize: '12px', fontWeight: '600' }}>LIVE</span>
            <span style={{ color: '#9ca3af', fontSize: '12px' }}>
              {selectedStore?.name} - {cameras.find(c => c.id === selectedCamera)?.name}
            </span>
          </div>
        )}

        {isStreaming && detections.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(0,0,0,0.8)',
            padding: '6px 16px',
            borderRadius: '20px',
            color: 'white',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            👤 {detections.filter(d => d.label.includes('Customer')).length} people detected
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px',
        marginTop: '16px'
      }}>
        <div style={{
          background: '#f3f4f6',
          padding: '16px',
          borderRadius: '10px',
          textAlign: 'center',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '24px' }}>👁️</div>
          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>People Detected</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#3b82f6' }}>
            {detections.filter(d => d.label.includes('Customer')).length}
          </div>
        </div>
        <div style={{
          background: '#f3f4f6',
          padding: '16px',
          borderRadius: '10px',
          textAlign: 'center',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '24px' }}>🎯</div>
          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Avg Attention</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#8b5cf6' }}>
            {detections.length > 0 ? Math.round(detections.reduce((acc, d) => acc + d.attention, 0) / detections.length) : 0}%
          </div>
        </div>
        <div style={{
          background: '#f3f4f6',
          padding: '16px',
          borderRadius: '10px',
          textAlign: 'center',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '24px' }}>📊</div>
          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Status</div>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: 'bold', 
            color: isStreaming ? '#059669' : '#dc2626'
          }}>
            {isStreaming ? '✅ Online' : '⭕ Offline'}
          </div>
        </div>
        <div style={{
          background: '#f3f4f6',
          padding: '16px',
          borderRadius: '10px',
          textAlign: 'center',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '24px' }}>📹</div>
          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Camera</div>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: 'bold', 
            color: '#667eea'
          }}>
            {cameras.find(c => c.id === selectedCamera)?.name || 'Main'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Camera;