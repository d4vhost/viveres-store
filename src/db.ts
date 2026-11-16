import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { firestore, isFirebaseConfigured } from './firebase';

export interface Product {
  id_producto: string;
  nombre: string;
  categoria: string;
  precio_unitario: number;
}

export interface SaleItem {
  id_producto: string;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
}

export interface Sale {
  id: string;
  /** Momento de la venta en milisegundos (Date.now()). */
  fecha: number;
  items: SaleItem[];
  total: number;
  efectivo: number;
  vuelto: number;
}

export interface Backup {
  version: 1;
  exportedAt: string;
  products: Product[];
  sales: Sale[];
}

/** true = los datos se sincronizan con Firebase; false = solo viven en este dispositivo. */
export const isCloudMode = isFirebaseConfigured;

// ==========================================
// IndexedDB (modo local)
// ==========================================
interface ViveresDB extends DBSchema {
  products: {
    key: string;
    value: Product;
    indexes: { 'by-name': string; 'by-category': string };
  };
  sales: {
    key: string;
    value: Sale;
    indexes: { 'by-fecha': number };
  };
}

const DB_NAME = 'viveres-pos-db';
const DB_VERSION = 2;

let localDbPromise: Promise<IDBPDatabase<ViveresDB>> | null = null;

function localDb(): Promise<IDBPDatabase<ViveresDB>> {
  if (!localDbPromise) {
    localDbPromise = openDB<ViveresDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('products')) {
          const store = db.createObjectStore('products', { keyPath: 'id_producto' });
          store.createIndex('by-name', 'nombre');
          store.createIndex('by-category', 'categoria');
        }
        if (!db.objectStoreNames.contains('sales')) {
          const store = db.createObjectStore('sales', { keyPath: 'id' });
          store.createIndex('by-fecha', 'fecha');
        }
      },
    });
  }
  return localDbPromise;
}

// ==========================================
// Errores de sincronización (reglas de Firestore, permisos, etc.)
// ==========================================
type ErrorListener = (message: string | null) => void;
let syncError: string | null = null;
const errorListeners = new Set<ErrorListener>();

function reportError(context: string, err: unknown) {
  console.error(context, err);
  const code = (err as { code?: string })?.code;
  syncError =
    code === 'permission-denied'
      ? 'Firebase rechazó la operación. Revisa las reglas de Firestore (ver README).'
      : `${context}: ${(err as Error)?.message ?? 'error desconocido'}`;
  errorListeners.forEach(l => l(syncError));
}

export function subscribeToSyncError(listener: ErrorListener): () => void {
  errorListeners.add(listener);
  listener(syncError);
  return () => {
    errorListeners.delete(listener);
  };
}

export function clearSyncError() {
  syncError = null;
  errorListeners.forEach(l => l(null));
}

// ==========================================
// Productos: catálogo en memoria, siempre disponible sin red
// ==========================================
type ProductsListener = (products: Product[], loaded: boolean) => void;

let products: Product[] = [];
let productsLoaded = false;
let productsStarted = false;
const productListeners = new Set<ProductsListener>();
let resolveProductsReady: () => void = () => {};
const productsReady = new Promise<void>(resolve => {
  resolveProductsReady = resolve;
});

function normalizeProduct(raw: Partial<Product>, fallbackId = ''): Product {
  return {
    id_producto: String(raw.id_producto ?? fallbackId),
    nombre: String(raw.nombre ?? ''),
    categoria: String(raw.categoria ?? ''),
    precio_unitario: Number(raw.precio_unitario) || 0,
  };
}

function setProducts(next: Product[]) {
  products = [...next].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  productsLoaded = true;
  resolveProductsReady();
  productListeners.forEach(l => l(products, true));
}

function startProducts() {
  if (productsStarted) return;
  productsStarted = true;
  if (firestore) {
    onSnapshot(
      collection(firestore, 'products'),
      snapshot => setProducts(snapshot.docs.map(d => normalizeProduct(d.data(), d.id))),
      err => {
        reportError('No se pudo leer el catálogo', err);
        setProducts(products);
      },
    );
  } else {
    localDb()
      .then(db => db.getAll('products'))
      .then(all => setProducts(all.map(p => normalizeProduct(p))))
      .catch(err => {
        reportError('No se pudo abrir la base de datos local', err);
        setProducts([]);
      });
  }
}

/** Los ids de documento de Firestore no admiten "/" (un QR puede traer una URL). */
function productDocId(id: string): string {
  return encodeURIComponent(id);
}

/** Suscripción en vivo al catálogo. Funciona igual en modo local y con Firebase. */
export function subscribeToProducts(listener: ProductsListener): () => void {
  startProducts();
  productListeners.add(listener);
  if (productsLoaded) listener(products, true);
  return () => {
    productListeners.delete(listener);
  };
}

export async function getAllProducts(): Promise<Product[]> {
  startProducts();
  await productsReady;
  return products;
}

export async function getProduct(id: string): Promise<Product | undefined> {
  const all = await getAllProducts();
  return all.find(p => p.id_producto === id);
}

export async function saveProduct(product: Product): Promise<void> {
  const clean = normalizeProduct(product);
  if (firestore) {
    // No se espera la confirmación del servidor: sin internet esa promesa no
    // se resuelve hasta reconectar. El listener refleja el cambio al instante.
    setDoc(doc(firestore, 'products', productDocId(clean.id_producto)), clean).catch(err =>
      reportError('No se pudo guardar el producto', err),
    );
    return;
  }
  const db = await localDb();
  await db.put('products', clean);
  setProducts([...products.filter(p => p.id_producto !== clean.id_producto), clean]);
}

export async function deleteProduct(id: string): Promise<void> {
  if (firestore) {
    deleteDoc(doc(firestore, 'products', productDocId(id))).catch(err =>
      reportError('No se pudo eliminar el producto', err),
    );
    return;
  }
  const db = await localDb();
  await db.delete('products', id);
  setProducts(products.filter(p => p.id_producto !== id));
}

/** Guarda muchos productos de una vez (importar respaldo, productos de ejemplo). */
export async function saveProducts(list: Product[]): Promise<void> {
  const clean = list.map(p => normalizeProduct(p)).filter(p => p.id_producto && p.nombre);
  if (clean.length === 0) return;
  if (firestore) {
    for (let i = 0; i < clean.length; i += 400) {
      const batch = writeBatch(firestore);
      for (const p of clean.slice(i, i + 400)) {
        batch.set(doc(firestore, 'products', productDocId(p.id_producto)), p);
      }
      batch.commit().catch(err => reportError('No se pudieron guardar los productos', err));
    }
    return;
  }
  const db = await localDb();
  const tx = db.transaction('products', 'readwrite');
  await Promise.all([...clean.map(p => tx.store.put(p)), tx.done]);
  const ids = new Set(clean.map(p => p.id_producto));
  setProducts([...products.filter(p => !ids.has(p.id_producto)), ...clean]);
}

// ==========================================
// Ventas
// ==========================================
function normalizeSale(raw: Partial<Sale>, fallbackId = ''): Sale {
  return {
    id: String(raw.id ?? fallbackId),
    fecha: Number(raw.fecha) || 0,
    items: Array.isArray(raw.items)
      ? raw.items.map(item => ({
          id_producto: String(item.id_producto ?? ''),
          nombre: String(item.nombre ?? ''),
          precio_unitario: Number(item.precio_unitario) || 0,
          cantidad: Number(item.cantidad) || 0,
        }))
      : [],
    total: Number(raw.total) || 0,
    efectivo: Number(raw.efectivo) || 0,
    vuelto: Number(raw.vuelto) || 0,
  };
}

// En modo local no hay eventos de la base: se avisa a mano tras cada cambio.
const localSalesWatchers = new Set<() => void>();

export async function saveSale(sale: Sale): Promise<void> {
  const clean = normalizeSale(sale);
  if (firestore) {
    setDoc(doc(firestore, 'sales', clean.id), clean).catch(err =>
      reportError('No se pudo guardar la venta', err),
    );
    return;
  }
  const db = await localDb();
  await db.put('sales', clean);
  localSalesWatchers.forEach(w => w());
}

export async function deleteSale(id: string): Promise<void> {
  if (firestore) {
    deleteDoc(doc(firestore, 'sales', id)).catch(err =>
      reportError('No se pudo anular la venta', err),
    );
    return;
  }
  const db = await localDb();
  await db.delete('sales', id);
  localSalesWatchers.forEach(w => w());
}

/** Ventas con `from <= fecha < to`, de la más reciente a la más antigua. */
export function subscribeToSales(
  from: number,
  to: number,
  listener: (sales: Sale[]) => void,
): () => void {
  if (firestore) {
    const q = query(
      collection(firestore, 'sales'),
      where('fecha', '>=', from),
      where('fecha', '<', to),
      orderBy('fecha', 'desc'),
    );
    return onSnapshot(
      q,
      snapshot => listener(snapshot.docs.map(d => normalizeSale(d.data(), d.id))),
      err => {
        reportError('No se pudieron leer las ventas', err);
        listener([]);
      },
    );
  }

  let active = true;
  const load = () => {
    localDb()
      .then(db => db.getAllFromIndex('sales', 'by-fecha', IDBKeyRange.bound(from, to, false, true)))
      .then(rows => {
        if (active) listener(rows.map(r => normalizeSale(r)).reverse());
      })
      .catch(err => {
        reportError('No se pudieron leer las ventas', err);
        if (active) listener([]);
      });
  };
  load();
  localSalesWatchers.add(load);
  return () => {
    active = false;
    localSalesWatchers.delete(load);
  };
}

async function getAllSales(): Promise<Sale[]> {
  if (firestore) {
    const snapshot = await getDocs(collection(firestore, 'sales'));
    return snapshot.docs.map(d => normalizeSale(d.data(), d.id));
  }
  const db = await localDb();
  return (await db.getAll('sales')).map(s => normalizeSale(s));
}

// ==========================================
// Respaldo
// ==========================================
export async function exportBackup(): Promise<Backup> {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    products: await getAllProducts(),
    sales: await getAllSales(),
  };
}

/** Fusiona un respaldo con los datos actuales (mismo código o id = se reemplaza). */
export async function importBackup(data: unknown): Promise<{ products: number; sales: number }> {
  const backup = data as Partial<Backup> | null;
  if (!backup || !Array.isArray(backup.products)) {
    throw new Error('El archivo no es un respaldo válido de POS Víveres.');
  }
  const importedProducts = backup.products
    .map(p => normalizeProduct(p))
    .filter(p => p.id_producto && p.nombre);
  const importedSales = (Array.isArray(backup.sales) ? backup.sales : [])
    .map(s => normalizeSale(s))
    .filter(s => s.id && s.fecha > 0);

  await saveProducts(importedProducts);

  if (importedSales.length > 0) {
    if (firestore) {
      for (let i = 0; i < importedSales.length; i += 400) {
        const batch = writeBatch(firestore);
        for (const s of importedSales.slice(i, i + 400)) {
          batch.set(doc(firestore, 'sales', s.id), s);
        }
        batch.commit().catch(err => reportError('No se pudieron importar las ventas', err));
      }
    } else {
      const db = await localDb();
      const tx = db.transaction('sales', 'readwrite');
      await Promise.all([...importedSales.map(s => tx.store.put(s)), tx.done]);
      localSalesWatchers.forEach(w => w());
    }
  }

  return { products: importedProducts.length, sales: importedSales.length };
}
