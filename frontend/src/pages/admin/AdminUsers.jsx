import { useEffect, useState } from 'react';
import api from '../../services/api';
import { formatDate } from '../../utils/format';
import { useToast } from '../../context/ToastContext';
import Spinner from '../../components/Spinner';

export default function AdminUsers() {
  const { show } = useToast();
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/users?limit=50${q ? `&q=${encodeURIComponent(q)}` : ''}`)
      .then(({ data }) => setUsers(data.users || []))
      .catch((e) => show(e.userMessage, 'error'))
      .finally(() => setLoading(false));
  }, [q]);

  const toggle = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/status`);
      show('User status updated');
      setUsers((us) => us.map((u) => (u._id === id ? { ...u, isActive: !u.isActive } : u)));
    } catch (e) {
      show(e.userMessage, 'error');
    }
  };

  return (
    <div>
      <div className="admin-head-row">
        <h2>Customers</h2>
        <input className="search-inline" placeholder="Search name or email..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {loading ? (
        <Spinner />
      ) : (
        <table className="table">
          <thead>
            <tr><th>User</th><th>Role</th><th>Joined</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>
                  <div className="u-cell">
                    <span className="avatar sm">{u.name?.charAt(0)}</span>
                    <div><strong>{u.name}</strong><small className="muted">{u.email}</small></div>
                  </div>
                </td>
                <td><span className={`pill ${u.role === 'admin' ? 'primary' : 'info'}`}>{u.role}</span></td>
                <td>{formatDate(u.createdAt)}</td>
                <td><span className={`pill ${u.isActive ? 'success' : 'danger'}`}>{u.isActive ? 'Active' : 'Disabled'}</span></td>
                <td>
                  {u.role !== 'admin' && (
                    <button className="btn btn-outline btn-sm" onClick={() => toggle(u._id)}>
                      {u.isActive ? 'Disable' : 'Enable'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}