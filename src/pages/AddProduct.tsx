import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, QrCode } from 'lucide-react';
import Scanner from '../components/Scanner';
import { saveProduct, getProduct, deleteProduct } from '../db';
import type { Product } from '../db';
import { CATEGORIES } from './Products';

export default function AddProduct() {
  const navigate = useNavigate();

  // Form state
  const [idProducto, setIdProducto] = useState('');
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [precio, setPrecio] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [existingProduct, setExistingProduct] = useState(false);

  useEffect(() => {
    async function checkProduct() {
      if (idProducto.trim()) {
        const prod = await getProduct(idProducto);
        if (prod) {
          setNombre(prod.nombre);
          setCategoria(prod.categoria);
          setPrecio(prod.precio_unitario.toString());
          setExistingProduct(true);
        } else {
          if (existingProduct) {
             setNombre('');
             setCategoria('');
             setPrecio('');
             setExistingProduct(false);
          }
        }
      } else {
         if (existingProduct) {
            setNombre('');
            setCategoria('');
            setPrecio('');
            setExistingProduct(false);
         }
      }
    }
    checkProduct();
  }, [idProducto]);

  const handleDelete = async () => {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      await deleteProduct(idProducto);
      navigate('/products');
    }
  };

  const hasFormData = () => {
    return idProducto.trim() !== '' || nombre.trim() !== '' || categoria !== '' || precio !== '';
  };

  const handleBack = () => {
    if (hasFormData()) {
      setShowDiscardModal(true);
    } else {
      navigate(-1);
    }
  };

  const confirmDiscard = () => {
    setShowDiscardModal(false);
    navigate(-1);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const product: Product = {
      id_producto: idProducto,
      nombre,
      categoria,
      precio_unitario: parseFloat(precio)
    };
    await saveProduct(product);
    navigate('/products'); // Go to products list after saving
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {isScanning && (
        <Scanner
          onScan={(code) => { setIdProducto(code); setIsScanning(false); }}
          onClose={() => setIsScanning(false)}
        />
      )}

      {/* Discard Changes Modal */}
      {showDiscardModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '40px',
        }}>
          <div style={{
            background: 'var(--white)', borderRadius: 'var(--radius-lg)',
            width: '100%', maxWidth: '320px', overflow: 'hidden', textAlign: 'center',
          }}>
            <div style={{ padding: '20px 20px 16px' }}>
              <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '8px' }}>¿Descartar cambios?</div>
              <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                Tienes información sin guardar. ¿Estás seguro de que quieres salir?
              </div>
            </div>
            <div style={{ borderTop: '0.33px solid var(--separator)' }}>
              <button
                onClick={confirmDiscard}
                style={{
                  background: 'none', color: 'var(--danger)', fontWeight: 400,
                  borderRadius: 0, borderBottom: '0.33px solid var(--separator)',
                  padding: '14px',
                }}
              >
                Descartar
              </button>
              <button
                onClick={() => setShowDiscardModal(false)}
                style={{
                  background: 'none', color: 'var(--accent)', fontWeight: 600,
                  borderRadius: 0, padding: '14px',
                }}
              >
                Seguir editando
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full page form content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 20px 100px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h1 style={{ fontSize: '34px', fontWeight: 700, letterSpacing: '0.37px' }}>
            {existingProduct ? 'Editar Producto' : 'Nuevo Producto'}
          </h1>
          <p style={{ color: 'var(--text-light)', fontSize: '15px', marginTop: '6px' }}>
            Escanea el código de barras o ingresa los datos manualmente.
          </p>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '6px' }}>Código del producto</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input placeholder="Barras, QR o manual" value={idProducto} onChange={e => setIdProducto(e.target.value)} required />
              <button type="button" className="secondary" style={{ width: 'auto', padding: '12px', flexShrink: 0 }} onClick={() => setIsScanning(true)}>
                <QrCode size={28} />
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '6px' }}>Nombre</label>
            <input placeholder="Ej. Tomates, Leche Gloria..." value={nombre} onChange={e => setNombre(e.target.value)} required />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '6px' }}>Categoría</label>
            <select value={categoria} onChange={e => setCategoria(e.target.value)} required>
              <option value="" disabled>Selecciona una categoría</option>
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '6px' }}>Precio unitario</label>
            <input placeholder="$0.00" type="number" inputMode="decimal" min="0" step="0.01" value={precio} onChange={e => {
              const val = e.target.value;
              if (val.includes('-')) return;
              setPrecio(val);
            }} required style={{ fontSize: '22px', fontWeight: 600 }} />
          </div>

          <div style={{ flex: 1 }}></div>

          <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
            {existingProduct && (
              <button type="button" onClick={handleDelete} style={{ background: 'var(--danger)', flex: 1 }}>
                Eliminar
              </button>
            )}
            <button type="submit" style={{ flex: existingProduct ? 2 : 1 }}>
              {existingProduct ? 'Actualizar Producto' : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
