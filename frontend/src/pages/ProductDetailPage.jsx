import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { formatINR, formatDate } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/Spinner';
import Rating from '../components/ProductCard';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { show } = useToast();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [review, setReview] = useState({ rating: 5, title: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get(`/products/${id}`)
      .then(({ data }) => setProduct(data.product))
      .catch((e) => show(e.userMessage, 'error'))
      .finally(() => setLoading(false));
    api
      .get(`/reviews/product/${id}`)
      .then(({ data }) => setReviews(data.reviews))
      .catch(() => {});
  };

  useEffect(load, [id]);

  if (loading) return <Spinner />;
  if (!product) return <div className="container empty"><p>Product not found.</p></div>;

  const out = product.stock < 1;
  const discount = product.actualPrice > product.price ? Math.round(((product.actualPrice - product.price) / product.actualPrice) * 100) : 0;

  const addToCart = async () => {
    try {
      await addItem(product, qty);
      show('Added to cart');
    } catch (e) {
      show(e.userMessage, 'error');
    }
  };

  const buyNow = async () => {
    try {
      await addItem(product, qty);
      navigate('/checkout');
    } catch (e) {
      show(e.userMessage, 'error');
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/reviews/product/${product._id}`, review);
      show('Review submitted');
      setReview({ rating: 5, title: '', comment: '' });
      load();
    } catch (err) {
      show(err.userMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container detail-layout">
      <nav className="crumbs">
        <Link to="/">Home</Link> / <Link to="/shop">Shop</Link> / {product.category} / <span>{product.name}</span>
      </nav>

      <div className="detail-grid">
        <div className="gallery">
          <div className="gallery-main">
            <img src={product.images?.[activeImg] || 'https://picsum.photos/seed/placeholder/600/400'} alt={product.name} />
          </div>
          {product.images?.length > 1 && (
            <div className="gallery-thumbs">
              {product.images.map((img, i) => (
                <button key={i} className={i === activeImg ? 'thumb active' : 'thumb'} onClick={() => setActiveImg(i)}>
                  <img src={img} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="detail-info">
          <span className="card-brand">{product.brand || product.category}</span>
          <h1>{product.name}</h1>
          <Rating value={product.ratingsAverage} count={product.ratingsCount} />
          <div className="detail-price">
            <strong>{formatINR(product.price)}</strong>
            {product.actualPrice > product.price && (
              <>
                <del>{formatINR(product.actualPrice)}</del>
                <span className="badge-discount">{discount}% OFF</span>
              </>
            )}
          </div>
          <p className="detail-desc">{product.description}</p>

          <div className="stock-line">
            {out ? (
              <span className="badge-oos">Currently out of stock</span>
            ) : (
              <span className={`in-stock ${product.stock <= 5 ? 'low' : ''}`}>
                ✓ {product.stock <= 5 ? `Only ${product.stock} left in stock` : 'In stock — ready to ship'}
              </span>
            )}
          </div>

          <div className="qty-row">
            <span>Quantity</span>
            <div className="stepper">
              <button disabled={qty <= 1} onClick={() => setQty((q) => q - 1)}>−</button>
              <input type="number" min="1" max={product.stock} value={qty} readOnly />
              <button disabled={qty >= product.stock} onClick={() => setQty((q) => q + 1)}>+</button>
            </div>
          </div>

          <div className="detail-actions">
            <button className="btn btn-outline" disabled={out} onClick={addToCart}>Add to Cart</button>
            <button className="btn btn-primary" disabled={out} onClick={buyNow}>Buy Now</button>
          </div>
        </div>
      </div>

      <section className="reviews">
        <h2>Ratings & Reviews ({reviews.length})</h2>
        {user ? (
          <form className="review-form" onSubmit={submitReview}>
            <div className="review-fields">
              <div>
                <label>Your rating</label>
                <div className="star-picker">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button key={i} type="button" className={i <= review.rating ? 'star filled' : 'star'} onClick={() => setReview((r) => ({ ...r, rating: i }))}>★</button>
                  ))}
                </div>
              </div>
              <div>
                <label>Title (optional)</label>
                <input value={review.title} onChange={(e) => setReview({ ...review, title: e.target.value })} maxLength={120} />
              </div>
            </div>
            <label>Review</label>
            <textarea value={review.comment} onChange={(e) => setReview({ ...review, comment: e.target.value })} rows={3} maxLength={600} required placeholder="Share your experience with this product..." />
            <button className="btn btn-primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Review'}</button>
          </form>
        ) : (
          <p className="review-login"><Link to="/login">Login</Link> to write a review.</p>
        )}

        <div className="review-list">
          {reviews.map((r) => (
            <div key={r._id} className="review-item">
              <div className="review-head">
                <span className="avatar sm">{r.user?.name?.charAt(0)}</span>
                <div>
                  <strong>{r.user?.name}</strong>
                  <Rating value={r.rating} size={12} />
                </div>
                <small>{formatDate(r.createdAt)}</small>
              </div>
              {r.title && <h4>{r.title}</h4>}
              <p>{r.comment}</p>
            </div>
          ))}
          {!reviews.length && <p className="muted">No reviews yet — be the first!</p>}
        </div>
      </section>
    </div>
  );
}