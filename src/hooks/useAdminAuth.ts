import { useCallback, useState } from "react";
import { DEFAULT_PASSWORD, LEGACY_DEFAULT_PASSWORD } from "../data/menu";
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

function isValidStoredPassword(password: string): boolean {
  const currentHash = storedHash();
  return isPasswordMatch(password, currentHash)
    || (currentHash === hashPassword(LEGACY_DEFAULT_PASSWORD) && isPasswordMatch(password, hashPassword(LEGACY_DEFAULT_PASSWORD)))
    || isPasswordMatch(password, hashPassword(DEFAULT_PASSWORD));
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
    if (!isValidStoredPassword(password)) return false;

    try {
      const nextHash = hashPassword(password);
      const legacyHash = hashPassword(LEGACY_DEFAULT_PASSWORD);
      const currentHash = storedHash();

      if (currentHash === legacyHash && password === DEFAULT_PASSWORD) {
        localStorage.setItem(HASH_KEY, nextHash);
      }

      if (!localStorage.getItem(HASH_KEY) || currentHash === legacyHash) {
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
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignorar */
    }
    setAuthed(false);
  }, []);

  const changePassword = useCallback((current: string, next: string): string | null => {
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
