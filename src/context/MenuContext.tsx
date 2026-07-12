import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initialCategories, initialComplements, initialConfig, initialProducts } from '../data';
import {
  deleteSupabaseCategory,
  deleteSupabaseComplement,
  deleteSupabaseProduct,
  loadSupabaseData,
  resetSupabaseData,
  saveSupabaseCategory,
  saveSupabaseComplement,
  saveSupabaseConfig,
  saveSupabaseProduct,
  uploadSupabaseProductImage,
} from '../lib/supabaseData';
import { hasSupabaseConfig } from '../lib/supabase';
import { BusinessConfig, Category, Complement, Product } from '../types';

interface MenuContextType {
  config: BusinessConfig;
  categories: Category[];
  products: Product[];
  complements: Complement[];
  storageEnabled: boolean;
  updateConfig: (newConfig: Partial<BusinessConfig>) => Promise<void>;
  toggleBusinessOpen: () => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  updateCategory: (id: string, name: string) => Promise<void>;
  reorderCategories: (orderedIds: string[]) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addComplement: (complement: Omit<Complement, 'id'>) => Promise<void>;
  updateComplement: (id: string, complement: Partial<Complement>) => Promise<void>;
  deleteComplement: (id: string) => Promise<void>;
  uploadProductImage: (file: File) => Promise<string>;
  resetToDefault: () => Promise<void>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CONFIG: 'menu_app_config_v1',
  CATEGORIES: 'menu_app_categories_v1',
  PRODUCTS: 'menu_app_products_v1',
  COMPLEMENTS: 'menu_app_complements_v1',
};

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return Date.now().toString();
}

function normalizeCategories(items: Category[]) {
  return [...items]
    .map((category, index) => ({
      ...category,
      sortOrder: typeof category.sortOrder === 'number' ? category.sortOrder : index,
    }))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function MenuProvider({ children }: { children: ReactNode }) {
  const [apiAvailable, setApiAvailable] = useState(false);
  const [storageEnabled] = useState(hasSupabaseConfig);
  const [dataSource, setDataSource] = useState<'local' | 'api' | 'supabase'>('local');

  const [config, setConfig] = useState<BusinessConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return saved ? { ...initialConfig, ...JSON.parse(saved) } : initialConfig;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return saved ? normalizeCategories(JSON.parse(saved)) : normalizeCategories(initialCategories);
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [complements, setComplements] = useState<Complement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COMPLEMENTS);
    return saved ? JSON.parse(saved) : initialComplements;
  });

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

  const API = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (hasSupabaseConfig) {
        try {
          const remote = await loadSupabaseData();
          if (!mounted) return;
          setDataSource('supabase');
          setApiAvailable(false);
          setConfig(remote.config);
          setCategories(normalizeCategories(remote.categories.length > 0 ? remote.categories : initialCategories));
          setProducts(remote.products.length > 0 ? remote.products : initialProducts);
          setComplements(remote.complements.length > 0 ? remote.complements : initialComplements);
          return;
        } catch (error) {
          console.error('No se pudo cargar Supabase; se intentará backend/local.', error);
        }
      }

      try {
        const res = await fetch(`${API}/api/ping`);
        if (!mounted) return;
        if (res.ok) {
          setApiAvailable(true);
          setDataSource('api');

          const [cfgRes, catsRes, prodsRes, compsRes] = await Promise.all([
            fetch(`${API}/api/config`),
            fetch(`${API}/api/categories`),
            fetch(`${API}/api/products`),
            fetch(`${API}/api/complements`),
          ]);

          if (cfgRes.ok) setConfig({ ...initialConfig, ...(await cfgRes.json()) });
          if (catsRes.ok) setCategories(normalizeCategories(await catsRes.json()));
          if (prodsRes.ok) setProducts(await prodsRes.json());
          if (compsRes.ok) setComplements(await compsRes.json());
          return;
        }
      } catch {
        setApiAvailable(false);
      }

      if (!mounted) return;
      setDataSource('local');
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [API]);

  const updateConfig = async (newConfig: Partial<BusinessConfig>) => {
    const nextConfig = { ...config, ...newConfig };
    setConfig(nextConfig);

    if (dataSource === 'supabase') {
      await saveSupabaseConfig(nextConfig);
      return;
    }

    if (apiAvailable) {
      await fetch(`${API}/api/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
    }
  };

  const toggleBusinessOpen = async () => {
    const updated = { ...config, isOpen: !config.isOpen };
    setConfig(updated);

    if (dataSource === 'supabase') {
      await saveSupabaseConfig(updated);
      return;
    }

    if (apiAvailable) {
      await fetch(`${API}/api/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen: updated.isOpen }),
      });
    }
  };

  const addCategory = async (name: string) => {
    const newCategory: Category = { id: createId(), name, sortOrder: categories.length };
    setCategories((prev) => normalizeCategories([...prev, newCategory]));

    if (dataSource === 'supabase') {
      await saveSupabaseCategory(newCategory);
      return;
    }

    if (apiAvailable) {
      await fetch(`${API}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
    }
  };

  const updateCategory = async (id: string, name: string) => {
    const updated = normalizeCategories(categories.map((category) => (category.id === id ? { ...category, name } : category)));
    setCategories(updated);

    if (dataSource === 'supabase') {
      const category = updated.find((item) => item.id === id);
      if (category) await saveSupabaseCategory(category);
      return;
    }

    if (apiAvailable) {
      await fetch(`${API}/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
    }
  };

  const reorderCategories = async (orderedIds: string[]) => {
    const byId = new Map(categories.map((category) => [category.id, category]));
    const updated = normalizeCategories(
      orderedIds
        .map((id, index) => {
          const category = byId.get(id);
          return category ? { ...category, sortOrder: index } : null;
        })
        .filter(Boolean) as Category[]
    );

    setCategories(updated);

    if (dataSource === 'supabase') {
      await Promise.all(updated.map(saveSupabaseCategory));
      return;
    }

    if (apiAvailable) {
      await Promise.all(
        updated.map((category) =>
          fetch(`${API}/api/categories/${category.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: category.name, sortOrder: category.sortOrder }),
          })
        )
      );
    }
  };

  const deleteCategory = async (id: string) => {
    setCategories((prev) => prev.filter((category) => category.id !== id));
    setProducts((prev) => prev.filter((product) => product.categoryId !== id));

    if (dataSource === 'supabase') {
      await deleteSupabaseCategory(id);
      return;
    }

    if (apiAvailable) {
      await fetch(`${API}/api/categories/${id}`, { method: 'DELETE' });
    }
  };

  const addProduct = async (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = { ...productData, id: createId() };
    setProducts((prev) => [...prev, newProduct]);

    if (dataSource === 'supabase') {
      await saveSupabaseProduct(newProduct);
      return;
    }

    if (apiAvailable) {
      await fetch(`${API}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    const updated = products.map((product) => (product.id === id ? { ...product, ...productData } : product));
    setProducts(updated);

    if (dataSource === 'supabase') {
      const product = updated.find((item) => item.id === id);
      if (product) await saveSupabaseProduct(product);
      return;
    }

    if (apiAvailable) {
      await fetch(`${API}/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
    }
  };

  const deleteProduct = async (id: string) => {
    setProducts((prev) => prev.filter((product) => product.id !== id));

    if (dataSource === 'supabase') {
      await deleteSupabaseProduct(id);
      return;
    }

    if (apiAvailable) {
      await fetch(`${API}/api/products/${id}`, { method: 'DELETE' });
    }
  };

  const addComplement = async (complementData: Omit<Complement, 'id'>) => {
    const newComplement: Complement = { ...complementData, id: createId() };
    setComplements((prev) => [...prev, newComplement]);

    if (dataSource === 'supabase') {
      await saveSupabaseComplement(newComplement);
      return;
    }

    if (apiAvailable) {
      await fetch(`${API}/api/complements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(complementData),
      });
    }
  };

  const updateComplement = async (id: string, complementData: Partial<Complement>) => {
    const updated = complements.map((complement) => (complement.id === id ? { ...complement, ...complementData } : complement));
    setComplements(updated);

    if (dataSource === 'supabase') {
      const complement = updated.find((item) => item.id === id);
      if (complement) await saveSupabaseComplement(complement);
      return;
    }

    if (apiAvailable) {
      await fetch(`${API}/api/complements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(complementData),
      });
    }
  };

  const deleteComplement = async (id: string) => {
    const productsToPersist = products.filter((product) => product.complementIds?.includes(id));
    const updatedProducts = products.map((product) => ({
      ...product,
      complementIds: product.complementIds?.filter((complementId) => complementId !== id),
    }));

    setComplements((prev) => prev.filter((complement) => complement.id !== id));
    setProducts(updatedProducts);

    if (dataSource === 'supabase') {
      await Promise.all(updatedProducts.filter((product) => productsToPersist.some((persisted) => persisted.id === product.id)).map(saveSupabaseProduct));
      await deleteSupabaseComplement(id);
      return;
    }

    if (apiAvailable) {
      await fetch(`${API}/api/complements/${id}`, { method: 'DELETE' });
    }
  };

  const uploadProductImage = async (file: File) => {
    if (dataSource !== 'supabase') {
      throw new Error('Configura Supabase para subir imágenes reales.');
    }

    return uploadSupabaseProductImage(file);
  };

  const resetToDefault = async () => {
    if (!window.confirm('¿Estás seguro de restablecer todos los datos del menú a los valores iniciales?')) {
      return;
    }

    if (dataSource === 'supabase') {
      await resetSupabaseData();
      setConfig(initialConfig);
      setCategories(initialCategories);
      setProducts(initialProducts);
      setComplements(initialComplements);
      return;
    }

    if (apiAvailable) {
      try {
        const res = await fetch(`${API}/api/reset`, { method: 'POST' });
        if (res.ok) {
          const seed = await fetch(`${API}/api/config`).then((response) => response.json());
          const [cats, prods, comps] = await Promise.all([
            fetch(`${API}/api/categories`),
            fetch(`${API}/api/products`),
            fetch(`${API}/api/complements`),
          ]);
          setConfig({ ...initialConfig, ...(seed || {}) });
          setCategories(normalizeCategories((await cats.json()) || initialCategories));
          setProducts((await prods.json()) || initialProducts);
          setComplements((await comps.json()) || initialComplements);
        }
        return;
      } catch {
        setConfig(initialConfig);
        setCategories(normalizeCategories(initialCategories));
        setProducts(initialProducts);
        setComplements(initialComplements);
        return;
      }
    }

    setConfig(initialConfig);
    setCategories(normalizeCategories(initialCategories));
    setProducts(initialProducts);
    setComplements(initialComplements);
    localStorage.removeItem(STORAGE_KEYS.CONFIG);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.COMPLEMENTS);
  };

  return (
    <MenuContext.Provider value={{
      config,
      categories,
      products,
      complements,
      storageEnabled,
      updateConfig,
      toggleBusinessOpen,
      addCategory,
      updateCategory,
      reorderCategories,
      deleteCategory,
      addProduct,
      updateProduct,
      deleteProduct,
      addComplement,
      updateComplement,
      deleteComplement,
      uploadProductImage,
      resetToDefault,
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
