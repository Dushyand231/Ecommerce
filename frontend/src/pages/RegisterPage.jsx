import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Name is required.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Enter a valid email address.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    setSubmitting(true);
    try {
      await register(form.name.trim(), form.email, form.password);
      show('Account created! Welcome to ShopSphere.');
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.userMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>Create account</h1>
        <p className="auth-sub">Join ShopSphere — it only takes a minute.</p>
        {error && <div className="form-error">{error}</div>}
        <div className="field">
          <label>Full name</label>
          <input value={form.name} onChange={set('name')} placeholder="Rahul Sharma" autoComplete="name" />
        </div>
        <div className="field">
          <label>Email address</label>
          <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={form.password} onChange={set('password')} placeholder="Min 6 characters" autoComplete="new-password" />
        </div>
        <div className="field">
          <label>Confirm password</label>
          <input type="password" value={form.confirm} onChange={set('confirm')} placeholder="Repeat password" autoComplete="new-password" />
        </div>
        <button className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create Account'}
        </button>
        <p className="auth-foot">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </form>
    </div>
  );
}