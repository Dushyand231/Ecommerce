import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatINR, formatDate } from '../../utils/format';
import { useToast } from '../../context/ToastContext';
import Spinner from '../../components/Spinner';

const STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
const COLORS = { Pending: 'info', Confirmed: 'primary', Shipped: 'accent', Delivered: 'success', Cancelled: 'danger' };

export default function AdminOrders() {
  const { show } = useToast();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/orders?limit=15&status=${filter}&page=${page}`)
      .then(({ data }) => {
        setOrders(data.orders);
        setPages(data.pages);
      })
      .catch((e) => show(e.userMessage, 'error'))
      .finally(() => setLoading(false));
  }, [filter, page]);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/orders/${id}/status`, { status });
      show(`Order marked ${status}`);
      setOrders((os) => os.map((o) => (o._id === id ? { ...o, status } : o)));
    } catch (e) {
      show(e.userMessage, 'error');
    }
  };

  return (
    <div>
      <div className="admin-head-row">
        <h2>Orders</h2>
        <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
          <option value="All">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {loading ? (
        <Spinner />
      ) : (
        <table className="table">
          <thead>
            <tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id}>
                <td><Link to={`/admin/orders/${o._id}`}>{o.orderId}</Link></td>
                <td>{formatDate(o.createdAt)}</td>
                <td>{o.user?.name}<small className="muted">{o.user?.email}</small></td>
                <td>{o.items.reduce((n, i) => n + i.qty, 0)} units</td>
                <td>{formatINR(o.total)}</td>
                <td><span className={`dot ${o.payment.status}`} /> {o.payment.status}</td>
                <td>
                  <select className="status-select" value={o.status} onChange={(e) => updateStatus(o._id, e.target.value)}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {pages > 1 && (
        <div className="pagination">
          <button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹ Prev</button>
          <span>Page {page} of {pages}</span>
          <button className="btn btn-outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next ›</button>
        </div>
      )}
    </div>
  );
}