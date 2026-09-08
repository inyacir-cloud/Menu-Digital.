import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_PASSWORD, LEGACY_DEFAULT_PASSWORD } from "../data/menu";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { hashPassword, isPasswordMatch } from "../utils/hash";

const HASH_KEY = "egf-admin-hash-v1";
const SESSION_KEY = "egf-admin-session";

function storedHash(): string {
  try {
    const saved = localStorage.getItem(HASH_KEY);
    if (saved) return saved;
  } catch {
    // ignorar y usar la contraseña por defecto
  }

  return hashPassword(DEFAULT_PASSWORD);
}

function hasStoredHash(): boolean {
  try {
    return Boolean(localStorage.getItem(HASH_KEY));
  } catch {
    return false;
  }
}

function isValidStoredPassword(password: string): boolean {
  return isPasswordMatch(password, storedHash())
    || (!hasStoredHash() && password === LEGACY_DEFAULT_PASSWORD);
}

export function useAdminAuth() {
  const emailRef = useRef<string | null>(null);
  const [authed, setAuthed] = useState<boolean>(() => {
    if (isSupabaseConfigured) return false;
    try {
      return sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [isDefaultPassword, setIsDefaultPassword] = useState<boolean>(
    () => !isSupabaseConfigured && storedHash() === hashPassword(DEFAULT_PASSWORD),
  );

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setAuthed(Boolean(data.session?.user));
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(Boolean(session?.user));
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error || !data.user) return false;
      emailRef.current = data.user.email ?? email.trim();
      setIsDefaultPassword(false);
      setAuthed(true);
      return true;
    }

    if (!isValidStoredPassword(password)) return false;

    try {
      const nextHash = hashPassword(password);
      const currentHash = storedHash();

      if (!localStorage.getItem(HASH_KEY) || currentHash !== nextHash) {
        localStorage.setItem(HASH_KEY, nextHash);
      }
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* sin almacenamiento de sesión: la sesión durará hasta recargar */
    }
    setAuthed(true);
    return true;
  }, []);

  const logout = useCallback(() => {
    if (isSupabaseConfigured) {
      void supabase.auth.signOut();
      setAuthed(false);
      return;
    }
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignorar */
    }
    setAuthed(false);
  }, []);

  const changePassword = useCallback(async (current: string, next: string): Promise<string | null> => {
    if (isSupabaseConfigured) {
      if (next.trim().length < 6) return "La nueva contraseña debe tener al menos 6 caracteres";
      const email = emailRef.current;
      if (!email) return "Inicia sesión nuevamente para cambiar la contraseña";
      const verified = await supabase.auth.signInWithPassword({ email, password: current });
      if (verified.error) return "La contraseña actual no es correcta";
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) return error.message;
      setIsDefaultPassword(false);
      return null;
    }

    if (!isValidStoredPassword(current)) return "La contraseña actual no es correcta";
    if (next.trim().length < 6) return "La nueva contraseña debe tener al menos 6 caracteres";
    try {
      localStorage.setItem(HASH_KEY, hashPassword(next));
    } catch {
      return "No se pudo guardar la nueva contraseña";
    }
    setIsDefaultPassword(next === DEFAULT_PASSWORD);
    return null;
  }, []);

  return { authed, isDefaultPassword, login, logout, changePassword };
}

export type AdminAuth = ReturnType<typeof useAdminAuth>;
