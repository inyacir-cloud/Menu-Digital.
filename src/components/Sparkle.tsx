import { cn } from "../utils/cn";

/** Trazos de énfasis dibujados a mano, como en el menú impreso */
export function Sparkle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 70"
      aria-hidden="true"
      className={cn("h-12 w-14 text-ink md:h-16 md:w-20", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="6"
      strokeLinecap="round"
    >
      <path d="M8 40 C14 34 18 30 24 26" />
      <path d="M36 8 C37 16 38 22 38 30" />
      <path d="M70 22 C62 26 56 30 50 34" />
      <path d="M58 56 C66 54 72 52 76 50" strokeWidth="5" />
    </svg>
  );
}
