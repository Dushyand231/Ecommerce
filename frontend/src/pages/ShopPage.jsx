import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { ProductCard } from '../components/ProductCard';
import Spinner from '../components/Spinner';

const PRICE_BUCKETS = [
  { label: 'Under ₹1,000', min: 0, max: 1000 },
  { label: '₹1,000 – ₹2,500', min: 1000, max: 2500 },
  { label: '₹2,500 – ₹5,000', min: 2500, max: 5000 },
  { label: 'Above ₹5,000', min: 5000, max: null },
];

export default function ShopPage() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const q = params.get('q') || '';
  const category = params.get('category') || 'All';
  const sort = params.get('sort') || 'newest';
  const page = Number(params.get('page')) || 1;
  const price = params.get('price') || '';

  useEffect(() => {
    api
      .get('/products/categories')
      .then(({ data }) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const search = new URLSearchParams({ limit: '8', sort });
    if (q) search.set('q', q);
    if (category !== 'All') search.set('category', category);
    if (price) {
      const bucket = PRICE_BUCKETS.find((b) => b.label === price);
      if (bucket) {
        search.set('minPrice', bucket.min);
        if (bucket.max) search.set('maxPrice', bucket.max);
      }
    }
    search.set('page', page);
    api
      .get(`/products?${search.toString()}`)
      .then(({ data }) => {
        setProducts(data.products);
        setPages(data.pages);
        setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [q, category, sort, price, page]);

  const updateParams = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === '' || value === 'All' || value === null) next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: false });
  };

  return (
    <div className="container shop-layout">
      <aside className="filters">
        <h3>Filters</h3>
        <div className="filter-group">
          <label>Category</label>
          <select value={category} onChange={(e) => updateParams('category', e.target.value)}>
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Price</label>
          <select value={price} onChange={(e) => updateParams('price', e.target.value)}>
            <option value="">Any price</option>
            {PRICE_BUCKETS.map((b) => (
              <option key={b.label} value={b.label}>{b.label}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Sort by</label>
          <select value={sort} onChange={(e) => updateParams('sort', e.target.value)}>
            <option value="newest">Newest arrivals</option>
            <option value="priceLow">Price: Low to High</option>
            <option value="priceHigh">Price: High to Low</option>
            <option value="rating">Top rated</option>
          </select>
        </div>
        {(q || category !== 'All' || price || sort !== 'newest') && (
          <button className="btn btn-outline btn-block" onClick={() => setParams(new URLSearchParams())}>
            Clear all
          </button>
        )}
      </aside>

      <main className="shop-main">
        <div className="shop-result-head">
          <h1>
            {q ? `Results for "${q}"` : category === 'All' ? 'All Products' : category}
          </h1>
          <span>{total} item{total === 1 ? '' : 's'}</span>
        </div>
        {loading ? (
          <Spinner />
        ) : products.length ? (
          <div className="grid">
            {products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        ) : (
          <div className="empty">
            <p>No products found. Try adjusting your filters.</p>
            <button className="btn btn-primary" onClick={() => setParams(new URLSearchParams())}>Reset filters</button>
          </div>
        )}
        {pages > 1 && (
          <div className="pagination">
            <button className="btn btn-outline" disabled={page <= 1} onClick={() => updateParams('page', page - 1)}>
              ‹ Prev
            </button>
            <span>Page {page} of {pages}</span>
            <button className="btn btn-outline" disabled={page >= pages} onClick={() => updateParams('page', page + 1)}>
              Next ›
            </button>
          </div>
        )}
      </main>
    </div>
  );
}