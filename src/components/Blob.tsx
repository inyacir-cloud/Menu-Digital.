import { cn } from "../utils/cn";

interface BlobProps {
  /** Gira la figura 180° para la esquina inferior derecha */
  flip?: boolean;
  className?: string;
}

/**
 * Mancha orgánica mostaza con borde terracota, igual que en el menú impreso.
 * Sin altura fija: la calcula a partir del viewBox para conservar la proporción.
 */
export function Blob({ flip = false, className }: BlobProps) {
  return (
    <svg
      viewBox="0 0 480 380"
      aria-hidden="true"
      className={cn("pointer-events-none block h-auto select-none", flip && "rotate-180", className)}
    >
      <path
        className="fill-terracotta"
        d="M0 0H452C482 55 440 92 445 134C450 176 378 188 342 220C310 248 326 282 266 304C209 326 134 316 76 346C56 356 24 372 0 374Z"
      />
      <path
        className="fill-mustard"
        d="M0 0H410C440 50 400 85 405 125C410 165 340 175 305 205C275 232 290 262 235 282C180 302 110 290 55 318C35 328 15 340 0 342Z"
      />
    </svg>
  );
}
