import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit2, Trash2, Shield, RefreshCw,
  UserCheck, UserX, KeyRound, Users, Save, Eye, EyeOff
} from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

const ROLES = ['ADMIN', 'OWNER', 'SALES', 'PURCHASE', 'MANUFACTURING', 'INVENTORY'];

const ROLE_BADGES = {
  ADMIN:         { label: 'Admin',          color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  OWNER:         { label: 'Business Owner', color: '#84cc16', bg: 'rgba(132,204,22,0.12)' },
  SALES:         { label: 'Sales Manager',  color: '#14b8a6', bg: 'rgba(20,184,166,0.12)' },
  PURCHASE:      { label: 'Purchase Mgr',   color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  MANUFACTURING: { label: 'Mfg. Manager',   color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  INVENTORY:     { label: 'Inv. Manager',   color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
};

const EMPTY_FORM = { employee_id: '', name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'SALES', status: 'ACTIVE' };

// ─── Password Strength ──────────────────────────────────────────
function PasswordStrength({ password }) {
  const checks = [
    { label: 'At least 6 characters', pass: password.length >= 6 },
    { label: 'Contains a number',     pass: /\d/.test(password) },
    { label: 'Contains a letter',     pass: /[a-zA-Z]/.test(password) },
  ];
  const strength = checks.filter(c => c.pass).length;
  const colors = ['var(--accent-red)', 'var(--accent-orange)', 'var(--accent-green)'];
  const labels = ['Weak', 'Fair', 'Strong'];

  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < strength ? colors[strength - 1] : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
        ))}
      </div>
      <div style={{ fontSize: 11, color: strength > 0 ? colors[strength - 1] : 'var(--text-muted)', fontWeight: 600 }}>
        {strength > 0 ? labels[strength - 1] : ''}
      </div>
    </div>
  );
}

// ─── User Form Modal ────────────────────────────────────────────
function UserForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm]     = useState(initial || EMPTY_FORM);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format';
    if (!initial?.id) {
      if (!form.password) errs.password = 'Password is required';
      else if (form.password.length < 6) errs.password = 'Minimum 6 characters';
      if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    }
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(form);
  };

  const isEdit = !!initial?.id;

  return (
    <div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Employee ID</label>
          <input className="form-input" value={form.employee_id} onChange={e => set('employee_id', e.target.value)} placeholder="EMP-001" />
        </div>
        <div className="form-group">
          <label className="form-label">Role *</label>
          <select className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>
            {ROLES.map(r => <option key={r} value={r}>{ROLE_BADGES[r]?.label || r}</option>)}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Full Name *</label>
        <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full Name" />
        {errors.name && <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 4 }}>{errors.name}</div>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Email Address *</label>
          <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="user@company.com" />
          {errors.email && <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 4 }}>{errors.email}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
        </div>
      </div>

      {!isEdit && (
        <>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password *</label>
              <div style={{ position: 'relative' }}>
                <input className="form-input" type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={e => set('password', e.target.value)} placeholder="Min. 6 characters"
                  style={{ paddingRight: 36 }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
              {errors.password && <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 4 }}>{errors.password}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input className="form-input" type="password" value={form.confirmPassword}
                onChange={e => set('confirmPassword', e.target.value)} placeholder="Repeat password" />
              {errors.confirmPassword && <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 4 }}>{errors.confirmPassword}</div>}
            </div>
          </div>
        </>
      )}

      <div className="form-group">
        <label className="form-label">Status</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {['ACTIVE', 'INACTIVE'].map(s => (
            <div key={s} onClick={() => set('status', s)}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${form.status === s ? (s === 'ACTIVE' ? 'var(--accent-green)' : 'var(--accent-red)') : 'var(--glass-border)'}`, background: form.status === s ? (s === 'ACTIVE' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)') : 'var(--glass)', textAlign: 'center', transition: 'all 0.2s' }}>
              <div style={{ fontSize: 14 }}>{s === 'ACTIVE' ? '✅' : '🔴'}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: form.status === s ? (s === 'ACTIVE' ? 'var(--accent-green)' : 'var(--accent-red)') : 'var(--text-muted)', marginTop: 4 }}>{s}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
        <motion.button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Save size={13} /> {saving ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
        </motion.button>
      </div>
    </div>
  );
}

// ─── Reset Password Modal ───────────────────────────────────────
function ResetPasswordForm({ user, onSave, onCancel, saving }) {
  const [pw, setPw]         = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow]     = useState(false);
  const [err, setErr]       = useState('');

  const handleSave = () => {
    if (!pw || pw.length < 6) { setErr('Minimum 6 characters'); return; }
    if (pw !== confirm) { setErr('Passwords do not match'); return; }
    onSave(pw);
  };

  return (
    <div>
      <div style={{ padding: '12px 16px', background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: 10, marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Resetting password for: <strong style={{ color: 'var(--text-primary)' }}>{user?.name}</strong></div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.email}</div>
      </div>
      {err && <div className="toast-item toast-error" style={{ marginBottom: 14 }}>{err}</div>}
      <div className="form-group">
        <label className="form-label">New Password</label>
        <div style={{ position: 'relative' }}>
          <input className="form-input" type={show ? 'text' : 'password'} value={pw}
            onChange={e => { setPw(e.target.value); setErr(''); }} placeholder="Min. 6 characters" style={{ paddingRight: 36 }} />
          <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            {show ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
        <PasswordStrength password={pw} />
      </div>
      <div className="form-group">
        <label className="form-label">Confirm New Password</label>
        <input className="form-input" type="password" value={confirm}
          onChange={e => { setConfirm(e.target.value); setErr(''); }} placeholder="Repeat password" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
        <motion.button className="btn btn-warning btn-sm" onClick={handleSave} disabled={saving}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <KeyRound size={13} /> {saving ? 'Resetting...' : 'Reset Password'}
        </motion.button>
      </div>
    </div>
  );
}

// ─── Main User Management Page ──────────────────────────────────
export default function UserManagementPage() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [showCreate, setShowCreate]   = useState(false);
  const [editUser, setEditUser]       = useState(null);
  const [resetUser, setResetUser]     = useState(null);
  const [saving, setSaving]           = useState(false);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      await api.post('/users', form);
      toast.success('User created successfully!');
      setShowCreate(false);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create user'); }
    finally { setSaving(false); }
  };

  const handleEdit = async (form) => {
    setSaving(true);
    try {
      await api.put(`/users/${editUser.id}`, form);
      toast.success('User updated!');
      setEditUser(null);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to update'); }
    finally { setSaving(false); }
  };

  const handleToggleStatus = async (user) => {
    try {
      await api.patch(`/users/${user.id}/toggle-status`);
      toast.success(`${user.name} ${user.status === 'ACTIVE' ? 'deactivated' : 'activated'}`);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to update status'); }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Delete "${user.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${user.id}`);
      toast.success('User deleted');
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Cannot delete user'); }
  };

  const handleResetPw = async (password) => {
    setSaving(true);
    try {
      await api.patch(`/users/${resetUser.id}/reset-password`, { password });
      toast.success(`Password reset for ${resetUser.name}`);
      setResetUser(null);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to reset password'); }
    finally { setSaving(false); }
  };

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase()) ||
                        (u.employee_id || '').toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter === 'ALL' || u.role === roleFilter;
    const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const stats = [
    { label: 'Total Users',  value: users.length,                                   color: 'teal' },
    { label: 'Active',       value: users.filter(u => u.status === 'ACTIVE').length, color: 'green' },
    { label: 'Inactive',     value: users.filter(u => u.status === 'INACTIVE').length,color: 'red' },
    { label: 'Admins',       value: users.filter(u => u.role === 'ADMIN').length,    color: 'orange' },
  ];

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <Toast toasts={toast.toasts} />

      {/* KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 24 }}>
        {stats.map((k, i) => (
          <motion.div key={k.label} className={`kpi-card ${k.color}`}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }} whileHover={{ scale: 1.03 }}>
            <div className="kpi-icon"><Users size={18} /></div>
            <div className="kpi-value" style={{ fontSize: 26 }}>{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-input" style={{ paddingLeft: 34 }} placeholder="Search by name, email, ID..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Role filter */}
        <select className="form-select" style={{ width: 'auto', minWidth: 150 }}
          value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="ALL">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{ROLE_BADGES[r]?.label || r}</option>)}
        </select>

        {/* Status filter */}
        {['ALL', 'ACTIVE', 'INACTIVE'].map(s => (
          <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setStatusFilter(s)}>{s === 'ALL' ? 'All Status' : s}</button>
        ))}

        <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={13} /></button>

        <motion.button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Plus size={14} /> Add User
        </motion.button>
      </div>

      {/* Users Table */}
      <motion.div className="table-container" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="table-header">
          <span className="table-title">
            <Shield size={15} style={{ display: 'inline', marginRight: 8 }} />
            Users & Access Rights ({filtered.length})
          </span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No users found</td></tr>
            ) : filtered.map((u, i) => {
              const roleInfo = ROLE_BADGES[u.role];
              const isActive = u.status === 'ACTIVE';
              return (
                <motion.tr key={u.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'monospace' }}>{u.employee_id || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${roleInfo?.color}30`, border: `1.5px solid ${roleInfo?.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: roleInfo?.color, flexShrink: 0 }}>
                        {u.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{u.phone || '—'}</td>
                  <td>
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, fontWeight: 700, background: roleInfo?.bg, color: roleInfo?.color }}>
                      {roleInfo?.label || u.role}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, fontWeight: 700, background: isActive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: isActive ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {isActive ? '● Active' : '○ Inactive'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                    {new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <motion.button className="btn btn-ghost btn-xs" title="Edit" whileHover={{ scale: 1.1 }} onClick={() => setEditUser(u)}><Edit2 size={12} /></motion.button>
                      <motion.button className="btn btn-ghost btn-xs" title={isActive ? 'Deactivate' : 'Activate'} whileHover={{ scale: 1.1 }}
                        onClick={() => handleToggleStatus(u)}
                        style={{ color: isActive ? 'var(--accent-orange)' : 'var(--accent-green)' }}>
                        {isActive ? <UserX size={12} /> : <UserCheck size={12} />}
                      </motion.button>
                      <motion.button className="btn btn-ghost btn-xs" title="Reset Password" whileHover={{ scale: 1.1 }}
                        onClick={() => setResetUser(u)} style={{ color: 'var(--accent-teal)' }}>
                        <KeyRound size={12} />
                      </motion.button>
                      <motion.button className="btn btn-ghost btn-xs" title="Delete" whileHover={{ scale: 1.1 }}
                        onClick={() => handleDelete(u)} style={{ color: 'var(--accent-red)' }}>
                        <Trash2 size={12} />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      {/* Modals */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="➕ Add New User">
        <UserForm onSave={handleCreate} onCancel={() => setShowCreate(false)} saving={saving} />
      </Modal>
      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title={`✏️ Edit: ${editUser?.name}`}>
        {editUser && <UserForm initial={editUser} onSave={handleEdit} onCancel={() => setEditUser(null)} saving={saving} />}
      </Modal>
      <Modal isOpen={!!resetUser} onClose={() => setResetUser(null)} title="🔑 Reset Password">
        {resetUser && <ResetPasswordForm user={resetUser} onSave={handleResetPw} onCancel={() => setResetUser(null)} saving={saving} />}
      </Modal>
    </div>
  );
}
