import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ScanBarcode } from 'lucide-react';
import { getProduct, saveSale } from '../db';
import type { Product, Sale } from '../db';
import type { Cart } from '../App';
import { useProducts } from '../hooks/useProducts';
import { categoryLabel } from '../categories';
import { formatCents, money, newId, normalize, toCents } from '../utils';
import QtyControls from '../components/QtyControls';

// La librería del escáner pesa bastante: se descarga solo al abrir la cámara.
const Scanner = lazy(() => import('../components/Scanner'));

interface POSProps {
  cart: Cart;
  onQtyChange: (productId: string, delta: number) => void;
  onClearCart: () => void;
}

const MAX_SEARCH_RESULTS = 8;

export default function POS({ cart, onQtyChange, onClearCart }: POSProps) {
  const navigate = useNavigate();
  const { products } = useProducts();
  const [search, setSearch] = useState('');
  const [efectivo, setEfectivo] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [unknownCode, setUnknownCode] = useState<string | null>(null);
  const [successVueltoCents, setSuccessVueltoCents] = useState<number | null>(null);
  const lastCheckoutAt = useRef(0);
  const successTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(successTimer.current), []);

  const searchResults = useMemo(() => {
    const term = normalize(search.trim());
    if (term.length < 2) return [];
    return products
      .filter(p => normalize(p.nombre).includes(term) || p.id_producto.toLowerCase().includes(term))
      .slice(0, MAX_SEARCH_RESULTS);
  }, [products, search]);

  const addToCart = (product: Product) => {
    onQtyChange(product.id_producto, 1);
    setSearch('');
  };

  const handleScan = async (code: string) => {
    setIsScanning(false);
    const product = await getProduct(code);
    if (product) {
      addToCart(product);
    } else {
      setUnknownCode(code);
    }
  };

  // Enter en el buscador: sirve para lectores de código de barras USB/Bluetooth,
  // que "escriben" el código y pulsan Enter.
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const term = search.trim();
    if (!term) return;
    const exact = products.find(p => p.id_producto === term);
    if (exact) {
      addToCart(exact);
    } else if (searchResults.length === 1) {
      addToCart(searchResults[0]);
    } else if (searchResults.length === 0 && /^\d{6,}$/.test(term)) {
      setSearch('');
      setUnknownCode(term);
    }
  };

  const cartItems = useMemo(
    () =>
      Object.entries(cart).flatMap(([id, cantidad]) => {
        const product = products.find(p => p.id_producto === id);
        return product ? [{ ...product, cantidad }] : [];
      }),
    [cart, products],
  );

  // Todo el dinero se calcula en centavos enteros para evitar errores de redondeo.
  const totalCents = cartItems.reduce((sum, item) => sum + toCents(item.precio_unitario) * item.cantidad, 0);
  const efectivoCents = toCents(parseFloat(efectivo) || 0);
  const hasEfectivo = efectivo !== '';
  const isFaltante = hasEfectivo && efectivoCents < totalCents;
  const diffCents = hasEfectivo ? Math.abs(efectivoCents - totalCents) : 0;
  const canCheckout = cartItems.length > 0 && hasEfectivo && !isFaltante;

  const handleCheckout = () => {
    if (!canCheckout) return;
    // El botón dispara pointerdown y click: se ignora el segundo evento.
    const now = Date.now();
    if (now - lastCheckoutAt.current < 1000) return;
    lastCheckoutAt.current = now;

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur(); // Cierra el teclado en móviles
    }

    const sale: Sale = {
      id: newId(),
      fecha: now,
      items: cartItems.map(item => ({
        id_producto: item.id_producto,
        nombre: item.nombre,
        precio_unitario: item.precio_unitario,
        cantidad: item.cantidad,
      })),
      total: totalCents / 100,
      efectivo: efectivoCents / 100,
      vuelto: (efectivoCents - totalCents) / 100,
    };
    saveSale(sale).catch(err => {
      console.error(err);
      alert('La venta no se pudo guardar en el historial. Anótala a mano y revisa el almacenamiento del dispositivo.');
    });

    setSuccessVueltoCents(efectivoCents - totalCents);
    onClearCart();
    setEfectivo('');
    clearTimeout(successTimer.current);
    successTimer.current = setTimeout(() => setSuccessVueltoCents(null), 1800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {isScanning && (
        <Suspense fallback={null}>
          <Scanner onScan={handleScan} onClose={() => setIsScanning(false)} />
        </Suspense>
      )}

      {unknownCode && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-body">
              <div className="modal-title">Producto no registrado</div>
              <div className="modal-text">
                El código <strong>{unknownCode}</strong> no está en el catálogo. ¿Quieres registrarlo ahora?
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="modal-action modal-action-primary"
                onClick={() => navigate(`/add?id=${encodeURIComponent(unknownCode)}`)}
              >
                Registrar producto
              </button>
              <button type="button" className="modal-action" onClick={() => setUnknownCode(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ paddingTop: '12px' }}></div>

      <div className="content" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Buscador */}
        <div className="search-bar" style={{ position: 'relative', zIndex: 5 }}>
          <Search size={18} className="search-icon" />
          <input
            placeholder="Buscar producto o código..."
            aria-label="Buscar producto"
            enterKeyHint="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <button
            type="button"
            className="header-btn"
            aria-label="Escanear código"
            style={{ padding: '0 8px', color: 'var(--accent)' }}
            onClick={() => setIsScanning(true)}
          >
            <ScanBarcode size={28} />
          </button>
        </div>

        {/* Resultados de búsqueda */}
        {search.trim().length >= 2 && (
          <div className="list-group" style={{ margin: '-4px 20px 8px', position: 'relative', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', flexShrink: 0 }}>
            {searchResults.length === 0 ? (
              <div className="list-item" style={{ color: 'var(--text-light)', fontSize: '15px' }}>
                No se encontró "{search.trim()}"
              </div>
            ) : (
              searchResults.map(p => (
                <button type="button" key={p.id_producto} className="list-item list-item-btn" onClick={() => addToCart(p)}>
                  <div style={{ textAlign: 'left' }}>
                    <div className="list-item-title">{p.nombre}</div>
                    <div className="list-item-subtitle">{categoryLabel(p.categoria)}</div>
                  </div>
                  <span className="list-item-value">{money(p.precio_unitario)}</span>
                </button>
              ))
            )}
          </div>
        )}

        {/* Carrito */}
        <div style={{ flex: 1, overflowY: 'auto', marginTop: '8px', minHeight: '120px' }}>
          {cartItems.length === 0 ? (
            <div className="empty-state">
              <p style={{ fontSize: '40px' }}>🛒</p>
              <p>El carrito está vacío</p>
              <p style={{ fontSize: '15px' }}>Busca o escanea un producto</p>
            </div>
          ) : (
            <>
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
                          {money(item.precio_unitario)} c/u
                        </div>
                      </td>
                      <td className="price-cell">{formatCents(toCents(item.precio_unitario) * item.cantidad)}</td>
                      <td>
                        <QtyControls
                          qty={item.cantidad}
                          label={item.nombre}
                          onChange={delta => onQtyChange(item.id_producto, delta)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ textAlign: 'center', padding: '10px 20px' }}>
                <button
                  type="button"
                  className="text-btn text-btn-danger"
                  onClick={() => {
                    if (confirm('¿Vaciar todo el carrito?')) {
                      onClearCart();
                      setEfectivo('');
                    }
                  }}
                >
                  Vaciar carrito
                </button>
              </div>
            </>
          )}
        </div>

        {/* Totales y cobro */}
        {cartItems.length > 0 && (
          <div className="cart-total">
            <div className="cart-total-row grand-total">
              <span>Total a Pagar</span>
              <span>{formatCents(totalCents)}</span>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="efectivo" style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Cliente da ($)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    id="efectivo"
                    className="checkout-input"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={efectivo}
                    onChange={e => {
                      const val = e.target.value;
                      if (val.includes('-')) return; // Sin negativos
                      setEfectivo(val);
                    }}
                    style={{ fontSize: '22px', fontWeight: 600, padding: '10px 14px', minWidth: 0 }}
                  />
                  <button
                    type="button"
                    className="secondary"
                    style={{ width: 'auto', padding: '10px 12px', fontSize: '14px', flexShrink: 0 }}
                    onClick={() => setEfectivo((totalCents / 100).toFixed(2))}
                  >
                    Exacto
                  </button>
                </div>
              </div>
              <div style={{ textAlign: 'right', paddingBottom: '4px', minWidth: '96px' }}>
                <div style={{ fontSize: '13px', color: isFaltante ? 'var(--danger)' : 'var(--text-light)', fontWeight: 500, marginBottom: '4px' }}>
                  {isFaltante ? 'Faltan ($)' : 'Vuelto ($)'}
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: isFaltante ? 'var(--danger)' : (diffCents > 0 ? 'var(--accent)' : 'var(--text-main)') }}>
                  {formatCents(diffCents)}
                </div>
              </div>
            </div>

            <button
              type="button"
              onPointerDown={e => {
                // Evita que el primer toque solo cierre el teclado en iOS
                e.preventDefault();
                handleCheckout();
              }}
              onClick={handleCheckout}
              disabled={!canCheckout}
            >
              Cobrar {formatCents(totalCents)}
            </button>
          </div>
        )}
      </div>

      {/* Animación de venta exitosa */}
      {successVueltoCents !== null && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'var(--white)', zIndex: 200,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeOut 0.4s ease 1.3s forwards',
          color: '#000',
        }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            animation: 'scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}>
            <svg className="apple-checkmark" style={{ width: '110px', height: '110px' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="apple-checkmark-circle-path" cx="26" cy="26" r="23" />
              <path className="apple-checkmark-check" d="M15 27l7 7 15-15" />
            </svg>
            <div style={{ marginTop: '24px', fontSize: '28px', fontWeight: 700, color: '#000', letterSpacing: '-0.5px' }}>
              ¡Venta Exitosa!
            </div>
            {successVueltoCents > 0 && (
              <div style={{ marginTop: '8px', fontSize: '20px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Vuelto: {formatCents(successVueltoCents)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
