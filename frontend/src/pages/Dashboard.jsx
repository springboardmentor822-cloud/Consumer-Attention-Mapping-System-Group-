import Heatmap from './Heatmap';
import Camera from './Camera';import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Charts from './Charts';

const Dashboard = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newStore, setNewStore] = useState({ name: '', location: '', description: '' });
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    fetchStores();
  }, [navigate]);

  const fetchStores = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8001/api/stores', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStores(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching stores:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      }
      setLoading(false);
    }
  };

  const createStore = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8001/api/stores', newStore, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowModal(false);
      setNewStore({ name: '', location: '', description: '' });
      fetchStores();
      setCreating(false);
    } catch (err) {
      console.error('Error creating store:', err);
      setCreating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Role-based access
  const userRole = user?.role || 'analyst';
  const isSuperAdmin = userRole === 'super_admin';
  const isStoreManager = userRole === 'store_manager' || isSuperAdmin;
  const isAnalyst = userRole === 'analyst' || isStoreManager || isSuperAdmin;

  // Role badge color
  const getRoleBadge = () => {
    if (isSuperAdmin) return { bg: '#8b5cf6', label: '👑 Admin' };
    if (isStoreManager) return { bg: '#3b82f6', label: '🏪 Manager' };
    return { bg: '#10b981', label: '📊 Analyst' };
  };
  const roleBadge = getRoleBadge();

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* Navigation Bar */}
      <nav style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '16px 32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>📊</span>
          <h1 style={{ 
            fontSize: '22px', 
            fontWeight: '700',
            color: 'white',
            margin: 0
          }}>
            Consumer Attention Dashboard
          </h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ 
            color: 'rgba(255,255,255,0.9)',
            fontSize: '14px',
            background: 'rgba(255,255,255,0.2)',
            padding: '6px 16px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            👤 {user?.email || 'User'}
            <span style={{
              background: roleBadge.bg,
              padding: '2px 10px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: '600',
              color: 'white'
            }}>
              {roleBadge.label}
            </span>
          </span>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              padding: '8px 20px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.2)';
            }}
          >
            🚪 Logout
          </button>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Welcome Banner */}
        <div style={{
          background: 'white',
          padding: '24px 32px',
          borderRadius: '12px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          borderLeft: `4px solid ${isSuperAdmin ? '#8b5cf6' : isStoreManager ? '#3b82f6' : '#10b981'}`
        }}>
          <h2 style={{ margin: 0, color: '#1f2937' }}>
            👋 Welcome back, {user?.full_name || 'User'}!
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280' }}>
            {isSuperAdmin ? '👑 You have full system access' :
             isStoreManager ? '🏪 Manage your stores and inventory' :
             '📊 View analytics and insights'}
          </p>
        </div>

        {/* Stats Cards - Role Based */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          {isStoreManager && (
            <>
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                borderTop: '4px solid #667eea'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '28px' }}>🏪</span>
                  <div>
                    <h3 style={{ margin: 0, color: '#6b7280', fontSize: '13px', fontWeight: '500' }}>
                      Total Stores
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
                      {stores.length}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                borderTop: '4px solid #34d399'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '28px' }}>✅</span>
                  <div>
                    <h3 style={{ margin: 0, color: '#6b7280', fontSize: '13px', fontWeight: '500' }}>
                      Active Stores
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
                      {stores.filter(s => s.is_active).length}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {isAnalyst && (
            <>
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                borderTop: '4px solid #f59e0b'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '28px' }}>📈</span>
                  <div>
                    <h3 style={{ margin: 0, color: '#6b7280', fontSize: '13px', fontWeight: '500' }}>
                      Total Shelves
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
                      --
                    </p>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                borderTop: '4px solid #ef4444'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '28px' }}>👁️</span>
                  <div>
                    <h3 style={{ margin: 0, color: '#6b7280', fontSize: '13px', fontWeight: '500' }}>
                      Attention Events
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
                      --
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {isSuperAdmin && (
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              borderTop: '4px solid #8b5cf6',
              gridColumn: 'span 2'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '28px' }}>👑</span>
                <div>
                  <h3 style={{ margin: 0, color: '#6b7280', fontSize: '13px', fontWeight: '500' }}>
                    Super Admin Access
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '600', color: '#8b5cf6' }}>
                    Full system control enabled
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Charts Section - Visible to Analysts and above */}
        {isAnalyst && <Charts stores={stores} />}

        {/* Heatmap Section - Visible to Analysts and above */}
        {isAnalyst && <Heatmap stores={stores} />}

        {/* Camera Section - Visible to Analysts and above */}
        {isAnalyst && <Camera />}

        {/* Add Store Modal */}
        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              padding: '40px',
              borderRadius: '16px',
              width: '500px',
              maxWidth: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
              <h2 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>🏪 Add New Store</h2>
              <p style={{ margin: '0 0 24px 0', color: '#6b7280' }}>Fill in the details to create a new store</p>
              
              <form onSubmit={createStore}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px', color: '#374151' }}>
                    Store Name *
                  </label>
                  <input
                    type="text"
                    value={newStore.name}
                    onChange={(e) => setNewStore({...newStore, name: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    placeholder="e.g., Main Street Store"
                    required
                  />
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px', color: '#374151' }}>
                    Location *
                  </label>
                  <input
                    type="text"
                    value={newStore.location}
                    onChange={(e) => setNewStore({...newStore, location: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    placeholder="e.g., 123 Main St, City"
                    required
                  />
                </div>
                
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px', color: '#374151' }}>
                    Description (Optional)
                  </label>
                  <textarea
                    value={newStore.description}
                    onChange={(e) => setNewStore({...newStore, description: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    placeholder="Describe your store..."
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      padding: '10px 24px',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    style={{
                      padding: '10px 24px',
                      background: creating ? '#93c5fd' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: creating ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                    }}
                  >
                    {creating ? 'Creating...' : '✨ Create Store'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Stores Table - Only for Store Managers and above */}
        {isStoreManager && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            overflow: 'hidden'
          }}>
            <div style={{ 
              padding: '20px 24px', 
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#1f2937' }}>
                📋 Your Stores
              </h2>
              {isStoreManager ? (
                <button
                  onClick={() => setShowModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '8px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }}
                >
                  + Add New Store
                </button>
              ) : (
                <span style={{ color: '#6b7280', fontSize: '14px' }}>
                  🔒 View only mode
                </span>
              )}
            </div>
            
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
                ⏳ Loading stores...
              </div>
            ) : stores.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏪</div>
                <h3 style={{ margin: 0, color: '#1f2937' }}>No stores found</h3>
                <p style={{ margin: '4px 0 0 0' }}>Create your first store to get started!</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                      Store Name
                    </th>
                    <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                      Location
                    </th>
                    <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                      Status
                    </th>
                    <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map((store, index) => (
                    <tr key={store.id} style={{ 
                      borderBottom: '1px solid #f3f4f6',
                      background: index % 2 === 0 ? 'white' : '#fafafa'
                    }}>
                      <td style={{ padding: '12px 20px', fontWeight: '500', color: '#1f2937' }}>
                        {store.name}
                      </td>
                      <td style={{ padding: '12px 20px', color: '#6b7280' }}>
                        📍 {store.location}
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{
                          padding: '4px 14px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: store.is_active ? '#d1fae5' : '#fee2e2',
                          color: store.is_active ? '#065f46' : '#991b1b'
                        }}>
                          {store.is_active ? '🟢 Active' : '🔴 Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                        <button style={{
                          padding: '4px 12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          background: 'white',
                          cursor: 'pointer',
                          fontSize: '12px',
                          color: '#6b7280'
                        }}>
                          👁️ View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Analyst View - If no stores and user is analyst */}
        {!isStoreManager && isAnalyst && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '60px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <h3 style={{ margin: 0, color: '#1f2937' }}>Analyst Dashboard</h3>
            <p style={{ margin: '8px 0 0 0', color: '#6b7280' }}>
              You have view-only access to analytics and charts.
            </p>
            <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
              Contact a Store Manager or Admin to manage stores.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
