import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Loader() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-primary)' }}>
      <div className="spinner" />
    </div>
  );
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader />;

  // Not logged in → redirect to login with return path
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Role check — if allowedRoles specified, user's role must be in list
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  // Render either children (page guard) or Outlet (layout wrapper)
  return children ?? <Outlet />;
}
