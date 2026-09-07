/**
 * Hash sencillo (FNV-1a, dos pasadas con sal) para no guardar la contraseña
 * en texto plano dentro del navegador.
 */
function fnv1a(input: string, seed: number): string {
  let hash = seed >>> 0;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

const SALT = "egf·menu·2024";

export function hashPassword(password: string): string {
  return fnv1a(SALT + password, 0x811c9dc5) + fnv1a(password + SALT, 0x01000193);
}

export function isPasswordMatch(password: string, expectedHash: string): boolean {
  return hashPassword(password) === expectedHash;
}
