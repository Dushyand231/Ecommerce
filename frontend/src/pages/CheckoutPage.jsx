import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatINR } from '../utils/format';
import Spinner from '../components/Spinner';

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { show } = useToast();

  const [address, setAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    line1: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [rzpReady, setRzpReady] = useState(false);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!items.length) navigate('/cart');
    if (user?.address) setAddress((a) => ({ ...a, line1: user.address }));
  }, []);

  useEffect(() => {
    api.get('/payments/config').then(({ data }) => setRzpReady(data.razorpayConfigured)).catch(() => setRzpReady(false));
  }, []);

  const deliveryFee = subtotal >= 500 || items.length === 0 ? 0 : 49;
  const total = subtotal + deliveryFee;

  const setField = (k) => (e) => setAddress({ ...address, [k]: e.target.value });

  const loadScript = (src) =>
    new Promise((resolve) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve(true);
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  const placeOrder = async () => {
    for (const [k, v] of Object.entries(address)) {
      if (!String(v).trim()) return show(`Please fill: ${k.split(/(?=[A-Z])/).join(' ').toLowerCase()}`, 'error');
    }
    setPlacing(true);
    try {
      const { data } = await api.post('/orders', { items: items.map((i) => ({ productId: i.id, qty: i.qty })), shippingAddress: address, paymentMethod });
      if (paymentMethod === 'cod') {
        await clearCart();
        show('Order placed successfully!');
        navigate(`/account/orders/${data.order._id}`);
        return;
      }
      const ok = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!ok) {
        show('Could not load payment gateway', 'error');
        return;
      }
      const rzp = data.razorpay;
      const options = {
        key: rzp.keyId,
        amount: rzp.amount,
        currency: 'INR',
        name: 'ShopSphere',
        description: `Order ${data.order.orderId}`,
        order_id: rzp.orderId,
        prefill: { name: address.fullName, contact: address.phone, email: user?.email },
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              orderId: data.order._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            await clearCart();
            show('Payment successful!');
            navigate(`/account/orders/${data.order._id}`);
          } catch (e) {
            show(e.userMessage || 'Payment could not be verified', 'error');
            navigate(`/account/orders/${data.order._id}`);
          }
        },
        modal: {
          ondismiss: () => setPlacing(false),
        },
      };
      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', () => {
        show('Payment failed — you can retry from My Orders.', 'error');
        navigate(`/account/orders/${data.order._id}`);
      });
      rzpInstance.open();
    } catch (e) {
      show(e.userMessage, 'error');
      setPlacing(false);
    }
  };

  return (
    <div className="container section">
      <h1 className="page-title">Checkout</h1>
      <div className="checkout-layout">
        <div className="checkout-left">
          <div className="panel-card">
            <h2>Delivery Details</h2>
            <div className="form-2col">
              <div className="field"><label>Full name *</label><input value={address.fullName} onChange={setField('fullName')} placeholder="Rahul Sharma" /></div>
              <div className="field"><label>Phone *</label><input value={address.phone} onChange={setField('phone')} placeholder="98765 43210" maxLength={10} /></div>
            </div>
            <div className="field"><label>Address line *</label><input value={address.line1} onChange={setField('line1')} placeholder="House / street / area" /></div>
            <div className="form-3col">
              <div className="field"><label>City *</label><input value={address.city} onChange={setField('city')} /></div>
              <div className="field"><label>State *</label><input value={address.state} onChange={setField('state')} /></div>
              <div className="field"><label>Pincode *</label><input value={address.pincode} onChange={setField('pincode')} maxLength={6} /></div>
            </div>
          </div>

          <div className="panel-card">
            <h2>Payment Method</h2>
            <label className="pay-option">
              <input type="radio" name="pay" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
              <span>
                <strong>Cash on Delivery</strong>
                <small>Pay in cash when your order arrives</small>
              </span>
            </label>
            <label className="pay-option">
              <input type="radio" name="pay" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} disabled={!rzpReady} />
              <span>
                <strong>Razorpay (UPI / Cards / NetBanking)</strong>
                <small>{rzpReady ? 'Secure server-verified payment' : 'Payment gateway not configured on the server'}</small>
              </span>
            </label>
          </div>
        </div>

        <aside className="summary checkout-summary">
          <h2>Order Summary</h2>
          {items.map((i) => (
            <div key={i.id} className="os-row">
              <img src={i.image || 'https://picsum.photos/seed/placeholder/80/80'} alt="" />
              <span className="os-name">{i.name} <small>× {i.qty}</small></span>
              <strong>{formatINR(i.price * i.qty)}</strong>
            </div>
          ))}
          <div className="summary-row"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
          <div className="summary-row"><span>Delivery</span><span>{deliveryFee ? formatINR(deliveryFee) : 'FREE'}</span></div>
          <div className="summary-row total"><span>Total</span><span>{formatINR(total)}</span></div>
          <button className="btn btn-primary btn-block" disabled={placing || !items.length} onClick={placeOrder}>
            {placing ? 'Placing order...' : paymentMethod === 'cod' ? `Place Order · ${formatINR(total)}` : `Pay ${formatINR(total)}`}
          </button>
          <Link className="btn btn-outline btn-block" to="/cart">Back to cart</Link>
        </aside>
      </div>
    </div>
  );
}