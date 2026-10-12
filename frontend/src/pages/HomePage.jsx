import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { ProductCard } from '../components/ProductCard';
import Spinner from '../components/Spinner';

const CATEGORIES = [
  { name: 'Electronics', icon: '🎧', blurb: 'Audio, wearables & more' },
  { name: 'Fashion', icon: '👟', blurb: 'Shoes, jackets & style' },
  { name: 'Home', icon: '🏠', blurb: 'Kitchen & living essentials' },
  { name: 'Beauty', icon: '✨', blurb: 'Skincare & grooming' },
  { name: 'Sports', icon: '🏋️', blurb: 'Fitness & outdoors' },
  { name: 'Books', icon: '📚', blurb: 'Bestselling reads' },
];

export default function HomePage() {
  const [featured, setFeatured] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/products?limit=8&sort=newest&featured=true')
      .then(({ data }) => setFeatured(data.products))
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="hero" style={{ backgroundImage: 'linear-gradient(120deg,#0f172a 30%,#1e3a8a)' }}>
        <div className="hero-inner">
          <p className="hero-eyebrow">New season · New drops</p>
          <h1>Everything you love,<br />delivered in a day.</h1>
          <p className="hero-sub">Shop 15,000+ handpicked products across electronics, fashion, home and more.</p>
          <div className="hero-cta">
            <Link className="btn btn-white" to="/shop">Shop now</Link>
            <Link className="btn btn-ghost" to="/shop?sort=priceLow">Deals under ₹1,000</Link>
          </div>
        </div>
      </section>

      <section className="container section">
        <h2 className="section-title">Shop by Category</h2>
        <div className="cat-grid">
          {CATEGORIES.map((c) => (
            <Link key={c.name} to={`/shop?category=${encodeURIComponent(c.name)}`} className="cat-tile">
              <span className="cat-icon">{c.icon}</span>
              <strong>{c.name}</strong>
              <small>{c.blurb}</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <h2 className="section-title">Featured & Trending</h2>
          <Link className="btn btn-outline" to="/shop">View all</Link>
        </div>
        {loading ? (
          <Spinner />
        ) : (
          <div className="grid">
            {featured?.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </section>
    </>
  );
}