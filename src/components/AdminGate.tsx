import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, KeyRound, Mail, ShieldCheck } from 'lucide-react';
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
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  const isAllowedEmail = (email?: string | null) => {
    if (!allowedEmails.length) return true;
    return Boolean(email && allowedEmails.includes(email.toLowerCase()));
  };

  useEffect(() => {
    if (!supabase || !hasSupabaseConfig) {
      setError('Configura Supabase para usar el acceso por correo.');
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const syncSession = async () => {
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
        setIsRecoveryMode(false);
        setError('');
        setInfo('');
      } else if (session && email) {
        setError('Tu correo no tiene acceso al panel de administración.');
        await supabase.auth.signOut();
      }

      setIsLoading(false);
    };

    void syncSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      const email = session?.user.email || '';

      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
        setUserEmail(email);
        setError('');
        setInfo('Crea una nueva contraseña para terminar la recuperación.');
        setIsLoading(false);
        return;
      }

      if (session && isAllowedEmail(email)) {
        setUserEmail(email);
        setIsAuthenticated(true);
        setIsRecoveryMode(false);
        setError('');
        setInfo('');
      } else if (session && email) {
        setError('Tu correo no tiene acceso al panel de administración.');
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

    const trimmedEmail = emailInput.trim().toLowerCase();
    const trimmedPassword = passwordInput.trim();

    if (!trimmedEmail) {
      setError('Escribe tu correo electrónico.');
      return;
    }

    if (!trimmedEmail.includes('@')) {
      setError('Escribe un correo válido.');
      return;
    }

    if (!isAllowedEmail(trimmedEmail)) {
      setError('Tu correo no tiene acceso al panel de administración.');
      return;
    }

    if (!trimmedPassword) {
      setError('Escribe la contraseña.');
      return;
    }

    setError('');
    setInfo('');
    setIsSigningIn(true);

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: trimmedPassword,
    });

    if (loginError) {
      setError(loginError.message || 'No se pudo iniciar sesión.');
      setIsSigningIn(false);
      return;
    }

    const sessionEmail = data.user?.email || trimmedEmail;

    if (!isAllowedEmail(sessionEmail)) {
      setError('Tu correo no tiene acceso al panel de administración.');
      await supabase.auth.signOut();
      setIsSigningIn(false);
      return;
    }

    setUserEmail(sessionEmail);
    setIsAuthenticated(true);
    setIsSigningIn(false);
  };

  const handleSendReset = async () => {
    if (!supabase || !hasSupabaseConfig) {
      setError('Configura Supabase antes de enviar el correo de recuperación.');
      return;
    }

    const trimmedEmail = emailInput.trim().toLowerCase();

    if (!trimmedEmail) {
      setError('Escribe tu correo electrónico.');
      return;
    }

    if (!trimmedEmail.includes('@')) {
      setError('Escribe un correo válido.');
      return;
    }

    if (!isAllowedEmail(trimmedEmail)) {
      setError('Tu correo no tiene acceso al panel de administración.');
      return;
    }

    setError('');
    setInfo('');
    setIsSendingReset(true);

    const redirectTo = `${window.location.origin}/admin`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo,
    });

    if (resetError) {
      setError(resetError.message || 'No se pudo enviar el correo de recuperación.');
      setIsSendingReset(false);
      return;
    }

    setInfo('Te enviamos un correo para crear una nueva contraseña.');
    setIsSendingReset(false);
  };

  const handleUpdatePassword = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!supabase || !hasSupabaseConfig) {
      setError('Configura Supabase antes de actualizar la contraseña.');
      return;
    }

    if (!newPasswordInput.trim()) {
      setError('Escribe la nueva contraseña.');
      return;
    }

    if (newPasswordInput.trim().length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPasswordInput.trim() !== confirmNewPasswordInput.trim()) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setError('');
    setInfo('');
    setIsResettingPassword(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPasswordInput.trim(),
    });

    if (updateError) {
      setError(updateError.message || 'No se pudo actualizar la contraseña.');
      setIsResettingPassword(false);
      return;
    }

    setIsRecoveryMode(false);
    setNewPasswordInput('');
    setConfirmNewPasswordInput('');
    setInfo('Contraseña actualizada. Ya puedes entrar con tu correo y la nueva clave.');
    setIsResettingPassword(false);
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
            <p className="text-sm text-gray-500 mt-1">
              Entra con tu correo y contraseña, o recupera acceso por email.
            </p>
          </div>
        </div>

        <form onSubmit={isRecoveryMode ? handleUpdatePassword : handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={emailInput}
                onChange={(event) => setEmailInput(event.target.value)}
                autoComplete="email"
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 focus:border-orange-500 outline-none text-sm"
                placeholder="tu-correo@ejemplo.com"
              />
            </div>
          </div>

          {!isRecoveryMode ? (
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(event) => setPasswordInput(event.target.value)}
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
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPasswordInput}
                    onChange={(event) => setNewPasswordInput(event.target.value)}
                    autoComplete="new-password"
                    className="w-full pl-11 pr-12 py-3.5 rounded-2xl border border-gray-200 focus:border-orange-500 outline-none text-sm"
                    placeholder="Escribe la nueva contraseña"
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

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmNewPasswordInput}
                    onChange={(event) => setConfirmNewPasswordInput(event.target.value)}
                    autoComplete="new-password"
                    className="w-full pl-11 pr-12 py-3.5 rounded-2xl border border-gray-200 focus:border-orange-500 outline-none text-sm"
                    placeholder="Repite la nueva contraseña"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isSigningIn || isSendingReset || isResettingPassword}
            className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-500 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <span>
              {isRecoveryMode
                ? isResettingPassword
                  ? 'Actualizando...'
                  : 'Guardar nueva contraseña'
                : isSigningIn
                  ? 'Entrando...'
                  : 'Entrar con correo'}
            </span>
          </button>

          {!isRecoveryMode && (
            <button
              type="button"
              onClick={handleSendReset}
              disabled={isSendingReset}
              className="w-full bg-orange-50 hover:bg-orange-100 disabled:bg-orange-50 text-orange-700 font-bold py-3.5 rounded-2xl border border-orange-200 transition-colors"
            >
              {isSendingReset ? 'Enviando correo...' : 'Olvidé mi contraseña'}
            </button>
          )}

          {isRecoveryMode && (
            <button
              type="button"
              onClick={() => {
                setIsRecoveryMode(false);
                setNewPasswordInput('');
                setConfirmNewPasswordInput('');
                setInfo('');
              }}
              className="w-full bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold py-3.5 rounded-2xl border border-orange-200 transition-colors"
            >
              Volver al inicio de sesión
            </button>
          )}

          {info && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 text-sm px-4 py-3 font-medium">
              {info}
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3 font-medium">
              {error}
            </div>
          )}
        </form>

        <p className="text-[11px] text-gray-400 mt-5 leading-relaxed">
          Puedes limitar el acceso con <span className="font-semibold text-gray-500">VITE_ADMIN_ALLOWED_EMAILS</span>. La contraseña se maneja en Supabase Auth.
        </p>
      </div>
    </main>
  );
}