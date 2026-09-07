import type { Theme } from "../types";

export interface ThemePreset {
  id: string;
  name: string;
  theme: Theme;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "original",
    name: "Original",
    theme: { background: "#e7e6e2", text: "#161616", primary: "#c9a52e", secondary: "#c8691e" },
  },
  {
    id: "guacamole",
    name: "Guacamole",
    theme: { background: "#eaeee3", text: "#182418", primary: "#8fb339", secondary: "#e0a526" },
  },
  {
    id: "chile",
    name: "Chile rojo",
    theme: { background: "#f4ebe4", text: "#2a1410", primary: "#d9482b", secondary: "#f2b134" },
  },
  {
    id: "talavera",
    name: "Talavera",
    theme: { background: "#eef2f5", text: "#10233a", primary: "#f2b705", secondary: "#1f5fa8" },
  },
  {
    id: "rosa",
    name: "Rosa mexicano",
    theme: { background: "#f8eef3", text: "#2a1020", primary: "#e4007c", secondary: "#f5a623" },
  },
  {
    id: "cafe",
    name: "Café de olla",
    theme: { background: "#efe6da", text: "#2b1d14", primary: "#a5673f", secondary: "#5c3a21" },
  },
  {
    id: "piedra",
    name: "Piedra",
    theme: { background: "#f5f5f4", text: "#1c1917", primary: "#57534e", secondary: "#a8a29e" },
  },
  {
    id: "noche",
    name: "Noche",
    theme: { background: "#1d1b18", text: "#f2ede4", primary: "#e0b93a", secondary: "#c8691e" },
  },
];
