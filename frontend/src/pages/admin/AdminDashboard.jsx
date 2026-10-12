import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatINR, formatDate } from '../../utils/format';
import Spinner from '../../components/Spinner';

const STATUS_COLORS = { Pending: 'info', Confirmed: 'primary', Shipped: 'accent', Delivered: 'success', Cancelled: 'danger' };

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => {
      setStats(data.stats);
      setRecent(data.recentOrders);
    }).catch(() => {});
  }, []);

  if (!stats) return <Spinner />;

  const cards = [
    { label: 'Revenue (paid)', value: formatINR(stats.revenue), icon: '💰' },
    { label: 'Total Orders', value: stats.totalOrders, icon: '📦' },
    { label: 'Products', value: stats.totalProducts, icon: '🛍️' },
    { label: 'Customers', value: stats.totalUsers, icon: '👥' },
  ];

  return (
    <div>
      <div className="stat-grid">
        {cards.map((c) => (
          <div key={c.label} className="stat-card">
            <span className="stat-icon">{c.icon}</span>
            <div>
              <strong>{c.value}</strong>
              <small>{c.label}</small>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-cols">
        <div className="panel-card">
          <h2>Orders by Status</h2>
          {stats.ordersByStatus.length ? (
            <table className="table">
              <tbody>
                {stats.ordersByStatus.map((o) => (
                  <tr key={o._id}>
                    <td><span className={`pill ${STATUS_COLORS[o._id] || 'info'}`}>{o._id}</span></td>
                    <td>{o.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No orders yet.</p>
          )}
        </div>

        <div className="panel-card">
          <h2>Recent Orders</h2>
          {recent.length ? (
            <table className="table">
              <thead>
                <tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o._id}>
                    <td><Link to={`/admin/orders/${o._id}`}>{o.orderId}</Link></td>
                    <td>{o.user?.name}</td>
                    <td>{formatINR(o.total)}</td>
                    <td><span className={`pill ${STATUS_COLORS[o.status] || 'info'}`}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No recent orders.</p>
          )}
        </div>
      </div>
    </div>
  );
}