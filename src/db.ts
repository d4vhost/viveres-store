import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import { doc, getDoc, getDocs, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';
import { db as firebaseDb } from './firebase';

export interface Product {
  id_producto: string;
  nombre: string;
  categoria: string;
  precio_unitario: number;
}

// ==========================================
// IndexedDB Fallback (Modo Local)
// ==========================================
interface ViveresDB extends DBSchema {
  products: {
    key: string;
    value: Product;
    indexes: { 'by-name': string; 'by-category': string; };
  };
}

const DB_NAME = 'viveres-pos-db';
const DB_VERSION = 1;

export async function initDB(): Promise<IDBPDatabase<ViveresDB>> {
  return openDB<ViveresDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('products')) {
        const store = db.createObjectStore('products', { keyPath: 'id_producto' });
        store.createIndex('by-name', 'nombre');
        store.createIndex('by-category', 'categoria');
      }
    },
  });
}

// ==========================================
// Lógica Híbrida: Usa Firebase si hay API Key, sino usa IndexedDB
// ==========================================
const useFirebase = import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== "TU_API_KEY";

export async function getProduct(id: string): Promise<Product | undefined> {
  if (useFirebase) {
    const docSnap = await getDoc(doc(firebaseDb, 'products', id));
    return docSnap.exists() ? (docSnap.data() as Product) : undefined;
  }
  const db = await initDB();
  return db.get('products', id);
}

export async function getAllProducts(): Promise<Product[]> {
  if (useFirebase) {
    const snapshot = await getDocs(collection(firebaseDb, 'products'));
    return snapshot.docs.map(doc => doc.data() as Product);
  }
  const db = await initDB();
  return db.getAll('products');
}

// Nuevo: Suscripción en tiempo real (solo funciona con Firebase, en local hace un fetch inicial)
export function subscribeToProducts(callback: (products: Product[]) => void) {
  if (useFirebase) {
    return onSnapshot(collection(firebaseDb, 'products'), (snapshot) => {
      const products = snapshot.docs.map(doc => doc.data() as Product);
      callback(products);
    });
  } else {
    getAllProducts().then(callback);
    return () => {}; // No-op unsubscribe for local DB
  }
}

export async function saveProduct(product: Product): Promise<string> {
  if (useFirebase) {
    await setDoc(doc(firebaseDb, 'products', product.id_producto), product);
    return product.id_producto;
  }
  const db = await initDB();
  return db.put('products', product);
}

export async function deleteProduct(id: string): Promise<void> {
  if (useFirebase) {
    await deleteDoc(doc(firebaseDb, 'products', id));
    return;
  }
  const db = await initDB();
  return db.delete('products', id);
}

export async function searchProductsByName(query: string): Promise<Product[]> {
  const all = await getAllProducts();
  const lowerQuery = query.toLowerCase();
  return all.filter(p => p.nombre.toLowerCase().includes(lowerQuery) || p.id_producto.includes(lowerQuery));
}
