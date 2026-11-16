import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ChevronLeft, Download, Upload, Cloud, HardDrive } from 'lucide-react';
import { exportBackup, importBackup, isCloudMode } from '../db';
import type { Cart } from '../App';
import { useProducts } from '../hooks/useProducts';
import { CATEGORIES } from '../categories';
import { loadSampleProducts } from '../seed';
import { formatCents, normalize, toCents, toDateInputValue } from '../utils';
import ProductTable from '../components/ProductTable';

interface ProductsProps {
  cart: Cart;
  onQtyChange: (productId: string, delta: number) => void;
}

const ITEMS_PER_PAGE = 8;

export default function Products({ cart, onQtyChange }: ProductsProps) {
  const navigate = useNavigate();
  const { products, loaded } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [catSearch, setCatSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // La categoría abierta vive en la URL (?cat=...) para volver a ella tras editar un producto.
  const selectedCategory = CATEGORIES.find(c => c.id === searchParams.get('cat')) ?? null;

  const openCategory = (catId: string | null) => {
    setCatSearch('');
    setCurrentPage(1);
    setSearchParams(catId ? { cat: catId } : {});
  };

  const countsByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) counts[p.categoria] = (counts[p.categoria] || 0) + 1;
    return counts;
  }, [products]);

  const { cartItemCount, cartTotalCents } = useMemo(() => {
    let count = 0;
    let cents = 0;
    for (const [id, qty] of Object.entries(cart)) {
      const product = products.find(p => p.id_producto === id);
      if (!product) continue;
      count += qty;
      cents += toCents(product.precio_unitario) * qty;
    }
    return { cartItemCount: count, cartTotalCents: cents };
  }, [cart, products]);

  const handleLoadSamples = async () => {
    setBusy(true);
    try {
      const count = await loadSampleProducts();
      setNotice(`Se cargaron ${count} productos de ejemplo.`);
    } catch (err) {
      console.error(err);
      setNotice('No se pudieron cargar los productos de ejemplo.');
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async () => {
    setBusy(true);
    try {
      const backup = await exportBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `respaldo-viveres-${toDateInputValue(new Date())}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setNotice(`Respaldo descargado: ${backup.products.length} productos y ${backup.sales.length} ventas.`);
    } catch (err) {
      console.error(err);
      setNotice('No se pudo crear el respaldo.');
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite volver a elegir el mismo archivo
    if (!file) return;
    setBusy(true);
    try {
      const result = await importBackup(JSON.parse(await file.text()));
      setNotice(`Respaldo importado: ${result.products} productos y ${result.sales} ventas.`);
    } catch (err) {
      console.error(err);
      setNotice(err instanceof SyntaxError ? 'El archivo no es un JSON válido.' : (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  /* ====================================================
     VISTA DE DETALLE: productos de una categoría
     ==================================================== */
  if (selectedCategory) {
    const categoryProducts = products.filter(p => p.categoria === selectedCategory.id);
    const term = normalize(catSearch.trim());
    const filtered = term ? categoryProducts.filter(p => normalize(p.nombre).includes(term)) : categoryProducts;
    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const page = Math.min(currentPage, totalPages);
    const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button type="button" className="header-btn" aria-label="Volver a categorías" onClick={() => openCategory(null)} style={{ padding: '4px' }}>
            <ChevronLeft size={28} />
          </button>
          <h2 style={{ fontSize: '22px', fontWeight: 700 }}>{selectedCategory.label}</h2>
        </div>

        <div className="search-bar" style={{ paddingTop: '12px' }}>
          <Search size={18} className="search-icon" style={{ top: '50%' }} />
          <input
            placeholder="Buscar en esta categoría..."
            aria-label="Buscar en esta categoría"
            value={catSearch}
            onChange={e => { setCatSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div className="content" style={{ flex: 1, overflow: 'auto' }}>
          <ProductTable
            products={paginated}
            cart={cart}
            onQtyChange={onQtyChange}
            emptyMessage={
              categoryProducts.length === 0 ? (
                <>
                  <p style={{ fontSize: '15px' }}>No hay productos registrados en esta categoría.</p>
                  <p style={{ fontSize: '13px', marginTop: '4px' }}>
                    Usa la pestaña <Link to="/add" style={{ color: 'var(--accent)', fontWeight: 600 }}>Añadir</Link> para registrar uno.
                  </p>
                </>
              ) : (
                <>No se encontró "{catSearch.trim()}"</>
              )
            }
          />

          {totalPages > 1 && (
            <div className="pagination">
              <button type="button" className="pagination-btn" disabled={page === 1} onClick={() => setCurrentPage(page - 1)}>
                Anterior
              </button>
              <span className="pagination-info">Página {page} de {totalPages}</span>
              <button type="button" className="pagination-btn" disabled={page === totalPages} onClick={() => setCurrentPage(page + 1)}>
                Siguiente
              </button>
            </div>
          )}
        </div>

        {cartItemCount > 0 && (
          <div className="cart-footer">
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>{cartItemCount} artículo{cartItemCount !== 1 ? 's' : ''} en carrito</div>
              <div style={{ fontSize: '22px', fontWeight: 700 }}>Total: {formatCents(cartTotalCents)}</div>
            </div>
            <button type="button" onClick={() => navigate('/')} style={{ width: 'auto', padding: '12px 20px', fontSize: '15px' }}>
              Ir a Caja
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ====================================================
     VISTA PRINCIPAL: buscador + cuadrícula de categorías
     ==================================================== */
  const term = normalize(search.trim());
  const searchResults = term.length >= 2
    ? products.filter(p => normalize(p.nombre).includes(term) || p.id_producto.toLowerCase().includes(term))
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="content">
        <div className="search-bar" style={{ marginTop: '12px' }}>
          <Search size={18} className="search-icon" />
          <input
            placeholder="Buscar producto o código..."
            aria-label="Buscar producto"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {notice && (
          <div className="notice" role="status" onClick={() => setNotice(null)}>
            {notice}
          </div>
        )}

        {term.length >= 2 ? (
          <div>
            <div className="section-header">RESULTADOS</div>
            <ProductTable
              products={searchResults}
              cart={cart}
              onQtyChange={onQtyChange}
              showCategory
              emptyMessage={<>No se encontró "{search.trim()}"</>}
            />
          </div>
        ) : (
          <div>
            {loaded && products.length === 0 && (
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '17px', fontWeight: 600 }}>Aún no tienes productos</div>
                <p style={{ fontSize: '14px', color: 'var(--text-light)', margin: '6px 0 14px' }}>
                  Registra tu primer producto o carga un catálogo de ejemplo para probar la app.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" style={{ fontSize: '15px', padding: '12px' }} onClick={() => navigate('/add')}>
                    Añadir producto
                  </button>
                  <button type="button" className="secondary" style={{ fontSize: '15px', padding: '12px' }} disabled={busy} onClick={handleLoadSamples}>
                    Cargar ejemplos
                  </button>
                </div>
              </div>
            )}

            <div className="section-header">CATEGORÍAS</div>
            <div className="category-grid">
              {CATEGORIES.map(cat => {
                const count = countsByCategory[cat.id] || 0;
                return (
                  <button type="button" key={cat.id} className="category-card" onClick={() => openCategory(cat.id)}>
                    <img className="category-card-img" src={cat.image} alt="" loading="lazy" />
                    <div className="category-card-body">
                      <div className="category-card-title">{cat.label}</div>
                      <div className="category-card-count">
                        {count} {count === 1 ? 'producto' : 'productos'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="section-header" style={{ paddingTop: '8px' }}>RESPALDO</div>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                {isCloudMode ? <Cloud size={18} /> : <HardDrive size={18} />}
                <span>
                  {isCloudMode
                    ? 'Los datos se sincronizan con Firebase.'
                    : 'Los datos se guardan solo en este dispositivo. Descarga un respaldo con frecuencia.'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button type="button" className="secondary" style={{ fontSize: '15px', padding: '12px' }} disabled={busy} onClick={handleExport}>
                  <Download size={18} /> Exportar
                </button>
                <button type="button" className="secondary" style={{ fontSize: '15px', padding: '12px' }} disabled={busy} onClick={() => fileInput.current?.click()}>
                  <Upload size={18} /> Importar
                </button>
                <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={handleImport} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
