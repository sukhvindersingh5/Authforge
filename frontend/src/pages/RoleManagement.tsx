import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, Key, X, CheckCircle, ShieldAlert, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  {
    id: 'user',
    name: 'User',
    badge: 'Standard',
    color: '#3b82f6',
    bgColor: 'rgba(59,130,246,0.1)',
    borderColor: 'rgba(59,130,246,0.3)',
    description: 'Default role assigned to all registered users. Provides basic access to personal account features.',
    memberCount: 42,
    permissions: [
      'profile:read', 'profile:update', 'session:read',
      'session:revoke_own', 'password:change',
    ],
  },
  {
    id: 'admin',
    name: 'Admin',
    badge: 'Administrator',
    color: '#10b981',
    bgColor: 'rgba(16,185,129,0.1)',
    borderColor: 'rgba(16,185,129,0.3)',
    description: 'Full administrative access. Can manage users, roles, permissions, and platform configuration.',
    memberCount: 3,
    permissions: [
      'profile:read', 'profile:update', 'session:read',
      'session:revoke_own', 'password:change',
      'users:read', 'users:update', 'users:delete',
      'roles:read', 'roles:assign', 'roles:revoke',
      'audit:read', 'system:config',
    ],
  },
];

const MOCK_USERS = [
  { id: '1', name: 'Alice Admin', email: 'admin@authforge.io', role: 'admin' },
  { id: '2', name: 'Bob User', email: 'user@authforge.io', role: 'user' },
  { id: '3', name: 'Carol Dev', email: 'carol@example.com', role: 'user' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08, ease: 'easeOut' } }),
};

export const RoleManagement: React.FC = () => {
  const { isAdmin } = useAuth();
  const [selected, setSelected] = useState<typeof ROLES[0] | null>(null);
  const [users, setUsers] = useState(MOCK_USERS);

  if (!isAdmin) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
        <ShieldAlert size={64} color="var(--danger)" style={{ margin: '0 auto 1.5rem' }} />
        <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)' }}>Role Management is restricted to Administrators only.</p>
      </div>
    );
  }

  const toggleRole = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId
      ? { ...u, role: u.role === 'admin' ? 'user' : 'admin' }
      : u
    ));
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="flex items-center gap-4 mb-8">
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={24} color="var(--primary)" />
        </div>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Role Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>Define and manage platform roles and their associated permissions.</p>
        </div>
      </motion.div>

      {/* Role Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {ROLES.map((role, i) => (
          <motion.div key={role.id} custom={i + 1} variants={fadeUp} initial="hidden" animate="visible"
            whileHover={{ y: -4, scale: 1.01 }} transition={{ type: 'spring', stiffness: 300 }}
            className="glass-card" style={{ padding: '1.75rem', cursor: 'pointer', border: `1px solid ${role.borderColor}` }}
            onClick={() => setSelected(role)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: role.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: role.color }}>
                  {role.id === 'admin' ? <Shield size={20} /> : <Users size={20} />}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.1rem', color: 'var(--text-main)' }}>{role.name}</h3>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: role.color, background: role.bgColor, padding: '2px 8px', borderRadius: 999, border: `1px solid ${role.borderColor}` }}>{role.badge}</span>
                </div>
              </div>
              <ChevronRight size={18} color="var(--text-muted)" />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>{role.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--text-muted)' }}><Key size={12} style={{ display: 'inline', marginRight: 4 }} />{role.permissions.length} permissions</span>
              <span style={{ color: 'var(--text-muted)' }}><Users size={12} style={{ display: 'inline', marginRight: 4 }} />{role.memberCount} members</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* User-Role Assignment Table */}
      <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>User Role Assignments</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Click to toggle role</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Current Role</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const roleData = ROLES.find(r => r.id === u.role)!;
              return (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                  <td>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: roleData.color, background: roleData.bgColor, padding: '3px 10px', borderRadius: 999, border: `1px solid ${roleData.borderColor}` }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                      onClick={() => toggleRole(u.id)}>
                      {u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      {/* Role Details Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel" style={{ maxWidth: 520, width: '100%', padding: '2.5rem', position: 'relative' }}
              onClick={e => e.stopPropagation()}>
              <button onClick={() => setSelected(null)}
                style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: selected.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: selected.color }}>
                  {selected.id === 'admin' ? <Shield size={26} /> : <Users size={26} />}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{selected.name} Role</h2>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: selected.color }}>{selected.memberCount} members</span>
                </div>
              </div>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>{selected.description}</p>
              <h4 style={{ marginBottom: '1rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Permissions ({selected.permissions.length})</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {selected.permissions.map(p => (
                  <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 600, color: selected.color, background: selected.bgColor, padding: '4px 12px', borderRadius: 999, border: `1px solid ${selected.borderColor}` }}>
                    <CheckCircle size={12} /> {p}
                  </span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
