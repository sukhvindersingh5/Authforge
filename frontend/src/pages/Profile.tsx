import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, ShieldCheck, KeyRound } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, token, updateUser } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await fetch('http://localhost:3000/api/v1/users/me', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ firstName, lastName })
      });

      if (res.ok) {
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
        const data = await res.json();
        updateUser(data.data);
      } else {
        const data = await res.json();
        setMessage({ text: data.message || 'Failed to update profile', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Network error. Please try again.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);
    setPasswordMessage({ text: '', type: '' });

    if (newPassword.length < 6) {
      setPasswordMessage({ text: 'New password must be at least 6 characters.', type: 'error' });
      setIsChangingPassword(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/v1/auth/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        setPasswordMessage({ text: 'Password changed successfully! You may be signed out on other devices.', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setTimeout(() => setShowPasswordForm(false), 3000);
      } else {
        setPasswordMessage({ text: data.message || 'Failed to change password.', type: 'error' });
      }
    } catch (err) {
      setPasswordMessage({ text: 'Network error. Please try again.', type: 'error' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Profile Settings</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Manage your personal information and security preferences.</p>

      {message.text && (
        <div className={`badge ${message.type === 'success' ? 'badge-success' : 'badge-danger'} mb-4`} style={{ padding: '1rem', borderRadius: '8px', display: 'block', border: `1px solid ${message.type === 'success' ? 'var(--success)' : 'var(--danger)'}`, backgroundColor: 'transparent' }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ flex: 2 }}>
          <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={20} color="var(--primary)" />
              Personal Information
            </h3>
            
            <form onSubmit={handleSave}>
              <div className="flex gap-4" style={{ marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label className="form-label">First Name</label>
                  <input type="text" className="form-input" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                </div>
                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label className="form-label">Last Name</label>
                  <input type="text" className="form-input" value={lastName} onChange={e => setLastName(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="email" className="form-input" value={user?.email || ''} disabled style={{ paddingLeft: '2.5rem', opacity: 0.7, cursor: 'not-allowed' }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Email cannot be changed directly. Please contact support.</span>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="var(--success)" />
              Account Security
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Your account is protected by AuthForge enterprise security.</p>
            
            {!showPasswordForm ? (
              <button 
                onClick={() => setShowPasswordForm(true)}
                className="btn btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <KeyRound size={16} />
                Change Password
              </button>
            ) : (
              <form onSubmit={handleChangePassword} style={{ marginTop: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>Update Password</h4>
                
                {passwordMessage.text && (
                  <div className={`badge ${passwordMessage.type === 'success' ? 'badge-success' : 'badge-danger'} mb-3`} style={{ padding: '0.75rem', borderRadius: '6px', display: 'block', fontSize: '0.8rem' }}>
                    {passwordMessage.text}
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Current Password</label>
                  <input type="password" className="form-input" style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                </div>
                
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>New Password</label>
                  <input type="password" className="form-input" style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }} placeholder="Min 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                  <button type="button" onClick={() => setShowPasswordForm(false)} className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.5rem' }} disabled={isChangingPassword}>
                    {isChangingPassword ? 'Saving...' : 'Update'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
