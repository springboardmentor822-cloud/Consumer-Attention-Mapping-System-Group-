import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:8001/api/auth/login', {
        email,
        password
      });
      
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data));
      
      setLoading(false);
      navigate('/dashboard');
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'white',
        padding: '48px',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        width: '420px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏪</div>
        </div>
        
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          textAlign: 'center',
          marginBottom: '4px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Consumer Attention System
        </h1>
        
        <p style={{
          textAlign: 'center',
          color: '#6b7280',
          marginBottom: '32px',
          fontSize: '14px'
        }}>
          AI-Powered Retail Intelligence
        </p>
        
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px', 
              fontWeight: '600',
              color: '#374151',
              fontSize: '14px'
            }}>
              📧 Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'all 0.3s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              placeholder="manager@store.com"
              required
            />
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px', 
              fontWeight: '600',
              color: '#374151',
              fontSize: '14px'
            }}>
              🔒 Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'all 0.3s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              placeholder="Enter your password"
              required
            />
          </div>
          
          {error && (
            <div style={{
              background: '#fef2f2',
              color: '#dc2626',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px',
              border: '1px solid #fecaca'
            }}>
              ❌ {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#93c5fd' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.target.style.transform = 'scale(1)';
            }}
          >
            {loading ? '⏳ Logging in...' : '🚀 Login'}
          </button>
        </form>
        
        <div style={{
          marginTop: '20px',
          textAlign: 'center',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '20px'
        }}>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ 
              color: '#667eea', 
              textDecoration: 'none',
              fontWeight: '600'
            }}>
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;