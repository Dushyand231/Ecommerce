import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

export function ProtectedRoute({ children }) {
  const { user, token, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner label="Checking session..." />;
  if (!token || !user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children || <Outlet />;
}

export function AdminRoute({ children }) {
  const { user, token, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner label="Checking session..." />;
  if (!token || !user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children || <Outlet />;
}