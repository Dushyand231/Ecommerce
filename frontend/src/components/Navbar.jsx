import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const CATEGORIES = [
  { name: 'Electronics', icon: '🎧' },
  { name: 'Fashion', icon: '👟' },
  { name: 'Home', icon: '🏠' },
  { name: 'Beauty', icon: '✨' },
  { name: 'Sports', icon: '🏋️' },
  { name: 'Books', icon: '📚' },
  { name: 'Toys', icon: '🧸' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const submitSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    navigate(`/shop?${params.toString()}`);
  };

  return (
    <>
      <header className="navbar">
        <div className="nav-inner">
          <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
            <span className="brand-dot">S</span> Shop<span>Sphere</span>
          </Link>

          <form className="nav-search" onSubmit={submitSearch}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products, brands..."
              aria-label="Search"
            />
            <button type="submit" aria-label="Search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>
          </form>

          <nav className="nav-links" aria-label="Main">
            <Link to="/shop">Shop</Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className="admin-link">
                Admin
              </Link>
            )}
            <Link to="/cart" className="cart-link">
              Cart
              {count > 0 && <span className="cart-badge">{count}</span>}
            </Link>
            {user ? (
              <div className="user-menu">
                <button className="avatar" onClick={() => setMenuOpen((v) => !v)} aria-label="Account menu">
                  {user.name?.charAt(0).toUpperCase()}
                </button>
                {menuOpen && (
                  <div className="dropdown">
                    <div className="dropdown-head">
                      <strong>{user.name}</strong>
                      <small>{user.email}</small>
                    </div>
                    <Link to="/account/orders" onClick={() => setMenuOpen(false)}>
                      My Orders
                    </Link>
                    <Link to="/account/profile" onClick={() => setMenuOpen(false)}>
                      Profile
                    </Link>
                    <button
                      className="dropdown-logout"
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                        navigate('/');
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={() => navigate(location.pathname === '/login' ? '/register' : '/login')}>
                Login
              </button>
            )}
          </nav>
        </div>
      </header>
      <div className="category-strip">
        <Link to="/shop">All Categories</Link>
        {CATEGORIES.map((c) => (
          <Link key={c.name} to={`/shop?category=${encodeURIComponent(c.name)}`}>
            <span aria-hidden>{c.icon}</span> {c.name}
          </Link>
        ))}
      </div>
    </>
  );
}