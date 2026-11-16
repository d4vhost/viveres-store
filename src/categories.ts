export interface Category {
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

export function categoryLabel(id: string): string {
  return CATEGORIES.find(c => c.id === id)?.label ?? id;
}
