import { useEffect, useState } from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';
import { deleteSale, subscribeToSales } from '../db';
import type { Sale } from '../db';
import { dayRange, formatCents, money, toCents, toDateInputValue } from '../utils';

const timeFormat = new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' });

export default function Sales() {
  const today = toDateInputValue(new Date());
  const [date, setDate] = useState(today);
  // Las ventas se guardan junto al día al que pertenecen: si el día elegido
  // cambia, la lista anterior deja de coincidir y se muestra "Cargando...".
  const [loaded, setLoaded] = useState<{ date: string; sales: Sale[] } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);

  useEffect(() => {
    const { from, to } = dayRange(date);
    return subscribeToSales(from, to, sales => setLoaded({ date, sales }));
  }, [date]);

  const sales = loaded?.date === date ? loaded.sales : null;
  const totalCents = (sales ?? []).reduce((sum, s) => sum + toCents(s.total), 0);
  const itemCount = (sales ?? []).reduce((sum, s) => sum + s.items.reduce((n, i) => n + i.cantidad, 0), 0);

  const confirmDelete = () => {
    if (!saleToDelete) return;
    deleteSale(saleToDelete.id).catch(err => {
      console.error(err);
      alert('No se pudo anular la venta.');
    });
    setSaleToDelete(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {saleToDelete && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-body">
              <div className="modal-title">¿Anular esta venta?</div>
              <div className="modal-text">
                Venta de {money(saleToDelete.total)} a las {timeFormat.format(saleToDelete.fecha)}. Se borrará del historial y no se puede deshacer.
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="modal-action modal-action-danger" onClick={confirmDelete}>
                Anular venta
              </button>
              <button type="button" className="modal-action modal-action-primary" onClick={() => setSaleToDelete(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="content">
        <div style={{ padding: '12px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <h1 style={{ fontSize: '34px', fontWeight: 700, letterSpacing: '0.37px' }}>Ventas</h1>
          <input
            type="date"
            aria-label="Día"
            value={date}
            max={today}
            onChange={e => { if (e.target.value) { setDate(e.target.value); setExpandedId(null); } }}
            style={{ width: 'auto', padding: '8px 12px', fontSize: '15px' }}
          />
        </div>

        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Total vendido</div>
            <div className="stat-value">{formatCents(totalCents)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Ventas</div>
            <div className="stat-value">{sales?.length ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Artículos</div>
            <div className="stat-value">{itemCount}</div>
          </div>
        </div>

        <div className="section-header">{date === today ? 'VENTAS DE HOY' : 'VENTAS DEL DÍA'}</div>

        {sales === null ? (
          <div className="empty-state" style={{ padding: '30px 20px' }}><p>Cargando...</p></div>
        ) : sales.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px 20px' }}>
            <p style={{ fontSize: '40px' }}>🧾</p>
            <p>No hay ventas registradas este día</p>
          </div>
        ) : (
          <div className="list-group" style={{ marginBottom: '20px' }}>
            {sales.map(sale => {
              const expanded = expandedId === sale.id;
              const units = sale.items.reduce((n, i) => n + i.cantidad, 0);
              return (
                <div key={sale.id} className="sale-row">
                  <button
                    type="button"
                    className="list-item list-item-btn"
                    aria-expanded={expanded}
                    onClick={() => setExpandedId(expanded ? null : sale.id)}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <div className="list-item-title">{timeFormat.format(sale.fecha)}</div>
                      <div className="list-item-subtitle">{units} artículo{units !== 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="list-item-value">{money(sale.total)}</span>
                      <ChevronDown size={18} style={{ color: 'var(--text-light)', transform: expanded ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s ease' }} />
                    </div>
                  </button>
                  {expanded && (
                    <div className="sale-detail">
                      {sale.items.map(item => (
                        <div key={item.id_producto} className="sale-detail-row">
                          <span>{item.cantidad} × {item.nombre}</span>
                          <span>{formatCents(toCents(item.precio_unitario) * item.cantidad)}</span>
                        </div>
                      ))}
                      <div className="sale-detail-row" style={{ color: 'var(--text-light)', marginTop: '6px' }}>
                        <span>Pagó {money(sale.efectivo)}</span>
                        <span>Vuelto {money(sale.vuelto)}</span>
                      </div>
                      <button type="button" className="text-btn text-btn-danger" style={{ marginTop: '10px' }} onClick={() => setSaleToDelete(sale)}>
                        <Trash2 size={15} /> Anular venta
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
