import { useCallback, useEffect, useState } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { ShoppingCart, Package, PlusCircle, Receipt, X } from 'lucide-react';
import POS from './pages/POS';
import Products from './pages/Products';
import AddProduct from './pages/AddProduct';
import Sales from './pages/Sales';
import { clearSyncError, subscribeToSyncError } from './db';

export type Cart = Record<string, number>;

const CART_KEY = 'viveres-pos-cart';

function loadCart(): Cart {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CART_KEY) ?? '{}');
    if (!parsed || typeof parsed !== 'object') return {};
    const cart: Cart = {};
    for (const [id, qty] of Object.entries(parsed)) {
      if (typeof qty === 'number' && Number.isInteger(qty) && qty > 0) cart[id] = qty;
    }
    return cart;
  } catch {
    return {};
  }
}

const navClass = ({ isActive }: { isActive: boolean }) => `nav-item ${isActive ? 'active' : ''}`;

function App() {
  // Carrito global: Record<id_producto, cantidad>. Se guarda para sobrevivir recargas.
  const [cart, setCart] = useState<Cart>(loadCart);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      // Almacenamiento lleno o bloqueado: el carrito sigue funcionando en memoria.
    }
  }, [cart]);

  useEffect(() => subscribeToSyncError(setSyncError), []);

  const changeQty = useCallback((productId: string, delta: number) => {
    setCart(prev => {
      const newQty = Math.max(0, (prev[productId] || 0) + delta);
      const updated = { ...prev };
      if (newQty === 0) {
        delete updated[productId];
      } else {
        updated[productId] = newQty;
      }
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => setCart({}), []);

  return (
    <>
      {syncError && (
        <div className="error-banner" role="alert">
          <span>{syncError}</span>
          <button type="button" className="icon-btn" aria-label="Cerrar aviso" onClick={clearSyncError}>
            <X size={18} />
          </button>
        </div>
      )}
      <Routes>
        <Route path="/" element={<POS cart={cart} onQtyChange={changeQty} onClearCart={clearCart} />} />
        <Route path="/products" element={<Products cart={cart} onQtyChange={changeQty} />} />
        <Route path="/add" element={<AddProduct />} />
        <Route path="/ventas" element={<Sales />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <nav className="bottom-nav">
        <NavLink to="/" end className={navClass}>
          <ShoppingCart />
          <span>Caja</span>
        </NavLink>
        <NavLink to="/add" className={navClass}>
          <PlusCircle />
          <span>Añadir</span>
        </NavLink>
        <NavLink to="/products" className={navClass}>
          <Package />
          <span>Productos</span>
        </NavLink>
        <NavLink to="/ventas" className={navClass}>
          <Receipt />
          <span>Ventas</span>
        </NavLink>
      </nav>
    </>
  );
}

export default App;
