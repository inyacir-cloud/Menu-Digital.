import { useCallback, useState } from "react";
import { DEFAULT_PASSWORD } from "../data/menu";
import { hashPassword } from "../utils/hash";

const HASH_KEY = "egf-admin-hash-v1";
const SESSION_KEY = "egf-admin-session";

function storedHash(): string {
  try {
    return localStorage.getItem(HASH_KEY) ?? hashPassword(DEFAULT_PASSWORD);
  } catch {
    return hashPassword(DEFAULT_PASSWORD);
  }
}

export function useAdminAuth() {
  const [authed, setAuthed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [isDefaultPassword, setIsDefaultPassword] = useState<boolean>(
    () => storedHash() === hashPassword(DEFAULT_PASSWORD),
  );

  const login = useCallback((password: string): boolean => {
    if (hashPassword(password) !== storedHash()) return false;
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* sin almacenamiento de sesión: la sesión durará hasta recargar */
    }
    setAuthed(true);
    return true;
  }, []);

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignorar */
    }
    setAuthed(false);
  }, []);

  const changePassword = useCallback((current: string, next: string): string | null => {
    if (hashPassword(current) !== storedHash()) return "La contraseña actual no es correcta";
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
