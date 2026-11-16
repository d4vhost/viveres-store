import { useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import type { Product } from '../db';
import { categoryLabel } from '../categories';
import { money } from '../utils';
import QtyControls from './QtyControls';

interface ProductTableProps {
  products: Product[];
  cart: Record<string, number>;
  onQtyChange: (productId: string, delta: number) => void;
  showCategory?: boolean;
  emptyMessage?: React.ReactNode;
}

/** Tabla de catálogo: nombre (toca el lápiz para editar), precio y cantidad en carrito. */
export default function ProductTable({ products, cart, onQtyChange, showCategory, emptyMessage }: ProductTableProps) {
  const navigate = useNavigate();

  return (
    <table className="product-table">
      <thead>
        <tr>
          <th>Producto</th>
          <th style={{ textAlign: 'right' }}>Precio</th>
          <th style={{ textAlign: 'center' }}>Cantidad</th>
        </tr>
      </thead>
      <tbody>
        {products.length === 0 ? (
          <tr>
            <td colSpan={3} style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-light)' }}>
              {emptyMessage}
            </td>
          </tr>
        ) : (
          products.map(p => (
            <tr key={p.id_producto}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Editar ${p.nombre}`}
                    onClick={() => navigate(`/add?id=${encodeURIComponent(p.id_producto)}`)}
                  >
                    <Pencil size={15} />
                  </button>
                  <div>
                    <div style={{ fontWeight: 500 }}>{p.nombre}</div>
                    {showCategory && (
                      <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '2px' }}>
                        {categoryLabel(p.categoria)}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="price-cell">{money(p.precio_unitario)}</td>
              <td>
                <QtyControls
                  qty={cart[p.id_producto] || 0}
                  label={p.nombre}
                  onChange={delta => onQtyChange(p.id_producto, delta)}
                />
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
