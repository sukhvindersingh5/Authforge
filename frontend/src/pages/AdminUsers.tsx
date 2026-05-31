import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { User } from '../context/AuthContext';
import { Users, AlertCircle, Search, ShieldAlert } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const { token, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAdmin && token) {
      fetchUsers();
    }
  }, [isAdmin, token]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/v1/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.data.users);
      } else {
        setError(data.message || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Network error connecting to AuthForge backend');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
        <ShieldAlert size={64} color="var(--danger)" style={{ margin: '0 auto 1.5rem auto' }} />
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--danger)' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)' }}>You do not have the required permissions to view this page. This area is restricted to Administrators only.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={32} color="var(--primary)" />
            User Management
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage user accounts, roles, and permissions across the platform.</p>
        </div>
        
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search users by name or email..." 
            className="form-input" 
            style={{ paddingLeft: '2.5rem', borderRadius: '999px', backgroundColor: 'var(--bg-surface)' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="badge badge-danger flex items-center gap-2 mb-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading users...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.filter(u => 
                u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                u.email.toLowerCase().includes(searchTerm.toLowerCase())
              ).map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.firstName} {u.lastName}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                  <td>
                    <span className="badge badge-success">Active</span>
                  </td>
                </tr>
              ))}
              {users.filter(u => 
                u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                u.email.toLowerCase().includes(searchTerm.toLowerCase())
              ).length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    {searchTerm ? 'No users match your search.' : 'No users found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
