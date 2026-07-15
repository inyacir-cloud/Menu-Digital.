import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { MenuProvider } from './context/MenuContext';
import { CartProvider } from './context/CartContext';
import { Home } from './components/Home';
import { MenuPage } from './components/MenuPage';
import { AdminGate } from './components/AdminGate';

function HomeRoute() {
  const navigate = useNavigate();

  return (
    <Home 
      onNavigateToMenu={() => navigate('/menu')}
    />
  );
}

function AdminRoute() {
  return <AdminGate />;
}

function App() {
  return (
    <MenuProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/admin" element={<AdminRoute />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </MenuProvider>
  );
}

export default App;
