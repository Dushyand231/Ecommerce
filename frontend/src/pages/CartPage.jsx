import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/format';
import Spinner from '../components/Spinner';

export default function CartPage() {
  const { items, loading, subtotal, updateQty, removeItem, clearCart } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();
  const { show } = useToast();

  if (loading) return <Spinner label="Loading cart..." />;

  return (
    <div className="container section">
      <h1 className="page-title">Your Cart</h1>
      {!items.length ? (
        <div className="empty">
          <p>Your cart is empty.</p>
          <Link className="btn btn-primary" to="/shop">Start shopping</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {items.map((i) => (
              <div key={i.id} className="cart-row">
                <img src={i.image || 'https://picsum.photos/seed/placeholder/100/100'} alt={i.name} />
                <div className="cart-row-info">
                  <Link to={`/product/${i.id}`}><h3>{i.name}</h3></Link>
                  {i.brand && <span className="card-brand">{i.brand}</span>}
                  <span className="cart-price">{formatINR(i.price)}</span>
                </div>
                <div className="stepper">
                  <button disabled={i.qty <= 1} onClick={() => updateQty(i.id, i.qty - 1)}>−</button>
                  <span className="step-val">{i.qty}</span>
                  <button
                    disabled={i.qty >= i.stock}
                    title={i.qty >= i.stock ? `Only ${i.stock} in stock` : ''}
                    onClick={() => updateQty(i.id, i.qty + 1)}
                  >
                    +
                  </button>
                </div>
                <strong className="cart-line-total">{formatINR(i.price * i.qty)}</strong>
                <button className="btn-remove" onClick={() => removeItem(i.id)} aria-label={`Remove ${i.name}`}>
                  ✕
                </button>
              </div>
            ))}
            <button className="link-clear" onClick={clearCart}>Clear cart</button>
          </div>

          <aside className="summary">
            <h2>Order Summary</h2>
            <div className="summary-row"><span>Items ({items.reduce((n, i) => n + i.qty, 0)})</span><span>{formatINR(subtotal)}</span></div>
            <div className="summary-row"><span>Delivery</span><span>{subtotal >= 500 ? 'FREE' : formatINR(49)}</span></div>
            <div className="summary-row total"><span>Total</span><span>{formatINR(subtotal + (subtotal >= 500 ? 0 : 49))}</span></div>
            <button
              className="btn btn-primary btn-block"
              onClick={() => {
                if (!token) return navigate('/login', { state: { from: '/checkout' } });
                navigate('/checkout');
              }}
            >
              Proceed to Checkout
            </button>
            <Link className="btn btn-outline btn-block" to="/shop">Continue shopping</Link>
          </aside>
        </div>
      )}
    </div>
  );
}