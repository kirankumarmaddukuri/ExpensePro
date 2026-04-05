import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from '../api/axios.config';
import { updateUser } from '../redux/slices/authSlice';

export default function Settings() {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currencyCode: 'USD'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/users/me');
      if (response.data.success) {
        const currentUser = response.data.data;
        setFormData({
          name: currentUser.name || '',
          email: currentUser.email || '',
          currencyCode: currentUser.currencyCode || 'USD'
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile.');
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        currencyCode: user?.currencyCode || 'USD'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setMessage('');
    setError('');
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await axios.put('/users/me', {
        name: formData.name,
        currencyCode: formData.currencyCode
      });

      if (response.data.success) {
        const updatedUser = response.data.data;
        dispatch(updateUser(updatedUser));
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setMessage('Profile saved successfully.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Settings</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Manage your account preferences.</p>
      </header>

      <div className="glass-panel" style={{ padding: '24px', maxWidth: '600px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Profile</h3>

        {loading && <div style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Loading profile...</div>}
        {error && <div style={{ marginBottom: '16px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>{error}</div>}
        {message && <div style={{ marginBottom: '16px', color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>{message}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Email Address</label>
            <input
              type="email"
              value={formData.email}
              disabled
              style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Base Currency</label>
            <select
              name="currencyCode"
              value={formData.currencyCode}
              onChange={handleChange}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--surface-color)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (EUR)</option>
              <option value="GBP">GBP (GBP)</option>
              <option value="INR">INR (INR)</option>
            </select>
          </div>

          <button
            className="btn-primary"
            style={{ marginTop: '16px', alignSelf: 'flex-start' }}
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  );
}
