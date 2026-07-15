import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import { AdminPanel } from './AdminPanel';

const ADMIN_SESSION_KEY = 'whatsapp-food-admin-auth';
const ADMIN_PASSWORD = (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined)?.trim() || 'admin123';

export function AdminGate() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();

    if (password.trim() !== ADMIN_PASSWORD) {
      setError('Contraseña incorrecta.');
      return;
    }

    sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    setIsAuthenticated(true);
    setPassword('');
    setError('');
  };

  const handleBackHome = () => {
    navigate('/');
  };

  if (isAuthenticated) {
    return <AdminPanel onBack={handleBackHome} />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-orange-100 border border-orange-100 p-6 sm:p-8">
        <button
          type="button"
          onClick={handleBackHome}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </button>

        <div className="flex items-start gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-200 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-500">Acceso restringido</p>
            <h1 className="text-2xl font-extrabold text-gray-900">Panel de Administración</h1>
            <p className="text-sm text-gray-500 mt-1">Ingresa la contraseña para editar productos, categorías, horarios y mensajes.</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Contraseña de administrador
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="w-full pl-11 pr-12 py-3.5 rounded-2xl border border-gray-200 focus:border-orange-500 outline-none text-sm"
                placeholder="Escribe la contraseña"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-700"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-orange-200 transition-colors"
          >
            Entrar al panel
          </button>
        </form>

        <p className="text-[11px] text-gray-400 mt-5 leading-relaxed">
          La contraseña se configura con <span className="font-semibold text-gray-500">VITE_ADMIN_PASSWORD</span>.
        </p>
      </div>
    </main>
  );
}