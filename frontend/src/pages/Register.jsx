import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'store_manager'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:8001/api/auth/register', {
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: formData.role
      });
      
      setSuccess('✅ Account created successfully! Redirecting to login...');
      setLoading(false);
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
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
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        width: '420px',
        maxWidth: '90%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>📝</div>
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
          Create Account
        </h1>
        
        <p style={{
          textAlign: 'center',
          color: '#6b7280',
          marginBottom: '32px',
          fontSize: '14px'
        }}>
          Choose your role and join the system
        </p>
        
        <form onSubmit={handleRegister}>
          {/* Full Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: '600',
              color: '#374151',
              fontSize: '14px'
            }}>
              👤 Full Name
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'all 0.3s',
                outline: 'none',
                background: 'white',
                color: '#1f2937'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              placeholder="John Doe"
              required
            />
          </div>
          
          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
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
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'all 0.3s',
                outline: 'none',
                background: 'white',
                color: '#1f2937'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              placeholder="user@store.com"
              required
            />
          </div>
          
          {/* Password */}
          <div style={{ marginBottom: '16px' }}>
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
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'all 0.3s',
                outline: 'none',
                background: 'white',
                color: '#1f2937'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              placeholder="Min 6 characters"
              required
              minLength="6"
            />
          </div>
          
          {/* Role Selection - IMPROVED VISIBILITY */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: '600',
              color: '#374151',
              fontSize: '14px'
            }}>
              👔 Select Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #667eea',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                background: 'white',
                cursor: 'pointer',
                color: '#1f2937',
                fontWeight: '500'
              }}
            >
              <option value="super_admin" style={{ 
                color: '#7c3aed', 
                fontWeight: 'bold',
                background: '#f5f3ff',
                padding: '8px'
              }}>
                👑 Super Admin - Full Access
              </option>
              <option value="store_manager" style={{ 
                color: '#2563eb', 
                fontWeight: 'bold',
                background: '#eff6ff',
                padding: '8px'
              }}>
                🏪 Store Manager - Manage Stores
              </option>
              <option value="analyst" style={{ 
                color: '#059669', 
                fontWeight: 'bold',
                background: '#ecfdf5',
                padding: '8px'
              }}>
                📊 Analyst - View Analytics
              </option>
            </select>
          </div>
          
          {/* Error Message */}
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
          
          {/* Success Message */}
          {success && (
            <div style={{
              background: '#d1fae5',
              color: '#065f46',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px',
              border: '1px solid #a7f3d0'
            }}>
              ✅ {success}
            </div>
          )}
          
          {/* Submit Button */}
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
            {loading ? '⏳ Creating Account...' : '🚀 Create Account'}
          </button>
        </form>
        
        {/* Login Link */}
        <div style={{
          marginTop: '20px',
          textAlign: 'center',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '20px'
        }}>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Already have an account?{' '}
            <Link to="/login" style={{
              color: '#667eea',
              textDecoration: 'none',
              fontWeight: '600'
            }}>
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;