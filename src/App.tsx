import { useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { ShoppingCart, Package, PlusCircle } from 'lucide-react';
import POS from './pages/POS';
import Products from './pages/Products';
import AddProduct from './pages/AddProduct';

function App() {
  // Global cart state: Record<id_producto, cantidad>
  const [cart, setCart] = useState<Record<string, number>>({});

  return (
    <>
      <Routes>
        <Route path="/" element={<POS cart={cart} setCart={setCart} />} />
        <Route path="/products" element={<Products cart={cart} setCart={setCart} />} />
        <Route path="/add" element={<AddProduct />} />
      </Routes>
      <nav className="bottom-nav">
        <NavLink to="/" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <ShoppingCart />
          <span>Caja</span>
        </NavLink>
        <NavLink to="/add" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <PlusCircle />
          <span>Añadir</span>
        </NavLink>
        <NavLink to="/products" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Package />
          <span>Productos</span>
        </NavLink>
      </nav>
    </>
  );
}

export default App;
