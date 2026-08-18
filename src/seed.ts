import { getAllProducts, saveProduct } from './db';

const SAMPLE_PRODUCTS = [
  // Frutas y Verduras
  { id_producto: '7501000101', nombre: 'Tomates (lb)', categoria: 'frutas-verduras', precio_unitario: 0.75 },
  { id_producto: '7501000102', nombre: 'Cebollas rojas (lb)', categoria: 'frutas-verduras', precio_unitario: 0.50 },
  { id_producto: '7501000103', nombre: 'Plátanos (unidad)', categoria: 'frutas-verduras', precio_unitario: 0.10 },
  { id_producto: '7501000104', nombre: 'Manzanas (lb)', categoria: 'frutas-verduras', precio_unitario: 1.20 },
  { id_producto: '7501000105', nombre: 'Lechuga', categoria: 'frutas-verduras', precio_unitario: 0.65 },

  // Carnes y Embutidos
  { id_producto: '7502000201', nombre: 'Pechuga de pollo (lb)', categoria: 'carnes', precio_unitario: 2.50 },
  { id_producto: '7502000202', nombre: 'Carne molida res (lb)', categoria: 'carnes', precio_unitario: 3.80 },
  { id_producto: '7502000203', nombre: 'Salchicha hot dog (paq)', categoria: 'carnes', precio_unitario: 1.75 },
  { id_producto: '7502000204', nombre: 'Jamón de pavo (200g)', categoria: 'carnes', precio_unitario: 2.10 },
  { id_producto: '7502000205', nombre: 'Mortadela (200g)', categoria: 'carnes', precio_unitario: 1.50 },

  // Lácteos y Huevos
  { id_producto: '7503000301', nombre: 'Leche entera (1L)', categoria: 'lacteos', precio_unitario: 1.15 },
  { id_producto: '7503000302', nombre: 'Queso fresco (500g)', categoria: 'lacteos', precio_unitario: 2.75 },
  { id_producto: '7503000303', nombre: 'Yogurt fresa (vaso)', categoria: 'lacteos', precio_unitario: 0.65 },
  { id_producto: '7503000304', nombre: 'Huevos cubeta (30u)', categoria: 'lacteos', precio_unitario: 4.50 },
  { id_producto: '7503000305', nombre: 'Mantequilla (barra)', categoria: 'lacteos', precio_unitario: 1.80 },

  // Congelados
  { id_producto: '7504000401', nombre: 'Nuggets pollo (500g)', categoria: 'congelados', precio_unitario: 3.50 },
  { id_producto: '7504000402', nombre: 'Helado vainilla (1L)', categoria: 'congelados', precio_unitario: 4.25 },
  { id_producto: '7504000403', nombre: 'Papas prefritas (1kg)', categoria: 'congelados', precio_unitario: 2.90 },
  { id_producto: '7504000404', nombre: 'Hamburguesas (4u)', categoria: 'congelados', precio_unitario: 3.20 },

  // Despensa y Abarrotes
  { id_producto: '7505000501', nombre: 'Arroz blanco (1kg)', categoria: 'despensa', precio_unitario: 1.10 },
  { id_producto: '7505000502', nombre: 'Fideo tallarín (500g)', categoria: 'despensa', precio_unitario: 0.85 },
  { id_producto: '7505000503', nombre: 'Aceite vegetal (1L)', categoria: 'despensa', precio_unitario: 2.40 },
  { id_producto: '7505000504', nombre: 'Atún en lata', categoria: 'despensa', precio_unitario: 1.35 },
  { id_producto: '7505000505', nombre: 'Salsa de tomate (400g)', categoria: 'despensa', precio_unitario: 1.00 },
  { id_producto: '7505000506', nombre: 'Sal (1kg)', categoria: 'despensa', precio_unitario: 0.50 },
  { id_producto: '7505000507', nombre: 'Azúcar (1kg)', categoria: 'despensa', precio_unitario: 0.95 },
  { id_producto: '7505000508', nombre: 'Lentejas (500g)', categoria: 'despensa', precio_unitario: 0.80 },

  // Desayuno y Galletas
  { id_producto: '7506000601', nombre: 'Café instantáneo (100g)', categoria: 'desayuno-galletas', precio_unitario: 2.50 },
  { id_producto: '7506000602', nombre: 'Cereal hojuelas maíz', categoria: 'desayuno-galletas', precio_unitario: 3.10 },
  { id_producto: '7506000603', nombre: 'Galletas de sal (paq)', categoria: 'desayuno-galletas', precio_unitario: 0.75 },
  { id_producto: '7506000604', nombre: 'Mermelada fresa (300g)', categoria: 'desayuno-galletas', precio_unitario: 1.80 },
  { id_producto: '7506000605', nombre: 'Té manzanilla (25 bolsas)', categoria: 'desayuno-galletas', precio_unitario: 1.20 },

  // Panadería
  { id_producto: '7507000701', nombre: 'Pan de molde', categoria: 'panaderia', precio_unitario: 1.50 },
  { id_producto: '7507000702', nombre: 'Pan para hamburguesa (4u)', categoria: 'panaderia', precio_unitario: 1.20 },
  { id_producto: '7507000703', nombre: 'Donas (paq 6u)', categoria: 'panaderia', precio_unitario: 2.00 },

  // Bebidas y Snacks
  { id_producto: '7508000801', nombre: 'Agua mineral (500ml)', categoria: 'bebidas-snacks', precio_unitario: 0.35 },
  { id_producto: '7508000802', nombre: 'Coca-Cola (500ml)', categoria: 'bebidas-snacks', precio_unitario: 0.75 },
  { id_producto: '7508000803', nombre: 'Jugo naranja (1L)', categoria: 'bebidas-snacks', precio_unitario: 1.50 },
  { id_producto: '7508000804', nombre: 'Papitas Lays (grande)', categoria: 'bebidas-snacks', precio_unitario: 2.25 },
  { id_producto: '7508000805', nombre: 'Cerveza (lata)', categoria: 'bebidas-snacks', precio_unitario: 1.00 },

  // Útiles y Papelería
  { id_producto: '7509000901', nombre: 'Cuaderno universitario', categoria: 'utiles-papeleria', precio_unitario: 1.75 },
  { id_producto: '7509000902', nombre: 'Bolígrafo azul', categoria: 'utiles-papeleria', precio_unitario: 0.35 },
  { id_producto: '7509000903', nombre: 'Lápiz HB (unidad)', categoria: 'utiles-papeleria', precio_unitario: 0.20 },
  { id_producto: '7509000904', nombre: 'Borrador blanco', categoria: 'utiles-papeleria', precio_unitario: 0.25 },

  // Limpieza del Hogar
  { id_producto: '7510001001', nombre: 'Detergente polvo (1kg)', categoria: 'limpieza', precio_unitario: 2.20 },
  { id_producto: '7510001002', nombre: 'Cloro (1L)', categoria: 'limpieza', precio_unitario: 0.90 },
  { id_producto: '7510001003', nombre: 'Jabón lavavajillas', categoria: 'limpieza', precio_unitario: 1.10 },
  { id_producto: '7510001004', nombre: 'Papel higiénico (4 rollos)', categoria: 'limpieza', precio_unitario: 1.80 },
  { id_producto: '7510001005', nombre: 'Servilletas (paq 100)', categoria: 'limpieza', precio_unitario: 0.75 },

  // Cuidado Personal
  { id_producto: '7511001101', nombre: 'Champú (400ml)', categoria: 'higiene-personal', precio_unitario: 3.50 },
  { id_producto: '7511001102', nombre: 'Pasta dental (100ml)', categoria: 'higiene-personal', precio_unitario: 1.80 },
  { id_producto: '7511001103', nombre: 'Jabón de barra', categoria: 'higiene-personal', precio_unitario: 0.60 },
  { id_producto: '7511001104', nombre: 'Desodorante spray', categoria: 'higiene-personal', precio_unitario: 2.50 },

  // Bebés y Mascotas
  { id_producto: '7512001201', nombre: 'Pañales (paq 24u)', categoria: 'bebes-mascotas', precio_unitario: 8.50 },
  { id_producto: '7512001202', nombre: 'Toallitas húmedas bebé', categoria: 'bebes-mascotas', precio_unitario: 2.00 },
  { id_producto: '7512001203', nombre: 'Comida perro (2kg)', categoria: 'bebes-mascotas', precio_unitario: 5.50 },
  { id_producto: '7512001204', nombre: 'Comida gato (1kg)', categoria: 'bebes-mascotas', precio_unitario: 3.80 },
];

export async function seedSampleProducts() {
  const existing = await getAllProducts();
  if (existing.length > 0) return; // Only seed if DB is empty

  for (const product of SAMPLE_PRODUCTS) {
    await saveProduct(product);
  }
  console.log(`✅ Seeded ${SAMPLE_PRODUCTS.length} sample products`);
}
