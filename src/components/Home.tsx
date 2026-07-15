import { Utensils, Clock, MapPin, Phone, ShieldCheck, Share2, Check, MessageSquare } from 'lucide-react';
import { useMenu } from '../context/MenuContext';
import { useState } from 'react';
import { defaultWhatsAppShareMessage } from '../data';

interface HomeProps {
  onNavigateToMenu: () => void;
}

export function Home({ onNavigateToMenu }: HomeProps) {
  const { config, products, categories } = useMenu();
  const [copied, setCopied] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const businessName = config.name || 'Menu';

  const menuUrl = `${window.location.origin}/menu`;

  const buildWhatsAppShareMessage = () => {
    const template = config.socialMedia?.whatsappMessage || defaultWhatsAppShareMessage;
    return template
      .replaceAll('{businessName}', businessName)
      .replaceAll('{menuUrl}', menuUrl)
      .replaceAll('{phone}', `+${config.phone}`);
  };

  const handleShareMenu = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: businessName,
          text: `¡Hola! Conoce nuestro menú digital y haz tu pedido:`,
          url: menuUrl,
        });
        setShareFeedback('¡Menú compartido con éxito!');
        setTimeout(() => setShareFeedback(null), 3000);
      } catch (err) {
        // User cancelled or not allowed, fallback to clipboard
        fallbackCopy();
      }
    } else {
      fallbackCopy();
    }
  };

  const fallbackCopy = async () => {
    try {
      await navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      setShareFeedback('✓ ¡Enlace copiado al portapapeles!');
      setTimeout(() => {
        setCopied(false);
        setShareFeedback(null);
      }, 3000);
    } catch (err) {
      alert(`Enlace de tu menú digital: ${menuUrl}`);
    }
  };

  const shareViaWhatsApp = () => {
    const text = buildWhatsAppShareMessage();
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-gray-50 flex flex-col">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20 safe-top">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {config.logo ? (
              <img src={config.logo} alt={businessName} className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover shadow-md shrink-0 bg-white" />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black shadow-md shadow-orange-200 shrink-0">
                {businessName.charAt(0)}
              </div>
            )}
            <span className="font-bold text-gray-800 text-base sm:text-lg truncate">{businessName}</span>
          </div>

        </div>
      </div>

      {/* Hero Section */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-10 md:py-12 flex flex-col items-center text-center">
        {/* Business Status & Toggle */}
        <div className="w-full max-w-md bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="relative flex h-3.5 w-3.5 shrink-0">
                {config.isOpen && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${config.isOpen ? 'bg-green-500' : 'bg-red-500'}`}></span>
              </span>
              <div className="text-left min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estado</p>
                <p className={`font-bold text-sm sm:text-base leading-tight ${config.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                  {config.isOpen ? 'Recibiendo pedidos' : 'Cerrado'}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Title */}
        <div className="space-y-3 sm:space-y-4 max-w-2xl">
          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1]">
            Descubre nuestro <span className="text-orange-500 underline decoration-orange-300 decoration-wavy underline-offset-4">menú digital</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed px-2 sm:px-0">
            Explora la carta, personaliza tu pedido y haz tu orden por WhatsApp en segundos.
          </p>
        </div>

        {/* CTAs & Quick Tools */}
        <div className="mt-6 sm:mt-8 flex flex-col gap-3.5 w-full max-w-md">
          {/* Main Menu Button */}
          <button
            onClick={onNavigateToMenu}
            className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-orange-200 flex items-center justify-center gap-3 text-base sm:text-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Utensils className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>Ver Carta Menú Digital</span>
          </button>

          {/* Share Section */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-200/80 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700">
              <span className="flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-orange-500" />
                <span>Compartir menú con clientes</span>
              </span>
              <span className="text-green-600 text-[11px] font-semibold">Enlace público</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleShareMenu}
                className="w-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm transition-colors"
              >
                <Share2 className="w-3.5 h-3.5 text-gray-600" />
                <span>{copied ? '✓ Copiado' : 'Compartir / Copiar'}</span>
              </button>

              <button
                onClick={shareViaWhatsApp}
                className="w-full bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1da850] text-white font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm transition-colors shadow-sm"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Enviar por WhatsApp</span>
              </button>
            </div>

            {shareFeedback && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold text-center animate-fadeIn flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4 text-green-600 shrink-0" />
                <span>{shareFeedback}</span>
              </div>
            )}
          </div>
        </div>

        {/* Warning Banner if Closed */}
        {!config.isOpen && (
          <div className="mt-5 sm:mt-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 sm:px-6 py-3 rounded-xl text-xs sm:text-sm max-w-md">
            ⚠️ <strong>Aviso:</strong> El negocio está cerrado. Los clientes podrán explorar el menú, pero no enviar pedidos.
          </div>
        )}

        {/* Business Details Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full mt-8 sm:mt-12 text-left">
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-3">
            <div className="p-2 sm:p-2.5 bg-orange-50 rounded-xl text-orange-500 shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-gray-800 text-xs sm:text-sm">Horario</h4>
              <p className="text-xs text-gray-500 mt-0.5 truncate sm:whitespace-normal">{config.schedule || 'No especificado'}</p>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-3">
            <div className="p-2 sm:p-2.5 bg-orange-50 rounded-xl text-orange-500 shrink-0">
              <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-gray-800 text-xs sm:text-sm">WhatsApp</h4>
              <p className="text-xs text-gray-500 mt-0.5 font-mono truncate">+{config.phone}</p>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-3">
            <div className="p-2 sm:p-2.5 bg-orange-50 rounded-xl text-orange-500 shrink-0">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-gray-800 text-xs sm:text-sm">Ubicación</h4>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{config.address || 'Domicilio y recoger'}</p>
            </div>
          </div>
        </div>

        {/* Stats Preview */}
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:gap-8 text-xs sm:text-sm text-gray-400">
          <div><strong className="text-gray-700 font-bold">{categories.length}</strong> Categorías</div>
          <div className="hidden sm:inline">•</div>
          <div><strong className="text-gray-700 font-bold">{products.length}</strong> Productos</div>
          <div className="hidden sm:inline">•</div>
          <div className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-green-500" /> Pedidos Directos</div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-4 sm:py-6 px-4 text-center text-[11px] sm:text-xs text-gray-400 safe-bottom">
        <p>© {new Date().getFullYear()} {config.name} · Menú digital con pedidos por WhatsApp</p>
      </footer>

    </div>
  );
}
