import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Category, Product, Complement, BusinessConfig } from '../types';
import { initialCategories, initialProducts, initialComplements, initialConfig } from '../data';

interface MenuContextType {
  config: BusinessConfig;
  categories: Category[];
  products: Product[];
  complements: Complement[];
  updateConfig: (newConfig: Partial<BusinessConfig>) => void;
  toggleBusinessOpen: () => void;
  // Category CRUD
  addCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  // Product CRUD
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  // Complement CRUD
  addComplement: (complement: Omit<Complement, 'id'>) => void;
  updateComplement: (id: string, complement: Partial<Complement>) => void;
  deleteComplement: (id: string) => void;
  resetToDefault: () => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CONFIG: 'menu_app_config_v1',
  CATEGORIES: 'menu_app_categories_v1',
  PRODUCTS: 'menu_app_products_v1',
  COMPLEMENTS: 'menu_app_complements_v1',
};

export function MenuProvider({ children }: { children: ReactNode }) {
  const [apiAvailable, setApiAvailable] = useState<boolean>(false);

  const [config, setConfig] = useState<BusinessConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return saved ? { ...initialConfig, ...JSON.parse(saved) } : initialConfig;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [complements, setComplements] = useState<Complement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COMPLEMENTS);
    return saved ? JSON.parse(saved) : initialComplements;
  });

  // Save to localStorage whenever states change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMPLEMENTS, JSON.stringify(complements));
  }, [complements]);

  // Base URL configurado por Vite env var. Si está vacío usar rutas relativas.
  const API = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

  // Detect API availability and optionally load remote data
  useEffect(() => {
    let mounted = true;
    const ping = async () => {
      try {
        const res = await fetch(`${API}/api/ping`);
        if (!mounted) return;
        if (res.ok) {
          setApiAvailable(true);
          // load remote state
          const [cfgRes, catsRes, prodsRes, compsRes] = await Promise.all([
            fetch(`${API}/api/config`),
            fetch(`${API}/api/categories`),
            fetch(`${API}/api/products`),
            fetch(`${API}/api/complements`)
          ]);
          if (cfgRes.ok) setConfig({ ...initialConfig, ...(await cfgRes.json()) });
          if (catsRes.ok) setCategories(await catsRes.json());
          if (prodsRes.ok) setProducts(await prodsRes.json());
          if (compsRes.ok) setComplements(await compsRes.json());
        }
      } catch (err) {
        setApiAvailable(false);
      }
    };
    ping();
    return () => { mounted = false; };
  }, [API]);

  const updateConfig = (newConfig: Partial<BusinessConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
    if (apiAvailable) {
      fetch(`${API}/api/config`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newConfig) }).catch(()=>{});
    }
  };

  const toggleBusinessOpen = () => {
    setConfig(prev => {
      const updated = { ...prev, isOpen: !prev.isOpen };
      if (apiAvailable) fetch(`${API}/api/config`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isOpen: updated.isOpen }) }).catch(()=>{});
      return updated;
    });
  };

  // Categories
  const addCategory = (name: string) => {
    const id = Date.now().toString();
    const newCat: Category = { id, name };
    setCategories(prev => [...prev, newCat]);
    if (apiAvailable) fetch(`${API}/api/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }).catch(()=>{});
  };

  const updateCategory = (id: string, name: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c));
    if (apiAvailable) fetch(`${API}/api/categories/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }).catch(()=>{});
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    // Optionally remove products in this category or set them to unassigned
    setProducts(prev => prev.filter(p => p.categoryId !== id));
    if (apiAvailable) fetch(`${API}/api/categories/${id}`, { method: 'DELETE' }).catch(()=>{});
  };

  // Products
  const addProduct = (productData: Omit<Product, 'id'>) => {
    const newProd: Product = { ...productData, id: Date.now().toString() };
    setProducts(prev => [...prev, newProd]);
    if (apiAvailable) fetch(`${API}/api/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(productData) }).catch(()=>{});
  };

  const updateProduct = (id: string, productData: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...productData } : p));
    if (apiAvailable) fetch(`${API}/api/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(productData) }).catch(()=>{});
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    if (apiAvailable) fetch(`${API}/api/products/${id}`, { method: 'DELETE' }).catch(()=>{});
  };

  // Complements
  const addComplement = (compData: Omit<Complement, 'id'>) => {
    const newComp: Complement = { ...compData, id: Date.now().toString() };
    setComplements(prev => [...prev, newComp]);
    if (apiAvailable) fetch(`${API}/api/complements`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(compData) }).catch(()=>{});
  };

  const updateComplement = (id: string, compData: Partial<Complement>) => {
    setComplements(prev => prev.map(c => c.id === id ? { ...c, ...compData } : c));
    if (apiAvailable) fetch(`${API}/api/complements/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(compData) }).catch(()=>{});
  };

  const deleteComplement = (id: string) => {
    setComplements(prev => prev.filter(c => c.id !== id));
    // Remove deleted complement from products
    setProducts(prev => prev.map(p => ({
      ...p,
      complementIds: p.complementIds?.filter(cid => cid !== id)
    })));
    if (apiAvailable) fetch(`${API}/api/complements/${id}`, { method: 'DELETE' }).catch(()=>{});
  };

  const resetToDefault = () => {
    if (window.confirm('¿Estás seguro de restablecer todos los datos del menú a los valores iniciales?')) {
      if (apiAvailable) {
        fetch(`${API}/api/reset`, { method: 'POST' })
          .then(async res => {
            if (res.ok) {
              const seed = await fetch(`${API}/api/config`).then(r => r.json());
              // reload all
              const [cats, prods, comps] = await Promise.all([fetch(`${API}/api/categories`), fetch(`${API}/api/products`), fetch(`${API}/api/complements`)]);
              setConfig({ ...initialConfig, ...(seed || {}) });
              setCategories((await cats.json()) || initialCategories);
              setProducts((await prods.json()) || initialProducts);
              setComplements((await comps.json()) || initialComplements);
            }
          }).catch(()=>{
            // fallback local
            setConfig(initialConfig);
            setCategories(initialCategories);
            setProducts(initialProducts);
            setComplements(initialComplements);
          });
      } else {
        setConfig(initialConfig);
        setCategories(initialCategories);
        setProducts(initialProducts);
        setComplements(initialComplements);
        localStorage.removeItem(STORAGE_KEYS.CONFIG);
        localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
        localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
        localStorage.removeItem(STORAGE_KEYS.COMPLEMENTS);
      }
    }
  };

  return (
    <MenuContext.Provider value={{
      config,
      categories,
      products,
      complements,
      updateConfig,
      toggleBusinessOpen,
      addCategory,
      updateCategory,
      deleteCategory,
      addProduct,
      updateProduct,
      deleteProduct,
      addComplement,
      updateComplement,
      deleteComplement,
      resetToDefault
    }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
}
