import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, KeyRound, Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleDemoFill = (role: 'admin' | 'user') => {
    if (role === 'admin') {
      setEmail('admin@authforge.io');
      setPassword('Admin@123456!');
    } else {
      setEmail('user@authforge.io');
      setPassword('User@123456!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.data.access_token, data.data.user);
        navigate('/dashboard');
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch {
      setError('Network error. Is the AuthForge backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', backgroundColor: 'var(--bg-base)' }}>
      {/* Left Brand Panel */}
      <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}
        style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.9)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 600, height: 600, background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)', top: -100, left: -100, borderRadius: '50%' }} />
        <div style={{ position: 'absolute', width: 500, height: 500, background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', bottom: -50, right: -50, borderRadius: '50%' }} />
        <Link to="/" style={{ position: 'absolute', top: '2rem', left: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem', transition: 'color 0.2s' }}
          onMouseOver={e => e.currentTarget.style.color = 'var(--text-main)'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <div style={{ zIndex: 10, textAlign: 'center' }}>
          <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
            <Shield size={80} color="var(--primary)" style={{ marginBottom: '2rem', filter: 'drop-shadow(0 0 24px rgba(59,130,246,0.7))' }} />
          </motion.div>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem', background: 'linear-gradient(135deg, #fff, #93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AuthForge.</h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: 360, margin: '0 auto', lineHeight: 1.7 }}>Enterprise-grade Authentication &amp; Authorization Infrastructure.</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '2rem', flexWrap: 'wrap' }}>
            {['SSO', 'OAuth 2.0', 'RBAC', 'MFA'].map(f => (
              <span key={f} style={{ padding: '4px 12px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600, color: '#93c5fd', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}>{f}</span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Right Form Panel */}
      <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}
        style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--bg-base)', padding: '2rem' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: 450, padding: '2.5rem' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Welcome back</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Sign in to your AuthForge dashboard</p>

          <div className="flex gap-2 mb-4">
            <button id="login-admin-btn" className="btn btn-secondary" style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }} onClick={() => handleDemoFill('admin')}>
              🔑 Admin
            </button>
            <button id="login-user-btn" className="btn btn-secondary" style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }} onClick={() => handleDemoFill('user')}>
              👤 User
            </button>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mb-4"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.9rem' }}>
              <AlertCircle size={16} /> {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="login-email" type="email" className="form-input" style={{ paddingLeft: '2.5rem' }} value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <div className="flex justify-between items-center">
                <label className="form-label">Password</label>
                <Link to="/signup" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>Create account</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <KeyRound size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="login-password" type="password" className="form-input" style={{ paddingLeft: '2.5rem' }} value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            </div>

            <button id="login-submit" type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem' }} disabled={isLoading}>
              {isLoading ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Sign up free</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
