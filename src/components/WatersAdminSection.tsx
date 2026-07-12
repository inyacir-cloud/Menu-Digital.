import { useState } from 'react';
import { Plus, Edit2, Trash2, Check, Droplets, ToggleLeft, ToggleRight } from 'lucide-react';
import { Product, Category, SizeOption } from '../types';

interface WatersAdminSectionProps {
  products: Product[];
  categories: Category[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
}

export function WatersAdminSection({ products, categories, addProduct, updateProduct, deleteProduct }: WatersAdminSectionProps) {
  const drinksCatId = categories.find(c => c.name.toLowerCase().includes('bebi') || c.name.toLowerCase().includes('agua'))?.id || categories[0]?.id || '3';
  const waterProducts = products.filter(p => p.isDailyWater);

  // Form states
  const [newWaterName, setNewWaterName] = useState('');
  const [newWaterDesc, setNewWaterDesc] = useState('');
  const [newPriceLitro, setNewPriceLitro] = useState('35');
  const [newPriceMedio, setNewPriceMedio] = useState('25');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriceLitro, setEditPriceLitro] = useState('');
  const [editPriceMedio, setEditPriceMedio] = useState('');

  const handleAddWater = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWaterName.trim()) return;

    const sizes: SizeOption[] = [
      { name: 'Litro', price: parseFloat(newPriceLitro) || 35 },
      { name: 'Medio Litro', price: parseFloat(newPriceMedio) || 25 },
    ];

    addProduct({
      name: newWaterName.trim(),
      description: newWaterDesc.trim() || 'Agua fresca preparada artesanalmente.',
      price: sizes[0].price,
      categoryId: drinksCatId,
      image: '/Logo.png',
      isDailyWater: true,
      isAvailable: true,
      complementIds: [],
      sizes,
    });

    setNewWaterName('');
    setNewWaterDesc('');
    setNewPriceLitro('35');
    setNewPriceMedio('25');
  };

  const handleStartEdit = (p: Product) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditDesc(p.description || '');
    const litroSize = p.sizes?.find(s => s.name.toLowerCase().includes('litro') && !s.name.toLowerCase().includes('medio'));
    const medioSize = p.sizes?.find(s => s.name.toLowerCase().includes('medio'));
    setEditPriceLitro(litroSize?.price.toString() || p.price.toString());
    setEditPriceMedio(medioSize?.price.toString() || '25');
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    const litroPrice = parseFloat(editPriceLitro) || 35;
    const medioPrice = parseFloat(editPriceMedio) || 25;

    updateProduct(id, {
      name: editName.trim(),
      description: editDesc.trim(),
      price: litroPrice,
      isDailyWater: true,
      sizes: [
        { name: 'Litro', price: litroPrice },
        { name: 'Medio Litro', price: medioPrice },
      ],
    });
    setEditingId(null);
  };

  const toggleAvailability = (p: Product) => {
    updateProduct(p.id, { isAvailable: p.isAvailable === false ? true : false, isDailyWater: true });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Add Form */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-3xl p-5 sm:p-6 shadow-lg text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shrink-0">
            <Droplets className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg">Agregar Agua / Sabor del Día</h3>
            <p className="text-blue-100 text-xs mt-0.5">Se crea sin complementos y con precios Litro / Medio Litro</p>
          </div>
        </div>

        <form onSubmit={handleAddWater} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-5">
              <input
                type="text"
                value={newWaterName}
                onChange={(e) => setNewWaterName(e.target.value)}
                placeholder="Ej: Agua de Horchata"
                className="w-full px-3 py-2.5 rounded-xl border-0 focus:ring-2 focus:ring-white/50 outline-none text-sm font-medium text-gray-900"
                required
              />
            </div>
            <div className="sm:col-span-4">
              <input
                type="text"
                value={newWaterDesc}
                onChange={(e) => setNewWaterDesc(e.target.value)}
                placeholder="Descripción (opcional)"
                className="w-full px-3 py-2.5 rounded-xl border-0 focus:ring-2 focus:ring-white/50 outline-none text-xs text-gray-900"
              />
            </div>
            <div className="sm:col-span-3 flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-blue-100 mb-0.5">Litro $</label>
                <input
                  type="number"
                  step="0.5"
                  value={newPriceLitro}
                  onChange={(e) => setNewPriceLitro(e.target.value)}
                  className="w-full px-2 py-2.5 rounded-xl border-0 outline-none text-sm font-bold text-blue-900 text-center"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-blue-100 mb-0.5">½ Litro $</label>
                <input
                  type="number"
                  step="0.5"
                  value={newPriceMedio}
                  onChange={(e) => setNewPriceMedio(e.target.value)}
                  className="w-full px-2 py-2.5 rounded-xl border-0 outline-none text-sm font-bold text-blue-900 text-center"
                  required
                />
              </div>
              <button
                type="submit"
                title="Agregar"
                className="h-[42px] bg-white/20 hover:bg-white/30 text-white font-bold px-4 rounded-xl shadow-md transition-colors shrink-0 flex items-center justify-center"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Waters List */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-500" />
            <span>Sabores Registrados ({waterProducts.length})</span>
          </h4>
          <span className="text-[11px] text-gray-400">Interruptor para ocultar hoy</span>
        </div>

        {waterProducts.length === 0 ? (
          <div className="text-center py-10">
            <Droplets className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold text-sm">No hay aguas registradas</p>
            <p className="text-xs text-gray-400 mt-1">Agrega la primera usando el formulario de arriba</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {waterProducts.map((p) => {
              const isAvailable = p.isAvailable !== false;
              const isEditing = editingId === p.id;

              return (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isAvailable
                      ? 'bg-white border-blue-100 shadow-sm'
                      : 'bg-gray-50 border-gray-200/60 opacity-65'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Nombre del sabor"
                        className="w-full px-3 py-2 rounded-xl border border-blue-500 text-sm font-bold bg-white"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Descripción breve"
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Precio Litro ($)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={editPriceLitro}
                            onChange={(e) => setEditPriceLitro(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-blue-500 text-sm font-bold text-blue-700 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">½ Litro ($)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={editPriceMedio}
                            onChange={(e) => setEditPriceMedio(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-blue-500 text-sm font-bold text-blue-700 bg-white"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button type="button" onClick={() => setEditingId(null)}
                          className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold"
                        >
                          Cancelar
                        </button>
                        <button type="button" onClick={() => handleSaveEdit(p.id)}
                          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" /> Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => toggleAvailability(p)}
                          title={isAvailable ? 'Desactivar por hoy' : 'Activar por hoy'}
                          className={`p-1 rounded-xl transition-colors shrink-0 ${
                            isAvailable ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          {isAvailable ? <ToggleRight className="w-8 h-8 text-green-500" /> : <ToggleLeft className="w-8 h-8 text-gray-400" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className={`font-bold text-sm truncate ${isAvailable ? 'text-gray-900' : 'text-gray-500 line-through'}`}>
                              {p.name}
                            </h5>
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{p.description || 'Agua fresca artesanal'}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            {p.sizes && p.sizes.length > 0 ? (
                              p.sizes.map((s, i) => (
                                <span key={i} className={`text-xs font-extrabold ${isAvailable ? 'text-blue-600' : 'text-gray-400'}`}>
                                  {s.name} ${s.price.toFixed(2)}
                                </span>
                              ))
                            ) : (
                              <span className={`text-xs font-extrabold ${isAvailable ? 'text-blue-600' : 'text-gray-400'}`}>
                                ${p.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                          }`}>
                            {isAvailable ? '🟢 Visible en carta' : '🔴 Oculta hoy'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(p)}
                          title="Editar"
                          className="p-2 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-gray-600 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { if (window.confirm(`¿Eliminar "${p.name}"?`)) deleteProduct(p.id); }}
                          title="Eliminar"
                          className="p-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-xl text-gray-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
