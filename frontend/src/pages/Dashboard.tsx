import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield, LayoutDashboard, Users, LogOut, Settings, Code,
  ShieldCheck, Home, Copy, Check, Globe, Key, Activity,
  ArrowRight, RefreshCw, BookOpen, Terminal, Zap
} from 'lucide-react';

// ─── Sidebar Layout ─────────────────────────────────────────────────────────

export const DashboardLayout: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navSections = [
    {
      label: 'Main',
      items: [
        { name: 'Overview', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
        { name: 'Developer API', path: '/dashboard/integration', icon: <Code size={18} /> },
        { name: 'Profile Settings', path: '/dashboard/settings', icon: <Settings size={18} /> },
      ],
    },
    ...(isAdmin ? [{
      label: 'Admin',
      items: [
        { name: 'User Management', path: '/dashboard/admin/users', icon: <Users size={18} /> },
      ],
    }] : []),
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: 'var(--bg-base)', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: '260px', flexShrink: 0, height: '100vh', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-light)', backgroundColor: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(12px)' }}>
        {/* Logo */}
        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={20} color="var(--primary)" style={{ filter: 'drop-shadow(0 0 6px rgba(59,130,246,0.5))' }} />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>AuthForge</p>
            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>Developer Console</p>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0.75rem' }}>
          {/* Back to home */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.75rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.82rem', marginBottom: '1rem', borderRadius: 8, transition: 'all 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
            onMouseOut={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
            <Home size={15} /> Back to Home
          </Link>

          {navSections.map(section => (
            <div key={section.label} style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', paddingLeft: '0.75rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                {section.label}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {section.items.map(item => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button key={item.path} onClick={() => navigate(item.path)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.6rem 0.75rem', borderRadius: 8, cursor: 'pointer',
                        backgroundColor: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
                        color: isActive ? '#60a5fa' : 'var(--text-muted)',
                        border: isActive ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
                        fontWeight: isActive ? 600 : 400, fontSize: '0.875rem', transition: 'all 0.15s',
                        textAlign: 'left',
                      }}
                      onMouseOver={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-main)'; } }}
                      onMouseOut={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; } }}>
                      {item.icon}
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User footer */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.firstName} {user?.lastName}</p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: isAdmin ? '#10b981' : 'var(--text-muted)' }}>{isAdmin ? '✦ Admin' : 'User'}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.55rem', backgroundColor: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-muted)', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', transition: 'all 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.05)'; }}
            onMouseOut={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 2.5rem' }} className="animate-fade-in">
        <Outlet />
      </div>
    </div>
  );
};

// ─── Copy Button ─────────────────────────────────────────────────────────────

const CopyBtn: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const doCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={doCopy}
      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: copied ? 'var(--success)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', transition: 'color 0.2s', padding: '0.25rem 0.5rem', borderRadius: 6 }}
      title="Copy to clipboard">
      {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
    </button>
  );
};

// ─── Overview (Main Page) ────────────────────────────────────────────────────

export const Overview: React.FC = () => {
  const { user, token, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [userCount, setUserCount] = useState<number | null>(null);
  const BASE_URL = 'http://localhost:3000/api/v1';

  useEffect(() => {
    if (isAdmin && token) {
      fetch('http://localhost:3000/api/v1/users', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { if (d.data?.users) setUserCount(d.data.users.length); })
        .catch(() => {});
    }
  }, [isAdmin, token]);

  const quickStartSteps = [
    { step: '1', title: 'Your API Base URL', desc: 'Use this URL to call AuthForge from your app', code: BASE_URL },
    { step: '2', title: 'Register a user from your app', desc: 'POST request to create a new user', code: `POST ${BASE_URL}/auth/signup` },
    { step: '3', title: 'Login and get a token', desc: 'Returns a JWT you can use to identify the user', code: `POST ${BASE_URL}/auth/login` },
    { step: '4', title: 'Verify the token anytime', desc: 'Call this with Bearer token to get user info', code: `GET ${BASE_URL}/users/me` },
  ];

  const apiEndpoints = [
    { method: 'POST', path: '/auth/signup',  color: '#10b981', desc: 'Create a new user account' },
    { method: 'POST', path: '/auth/login',   color: '#10b981', desc: 'Login and receive JWT token' },
    { method: 'POST', path: '/auth/logout',  color: '#f97316', desc: 'Invalidate the current session' },
    { method: 'POST', path: '/auth/refresh', color: '#10b981', desc: 'Get a new access token' },
    { method: 'GET',  path: '/users/me',     color: '#3b82f6', desc: 'Get the logged-in user info' },
    { method: 'GET',  path: '/health',       color: '#3b82f6', desc: 'Check if the server is running' },
  ];

  const recentEvents = [
    { event: 'Signed in successfully', time: 'Just now', dot: 'var(--success)' },
    { event: 'Token issued (JWT)',      time: '2 min ago', dot: 'var(--primary)' },
    { event: 'Session started',         time: '2 min ago', dot: 'var(--primary)' },
  ];

  return (
    <div style={{ maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.3rem' }}>
          Welcome, {user?.firstName} 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          {isAdmin
            ? 'You are logged in as Admin — you can manage users, roles, and the full platform.'
            : 'You are logged in as a User — manage your profile and connect your app to AuthForge below.'}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          {
            label: 'Account Status',
            value: 'Active',
            icon: <Zap size={18} />,
            color: 'var(--success)',
            bg: 'rgba(16,185,129,0.1)',
          },
          {
            label: 'Your Role',
            value: isAdmin ? 'Admin' : 'User',
            icon: isAdmin ? <ShieldCheck size={18} /> : <Users size={18} />,
            color: isAdmin ? '#10b981' : 'var(--primary)',
            bg: isAdmin ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
          },
          {
            label: 'API Base URL',
            value: 'localhost:3000',
            icon: <Globe size={18} />,
            color: '#a78bfa',
            bg: 'rgba(139,92,246,0.1)',
          },
          ...(isAdmin ? [{
            label: 'Total Users',
            value: userCount !== null ? String(userCount) : '...',
            icon: <Users size={18} />,
            color: '#f97316',
            bg: 'rgba(249,115,22,0.1)',
          }] : []),
        ].map(card => (
          <div key={card.label} className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: card.bg, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {card.icon}
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>{card.label}</span>
            </div>
            <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: card.color }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Start — How to use AuthForge in your app */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Terminal size={20} color="var(--primary)" />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>How to use AuthForge in your app</h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>Copy these endpoints and call them from any language — Node.js, Python, PHP, etc.</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {quickStartSteps.map(s => (
            <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.9rem 1rem', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                {s.step}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>{s.title}</p>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.desc}</p>
              </div>
              <code style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#93c5fd', background: 'rgba(59,130,246,0.08)', padding: '0.3rem 0.75rem', borderRadius: 6, whiteSpace: 'nowrap', flexShrink: 0 }}>
                {s.code}
              </code>
              <CopyBtn text={s.code} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.6rem 1.2rem' }} onClick={() => navigate('/dashboard/integration')}>
            <BookOpen size={15} /> Full API Guide
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* API Endpoints Reference */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Key size={18} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: '1rem' }}>API Endpoints</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {apiEndpoints.map(ep => (
              <div key={ep.path} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.015)', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: `${ep.color}15`, color: ep.color, minWidth: 38, textAlign: 'center', flexShrink: 0 }}>
                  {ep.method}
                </span>
                <code style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#94a3b8', flex: 1 }}>{ep.path}</code>
                <CopyBtn text={`${BASE_URL}${ep.path}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} color="var(--primary)" />
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Recent Activity</h3>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {recentEvents.map((e, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.015)', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: e.dot, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem' }}>{e.event}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>{e.time}</span>
              </div>
            ))}
          </div>

          {/* Admin quick-access */}
          {isAdmin && (
            <div style={{ marginTop: '1.25rem', padding: '1rem', borderRadius: 10, background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(16,185,129,0.06))', border: '1px solid rgba(59,130,246,0.2)' }}>
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.82rem', fontWeight: 600, color: '#60a5fa' }}>⚡ Admin Quick Access</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <button className="btn btn-secondary" style={{ width: '100%', fontSize: '0.8rem', padding: '0.45rem', justifyContent: 'flex-start', gap: '0.5rem' }} onClick={() => navigate('/dashboard/admin/users')}>
                  <Users size={13} /> Manage Users <ArrowRight size={12} style={{ marginLeft: 'auto' }} />
                </button>
                <button className="btn btn-secondary" style={{ width: '100%', fontSize: '0.8rem', padding: '0.45rem', justifyContent: 'flex-start', gap: '0.5rem' }} onClick={() => navigate('/dashboard/admin/roles')}>
                  <ShieldCheck size={13} /> Manage Roles <ArrowRight size={12} style={{ marginLeft: 'auto' }} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* What you can do next */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <RefreshCw size={18} color="var(--primary)" />
          <h3 style={{ margin: 0, fontSize: '1rem' }}>What you can do</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {[
            { icon: <Code size={16} />, title: 'Connect your app', desc: 'Use the API to add login/signup to any project', path: '/dashboard/integration', color: '#60a5fa' },
            { icon: <Settings size={16} />, title: 'Update your profile', desc: 'Change your name or account settings', path: '/dashboard/settings', color: '#a78bfa' },
            ...(isAdmin ? [
              { icon: <Users size={16} />, title: 'Manage users', desc: 'See all registered users and edit their roles', path: '/dashboard/admin/users', color: '#10b981' },
              { icon: <ShieldCheck size={16} />, title: 'Set roles', desc: 'Promote users to admin or adjust permissions', path: '/dashboard/admin/roles', color: '#f97316' },
            ] : []),
          ].map(a => (
            <button key={a.title} onClick={() => navigate(a.path)}
              style={{ display: 'flex', gap: '0.75rem', padding: '0.9rem', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
              onMouseOut={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'var(--border-light)'; }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${a.color}18`, color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {a.icon}
              </div>
              <div>
                <p style={{ margin: '0 0 0.2rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>{a.title}</p>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>{a.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
