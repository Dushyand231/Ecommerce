import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const { login } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) return setError('Email and password are required.');
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      show('Welcome back!');
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.userMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>Welcome back</h1>
        <p className="auth-sub">Login to continue shopping on ShopSphere.</p>
        {error && <div className="form-error">{error}</div>}
        <div className="field">
          <label>Email address</label>
          <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={form.password} onChange={set('password')} placeholder="Enter your password" autoComplete="current-password" />
        </div>
        <button className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Login'}
        </button>
        <p className="auth-foot">
          New to ShopSphere? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}