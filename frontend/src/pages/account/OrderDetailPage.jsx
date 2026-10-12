import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import { formatINR, formatDate } from '../../utils/format';
import { useToast } from '../../context/ToastContext';
import Spinner from '../../components/Spinner';

const STATUS_STEPS = ['Pending', 'Confirmed', 'Shipped', 'Delivered'];

export default function OrderDetailPage() {
  const { id } = useParams();
  const { show } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then(({ data }) => setOrder(data.order))
      .catch((e) => show(e.userMessage, 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner label="Loading order..." />;
  if (!order) return <div className="container empty"><p>Order not found.</p></div>;

  const stepIndex = STATUS_STEPS.indexOf(order.status);
  const cancellable = ['Pending', 'Confirmed'].includes(order.status);

  const cancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setCancelling(true);
    try {
      await api.post(`/orders/${id}/cancel`);
      setOrder((o) => ({ ...o, status: 'Cancelled' }));
      show('Order cancelled');
    } catch (e) {
      show(e.userMessage, 'error');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div>
      <Link to="/account/orders" className="link-back">← Back to orders</Link>
      <div className="order-detail-head">
        <div>
          <h1 className="page-title">Order {order.orderId}</h1>
          <p className="muted">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <div className="order-right">
          <span className={`pill ${order.status === 'Cancelled' ? 'danger' : 'success'}`}>{order.status}</span>
          <strong className="total-art">{formatINR(order.total)}</strong>
        </div>
      </div>

      {order.status !== 'Cancelled' && (
        <div className="track">
          {STATUS_STEPS.map((s, i) => (
            <div key={s} className={`track-step ${i <= stepIndex ? 'done' : ''}`}>
              <span className="track-dot">{i < stepIndex ? '✓' : i + 1}</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
      )}

      <div className="panel-card">
        <h2>Items</h2>
        {order.items.map((i) => (
          <div key={i.product} className="os-row">
            <img src={i.image || 'https://picsum.photos/seed/placeholder/80/80'} alt="" />
            <span className="os-name">{i.name} <small>× {i.qty}</small></span>
            <strong>{formatINR(i.price * i.qty)}</strong>
          </div>
        ))}
        <div className="summary-row"><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
        <div className="summary-row"><span>Delivery</span><span>{order.deliveryCharges ? formatINR(order.deliveryCharges) : 'FREE'}</span></div>
        <div className="summary-row total"><span>Total</span><span>{formatINR(order.total)}</span></div>
      </div>

      <div className="two-col">
        <div className="panel-card">
          <h2>Delivery Address</h2>
          <p>
            <strong>{order.shippingAddress.fullName}</strong> · {order.shippingAddress.phone}<br />
            {order.shippingAddress.line1}, {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
          </p>
        </div>
        <div className="panel-card">
          <h2>Payment</h2>
          <p>
            Method: {order.payment.method === 'cod' ? 'Cash on Delivery' : 'Razorpay'}<br />
            Status: <b>{order.payment.status === 'paid' ? 'Paid' : 'Payment pending'}</b>
            {order.payment.razorpayPaymentId && <><br />Txn ID: {order.payment.razorpayPaymentId}</>}
          </p>
        </div>
      </div>

      {cancellable && (
        <button className="btn btn-danger" disabled={cancelling} onClick={cancel}>
          {cancelling ? 'Cancelling...' : 'Cancel Order'}
        </button>
      )}
    </div>
  );
}