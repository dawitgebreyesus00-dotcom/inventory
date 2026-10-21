import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext();

const STORAGE_KEY = 'customer_cart';

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch (err) {
      console.error('Failed to load cart', err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.error('Failed to save cart', err);
    }
  }, [items]);

  const addItem = (product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.product._id === product._id);
      if (existing) {
        return prev.map((p) =>
          p.product._id === product._id ? { ...p, quantity: p.quantity + quantity } : p
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const updateQuantity = (productId, quantity) => {
    setItems((prev) =>
      prev
        .map((p) => (p.product._id === productId ? { ...p, quantity: Math.max(1, quantity) } : p))
        .filter((p) => p.quantity > 0)
    );
  };

  const removeItem = (productId) => {
    setItems((prev) => prev.filter((p) => p.product._id !== productId));
  };

  const clear = () => setItems([]);

  const total = useMemo(
    () =>
      items.reduce((sum, it) => {
        const price = Number(it.product.price || 0);
        return sum + price * (it.quantity || 1);
      }, 0),
    [items]
  );

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, removeItem, clear, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

export default CartProvider;




