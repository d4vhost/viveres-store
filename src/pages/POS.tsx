import { useState, useEffect } from 'react';
import { searchProductsByName, getProduct, getAllProducts, subscribeToProducts } from '../db';
import type { Product } from '../db';
import { Search, QrCode, Plus, Minus } from 'lucide-react';
import Scanner from '../components/Scanner';

interface POSProps {
  cart: Record<string, number>;
  setCart: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export default function POS({ cart, setCart }: POSProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [efectivo, setEfectivo] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToProducts(setProducts);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (search.length >= 2) {
      searchProductsByName(search).then(setSearchResults);
    } else {
      setSearchResults([]);
    }
  }, [search]);

  const updateCart = (productId: string, delta: number) => {
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
  };

  const addToCart = (product: Product) => {
    updateCart(product.id_producto, 1);
    setSearch('');
    setSearchResults([]);
    setIsScanning(false);
  };

  const handleScan = async (code: string) => {
    const product = await getProduct(code);
    if (product) {
      addToCart(product);
    } else {
      alert(`Producto con código ${code} no encontrado. Regístralo primero en Productos.`);
      setIsScanning(false);
    }
  };

  const handleCheckout = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur(); // Cierra el teclado en móviles
    }
    setCart({});
    setEfectivo('');
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 1800); // Wait for Apple Pay animation to finish
  };

  // Build full cart items for rendering
  const cartItems = Object.entries(cart)
    .map(([id, qty]) => {
      const product = products.find(p => p.id_producto === id);
      return product ? { ...product, cantidad: qty } : null;
    })
    .filter(Boolean) as (Product & { cantidad: number })[];

  const total = cartItems.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0);
  const efectivoNum = parseFloat(efectivo) || 0;
  const isFaltante = efectivo !== '' && efectivoNum < total;
  const vuelto = isFaltante ? total - efectivoNum : (efectivoNum >= total ? efectivoNum - total : 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {isScanning && (
        <Scanner onScan={handleScan} onClose={() => setIsScanning(false)} />
      )}

      {/* Header removed as requested, just a small padding for status bar */}
      <div style={{ paddingTop: '12px' }}></div>

      <div className="content" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Search */}
        <div className="search-bar" style={{ position: 'relative', zIndex: 5 }}>
          <Search size={18} className="search-icon" />
          <input
            placeholder="Buscar producto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="header-btn" style={{ padding: '0 8px', color: 'var(--accent)' }} onClick={() => setIsScanning(true)}>
            <QrCode size={28} />
          </button>
        </div>

        {/* Search Dropdown */}
        {searchResults.length > 0 && (
          <div className="list-group" style={{ margin: '-4px 20px 8px', position: 'relative', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            {searchResults.map(p => (
              <div
                key={p.id_producto}
                className="list-item"
                onClick={() => addToCart(p)}
                style={{ cursor: 'pointer' }}
              >
                <div>
                  <div className="list-item-title">{p.nombre}</div>
                  <div className="list-item-subtitle">{p.categoria}</div>
                </div>
                <span className="list-item-value">${p.precio_unitario.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Cart */}
        <div style={{ flex: 1, overflowY: 'auto', marginTop: '8px' }}>
          {cartItems.length === 0 ? (
            <div className="empty-state">
              <p style={{ fontSize: '40px' }}>🛒</p>
              <p>El carrito está vacío</p>
              <p style={{ fontSize: '15px' }}>Busca o escanea un producto</p>
            </div>
          ) : (
            <table className="product-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style={{ textAlign: 'right' }}>Precio</th>
                  <th style={{ textAlign: 'center' }}>Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map(item => (
                  <tr key={item.id_producto}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.nombre}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '2px' }}>
                        ${item.precio_unitario.toFixed(2)} c/u
                      </div>
                    </td>
                    <td className="price-cell">${(item.precio_unitario * item.cantidad).toFixed(2)}</td>
                    <td>
                      <div className="qty-controls" style={{ display: 'inline-flex', background: 'var(--gray-50)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
                        <button className="qty-btn" style={{ padding: '6px 10px', color: item.cantidad > 0 ? 'var(--text-main)' : 'var(--text-light)' }} onClick={() => updateCart(item.id_producto, -1)}><Minus size={14}/></button>
                        <span className="qty-val" style={{ fontSize: '15px', minWidth: '24px', lineHeight: '26px' }}>{item.cantidad}</span>
                        <button className="qty-btn" style={{ padding: '6px 10px' }} onClick={() => updateCart(item.id_producto, 1)}><Plus size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Totals & Checkout */}
        {cartItems.length > 0 && (
          <div className="cart-total">
            <div className="cart-total-row grand-total">
              <span>Total a Pagar</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Cliente da ($)</label>
                <input
                  className="checkout-input"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="0.00"
                  value={efectivo}
                  onChange={e => {
                    let val = e.target.value;
                    if (val.includes('-')) return; // No negatives
                    if (val !== '' && parseFloat(val) > 100) {
                      val = '100'; // Max 100
                    }
                    setEfectivo(val);
                  }}
                  style={{ fontSize: '22px', fontWeight: 600, padding: '10px 14px' }}
                />
              </div>
              <div style={{ flex: 1, textAlign: 'right', paddingBottom: '4px' }}>
                <label style={{ fontSize: '13px', color: isFaltante ? 'var(--danger)' : 'var(--text-light)', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                  {isFaltante ? 'Faltan ($)' : 'Vuelto ($)'}
                </label>
                <div style={{ fontSize: '28px', fontWeight: 700, color: isFaltante ? 'var(--danger)' : (vuelto > 0 ? 'var(--accent)' : 'var(--text-main)') }}>
                  ${vuelto.toFixed(2)}
                </div>
              </div>
            </div>

            <button 
              onPointerDown={(e) => {
                // Previene que el primer toque solo cierre el teclado en iOS
                e.preventDefault();
                if (!isFaltante && efectivo !== '') {
                  handleCheckout();
                }
              }}
              onClick={() => {
                if (!isFaltante && efectivo !== '') {
                  handleCheckout();
                }
              }}
              disabled={isFaltante || efectivo === ''} 
              style={{ opacity: (isFaltante || efectivo === '') ? 0.5 : 1 }}
            >
              Cobrar ${total.toFixed(2)}
            </button>
          </div>
        )}
      </div>

      {/* Success Animation Overlay (Apple Style Fullscreen) */}
      {showSuccess && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'var(--white)', zIndex: 200,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeOut 0.4s ease 1.3s forwards',
          color: '#000'
        }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            animation: 'scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
            <svg className="apple-checkmark" style={{ width: '110px', height: '110px' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="apple-checkmark-circle-path" cx="26" cy="26" r="23" />
              <path className="apple-checkmark-check" d="M15 27l7 7 15-15" />
            </svg>
            <div style={{ marginTop: '24px', fontSize: '28px', fontWeight: 700, color: '#000', letterSpacing: '-0.5px' }}>
              ¡Venta Exitosa!
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

