import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initialCategories, initialComplements, initialConfig, initialProducts } from '../data';
import {
  canPersistSupabaseCategoryOrder,
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
  const [storageEnabled] = useState(hasSupabaseConfig);
  const [config, setConfig] = useState<BusinessConfig>(initialConfig);
  const [categories, setCategories] = useState<Category[]>(normalizeCategories(initialCategories));
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [complements, setComplements] = useState<Complement[]>(initialComplements);

  const assertSupabaseConfigured = () => {
    if (!hasSupabaseConfig) {
      throw new Error('Supabase no está configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!hasSupabaseConfig) {
        console.error('Supabase no está configurado. La app está en modo Supabase-only.');
        return;
      }

      try {
        const remote = await loadSupabaseData();
        if (!mounted) return;
        setConfig(remote.config);
        setCategories(normalizeCategories(remote.categories.length > 0 ? remote.categories : initialCategories));
        setProducts(remote.products.length > 0 ? remote.products : initialProducts);
        setComplements(remote.complements.length > 0 ? remote.complements : initialComplements);
      } catch (error) {
        console.error('No se pudo cargar Supabase.', error);
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const updateConfig = async (newConfig: Partial<BusinessConfig>) => {
    assertSupabaseConfigured();
    const nextConfig = { ...config, ...newConfig };
    setConfig(nextConfig);
    await saveSupabaseConfig(nextConfig);
  };

  const toggleBusinessOpen = async () => {
    assertSupabaseConfigured();
    const updated = { ...config, isOpen: !config.isOpen };
    setConfig(updated);
    await saveSupabaseConfig(updated);
  };

  const addCategory = async (name: string) => {
    assertSupabaseConfigured();
    const previousCategories = categories;
    const newCategory: Category = { id: createId(), name, sortOrder: categories.length };
    const nextCategories = normalizeCategories([...previousCategories, newCategory]);
    setCategories(nextCategories);

    try {
      await saveSupabaseCategory(newCategory);
    } catch (error) {
      setCategories(previousCategories);
      throw error;
    }
  };

  const updateCategory = async (id: string, name: string) => {
    assertSupabaseConfigured();
    const updated = normalizeCategories(categories.map((category) => (category.id === id ? { ...category, name } : category)));
    setCategories(updated);
    const category = updated.find((item) => item.id === id);
    if (category) await saveSupabaseCategory(category);
  };

  const reorderCategories = async (orderedIds: string[]) => {
    assertSupabaseConfigured();
    if (!canPersistSupabaseCategoryOrder()) {
      throw new Error('Tu proyecto de Supabase no tiene la columna sort_order en categories. Ejecuta supabase/schema.sql para habilitar el orden persistente.');
    }

    const previousCategories = categories;
    const byId = new Map(previousCategories.map((category) => [category.id, category]));
    const updated = normalizeCategories(
      orderedIds
        .map((id, index) => {
          const category = byId.get(id);
          return category ? { ...category, sortOrder: index } : null;
        })
        .filter(Boolean) as Category[]
    );

    setCategories(updated);

    try {
      for (const category of updated) {
        await saveSupabaseCategory(category);
      }
    } catch (error) {
      setCategories(previousCategories);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    assertSupabaseConfigured();
    const previousCategories = categories;
    const previousProducts = products;
    const nextCategories = previousCategories.filter((category) => category.id !== id);
    const nextProducts = previousProducts.filter((product) => product.categoryId !== id);

    setCategories(nextCategories);
    setProducts(nextProducts);

    try {
      await deleteSupabaseCategory(id);
    } catch (error) {
      setCategories(previousCategories);
      setProducts(previousProducts);
      throw error;
    }
  };

  const addProduct = async (productData: Omit<Product, 'id'>) => {
    assertSupabaseConfigured();
    const newProduct: Product = { ...productData, id: createId() };
    setProducts((prev) => [...prev, newProduct]);
    await saveSupabaseProduct(newProduct);
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    assertSupabaseConfigured();
    const updated = products.map((product) => (product.id === id ? { ...product, ...productData } : product));
    setProducts(updated);
    const product = updated.find((item) => item.id === id);
    if (product) await saveSupabaseProduct(product);
  };

  const deleteProduct = async (id: string) => {
    assertSupabaseConfigured();
    setProducts((prev) => prev.filter((product) => product.id !== id));
    await deleteSupabaseProduct(id);
  };

  const addComplement = async (complementData: Omit<Complement, 'id'>) => {
    assertSupabaseConfigured();
    const newComplement: Complement = { ...complementData, id: createId() };
    setComplements((prev) => [...prev, newComplement]);
    await saveSupabaseComplement(newComplement);
  };

  const updateComplement = async (id: string, complementData: Partial<Complement>) => {
    assertSupabaseConfigured();
    const updated = complements.map((complement) => (complement.id === id ? { ...complement, ...complementData } : complement));
    setComplements(updated);
    const complement = updated.find((item) => item.id === id);
    if (complement) await saveSupabaseComplement(complement);
  };

  const deleteComplement = async (id: string) => {
    assertSupabaseConfigured();
    const productsToPersist = products.filter((product) => product.complementIds?.includes(id));
    const updatedProducts = products.map((product) => ({
      ...product,
      complementIds: product.complementIds?.filter((complementId) => complementId !== id),
    }));

    setComplements((prev) => prev.filter((complement) => complement.id !== id));
    setProducts(updatedProducts);
    await Promise.all(updatedProducts.filter((product) => productsToPersist.some((persisted) => persisted.id === product.id)).map(saveSupabaseProduct));
    await deleteSupabaseComplement(id);
  };

  const uploadProductImage = async (file: File) => {
    assertSupabaseConfigured();
    return uploadSupabaseProductImage(file);
  };

  const resetToDefault = async () => {
    if (!window.confirm('¿Estás seguro de restablecer todos los datos del menú a los valores iniciales?')) {
      return;
    }
    assertSupabaseConfigured();
    await resetSupabaseData();
    setConfig(initialConfig);
    setCategories(normalizeCategories(initialCategories));
    setProducts(initialProducts);
    setComplements(initialComplements);
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
