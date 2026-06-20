import { Bell, RefreshCw } from 'lucide-react';

const ROLE_LABELS = {
  ADMIN: 'Administrator', OWNER: 'Business Owner', SALES: 'Sales Manager',
  PURCHASE: 'Purchase Manager', MANUFACTURING: 'Mfg. Manager', INVENTORY: 'Inventory Manager',
};

export default function Topbar({ title, subtitle, onRefresh }) {
  const user = JSON.parse(localStorage.getItem('erp_user') || '{}');
  const role = user?.role || '';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="topbar-right">
        {role && <span className="role-badge">{ROLE_LABELS[role] || role}</span>}
        {onRefresh && (
          <button className="topbar-btn" onClick={onRefresh} title="Refresh"><RefreshCw size={15} /></button>
        )}
        <button className="topbar-btn" title="Notifications"><Bell size={15} /></button>
      </div>
    </header>
  );
}
