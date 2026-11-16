# POS Víveres

Punto de venta para una tienda de víveres, pensado para usarse desde el celular.
Se instala como app (PWA) y **funciona sin internet**.

## Qué hace

- **Caja** — busca por nombre o código, escanea códigos de barras/QR con la cámara
  (o con un lector USB/Bluetooth: escribe el código y pulsa Enter), calcula el total,
  el vuelto y registra la venta.
- **Añadir** — registra productos nuevos. Si el código ya existe, pasa a modo edición
  (cambiar nombre, categoría, precio o eliminar).
- **Productos** — catálogo por categorías con buscador; el lápiz abre la edición.
  Aquí también está el respaldo (exportar / importar un archivo `.json`).
- **Ventas** — historial por día con total vendido, número de ventas y detalle de
  cada una. Una venta se puede anular.

## Dónde se guardan los datos

| Modo | Cuándo | Dónde viven los datos |
| --- | --- | --- |
| **Local** | Sin archivo `.env` | Solo en el navegador de ese dispositivo (IndexedDB) |
| **Nube** | Con credenciales de Firebase en `.env` | Firestore, sincronizado entre dispositivos y con caché sin internet |

En modo local, borrar los datos del navegador borra el catálogo y las ventas:
usa **Productos → Respaldo → Exportar** con frecuencia. Ese mismo archivo sirve
para pasar los datos a otro dispositivo o al modo nube (**Importar**).

## Puesta en marcha

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev        # desarrollo en http://localhost:5173
npm run build      # genera la app lista para publicar en dist/
npm run preview    # prueba local de lo que quedó en dist/
npm run lint
```

La cámara solo funciona en `https://` o en `localhost`.

## Activar Firebase (opcional)

1. Crea un proyecto en <https://console.firebase.google.com> y añade una app web.
2. Activa **Firestore Database**.
3. Copia `.env.example` a `.env` y pega los valores de tu app web.
4. En Firestore → Reglas, pega el contenido de [`firestore.rules`](./firestore.rules).
5. Vuelve a ejecutar `npm run build` (las credenciales se leen al compilar).

> **Importante:** la app no tiene inicio de sesión, así que esas reglas permiten
> leer y escribir a cualquiera que conozca la dirección de la app. Sirve para una
> tienda pequeña con el enlace sin compartir, pero si vas a publicarla abiertamente
> añade Firebase Authentication y cambia las reglas a `request.auth != null`.

Si la app muestra una franja roja "Firebase rechazó la operación", las reglas no
permiten leer/escribir las colecciones `products` y `sales`.

## Publicar

`dist/` es un sitio estático: sirve en cualquier hosting con HTTPS. Como es una
SPA, el hosting debe devolver `index.html` para cualquier ruta.

### Vercel

1. En <https://vercel.com> → **Add New → Project** e importa este repositorio.
   Vercel detecta Vite solo (build `npm run build`, salida `dist`).
2. Si usas Firebase, añade las seis variables `VITE_FIREBASE_*` en
   **Settings → Environment Variables** y vuelve a desplegar (se leen al compilar).
3. Cada `git push` a `main` publica una versión nueva.

`vercel.json` ya incluye la regla para que rutas como `/ventas` abran la app.

### Firebase Hosting

Ya está configurado en `firebase.json`:

```bash
npm install -g firebase-tools
firebase login
firebase use --add            # elige tu proyecto
npm run build
firebase deploy --only hosting
```

Después abre la dirección en el celular y usa "Añadir a pantalla de inicio".

## Estructura

```
src/
  App.tsx              rutas, carrito global y barra inferior
  db.ts                datos: productos, ventas y respaldo (IndexedDB o Firestore)
  firebase.ts          inicialización de Firebase (solo si hay .env)
  categories.ts        lista de categorías
  seed.ts              catálogo de ejemplo (se carga a pedido desde Productos)
  utils.ts             dinero en centavos, búsqueda sin tildes, fechas
  hooks/useProducts.ts catálogo en vivo
  components/          Scanner, ProductTable, QtyControls
  pages/               POS (Caja), AddProduct, Products, Sales
public/
  logo.svg             origen de los íconos (npm run generate-pwa-assets)
```

## Datos

```ts
Product { id_producto, nombre, categoria, precio_unitario }
Sale    { id, fecha (ms), items[{ id_producto, nombre, precio_unitario, cantidad }], total, efectivo, vuelto }
```

Las ventas guardan una copia del nombre y precio de cada producto, así el
historial no cambia si luego editas o eliminas el producto.
