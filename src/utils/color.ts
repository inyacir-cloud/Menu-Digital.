import type { CSSProperties } from "react";
import type { Theme } from "../types";

const HEX6 = /^#[0-9a-f]{6}$/;

/** Permite escribir valores parciales mientras el usuario está tecleando, pero solo acepta hex completos cuando hay que guardar. */
export function isHexDraft(input: string): boolean {
  const s = input.trim();
  if (!s) return true;
  return /^#?[0-9a-fA-F]{0,6}$/.test(s);
}

/** Acepta "#abc", "abc", "#AABBCC", "aabbcc" → "#aabbcc"; null si no es válido */
export function normalizeHex(input: string): string | null {
  let s = input.trim().toLowerCase();
  if (!s) return null;
  if (!s.startsWith("#")) s = `#${s}`;
  if (/^#[0-9a-f]{3}$/.test(s)) s = `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
  return HEX6.test(s) ? s : null;
}

function toRgb(hex: string): [number, number, number] {
  const h = normalizeHex(hex) ?? "#000000";
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

function toHex(r: number, g: number, b: number): string {
  const c = (v: number) =>
    Math.round(Math.max(0, Math.min(255, v)))
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Mezcla `a` con `b` (t = 0 → a, t = 1 → b) */
export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = toRgb(a);
  const [r2, g2, b2] = toRgb(b);
  return toHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

/** Luminancia relativa (WCAG) */
export function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Relación de contraste (WCAG): 1 (igual) … 21 (negro / blanco) */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export function isLight(hex: string): boolean {
  return luminance(hex) > 0.35;
}

/** Oscurece (o aclara, en fondos oscuros) un color hasta que sea legible sobre `against` */
export function ensureContrast(color: string, against: string, min = 4.5): string {
  const towards = isLight(against) ? "#000000" : "#ffffff";
  let c = color;
  for (let i = 0; i < 12 && contrastRatio(c, against) < min; i++) c = mix(c, towards, 0.12);
  return c;
}

/** Variables CSS que usan las utilidades de Tailwind (bg-paper, text-ink, bg-mustard…) */
export function themeVars(t: Theme): Record<string, string> {
  const light = isLight(t.background);
  // Texto sobre el color principal: el que mejor contraste (con ligera preferencia por el fondo)
  const onPrimary =
    contrastRatio(t.primary, t.text) > contrastRatio(t.primary, t.background) * 1.15 ? t.text : t.background;

  return {
    "--color-paper": t.background,
    "--color-paper-dark": mix(t.background, "#000000", light ? 0.07 : 0.3),
    "--color-paper-light": mix(t.background, "#ffffff", light ? 0.6 : 0.06),
    "--color-surface": mix(t.background, "#ffffff", light ? 0.85 : 0.1),
    "--color-ink": t.text,
    "--color-mustard": t.primary,
    "--color-mustard-deep": mix(t.primary, "#000000", 0.16),
    "--color-mustard-ink": ensureContrast(t.primary, t.background),
    "--color-on-mustard": onPrimary,
    "--color-terracotta": t.secondary,
    "--color-terracotta-deep": mix(t.secondary, "#000000", 0.16),
  };
}

/** Para aplicar un tema a un subárbol concreto (p. ej. la vista previa) */
export function themeStyle(t: Theme): CSSProperties {
  return themeVars(t) as CSSProperties;
}

/** Aplica el tema a toda la página */
export function applyTheme(t: Theme): void {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(themeVars(t))) root.style.setProperty(key, value);
  root.classList.toggle("theme-dark", !isLight(t.background));
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", t.primary);
}
