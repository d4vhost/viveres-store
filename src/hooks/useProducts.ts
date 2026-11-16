import { useEffect, useState } from 'react';
import { subscribeToProducts } from '../db';
import type { Product } from '../db';

/** Catálogo en vivo. `loaded` es false hasta que llega la primera lectura. */
export function useProducts(): { products: Product[]; loaded: boolean } {
  const [state, setState] = useState<{ products: Product[]; loaded: boolean }>({
    products: [],
    loaded: false,
  });

  useEffect(
    () => subscribeToProducts((products, loaded) => setState({ products, loaded })),
    [],
  );

  return state;
}
