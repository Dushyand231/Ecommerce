import { Link, useNavigate } from 'react-router-dom';
import { formatINR } from '../utils/format';
import { useCart } from '../context/CartContext';

export default function Rating({ value = 0, count, size = 14 }) {
  return (
    <span className={`rating size-${size}`} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(value) ? 'star filled' : 'star'}>
          ★
        </span>
      ))}
      {count !== undefined && <span className="rating-count">({count})</span>}
    </span>
  );
}

export function ProductCard({ product }) {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const out = product.stock < 1;
  const discount = product.actualPrice > product.price ? Math.round(((product.actualPrice - product.price) / product.actualPrice) * 100) : 0;

  const onAdd = async (e) => {
    e.stopPropagation();
    try {
      await addItem(product);
      navigate('/cart');
    } catch {
      /* handled globally */
    }
  };

  return (
    <article className="card" onClick={() => navigate(`/product/${product._id}`)}>
      <div className="card-img">
        <img src={product.images?.[0] || 'https://picsum.photos/seed/placeholder/600/400'} alt={product.name} loading="lazy" />
        {discount > 0 && <span className="badge-discount">{discount}% OFF</span>}
        {out && <span className="badge-oos">Out of stock</span>}
      </div>
      <div className="card-body">
        <span className="card-brand">{product.brand || product.category}</span>
        <h3>{product.name}</h3>
        <Rating value={product.ratingsAverage} count={product.ratingsCount} />
        <div className="card-price">
          <strong>{formatINR(product.price)}</strong>
          {product.actualPrice > product.price && <del>{formatINR(product.actualPrice)}</del>}
        </div>
        <div className="card-actions">
          <button className="btn btn-outline" disabled={out} onClick={onAdd}>
            Add to Cart
          </button>
          <button
            className="btn btn-primary"
            disabled={out}
            onClick={(e) => {
              e.stopPropagation();
              if (out) return;
              addItem(product).then(() => navigate('/checkout'));
            }}
          >
            Buy Now
          </button>
        </div>
        {product.stock <= 5 && product.stock > 0 && <span className="low-stock">Only {product.stock} left</span>}
      </div>
    </article>
  );
}