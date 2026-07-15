import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MenuProvider } from './context/MenuContext';
import { CartProvider } from './context/CartContext';
import { MenuPage } from './components/MenuPage';
import { AdminGate } from './components/AdminGate';

function App() {
  return (
    <MenuProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AdminGate />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/menú" element={<MenuPage />} />
            <Route path="/admin" element={<AdminGate />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </MenuProvider>
  );
}

export default App;
