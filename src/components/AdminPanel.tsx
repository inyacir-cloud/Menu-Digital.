import { useState } from 'react';
import { 
  Power, Plus, Trash2, Edit2, ArrowLeft, Check, X, 
  Settings, Utensils, Tag, Layers, RefreshCw, Droplets, GripVertical, ChevronDown, ChevronUp
} from 'lucide-react';
import { useMenu } from '../context/MenuContext';
import { Product } from '../types';
import { defaultWhatsAppOrderMessage, defaultWhatsAppShareMessage } from '../data';
import { handleProductImageError } from '../utils/images';
import { WatersAdminSection } from './WatersAdminSection';

interface AdminPanelProps {
  onBack: () => void;
  onLogout: () => void;
  userEmail?: string;
}

export function AdminPanel({ onBack, onLogout, userEmail }: AdminPanelProps) {
  const { 
    config, updateConfig, toggleBusinessOpen,
    categories, addCategory, updateCategory, reorderCategories, deleteCategory,
    products, addProduct, updateProduct, deleteProduct,
    complements, addComplement, updateComplement, deleteComplement,
    storageEnabled, uploadProductImage, uploadLogoImage, resetToDefault
  } = useMenu();

  const [activeTab, setActiveTab] = useState<'general' | 'products' | 'waters' | 'categories' | 'complements'>('general');

  // --- GENERAL STATE ---
  const [phoneInput, setPhoneInput] = useState(config.phone);
  const [nameInput, setNameInput] = useState(config.name);
  const [scheduleInput, setScheduleInput] = useState(config.schedule);
  const [addressInput, setAddressInput] = useState(config.address || '');
  const [descriptionInput, setDescriptionInput] = useState(config.description || '');
  const [logoInput, setLogoInput] = useState(config.logo || '');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [whatsappMessageInput, setWhatsappMessageInput] = useState(
    config.socialMedia?.whatsappMessage || defaultWhatsAppShareMessage
  );
  const [whatsappMessageSaved, setWhatsappMessageSaved] = useState(false);
  const [whatsappOrderMessageInput, setWhatsappOrderMessageInput] = useState(
    config.socialMedia?.whatsappOrderMessage || defaultWhatsAppOrderMessage
  );
  const [whatsappOrderMessageSaved, setWhatsappOrderMessageSaved] = useState(false);
  const [showWhatsAppOrderPreview, setShowWhatsAppOrderPreview] = useState(false);
  const [serviceTypeInput, setServiceTypeInput] = useState(config.serviceType || 'both');
  const [deliveryRadiusInput, setDeliveryRadiusInput] = useState(config.deliveryRadius || '');
  const [instagramInput, setInstagramInput] = useState(config.socialMedia?.instagram || '');
  const [facebookInput, setFacebookInput] = useState(config.socialMedia?.facebook || '');
  const [websiteInput, setWebsiteInput] = useState(config.socialMedia?.website || '');
  const [hoursInput, setHoursInput] = useState(config.hours || {
    monday: 'Cerrado',
    tuesday: '1:00 PM - 11:00 PM',
    wednesday: '1:00 PM - 11:00 PM',
    thursday: '1:00 PM - 11:00 PM',
    friday: '1:00 PM - 12:00 AM',
    saturday: '12:00 PM - 12:00 AM',
    sunday: '12:00 PM - 10:00 PM'
  });
  const [generalSaved, setGeneralSaved] = useState(false);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      name: nameInput,
      phone: phoneInput,
      schedule: scheduleInput,
      address: addressInput,
      description: descriptionInput,
      logo: logoInput,
      serviceType: serviceTypeInput,
      deliveryRadius: deliveryRadiusInput,
      socialMedia: {
        instagram: instagramInput,
        facebook: facebookInput,
        website: websiteInput,
        whatsappMessage: whatsappMessageInput,
        whatsappOrderMessage: whatsappOrderMessageInput
      },
      hours: hoursInput
    });
    setGeneralSaved(true);
    setTimeout(() => setGeneralSaved(false), 2500);
  };

  const handleUploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    if (!storageEnabled) {
      alert('Configura Supabase para subir el logo.');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const logoUrl = await uploadLogoImage(file);
      setLogoInput(logoUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo subir el logo.';
      alert(message);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSaveWhatsAppMessage = async () => {
    await updateConfig({
      socialMedia: {
        instagram: instagramInput,
        facebook: facebookInput,
        website: websiteInput,
        whatsappMessage: whatsappMessageInput,
        whatsappOrderMessage: whatsappOrderMessageInput,
      },
    });

    setWhatsappMessageSaved(true);
    setTimeout(() => setWhatsappMessageSaved(false), 2500);
  };

  const handleSaveWhatsAppOrderMessage = async () => {
    await updateConfig({
      socialMedia: {
        instagram: instagramInput,
        facebook: facebookInput,
        website: websiteInput,
        whatsappMessage: whatsappMessageInput,
        whatsappOrderMessage: whatsappOrderMessageInput,
      },
    });

    setWhatsappOrderMessageSaved(true);
    setTimeout(() => setWhatsappOrderMessageSaved(false), 2500);
  };

  const previewOrderExample = [
    {
      quantity: 2,
      name: 'Hamburguesa Clásica',
      subtotal: '$170.00',
      details: 'Presentación: Grande',
      extras: ['Queso Cheddar Extra (+$15)']
    },
    {
      quantity: 1,
      name: 'Agua de Jamaica',
      subtotal: '$25.00',
      details: 'Sin hielo',
      extras: []
    }
  ];

  const previewOrderDetails = previewOrderExample
    .map((item) => {
      let details = `▪️ *${item.quantity}x ${item.name}* - ${item.subtotal}`;
      if (item.details) {
        details += `\n   ↳ _Detalle:_ ${item.details}`;
      }
      if (item.extras.length > 0) {
        details += `\n   ↳ _Extras/Opciones:_ ${item.extras.join(', ')}`;
      }
      return details;
    })
    .join('\n\n');

  const previewWhatsAppOrderMessage = whatsappOrderMessageInput
    .replaceAll('{businessName}', config.name || 'Tu negocio')
    .replaceAll('{orderDetails}', previewOrderDetails)
    .replaceAll('{total}', '$195.00')
    .replaceAll('{phone}', `+${config.phone}`);

  const dayLabels: Record<string, string> = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };

  const updateHour = (day: string, value: string) => {
    setHoursInput(prev => ({ ...prev, [day]: value }));
  };

  // --- CATEGORY STATE ---
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [draggingCategoryId, setDraggingCategoryId] = useState<string | null>(null);
  const [pendingCategoryOrderIds, setPendingCategoryOrderIds] = useState<string[] | null>(null);
  const [isReorderingCategories, setIsReorderingCategories] = useState(false);

  const displayedCategories = (() => {
    if (!pendingCategoryOrderIds || pendingCategoryOrderIds.length === 0) {
      return categories;
    }

    const byId = new Map(categories.map((category) => [category.id, category]));
    const ordered = pendingCategoryOrderIds
      .map((id) => byId.get(id))
      .filter(Boolean) as typeof categories;
    const remaining = categories.filter((category) => !pendingCategoryOrderIds.includes(category.id));
    return [...ordered, ...remaining];
  })();

  const hasPendingCategoryOrder = (() => {
    if (!pendingCategoryOrderIds) return false;
    const current = categories.map((category) => category.id).join('|');
    const draft = pendingCategoryOrderIds.join('|');
    return current !== draft;
  })();

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      await addCategory(newCatName.trim());
      setNewCatName('');
      setPendingCategoryOrderIds(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear la categoría en Supabase.';
      alert(message);
    }
  };

  const handleCategoryDrop = (targetId: string) => {
    if (isReorderingCategories || !draggingCategoryId || draggingCategoryId === targetId) {
      setDraggingCategoryId(null);
      return;
    }

    const orderedIds = displayedCategories.map((category) => category.id);
    const fromIndex = orderedIds.indexOf(draggingCategoryId);
    const toIndex = orderedIds.indexOf(targetId);

    if (fromIndex === -1 || toIndex === -1) {
      setDraggingCategoryId(null);
      return;
    }

    const nextIds = [...orderedIds];
    const [movedId] = nextIds.splice(fromIndex, 1);
    nextIds.splice(toIndex, 0, movedId);
    setDraggingCategoryId(null);

    setPendingCategoryOrderIds(nextIds);
  };

  const handleSaveCategoryOrder = async () => {
    if (!hasPendingCategoryOrder || !pendingCategoryOrderIds) {
      return;
    }

    setIsReorderingCategories(true);
    try {
      await reorderCategories(pendingCategoryOrderIds);
      setPendingCategoryOrderIds(null);
      window.location.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar el nuevo orden de categorías en Supabase.';
      alert(message);
    } finally {
      setIsReorderingCategories(false);
    }
  };

  // --- COMPLEMENT STATE ---
  const [newCompName, setNewCompName] = useState('');
  const [newCompPrice, setNewCompPrice] = useState('0');
  const [editingCompId, setEditingCompId] = useState<string | null>(null);
  const [editingCompName, setEditingCompName] = useState('');
  const [editingCompPrice, setEditingCompPrice] = useState('0');

  const handleAddComplement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName.trim()) return;
    addComplement({
      name: newCompName.trim(),
      price: parseFloat(newCompPrice) || 0
    });
    setNewCompName('');
    setNewCompPrice('0');
  };

  // --- PRODUCT STATE ---
  const [isEditingProd, setIsEditingProd] = useState<boolean>(false);
  const [currentProdId, setCurrentProdId] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCat, setProdCat] = useState(categories[0]?.id || '');
  const [prodImg, setProdImg] = useState('');
  const [prodImageFile, setProdImageFile] = useState<File | null>(null);
  const [prodComplements, setProdComplements] = useState<string[]>([]);
  const [productSaveError, setProductSaveError] = useState<string | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [expandedProductCategories, setExpandedProductCategories] = useState<string[]>([]);

  const openNewProductForm = () => {
    setIsEditingProd(true);
    setCurrentProdId(null);
    setProdName('');
    setProdDesc('');
    setProdPrice('');
    setProdCat(categories[0]?.id || '');
    setProdImg('');
    setProdImageFile(null);
    setProdComplements([]);
    setProductSaveError(null);
  };

  const openEditProductForm = (p: Product) => {
    setIsEditingProd(true);
    setCurrentProdId(p.id);
    setProdName(p.name);
    setProdDesc(p.description);
    setProdPrice(p.price.toString());
    setProdCat(p.categoryId);
    setProdImg(p.image);
    setProdImageFile(null);
    setProdComplements(p.complementIds || []);
    setProductSaveError(null);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodPrice) return;

    setIsSavingProduct(true);
    setProductSaveError(null);

    try {
      let imageUrl = prodImg.trim() || '/Logo.png';

      if (prodImageFile) {
        imageUrl = await uploadProductImage(prodImageFile);
      }

      const productData = {
        name: prodName.trim(),
        description: prodDesc.trim(),
        price: parseFloat(prodPrice) || 0,
        categoryId: prodCat || categories[0]?.id || '1',
        image: imageUrl,
        complementIds: prodComplements
      };

      if (currentProdId) {
        await updateProduct(currentProdId, productData);
      } else {
        await addProduct(productData);
      }

      setIsEditingProd(false);
      setProdImageFile(null);
    } catch (error) {
      setProductSaveError(error instanceof Error ? error.message : 'No se pudo guardar el producto.');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const toggleProdComplement = (id: string) => {
    setProdComplements(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const groupedProducts = categories
    .map((category) => ({
      category,
      items: products.filter((product) => !product.isDailyWater && product.categoryId === category.id),
    }))
    .filter((group) => group.items.length > 0);

  const toggleProductCategory = (categoryId: string) => {
    setExpandedProductCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Admin Top Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm safe-top">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={onBack}
              aria-label="Volver"
              className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-xl text-gray-600 flex items-center gap-1.5 font-medium text-sm transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Volver</span>
            </button>
            <div className="h-6 w-px bg-gray-200 hidden sm:block" />
            <h1 className="font-bold text-gray-800 text-sm sm:text-lg flex items-center gap-2 min-w-0">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 shrink-0" />
              <span className="truncate">
                <span className="sm:hidden">Admin</span>
                <span className="hidden sm:inline">Panel de Administración</span>
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {userEmail && (
              <span className="hidden md:inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600">
                {userEmail}
              </span>
            )}
            <button
              onClick={toggleBusinessOpen}
              className={`px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all shrink-0 ${
                config.isOpen
                  ? 'bg-green-100 text-green-700 hover:bg-green-200 active:bg-green-300'
                  : 'bg-red-100 text-red-700 hover:bg-red-200 active:bg-red-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${config.isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="hidden xs:inline">{config.isOpen ? 'Abierto' : 'Cerrado'}</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-950 transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Tabs Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-14 sm:top-16 z-20">
        <div className="max-w-5xl mx-auto px-2 sm:px-4 flex gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => { setActiveTab('general'); setIsEditingProd(false); }}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 border-b-2 font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors ${
              activeTab === 'general'
                ? 'border-orange-500 text-orange-600 bg-orange-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>Estado</span>
          </button>
          <button
            onClick={() => { setActiveTab('products'); setIsEditingProd(false); }}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 border-b-2 font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors ${
              activeTab === 'products'
                ? 'border-orange-500 text-orange-600 bg-orange-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Productos</span>
          </button>
          <button
            onClick={() => { setActiveTab('waters'); setIsEditingProd(false); }}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 border-b-2 font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors ${
              activeTab === 'waters'
                ? 'border-orange-500 text-orange-600 bg-orange-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Droplets className="w-4 h-4" />
            <span>Aguas del Día</span>
          </button>
          <button
            onClick={() => { setActiveTab('categories'); setIsEditingProd(false); }}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 border-b-2 font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors ${
              activeTab === 'categories'
                ? 'border-orange-500 text-orange-600 bg-orange-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Categorías ({categories.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('complements'); setIsEditingProd(false); }}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 border-b-2 font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors ${
              activeTab === 'complements'
                ? 'border-orange-500 text-orange-600 bg-orange-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Complementos ({complements.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-8 safe-bottom">
        
        {/* TAB 1: GENERAL & STATUS */}
        {activeTab === 'general' && (
          <div className="space-y-6 max-w-2xl mx-auto">
            {/* Master Switch Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Estado del Menú Virtual</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Cuando está cerrado, los clientes pueden ver tu carta pero no podrán enviar pedidos por WhatsApp.
                </p>
              </div>
              
              <button
                onClick={toggleBusinessOpen}
                className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-md ${
                  config.isOpen
                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-200'
                    : 'bg-red-500 hover:bg-red-600 text-white shadow-red-200'
                }`}
              >
                <Power className="w-5 h-5" />
                <span>{config.isOpen ? 'ABIERTO (Recibiendo Pedidos)' : 'CERRADO (Sin Pedidos)'}</span>
              </button>
            </div>

            {/* Config Form */}
            <form onSubmit={handleSaveGeneral} className="space-y-6">
              {/* Información General */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Información General</h3>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                    Nombre del Negocio
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-sm font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                    Descripción del Negocio
                  </label>
                  <textarea
                    value={descriptionInput}
                    onChange={(e) => setDescriptionInput(e.target.value)}
                    placeholder="Breve descripción de tu negocio..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                    URL del Logo (opcional)
                  </label>
                  <input
                    type="url"
                    value={logoInput}
                    onChange={(e) => setLogoInput(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 outline-none text-sm"
                  />
                  <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUploadLogo}
                        disabled={isUploadingLogo}
                      />
                      {isUploadingLogo ? 'Subiendo logo...' : 'Subir imagen de logo'}
                    </label>
                    <span className="text-[11px] text-gray-400">
                      Al subirla, se colocará automáticamente en la URL del logo.
                    </span>
                  </div>
                </div>
              </div>

              {/* Contacto y WhatsApp */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Contacto</h3>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                    Número de WhatsApp para Pedidos
                  </label>
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="Ej: 525635397099"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 outline-none text-sm font-mono font-bold"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Código de país + número sin símbolos. Ej: 525635397099
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                    Horario General (Resumen)
                  </label>
                  <input
                    type="text"
                    value={scheduleInput}
                    onChange={(e) => setScheduleInput(e.target.value)}
                    placeholder="Ej: Mar - Dom: 1:00 PM - 11:00 PM"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 outline-none text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Resumen breve para mostrar en la cabecera del menú
                  </p>
                </div>
              </div>

              {/* Horarios Detallados por Día */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Horarios por Día</h3>
                <p className="text-xs text-gray-500 -mt-2 mb-3">Define los horarios específicos para cada día de la semana</p>

                <div className="space-y-3">
                  {Object.keys(dayLabels).map(day => (
                    <div key={day} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                      <label className="text-sm font-semibold text-gray-700">
                        {dayLabels[day]}
                      </label>
                      <input
                        type="text"
                        value={hoursInput[day as keyof typeof hoursInput] || ''}
                        onChange={(e) => updateHour(day, e.target.value)}
                        placeholder="Ej: 1:00 PM - 11:00 PM o Cerrado"
                        className="sm:col-span-2 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 outline-none text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Ubicación y Servicio */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Ubicación y Servicio</h3>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                    Dirección Completa
                  </label>
                  <input
                    type="text"
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    placeholder="Ej: Av. Principal #123, Centro, Ciudad de México"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                    Tipo de Servicio
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setServiceTypeInput('pickup')}
                      className={`py-2.5 px-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                        serviceTypeInput === 'pickup'
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      Solo Recoger
                    </button>
                    <button
                      type="button"
                      onClick={() => setServiceTypeInput('delivery')}
                      className={`py-2.5 px-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                        serviceTypeInput === 'delivery'
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      Solo Domicilio
                    </button>
                    <button
                      type="button"
                      onClick={() => setServiceTypeInput('both')}
                      className={`py-2.5 px-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                        serviceTypeInput === 'both'
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      Ambos
                    </button>
                  </div>
                </div>

                {(serviceTypeInput === 'delivery' || serviceTypeInput === 'both') && (
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                      Radio de Entrega
                    </label>
                    <input
                      type="text"
                      value={deliveryRadiusInput}
                      onChange={(e) => setDeliveryRadiusInput(e.target.value)}
                      placeholder="Ej: 5 km, 10 minutos, etc."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 outline-none text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Redes Sociales */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Redes Sociales (opcional)</h3>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={instagramInput}
                    onChange={(e) => setInstagramInput(e.target.value)}
                    placeholder="@usuario"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                    Facebook
                  </label>
                  <input
                    type="text"
                    value={facebookInput}
                    onChange={(e) => setFacebookInput(e.target.value)}
                    placeholder="nombre de página"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                    Sitio Web
                  </label>
                  <input
                    type="url"
                    value={websiteInput}
                    onChange={(e) => setWebsiteInput(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Mensaje WhatsApp */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Mensaje de WhatsApp</h3>
                    <p className="text-xs text-gray-500">Edita el texto que se envía cuando comparten tu menú por WhatsApp.</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700 px-2 py-1 rounded-full shrink-0">Acceso Rápido</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                    Estilo del mensaje
                  </label>
                  <textarea
                    value={whatsappMessageInput}
                    onChange={(e) => setWhatsappMessageInput(e.target.value)}
                    rows={6}
                    placeholder="Escribe el mensaje que se compartirá por WhatsApp..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 outline-none text-sm leading-relaxed"
                  />
                  <p className="text-[11px] text-gray-400 mt-2">
                    Usa <span className="font-bold text-gray-600">{`{businessName}`}</span> y <span className="font-bold text-gray-600">{`{menuUrl}`}</span> si quieres insertar el nombre y el enlace.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleSaveWhatsAppMessage}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl shadow-md shadow-green-200 flex items-center gap-2 text-sm transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar mensaje</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWhatsappMessageInput(defaultWhatsAppShareMessage)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
                  >
                    Restablecer mensaje
                  </button>
                </div>

                {whatsappMessageSaved && (
                  <p className="text-green-600 text-xs font-bold animate-fadeIn">✓ Mensaje de WhatsApp guardado correctamente</p>
                )}
              </div>

                {/* Mensaje Pedido WhatsApp */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Mensaje de Pedido por WhatsApp</h3>
                      <p className="text-xs text-gray-500">Edita el texto que se enviará cuando el cliente haga su pedido desde el carrito.</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-1 rounded-full shrink-0">Carrito</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                      Plantilla del pedido
                    </label>
                    <textarea
                      value={whatsappOrderMessageInput}
                      onChange={(e) => setWhatsappOrderMessageInput(e.target.value)}
                      rows={7}
                      placeholder="Escribe el mensaje del pedido que se enviará por WhatsApp..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 outline-none text-sm leading-relaxed"
                    />
                    <p className="text-[11px] text-gray-400 mt-2">
                      Usa <span className="font-bold text-gray-600">{`{businessName}`}</span>, <span className="font-bold text-gray-600">{`{orderDetails}`}</span>, <span className="font-bold text-gray-600">{`{total}`}</span> y <span className="font-bold text-gray-600">{`{phone}`}</span>.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={handleSaveWhatsAppOrderMessage}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-md shadow-blue-200 flex items-center gap-2 text-sm transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>Guardar mensaje</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWhatsappOrderMessageInput(defaultWhatsAppOrderMessage)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
                    >
                      Restablecer mensaje
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowWhatsAppOrderPreview((prev) => !prev)}
                      className="bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold px-6 py-3 rounded-xl text-sm transition-colors border border-orange-200"
                    >
                      {showWhatsAppOrderPreview ? 'Ocultar vista previa' : 'Vista previa'}
                    </button>
                  </div>

                  {showWhatsAppOrderPreview && (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Vista previa del mensaje final</p>
                      <div className="space-y-3">
                        <div className="bg-white/90 rounded-2xl border border-blue-100 p-3 space-y-2">
                          {previewOrderExample.map((item) => (
                            <div key={`${item.name}-${item.quantity}`} className="flex items-start justify-between gap-3 text-xs sm:text-sm">
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900">
                                  {item.quantity}x {item.name}
                                </p>
                                {item.details && <p className="text-gray-500">{item.details}</p>}
                                {item.extras.length > 0 && <p className="text-gray-500">Extras: {item.extras.join(', ')}</p>}
                              </div>
                              <span className="shrink-0 font-extrabold text-blue-700">{item.subtotal}</span>
                            </div>
                          ))}
                          <div className="pt-2 border-t border-blue-100 flex items-center justify-between text-sm">
                            <span className="font-bold text-gray-700">Total</span>
                            <span className="font-extrabold text-orange-600">$195.00</span>
                          </div>
                        </div>
                        <pre className="whitespace-pre-wrap text-xs sm:text-sm text-gray-800 leading-relaxed font-medium bg-white rounded-2xl border border-blue-100 p-4">
                          {previewWhatsAppOrderMessage}
                        </pre>
                      </div>
                    </div>
                  )}

                  {whatsappOrderMessageSaved && (
                    <p className="text-blue-600 text-xs font-bold animate-fadeIn">✓ Mensaje de pedido guardado correctamente</p>
                  )}
                </div>

              {/* Botón Guardar */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl shadow-md shadow-orange-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  <span>Guardar Todos los Cambios</span>
                </button>
                {generalSaved && (
                  <p className="text-green-600 text-center text-xs font-bold mt-3 animate-fadeIn">
                    ✓ ¡Configuración guardada exitosamente!
                  </p>
                )}
              </div>
            </form>

            {/* Reset Data */}
            <div className="bg-red-50/50 rounded-3xl p-6 border border-red-100 flex items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-red-900 text-sm">Restablecer Datos Originales</h4>
                <p className="text-xs text-red-600 mt-0.5">Vuelve a cargar las categorías y platillos de prueba iniciales.</p>
              </div>
              <button
                onClick={resetToDefault}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restablecer</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS */}
        {activeTab === 'products' && (
          <div>
            {!isEditingProd ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Listado de Platillos y Productos</h3>
                    <p className="text-sm text-gray-500">Agrega, edita precios, descripciones o asigna complementos.</p>
                  </div>
                  <button
                    onClick={openNewProductForm}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-5 rounded-xl shadow-md shadow-orange-200 flex items-center gap-2 text-sm transition-transform active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Nuevo Producto</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {groupedProducts.map(({ category, items }) => (
                    <section key={category.id} className="space-y-3">
                      <button
                        type="button"
                        onClick={() => toggleProductCategory(category.id)}
                        className="w-full flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left hover:border-orange-300 hover:bg-orange-50/30 transition-colors"
                      >
                        <div>
                          <h4 className="text-xl font-bold text-gray-900">{category.name}</h4>
                          <span className="text-xs text-gray-400">{items.length} producto(s)</span>
                        </div>
                        {expandedProductCategories.includes(category.id) ? (
                          <ChevronUp className="w-5 h-5 text-gray-500 shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500 shrink-0" />
                        )}
                      </button>

                      {expandedProductCategories.includes(category.id) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {items.map((product) => (
                            <div key={product.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex gap-4 items-center justify-between">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  onError={handleProductImageError}
                                  className="w-16 h-16 object-cover rounded-xl shrink-0 bg-gray-100"
                                />
                                <div className="overflow-hidden">
                                  <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-600 px-2 py-0.5 rounded-md">
                                    {category.name}
                                  </span>
                                  <h4 className="font-bold text-gray-800 text-sm truncate mt-1">{product.name}</h4>
                                  <p className="text-orange-500 font-extrabold text-sm">${product.price.toFixed(2)}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => openEditProductForm(product)}
                                  title="Editar producto"
                                  className="p-2 bg-gray-100 hover:bg-orange-50 hover:text-orange-600 rounded-xl text-gray-600 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`¿Eliminar "${product.name}"?`)) deleteProduct(product.id);
                                  }}
                                  title="Eliminar producto"
                                  className="p-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-xl text-gray-600 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  ))}
                </div>
              </div>
            ) : (
              /* PRODUCT FORM (NEW / EDIT) */
              <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 shadow-sm border border-gray-100 animate-fadeIn">
                <div className="flex justify-between items-center mb-6 pb-4 border-b">
                  <h3 className="text-lg font-bold text-gray-900">
                    {currentProdId ? 'Editar Producto' : 'Crear Nuevo Producto'}
                  </h3>
                  <button
                    onClick={() => setIsEditingProd(false)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSaveProduct} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                      Nombre del Platillo *
                    </label>
                    <input
                      type="text"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      placeholder="Ej: Hamburguesa Especial"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 outline-none text-sm font-medium"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                        Precio ($) *
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={prodPrice}
                        onChange={(e) => setProdPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 outline-none text-sm font-bold text-orange-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                        Categoría *
                      </label>
                      <select
                        value={prodCat}
                        onChange={(e) => setProdCat(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 outline-none text-sm font-medium bg-white"
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                      Descripción de ingredientes
                    </label>
                    <textarea
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      placeholder="Describe qué lleva el platillo..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                      URL de la Imagen (Foto del platillo)
                    </label>
                    <input
                      type="text"
                      value={prodImg}
                      onChange={(e) => setProdImg(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 outline-none text-sm text-gray-600"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Puedes pegar una URL o subir una foto real. Si subes archivo, tendrá prioridad.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                      Subir imagen real del producto
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProdImageFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 outline-none text-sm text-gray-600 bg-white"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      {storageEnabled ? 'Se subirá a Supabase Storage dentro del bucket configurado.' : 'Configura Supabase para habilitar la carga real de imágenes.'}
                    </p>
                    {prodImageFile && (
                      <p className="text-[11px] text-orange-600 mt-1 font-semibold">
                        Archivo listo: {prodImageFile.name}
                      </p>
                    )}
                  </div>

                  {productSaveError && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {productSaveError}
                    </div>
                  )}

                  {/* Complements Selector for this Product */}
                  <div className="pt-3 border-t">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                      Complementos disponibles para este producto
                    </label>
                    <p className="text-xs text-gray-400 mb-3">
                      Marca los ingredientes o extras que el cliente puede seleccionar al pedir este producto:
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-2xl border">
                      {complements.length === 0 ? (
                        <p className="text-xs text-gray-400 p-2">No hay complementos creados. Ve a la pestaña de Complementos para agregar.</p>
                      ) : (
                        complements.map(comp => {
                          const isChecked = prodComplements.includes(comp.id);
                          return (
                            <div
                              key={comp.id}
                              onClick={() => toggleProdComplement(comp.id)}
                              className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer text-xs transition-all ${
                                isChecked
                                  ? 'bg-orange-500 border-orange-500 text-white font-semibold'
                                  : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300'
                              }`}
                            >
                              <span>{comp.name}</span>
                              <span>{comp.price > 0 ? `+$${comp.price}` : 'Gratis'}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditingProd(false)}
                      className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-sm transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingProduct}
                      className="w-2/3 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm transition-colors shadow-md shadow-orange-200"
                    >
                      {isSavingProduct ? 'Guardando...' : currentProdId ? 'Guardar Cambios' : 'Crear Producto'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AGUAS DEL DÍA */}
        {activeTab === 'waters' && (
          <WatersAdminSection
            products={products}
            categories={categories}
            addProduct={addProduct}
            updateProduct={updateProduct}
            deleteProduct={deleteProduct}
          />
        )}

        {/* TAB 4: CATEGORIES */}
        {activeTab === 'categories' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Agregar Nueva Categoría</h3>
              <form onSubmit={handleAddCategory} className="flex gap-3">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ej: Alitas, Desayunos, Tacos..."
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 outline-none text-sm font-medium"
                  required
                />
                <button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl shadow-md shadow-orange-200 flex items-center gap-2 text-sm transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar</span>
                </button>
              </form>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-3">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Categorías Actuales</h3>
              {displayedCategories.map(cat => (
                <div
                  key={cat.id}
                  draggable={!isReorderingCategories}
                  onDragStart={() => {
                    if (isReorderingCategories) return;
                    setDraggingCategoryId(cat.id);
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleCategoryDrop(cat.id)}
                  onDragEnd={() => setDraggingCategoryId(null)}
                  className={`flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border ${draggingCategoryId === cat.id ? 'border-orange-300 bg-orange-50' : 'border-gray-100'} ${isReorderingCategories ? 'opacity-70' : ''}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      className="p-1.5 text-gray-400 cursor-grab active:cursor-grabbing"
                      title="Arrastra para cambiar el orden"
                    >
                      <GripVertical className="w-4 h-4" />
                    </button>

                  {editingCatId === cat.id ? (
                    <div className="flex items-center gap-2 flex-1 mr-4">
                      <input
                        type="text"
                        value={editingCatName}
                        onChange={(e) => setEditingCatName(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-orange-500 outline-none text-sm font-semibold bg-white"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          if (editingCatName.trim()) updateCategory(cat.id, editingCatName.trim());
                          setEditingCatId(null);
                        }}
                        className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingCatId(null)}
                        className="p-1.5 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="min-w-0">
                      <span className="font-bold text-gray-800 text-sm block truncate">{cat.name}</span>
                      <span className="text-[11px] text-gray-400">Posición {(cat.sortOrder ?? 0) + 1}</span>
                    </div>
                  )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingCatId(cat.id);
                        setEditingCatName(cat.name);
                      }}
                      className="p-2 text-gray-500 hover:bg-white rounded-xl transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        if (displayedCategories.length <= 1) {
                          alert('Debe existir al menos una categoría.');
                          return;
                        }
                        if (window.confirm(`¿Eliminar la categoría "${cat.name}"?`)) {
                          try {
                            await deleteCategory(cat.id);
                            setPendingCategoryOrderIds(null);
                          } catch (error) {
                            const message = error instanceof Error ? error.message : 'No se pudo eliminar la categoría en Supabase.';
                            alert(message);
                          }
                        }
                      }}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-white rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {hasPendingCategoryOrder && (
              <div className="fixed bottom-6 right-4 sm:right-6 z-40">
                <button
                  type="button"
                  onClick={handleSaveCategoryOrder}
                  disabled={isReorderingCategories}
                  className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold px-5 py-3 rounded-full shadow-lg shadow-orange-200 flex items-center gap-2 text-sm transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>{isReorderingCategories ? 'Guardando...' : 'Guardar orden'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: COMPLEMENTS */}
        {activeTab === 'complements' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Agregar Complemento o Ingrediente</h3>
              <p className="text-xs text-gray-400 mb-4">Ejemplo: Queso Extra ($15), Tocino ($20), Sin Cebolla ($0).</p>

              <form onSubmit={handleAddComplement} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={newCompName}
                    onChange={(e) => setNewCompName(e.target.value)}
                    placeholder="Nombre del complemento..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 outline-none text-sm font-medium"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.5"
                    value={newCompPrice}
                    onChange={(e) => setNewCompPrice(e.target.value)}
                    placeholder="Precio ($)"
                    className="w-24 px-3 py-3 rounded-xl border border-gray-200 focus:border-orange-500 outline-none text-sm font-bold text-orange-600"
                    required
                  />
                  <button
                    type="submit"
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-md shadow-orange-200 flex items-center justify-center transition-colors shrink-0"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold text-gray-900">Complementos Registrados</h3>
                <span className="text-xs text-gray-400">Total: {complements.length}</span>
              </div>

              {complements.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-6">No has agregado ningún complemento todavía.</p>
              ) : (
                complements.map(comp => (
                  <div key={comp.id} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                    {editingCompId === comp.id ? (
                      <div className="flex items-center gap-2 flex-1 mr-4">
                        <input
                          type="text"
                          value={editingCompName}
                          onChange={(e) => setEditingCompName(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-orange-500 outline-none text-sm font-semibold bg-white"
                        />
                        <input
                          type="number"
                          step="0.5"
                          value={editingCompPrice}
                          onChange={(e) => setEditingCompPrice(e.target.value)}
                          className="w-20 px-2 py-1.5 rounded-lg border border-orange-500 outline-none text-sm font-bold bg-white text-orange-600"
                        />
                        <button
                          onClick={() => {
                            if (editingCompName.trim()) {
                              updateComplement(comp.id, {
                                name: editingCompName.trim(),
                                price: parseFloat(editingCompPrice) || 0
                              });
                            }
                            setEditingCompId(null);
                          }}
                          className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingCompId(null)}
                          className="p-1.5 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between flex-1 mr-4">
                        <span className="font-bold text-gray-800 text-sm">{comp.name}</span>
                        <span className={`text-sm font-bold ${comp.price > 0 ? 'text-orange-600 bg-orange-100/50 px-2 py-0.5 rounded-md' : 'text-gray-400'}`}>
                          {comp.price > 0 ? `+$${comp.price.toFixed(2)}` : 'Sin costo ($0)'}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingCompId(comp.id);
                          setEditingCompName(comp.name);
                          setEditingCompPrice(comp.price.toString());
                        }}
                        className="p-2 text-gray-500 hover:bg-white rounded-xl transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Eliminar el complemento "${comp.name}"?`)) {
                            deleteComplement(comp.id);
                          }
                        }}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-white rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
