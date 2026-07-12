import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { MenuProvider } from './context/MenuContext';
import { CartProvider } from './context/CartContext';
import { Home } from './components/Home';
import { MenuPage } from './components/MenuPage';
import { AdminPanel } from './components/AdminPanel';

function HomeRoute() {
  const [showAdmin, setShowAdmin] = useState(false);
  const navigate = useNavigate();

  if (showAdmin) {
    return <AdminPanel onBack={() => setShowAdmin(false)} />;
  }

  return (
    <Home 
      onNavigateToMenu={() => navigate('/menu')}
      onNavigateToAdmin={() => setShowAdmin(true)}
    />
  );
}

function App() {
  return (
    <MenuProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/menu" element={<MenuPage />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </MenuProvider>
  );
}

export default App;
