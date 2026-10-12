import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function AccountLayout() {
  const { user } = useAuth();
  const { show } = useToast();
  const [msg, setMsg] = useState('');

  const copy = (text) => {
    navigator.clipboard?.writeText(text).then(() => show('Copied!'));
  };

  return (
    <div className="container section account-layout">
      <aside className="account-side">
        <div className="account-hero">
          <span className="avatar lg">{user?.name?.charAt(0)}</span>
          <div>
            <strong>{user?.name}</strong>
            <small>{user?.email}</small>
            <button
              className="link-clear"
              onClick={() => {
                navigator.clipboard?.writeText(user?.id || '');
                show('User ID copied');
              }}
              title="Copy user id"
            >
              UID: {user?.id?.slice(0, 8)}…
            </button>
          </div>
        </div>
        <nav className="account-nav">
          <NavLink to="/account/orders" className={({ isActive }) => (isActive ? 'active' : '')}>My Orders</NavLink>
          <NavLink to="/account/profile" className={({ isActive }) => (isActive ? 'active' : '')}>Profile Settings</NavLink>
        </nav>
      </aside>
      <main className="account-main">
        {msg && <div className="form-error">{msg}</div>}
        <Outlet />
      </main>
    </div>
  );
}