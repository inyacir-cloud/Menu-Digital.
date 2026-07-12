import { useState } from 'react';
import { X, Plus, Edit2, Trash2, Check, Droplets, ToggleLeft, ToggleRight } from 'lucide-react';
import { useMenu } from '../context/MenuContext';
import { Product, SizeOption } from '../types';

interface WatersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WatersModal({ isOpen, onClose }: WatersModalProps) {
  const { products, addProduct, updateProduct, deleteProduct, categories } = useMenu();

  // Find drinks category
  const drinksCatId = categories.find(c => c.name.toLowerCase().includes('bebi') || c.name.toLowerCase().includes('agua'))?.id || categories[0]?.id || '3';

  // Filter existing water products
  const waterProducts = products.filter(p => p.isDailyWater || (p.categoryId === drinksCatId && (p.name.toLowerCase().includes('agua') || p.name.toLowerCase().includes('limonada') || p.name.toLowerCase().includes('fresca') || p.name.toLowerCase().includes('horchata') || p.name.toLowerCase().includes('jamaica'))));

  // Form states for adding new water
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

  if (!isOpen) return null;

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
      price: sizes[0].price, // Default base price is Litro
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
    setEditDesc(p.description);
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
    const nextState = p.isAvailable === false ? true : false;
    updateProduct(p.id, { isAvailable: nextState, isDailyWater: true });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 animate-fadeIn" onClick={onClose}>
      <div 
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col animate-slideUp sm:animate-fadeIn" 
        style={{ maxHeight: '92dvh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-white">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shrink-0">
              <Droplets className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg sm:text-xl leading-tight">Editar Aguas y Sabores del Día</h3>
              <p className="text-blue-100 text-xs mt-0.5">Precios: Litro $35 · Medio Litro $25</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="p-2 bg-black/20 hover:bg-black/30 rounded-full transition-colors shrink-0">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 slim-scrollbar">
          
          {/* Quick Add Form */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 shadow-sm">
            <h4 className="font-bold text-gray-800 text-sm mb-1 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Agregar nueva agua / sabor</span>
            </h4>
            <p className="text-xs text-gray-500 mb-3">Se agregará automáticamente con precio de Litro y Medio Litro.</p>

            <form onSubmit={handleAddWater} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    value={newWaterName}
                    onChange={(e) => setNewWaterName(e.target.value)}
                    placeholder="Ej: Agua de Horchata"
                    className="w-full px-3 py-2.5 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm bg-white font-medium"
                    required
                  />
                </div>
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    value={newWaterDesc}
                    onChange={(e) => setNewWaterDesc(e.target.value)}
                    placeholder="Descripción (opcional)"
                    className="w-full px-3 py-2.5 rounded-xl border border-blue-200 focus:border-blue-500 outline-none text-xs bg-white"
                  />
                </div>
                
                {/* Price inputs side by side */}
                <div className="sm:col-span-3 flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-gray-500 mb-0.5">1 Litro $</label>
                    <input
                      type="number"
                      step="0.5"
                      value={newPriceLitro}
                      onChange={(e) => setNewPriceLitro(e.target.value)}
                      className="w-full px-2 py-2.5 rounded-xl border border-blue-200 focus:border-blue-500 outline-none text-sm font-bold text-blue-700 bg-white text-center"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-gray-500 mb-0.5">½ Litro $</label>
                    <input
                      type="number"
                      step="0.5"
                      value={newPriceMedio}
                      onChange={(e) => setNewPriceMedio(e.target.value)}
                      className="w-full px-2 py-2.5 rounded-xl border border-blue-200 focus:border-blue-500 outline-none text-sm font-bold text-blue-700 bg-white text-center"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    title="Agregar"
                    className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold px-3 py-2.5 rounded-xl shadow-md shadow-blue-200 flex items-center justify-center transition-colors shrink-0"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Current Waters List */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-gray-800 text-sm">
                Sabores registrados ({waterProducts.length})
              </h4>
              <span className="text-[11px] text-gray-400">Interruptor para ocultar las que no sirves hoy</span>
            </div>

            {waterProducts.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-6">
                <Droplets className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-600 text-sm font-semibold">No hay aguas registradas</p>
                <p className="text-xs text-gray-400 mt-1">Agrega tu primer agua usando el formulario de arriba</p>
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
                          ? 'bg-white border-gray-200 shadow-sm'
                          : 'bg-gray-50 border-gray-200/60 opacity-65'
                      }`}
                    >
                      {isEditing ? (
                        /* Edit Form */
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
                              <label className="block text-[10px] font-bold text-gray-500 mb-1">Precio Medio Litro ($)</label>
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
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(p.id)}
                              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Guardar</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* View Mode */
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
                              {/* Show size prices */}
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
                              onClick={() => {
                                if (window.confirm(`¿Eliminar "${p.name}"?`)) deleteProduct(p.id);
                              }}
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

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center safe-bottom shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3.5 rounded-2xl text-sm transition-colors shadow-md"
          >
            Listo · Cerrar ventana
          </button>
        </div>
      </div>
    </div>
  );
}
