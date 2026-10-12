import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const GUEST_KEY = 'guestCart';

const readGuest = () => {
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY)) || [];
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const lastToken = useRef(null);

  const applyServerCart = useCallback((data) => {
    setItems(data.items || []);
  }, []);

  useEffect(() => {
    if (token === lastToken.current) return;
    lastToken.current = token;

    if (!token) {
      setItems(readGuest());
      return;
    }

    setLoading(true);
    const guest = readGuest();
    const sync = guest.length
      ? api.post('/cart/sync', { items: guest }).then(applyServerCart).then(async () => {
          localStorage.removeItem(GUEST_KEY);
        })
      : api.get('/cart').then(({ data }) => applyServerCart(data));

    sync
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, applyServerCart]);

  const addItem = useCallback(
    async (product, qty = 1) => {
      const snapshot = {
        id: product._id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || '',
        brand: product.brand || '',
        stock: product.stock,
      };
      if (!token) {
        const guest = readGuest();
        const existing = guest.find((g) => g.id === product._id);
        if (existing) existing.qty = Math.min(existing.qty + qty, product.stock);
        else guest.push({ ...snapshot, qty });
        localStorage.setItem(GUEST_KEY, JSON.stringify(guest));
        setItems([...guest]);
        return;
      }
      const { data } = await api.post('/cart', { productId: product._id, qty });
      applyServerCart(data);
    },
    [token, applyServerCart]
  );

  const updateQty = useCallback(
    async (id, qty) => {
      if (qty < 1) {
        if (!token) {
          const guest = readGuest().filter((g) => g.id !== id);
          localStorage.setItem(GUEST_KEY, JSON.stringify(guest));
          setItems([...guest]);
          return;
        }
        await api.delete(`/cart/${id}`);
        const { data } = await api.get('/cart');
        applyServerCart(data);
        return;
      }
      if (!token) {
        const guest = readGuest().map((g) => (g.id === id ? { ...g, qty } : g));
        localStorage.setItem(GUEST_KEY, JSON.stringify(guest));
        setItems([...guest]);
        return;
      }
      const { data } = await api.put(`/cart/${id}`, { qty });
      applyServerCart(data);
    },
    [token, applyServerCart]
  );

  const removeItem = useCallback(
    async (id) => {
      if (!token) {
        const guest = readGuest().filter((g) => g.id !== id);
        localStorage.setItem(GUEST_KEY, JSON.stringify(guest));
        setItems([...guest]);
        return;
      }
      await api.delete(`/cart/${id}`);
      const { data } = await api.get('/cart');
      applyServerCart(data);
    },
    [token, applyServerCart]
  );

  const clearCart = useCallback(async () => {
    localStorage.removeItem(GUEST_KEY);
    if (token) {
      await api.delete('/cart').catch(() => {});
      setItems([]);
    } else {
      setItems([]);
    }
  }, [token]);

  const subtotal = items.reduce((n, i) => n + (i.price || 0) * i.qty, 0);
  const count = items.reduce((n, i) => n + i.qty, 0);

  return (
    <CartContext.Provider value={{ items, loading, count, subtotal, addItem, updateQty, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);