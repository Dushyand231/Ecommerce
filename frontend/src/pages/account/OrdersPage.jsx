import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatINR, formatDate } from '../../utils/format';
import Spinner from '../../components/Spinner';

const STATUS_COLORS = {
  Pending: 'info',
  Confirmed: 'primary',
  Shipped: 'accent',
  Delivered: 'success',
  Cancelled: 'danger',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/orders/my-orders?limit=20')
      .then(({ data }) => setOrders(data.orders))
      .catch((e) => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading your orders..." />;

  return (
    <div>
      <h1 className="page-title">My Orders</h1>
      {!orders?.length ? (
        <div className="empty">
          <p>You haven't placed any orders yet.</p>
          <Link className="btn btn-primary" to="/shop">Start shopping</Link>
        </div>
      ) : (
        <div className="order-list">
          {orders.map((o) => (
            <Link key={o._id} to={`/account/orders/${o._id}`} className="order-card">
              <div className="order-head">
                <div>
                  <strong>Order {o.orderId}</strong>
                  <small>{formatDate(o.createdAt)}</small>
                </div>
                <div className="order-right">
                  <span className={`pill ${STATUS_COLORS[o.status] || 'info'}`}>{o.status}</span>
                  <strong>{formatINR(o.total)}</strong>
                </div>
              </div>
              <div className="order-items">
                {o.items.slice(0, 3).map((i) => (
                  <img key={i.product} src={i.image || 'https://picsum.photos/seed/placeholder/60/60'} alt={i.name} />
                ))}
                {o.items.length > 3 && <span className="more">+{o.items.length - 3}</span>}
                <p>
                  {o.items.map((i) => i.name).join(', ')}
                </p>
              </div>
              <div className="order-meta">
                <span className={`dot ${o.payment.status}`} /> {o.payment.method === 'cod' ? 'Cash on Delivery' : 'Razorpay'} · {o.payment.status === 'paid' ? 'Paid' : 'Pending payment'}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}