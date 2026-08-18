import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProducts, saveProduct, deleteProduct, subscribeToProducts } from '../db';
import type { Product } from '../db';
import { PlusCircle, Search, QrCode, ChevronLeft, Trash2, Plus, Minus } from 'lucide-react';
import Scanner from '../components/Scanner';

/* =============================
   Category definitions with local images
   ============================= */
interface Category {
  id: string;
  label: string;
  image: string;
}

export const CATEGORIES: Category[] = [
  { id: 'frutas-verduras', label: 'Frutas y Verduras', image: '/images/categories/frutas-verduras.jpg' },
  { id: 'carnes', label: 'Carnes y Embutidos', image: '/images/categories/carnes.jpg' },
  { id: 'lacteos', label: 'Lácteos y Huevos', image: '/images/categories/lacteos.jpg' },
  { id: 'congelados', label: 'Congelados', image: '/images/categories/congelados.jpg' },
  { id: 'despensa', label: 'Despensa y Abarrotes', image: '/images/categories/despensa.jpg' },
  { id: 'desayuno-galletas', label: 'Desayuno y Galletas', image: '/images/categories/desayuno-galletas.jpg' },
  { id: 'panaderia', label: 'Panadería', image: '/images/categories/panaderia.jpg' },
  { id: 'bebidas-snacks', label: 'Bebidas y Snacks', image: '/images/categories/bebidas-snacks.jpg' },
  { id: 'utiles-papeleria', label: 'Útiles y Papelería', image: '/images/categories/utiles-papeleria.jpg' },
  { id: 'limpieza', label: 'Limpieza del Hogar', image: '/images/categories/limpieza.jpg' },
  { id: 'higiene-personal', label: 'Cuidado Personal', image: '/images/categories/higiene-personal.jpg' },
  { id: 'bebes-mascotas', label: 'Bebés y Mascotas', image: '/images/categories/bebes-mascotas.jpg' },
];

interface ProductsProps {
  cart: Record<string, number>;
  setCart: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export default function Products({ cart, setCart }: ProductsProps) {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const [catSearch, setCatSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    const all = await getAllProducts();
    setProducts(all);
  };

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

  const countByCategory = (catId: string) => products.filter(p => p.categoria === catId).length;

  const categoryProducts = selectedCategory
    ? products.filter(p => p.categoria === selectedCategory)
    : [];

  const searchResults = search.length >= 2
    ? products.filter(p =>
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.id_producto.includes(search)
      )
    : [];

  const selectedCategoryObj = CATEGORIES.find(c => c.id === selectedCategory);

  /* ====================================================
     DETAIL VIEW: Products in a category (with cart)
     ==================================================== */
  if (selectedCategory) {
    const ITEMS_PER_PAGE = 8;

    const filteredCatProducts = catSearch.length >= 1
      ? categoryProducts.filter(p => p.nombre.toLowerCase().includes(catSearch.toLowerCase()))
      : categoryProducts;

    const totalPages = Math.ceil(filteredCatProducts.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedProducts = filteredCatProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
      const product = products.find(p => p.id_producto === id);
      return sum + (product ? product.precio_unitario * qty : 0);
    }, 0);

    const cartItemCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        {/* Back arrow + title — no bar */}
        <div style={{ padding: '12px 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="header-btn" onClick={() => { setSelectedCategory(null); setCatSearch(''); setCurrentPage(1); }} style={{ padding: '4px' }}>
            <ChevronLeft size={28} />
          </button>
          <h2 style={{ fontSize: '22px', fontWeight: 700 }}>{selectedCategoryObj?.label}</h2>
        </div>

        {/* Search */}
        <div className="search-bar" style={{ paddingTop: '12px' }}>
          <Search size={18} className="search-icon" />
          <input
            placeholder="Buscar en esta categoría..."
            value={catSearch}
            onChange={e => { setCatSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>

        {/* Product list with +/- */}
        <div className="content" style={{ flex: 1, overflow: 'auto' }}>
          {categoryProducts.length === 0 ? (
            <div style={{ margin: '0 20px' }}>
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style={{ textAlign: 'right' }}>Precio</th>
                    <th style={{ textAlign: 'center' }}>Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-light)' }}>
                      <p style={{ fontSize: '15px' }}>No hay productos registrados en esta categoría.</p>
                      <p style={{ fontSize: '13px', marginTop: '4px' }}>Regresa a categorías y toca <strong>+</strong> para agregar.</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : filteredCatProducts.length === 0 ? (
            <div style={{ margin: '0 20px' }}>
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style={{ textAlign: 'right' }}>Precio</th>
                    <th style={{ textAlign: 'center' }}>Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-light)' }}>
                      No se encontró "{catSearch}"
                    </td>
                  </tr>
                </tbody>
              </table>
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
                  {paginatedProducts.map(p => {
                    const qty = cart[p.id_producto] || 0;
                    return (
                      <tr key={p.id_producto}>
                        <td style={{ fontWeight: 500 }}>{p.nombre}</td>
                        <td className="price-cell">${p.precio_unitario.toFixed(2)}</td>
                        <td>
                          <div className="qty-controls" style={{ display: 'inline-flex', background: 'var(--gray-50)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
                            <button className="qty-btn" style={{ padding: '6px 10px', color: qty > 0 ? 'var(--text-main)' : 'var(--text-light)' }} onClick={() => updateCart(p.id_producto, -1)}><Minus size={14}/></button>
                            <span className="qty-val" style={{ fontSize: '15px', minWidth: '24px', lineHeight: '26px' }}>{qty}</span>
                            <button className="qty-btn" style={{ padding: '6px 10px' }} onClick={() => updateCart(p.id_producto, 1)}><Plus size={14}/></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="pagination">
                  <button 
                    className="pagination-btn" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    Anterior
                  </button>
                  <span className="pagination-info">Página {currentPage} de {totalPages}</span>
                  <button 
                    className="pagination-btn" 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Cart total footer — only show if there are items */}
        {cartItemCount > 0 && (
          <div style={{
            marginTop: 'auto', padding: '16px 20px 20px', borderTop: '0.33px solid var(--separator)',
            background: 'var(--white)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>{cartItemCount} artículo{cartItemCount !== 1 ? 's' : ''} en carrito</div>
              <div style={{ fontSize: '22px', fontWeight: 700 }}>Total: ${cartTotal.toFixed(2)}</div>
            </div>
            <button
              onClick={() => navigate('/')}
              style={{ width: 'auto', padding: '12px 20px', fontSize: '15px' }}
            >
              Ir a Caja
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ====================================================
     MAIN VIEW: Search + Category Grid (clean, no header bar)
     ==================================================== */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="content">
        {/* Search */}
        <div className="search-bar" style={{ marginTop: '12px' }}>
          <Search size={18} className="search-icon" />
          <input
            placeholder="Buscar producto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Search Results */}
        {search.length >= 2 ? (
          <div>
            <div className="section-header">RESULTADOS</div>
            {searchResults.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px' }}>
                <p>No se encontró "{search}"</p>
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
                  {searchResults.map(p => {
                    const qty = cart[p.id_producto] || 0;
                    return (
                      <tr key={p.id_producto}>
                        <td style={{ fontWeight: 500 }}>
                          {p.nombre}
                          <div style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: 400, marginTop: '2px' }}>
                            {CATEGORIES.find(c => c.id === p.categoria)?.label || p.categoria}
                          </div>
                        </td>
                        <td className="price-cell">${p.precio_unitario.toFixed(2)}</td>
                        <td>
                          <div className="qty-controls" style={{ display: 'inline-flex', background: 'var(--gray-50)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
                            <button className="qty-btn" style={{ padding: '6px 10px', color: qty > 0 ? 'var(--text-main)' : 'var(--text-light)' }} onClick={() => updateCart(p.id_producto, -1)}>
                              <Minus size={14}/>
                            </button>
                            <span className="qty-val" style={{ fontSize: '15px', minWidth: '24px', lineHeight: '26px' }}>{qty}</span>
                            <button className="qty-btn" style={{ padding: '6px 10px' }} onClick={() => updateCart(p.id_producto, 1)}>
                              <Plus size={14}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          /* Category Grid */
          <div>
            <div className="section-header">CATEGORÍAS</div>
            <div className="category-grid">
              {CATEGORIES.map(cat => (
                <div key={cat.id} className="category-card" onClick={() => setSelectedCategory(cat.id)}>
                  <img
                    className="category-card-img"
                    src={cat.image}
                    alt={cat.label}
                    loading="lazy"
                  />
                  <div className="category-card-body">
                    <div className="category-card-title">{cat.label}</div>
                    <div className="category-card-count">
                      {countByCategory(cat.id)} {countByCategory(cat.id) === 1 ? 'producto' : 'productos'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

