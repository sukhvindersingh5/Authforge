import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { Shield, KeyRound, Mail, ArrowRight, User, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const levels = [
    { label: '', color: 'transparent' },
    { label: 'Weak', color: '#ef4444' },
    { label: 'Fair', color: '#f97316' },
    { label: 'Good', color: '#eab308' },
    { label: 'Strong', color: '#10b981' },
    { label: 'Very Strong', color: '#3b82f6' },
  ];
  return { score, ...levels[Math.min(score, 5)] };
};

export const Signup: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:3000/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('Account created successfully! Redirecting to sign in...');
        setTimeout(() => navigate('/login'), 2200);
      } else {
        setError(data.error?.message || data.message || 'Failed to sign up. Please try again.');
      }
    } catch {
      setError('Network error. Is the AuthForge backend running?');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', backgroundColor: 'var(--bg-base)' }}>
      {/* Left Brand Panel */}
      <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}
        style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.9)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 600, height: 600, background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)', top: -100, left: -100, borderRadius: '50%' }} />
        <div style={{ position: 'absolute', width: 500, height: 500, background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', bottom: -50, right: -50, borderRadius: '50%' }} />
        <Link to="/" style={{ position: 'absolute', top: '2rem', left: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem', transition: 'color 0.2s' }}
          onMouseOver={e => e.currentTarget.style.color = 'var(--text-main)'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <div style={{ zIndex: 10, textAlign: 'center', padding: '0 2rem' }}>
          <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
            <Shield size={72} color="var(--primary)" style={{ marginBottom: '1.5rem', filter: 'drop-shadow(0 0 24px rgba(59,130,246,0.7))' }} />
          </motion.div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', background: 'linear-gradient(135deg, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Join AuthForge</h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', maxWidth: 340, margin: '0 auto', lineHeight: 1.7 }}>The enterprise-grade Identity Provider. Secure, scalable, and beautifully designed for developers.</p>
          <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start', maxWidth: 280, margin: '2rem auto 0' }}>
            {['Free to get started', 'No credit card required', 'SSO, RBAC & MFA included', 'Deploy in minutes'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0 }} />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Right Form Panel */}
      <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}
        style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--bg-base)', padding: '2rem', overflowY: 'auto' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: 460, padding: '2.5rem' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Create your account</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Start securing your app in minutes</p>

          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--danger)', padding: '0.85rem 1rem', borderRadius: 8, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <XCircle size={16} /> {error}
            </motion.div>
          )}

          {success && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: 'var(--success)', padding: '0.85rem 1rem', borderRadius: 8, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <CheckCircle size={16} /> {success}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label className="form-label">First Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input id="signup-firstname" type="text" className="form-input" style={{ paddingLeft: '2.4rem' }} value={firstName} onChange={e => setFirstName(e.target.value)} required />
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label className="form-label">Last Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input id="signup-lastname" type="text" className="form-input" style={{ paddingLeft: '2.4rem' }} value={lastName} onChange={e => setLastName(e.target.value)} required />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="signup-email" type="email" className="form-input" style={{ paddingLeft: '2.4rem' }} value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '0.25rem' }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="signup-password" type="password" className="form-input" style={{ paddingLeft: '2.4rem' }} placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              </div>
            </div>

            {/* Password strength */}
            {password && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: '1.5rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '0.4rem' }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, backgroundColor: i <= strength.score ? strength.color : 'var(--border-light)', transition: 'background-color 0.3s' }} />
                  ))}
                </div>
                <p style={{ fontSize: '0.78rem', color: strength.color, margin: 0, fontWeight: 600 }}>{strength.label}</p>
              </motion.div>
            )}

            <button id="signup-submit" type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', marginTop: password ? 0 : '1.5rem' }} disabled={isSubmitting}>
              {isSubmitting ? 'Creating Account...' : <><ArrowRight size={18} /> Create Free Account</>}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
