import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Package, ShoppingCart, Truck, Factory, BarChart3, LogOut, Layers, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard',     icon: <LayoutDashboard size={16}/>, label: 'Dashboard',       roles: ['ADMIN', 'OWNER'] },
  { to: '/products',      icon: <Package size={16}/>,         label: 'Products',         roles: ['ADMIN', 'OWNER'] },
  { to: '/sales',         icon: <ShoppingCart size={16}/>,    label: 'Sales Orders',     roles: ['ADMIN', 'SALES'] },
  { to: '/purchase',      icon: <Truck size={16}/>,           label: 'Purchase Orders',  roles: ['ADMIN', 'PURCHASE'] },
  { to: '/manufacturing', icon: <Factory size={16}/>,         label: 'Manufacturing',    roles: ['ADMIN', 'MANUFACTURING'] },
  { to: '/inventory',     icon: <Layers size={16}/>,          label: 'Inventory',        roles: ['ADMIN', 'INVENTORY'] },
  { to: '/reports',       icon: <BarChart3 size={16}/>,       label: 'Reports',          roles: ['ADMIN', 'OWNER', 'SALES', 'PURCHASE', 'MANUFACTURING', 'INVENTORY'] },
  { to: '/users',         icon: <Users size={16}/>,           label: 'User Management',  roles: ['ADMIN'] },
];

const ROLE_INFO = {
  ADMIN:         { label: 'Administrator',    emoji: '👑', color: '#f59e0b' },
  OWNER:         { label: 'Business Owner',   emoji: '📈', color: '#84cc16' },
  SALES:         { label: 'Sales Manager',    emoji: '🛒', color: '#14b8a6' },
  PURCHASE:      { label: 'Purchase Manager', emoji: '🚛', color: '#06b6d4' },
  MANUFACTURING: { label: 'Mfg. Manager',     emoji: '🏭', color: '#8b5cf6' },
  INVENTORY:     { label: 'Inv. Manager',     emoji: '📦', color: '#10b981' },
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role     = user?.role || 'ADMIN';
  const info     = ROLE_INFO[role] || { label: role, emoji: '👤', color: 'var(--accent-teal)' };
  const visible  = NAV.filter(n => n.roles.includes(role));

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <motion.aside className="sidebar"
      initial={{ x: -264 }} animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}>

      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">🪑</div>
        <h2>Shiv Furniture Works</h2>
        <span>Mini ERP System</span>
      </div>

      {/* Role badge */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: `${info.color}15`, border: `1px solid ${info.color}30` }}>
          <span style={{ fontSize: 16 }}>{info.emoji}</span>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: info.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{info.label}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{user?.name}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {visible.map(item => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar" style={{ background: `linear-gradient(135deg, ${info.color}, var(--accent-emerald))` }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role" style={{ color: info.color }}>{info.label}</div>
          </div>
          <motion.button onClick={handleLogout} title="Logout"
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 6 }}
            whileHover={{ color: 'var(--accent-red)', scale: 1.1 }}>
            <LogOut size={15} />
          </motion.button>
        </div>
      </div>
    </motion.aside>
  );
}
