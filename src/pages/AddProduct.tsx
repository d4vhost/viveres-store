import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ScanBarcode } from 'lucide-react';
import { saveProduct, deleteProduct } from '../db';
import { useProducts } from '../hooks/useProducts';
import { CATEGORIES } from '../categories';

// La librería del escáner pesa bastante: se descarga solo al abrir la cámara.
const Scanner = lazy(() => import('../components/Scanner'));

const labelStyle: React.CSSProperties = {
  fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase',
  letterSpacing: '0.8px', display: 'block', marginBottom: '6px',
};

/** /add crea un producto; /add?id=CODIGO abre ese código (edición si ya existe). */
export default function AddProduct() {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id') ?? '';
  // La key reinicia el formulario al cambiar de producto o al tocar la pestaña "Añadir".
  return <AddProductForm key={initialId} initialId={initialId} />;
}

function AddProductForm({ initialId }: { initialId: string }) {
  const navigate = useNavigate();
  const { products, loaded } = useProducts();
  const cameFromLink = initialId !== '';

  const [idProducto, setIdProducto] = useState(initialId);
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [precio, setPrecio] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // Si el código escrito o escaneado ya existe, el formulario pasa a modo edición.
  const code = idProducto.trim();
  const existing = loaded ? products.find(p => p.id_producto === code) : undefined;
  const existingId = existing?.id_producto ?? null;
  const [syncedId, setSyncedId] = useState<string | null>(null);
  if (existingId !== syncedId) {
    setSyncedId(existingId);
    setNombre(existing?.nombre ?? '');
    setCategoria(existing?.categoria ?? '');
    setPrecio(existing ? String(existing.precio_unitario) : '');
  }

  const isDirty = existing
    ? nombre.trim() !== existing.nombre || categoria !== existing.categoria || parseFloat(precio) !== existing.precio_unitario
    : code !== initialId || nombre.trim() !== '' || categoria !== '' || precio !== '';

  const resetForm = () => {
    setIdProducto('');
    setNombre('');
    setCategoria('');
    setPrecio('');
  };

  const leave = () => {
    if (cameFromLink) {
      navigate(-1);
    } else {
      resetForm();
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      setShowDiscardModal(true);
    } else {
      leave();
    }
  };

  const showToast = (message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  const handleDelete = async () => {
    setShowDeleteModal(false);
    try {
      await deleteProduct(code);
      if (cameFromLink) {
        navigate(-1);
      } else {
        resetForm();
        showToast('Producto eliminado');
      }
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar el producto.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Math.round(parseFloat(precio) * 100) / 100;
    if (!code || !nombre.trim() || !categoria || !(price > 0) || saving) return;

    setSaving(true);
    try {
      await saveProduct({ id_producto: code, nombre: nombre.trim(), categoria, precio_unitario: price });
      if (cameFromLink) {
        navigate(-1);
      } else if (existing) {
        navigate(`/products?cat=${encodeURIComponent(categoria)}`);
      } else {
        // Producto nuevo: el formulario queda listo para registrar el siguiente.
        resetForm();
        showToast('Producto guardado');
      }
    } catch (err) {
      console.error(err);
      alert('No se pudo guardar el producto. Revisa el almacenamiento del dispositivo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {isScanning && (
        <Suspense fallback={null}>
          <Scanner
            onScan={scanned => { setIdProducto(scanned); setIsScanning(false); }}
            onClose={() => setIsScanning(false)}
          />
        </Suspense>
      )}

      {showDiscardModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-body">
              <div className="modal-title">¿Descartar cambios?</div>
              <div className="modal-text">Tienes información sin guardar. ¿Estás seguro de que quieres salir?</div>
            </div>
            <div className="modal-actions">
              <button type="button" className="modal-action modal-action-danger" onClick={() => { setShowDiscardModal(false); leave(); }}>
                Descartar
              </button>
              <button type="button" className="modal-action modal-action-primary" onClick={() => setShowDiscardModal(false)}>
                Seguir editando
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-body">
              <div className="modal-title">¿Eliminar producto?</div>
              <div className="modal-text">
                "{existing?.nombre}" se quitará del catálogo. Las ventas ya registradas no cambian.
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="modal-action modal-action-danger" onClick={handleDelete}>
                Eliminar
              </button>
              <button type="button" className="modal-action modal-action-primary" onClick={() => setShowDeleteModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}

      <div style={{ flex: 1, overflow: 'auto', padding: '8px 20px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' }}>
            <h1 style={{ fontSize: '34px', fontWeight: 700, letterSpacing: '0.37px' }}>
              {existing ? 'Editar Producto' : 'Nuevo Producto'}
            </h1>
            {(isDirty || cameFromLink || code !== '') && (
              <button type="button" className="text-btn" onClick={handleCancel}>
                Cancelar
              </button>
            )}
          </div>
          <p style={{ color: 'var(--text-light)', fontSize: '15px', marginTop: '6px' }}>
            Escanea el código de barras o ingresa los datos manualmente.
          </p>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
          <div>
            <label htmlFor="codigo" style={labelStyle}>Código del producto</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input id="codigo" placeholder="Barras, QR o manual" autoComplete="off" value={idProducto} onChange={e => setIdProducto(e.target.value)} required />
              <button type="button" className="secondary" aria-label="Escanear código" style={{ width: 'auto', padding: '12px', flexShrink: 0 }} onClick={() => setIsScanning(true)}>
                <ScanBarcode size={28} />
              </button>
            </div>
            {existing && (
              <p style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '6px' }}>
                Este código ya está registrado: estás editando el producto existente.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="nombre" style={labelStyle}>Nombre</label>
            <input id="nombre" placeholder="Ej. Tomates, Leche entera..." autoComplete="off" maxLength={80} value={nombre} onChange={e => setNombre(e.target.value)} required />
          </div>

          <div>
            <label htmlFor="categoria" style={labelStyle}>Categoría</label>
            <select id="categoria" value={categoria} onChange={e => setCategoria(e.target.value)} required>
              <option value="" disabled>Selecciona una categoría</option>
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="precio" style={labelStyle}>Precio unitario ($)</label>
            <input
              id="precio"
              placeholder="0.00"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={precio}
              onChange={e => {
                const val = e.target.value;
                if (val.includes('-')) return;
                setPrecio(val);
              }}
              required
              style={{ fontSize: '22px', fontWeight: 600 }}
            />
          </div>

          <div style={{ flex: 1 }}></div>

          <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
            {existing && (
              <button type="button" className="danger" onClick={() => setShowDeleteModal(true)} style={{ flex: 1 }}>
                Eliminar
              </button>
            )}
            <button type="submit" disabled={saving} style={{ flex: existing ? 2 : 1 }}>
              {existing ? 'Actualizar Producto' : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
