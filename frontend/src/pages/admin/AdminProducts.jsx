import { useEffect, useState } from 'react';
import api from '../../services/api';
import { formatINR } from '../../utils/format';
import { useToast } from '../../context/ToastContext';
import Spinner from '../../components/Spinner';

const CATEGORIES = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports', 'Books', 'Toys', 'Other'];
const BLANK = { name: '', brand: '', description: '', price: '', actualPrice: '', category: 'Electronics', stock: '', featured: false, images: '' };

export default function AdminProducts() {
  const { show } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/products?limit=40').then(({ data }) => setProducts(data.products)).catch((e) => show(e.userMessage, 'error')).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const startAdd = () => {
    setEditing(null);
    setForm(BLANK);
    setFiles([]);
  };
  const startEdit = (p) => {
    setEditing(p._id);
    setForm({
      name: p.name, brand: p.brand || '', description: p.description, price: p.price,
      actualPrice: p.actualPrice || '', category: p.category, stock: p.stock, featured: p.featured, images: '',
    });
    setFiles([]);
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        if (files.length) files.forEach((f) => fd.append('images', f));
        await api.put(`/products/${editing}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        show('Product updated');
      } else {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
        if (files.length) files.forEach((f) => fd.append('images', f));
        await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        show('Product created');
      }
      setEditing(null);
      setFiles([]);
      load();
    } catch (err) {
      show(err.userMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      await api.delete(`/products/${id}`);
      show('Product deleted');
      load();
    } catch (err) {
      show(err.userMessage, 'error');
    }
  };

  return (
    <div className="admin-products">
      <div className="admin-head-row">
        <h2>Products ({products.length})</h2>
        <button className="btn btn-primary" onClick={startAdd}>+ Add Product</button>
      </div>

      {(editing !== null || form.name || form.price) && (
        <form className="panel-card" onSubmit={save}>
          <h2>{editing ? 'Edit Product' : 'New Product'}</h2>
          <div className="form-2col">
            <div className="field"><label>Name *</label><input value={form.name} onChange={set('name')} required /></div>
            <div className="field"><label>Brand</label><input value={form.brand} onChange={set('brand')} /></div>
          </div>
          <div className="field"><label>Description *</label><textarea value={form.description} onChange={set('description')} rows={2} required /></div>
          <div className="form-3col">
            <div className="field"><label>Price (₹) *</label><input type="number" min="0" value={form.price} onChange={set('price')} required /></div>
            <div className="field"><label>MRP (₹)</label><input type="number" min="0" value={form.actualPrice} onChange={set('actualPrice')} /></div>
            <div className="field"><label>Stock *</label><input type="number" min="0" value={form.stock} onChange={set('stock')} required /></div>
          </div>
          <div className="form-2col">
            <div className="field">
              <label>Category</label>
              <select value={form.category} onChange={set('category')}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Featured</label>
              <label className="check"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Show on homepage</label>
            </div>
          </div>
          <div className="field">
            <label>Images</label>
            <input type="file" accept="image/*" multiple onChange={(e) => setFiles([...e.target.files])} />
            <small className="muted">Upload up to 5 images. {files.length} selected.</small>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Product'}</button>
            <button type="button" className="btn btn-outline" onClick={() => { setEditing(null); setFiles([]); }}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <Spinner />
      ) : (
        <table className="table">
          <thead>
            <tr><th></th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Rating</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id}>
                <td><img src={p.images?.[0] || 'https://picsum.photos/seed/placeholder/60/60'} alt="" className="tbl-img" /></td>
                <td>{p.name}<small className="muted">{p.brand}</small></td>
                <td>{p.category}</td>
                <td>{formatINR(p.price)}</td>
                <td><span className={p.stock === 0 ? 'danger' : p.stock <= 5 ? 'accent' : ''}>{p.stock}</span></td>
                <td>{p.ratingsAverage.toFixed(1)}({p.ratingsCount})</td>
                <td>
                  <button className="btn btn-outline btn-sm" onClick={() => startEdit(p)}>Edit</button>{' '}
                  <button className="btn btn-danger btn-sm" onClick={() => remove(p._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}