import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import { supabase, hasSupabaseConfig } from '../lib/supabase';
import { AdminPanel } from './AdminPanel';

const allowedEmails = (import.meta.env.VITE_ADMIN_ALLOWED_EMAILS as string | undefined)
  ?.split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean) || [];

export function AdminGate() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const isAllowedEmail = (email?: string | null) => {
    if (!allowedEmails.length) return true;
    return Boolean(email && allowedEmails.includes(email.toLowerCase()));
  };

  useEffect(() => {
    if (!supabase || !hasSupabaseConfig) {
      setError('Configura Supabase para usar el inicio de sesión con Google.');
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const initializeSession = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (!mounted) return;

      if (sessionError) {
        setError('No se pudo comprobar la sesión de administrador.');
        setIsLoading(false);
        return;
      }

      const session = data.session;
      const email = session?.user.email || '';

      if (session && isAllowedEmail(email)) {
        setUserEmail(email);
        setIsAuthenticated(true);
        setError('');
      } else if (session && email) {
        setError('Tu cuenta no tiene acceso al panel de administración.');
        await supabase.auth.signOut();
      }

      setIsLoading(false);
    };

    void initializeSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      const email = session?.user.email || '';

      if (session && isAllowedEmail(email)) {
        setUserEmail(email);
        setIsAuthenticated(true);
        setError('');
      } else if (session && email) {
        setError('Tu cuenta no tiene acceso al panel de administración.');
        setIsAuthenticated(false);
        await supabase.auth.signOut();
      } else {
        setUserEmail('');
        setIsAuthenticated(false);
      }

      setIsLoading(false);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!supabase || !hasSupabaseConfig) {
      setError('Configura Supabase antes de iniciar sesión.');
      return;
    }

    setIsSigningIn(true);
    setError('');

    const redirectTo = `${window.location.origin}/admin`;
    const { error: loginError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (loginError) {
      setError(loginError.message || 'No se pudo iniciar sesión con Google.');
      setIsSigningIn(false);
      return;
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;

    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserEmail('');
    setError('');
    navigate('/');
  };

  const handleBackHome = () => {
    navigate('/');
  };

  if (isAuthenticated) {
    return <AdminPanel onBack={handleBackHome} onLogout={handleLogout} userEmail={userEmail} />;
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-gray-50 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-orange-100 border border-orange-100 p-6 sm:p-8 text-center">
          <p className="text-sm font-semibold text-gray-500">Comprobando acceso...</p>
        </div>
      </main>
    );
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
            <p className="text-sm text-gray-500 mt-1">Ingresa con Google para editar productos, categorías, horarios y mensajes.</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSigningIn}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-orange-200 transition-colors flex items-center justify-center gap-2"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
            <span>{isSigningIn ? 'Redirigiendo...' : 'Entrar con Google'}</span>
          </button>
        </form>

        <p className="text-[11px] text-gray-400 mt-5 leading-relaxed">
          Puedes limitar el acceso con <span className="font-semibold text-gray-500">VITE_ADMIN_ALLOWED_EMAILS</span>.
        </p>
      </div>
    </main>
  );
}