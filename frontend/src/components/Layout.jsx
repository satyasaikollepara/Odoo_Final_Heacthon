import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar  from './Topbar';
import { useAuth } from '../context/AuthContext';

const PAGE_META = {
  '/dashboard':      { title: 'Dashboard',          subtitle: 'Business overview at a glance' },
  '/products':       { title: 'Products',            subtitle: 'Manage your product catalog & BoMs' },
  '/sales':          { title: 'Sales Orders',        subtitle: 'Manage customer orders & deliveries' },
  '/purchase':       { title: 'Purchase Orders',     subtitle: 'Manage vendor orders & receiving' },
  '/manufacturing':  { title: 'Manufacturing',       subtitle: 'Production orders & work center tracking' },
  '/inventory':      { title: 'Inventory',           subtitle: 'Real-time stock levels & ledger' },
  '/reports':        { title: 'Reports & Analytics', subtitle: 'Business insights & KPIs' },
  '/users':          { title: 'User Management',     subtitle: 'Manage users, roles & access rights' },
};

export default function Layout() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const path = window.location.pathname;
  const meta = PAGE_META[path] || { title: 'ERP System', subtitle: '' };

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, loading]);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title={meta.title} subtitle={meta.subtitle} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
