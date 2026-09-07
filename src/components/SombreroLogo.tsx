import { useRef } from "react";
import { cn } from "../utils/cn";

/** Sombrero ilustrado (logo por defecto) */
function SombreroArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 130" className={className} aria-hidden="true">
      {/* Ala */}
      <ellipse cx="120" cy="98" rx="116" ry="28" fill="#e39a12" />
      <ellipse cx="120" cy="95" rx="116" ry="26" fill="#f2b21b" />
      <ellipse cx="120" cy="95" rx="106" ry="20" fill="none" stroke="#2f8f3b" strokeWidth="4" strokeDasharray="7 7" />
      <ellipse cx="120" cy="95" rx="96" ry="15" fill="#f7c33a" />
      {/* Copa */}
      <path d="M76 94 C80 52 92 14 120 12 C148 14 160 52 164 94 Z" fill="#f7c33a" />
      <path d="M76 94 C80 52 92 14 120 12 C104 24 100 60 98 94 Z" fill="#e9ab1c" opacity="0.6" />
      {/* Banda roja con zigzag */}
      <path d="M78 70 Q120 86 162 70 L164 82 Q120 98 76 82 Z" fill="#c62828" />
      <path
        d="M82 76 l6 -4 6 4 6 -4 6 4 6 -4 6 4 6 -4 6 4 6 -4 6 4 6 -4 6 4 4 -3"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Pompones */}
      <circle cx="30" cy="112" r="4" fill="#c62828" />
      <circle cx="70" cy="119" r="4" fill="#fff" />
      <circle cx="120" cy="122" r="4" fill="#2f8f3b" />
      <circle cx="170" cy="119" r="4" fill="#fff" />
      <circle cx="210" cy="112" r="4" fill="#c62828" />
    </svg>
  );
}

interface BrandLogoProps {
  name: string;
  tagline: string;
  /** Imagen del logo subida desde el panel (opcional) */
  logo?: string;
  /** Se dispara al tocar el logo 5 veces seguidas (acceso oculto) */
  onSecret?: () => void;
  className?: string;
  artClassName?: string;
}

/** Logo del negocio: imagen subida o sombrero + nombre por defecto */
export function BrandLogo({ name, tagline, logo, onSecret, className, artClassName }: BrandLogoProps) {
  const taps = useRef<number[]>([]);

  const handleTap = () => {
    if (!onSecret) return;
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 2000), now];
    if (taps.current.length >= 5) {
      taps.current = [];
      onSecret();
    }
  };

  const parts = name.split(/\s*&\s*/);

  return (
    <div
      className={cn("flex cursor-default select-none flex-col items-center text-center", className)}
      onClick={handleTap}
      role="presentation"
    >
      {logo ? (
        <img
          src={logo}
          alt={`Logo de ${name}`}
          className={cn("max-h-44 w-auto max-w-full object-contain drop-shadow-md sm:max-h-56", artClassName)}
        />
      ) : (
        <>
          <SombreroArt className={cn("w-[58%] max-w-[150px] drop-shadow-sm", artClassName)} />
          <h2 className="mt-1 font-display text-[clamp(1.2rem,4.4vw,1.75rem)] leading-[1.05] tracking-tight text-ink">
            {parts.length === 2 ? (
              <>
                {parts[0]} &amp;
                <br />
                {parts[1]}
              </>
            ) : (
              name
            )}
          </h2>
        </>
      )}
      {tagline && !logo && (
        <p className="mt-1 text-[clamp(0.5rem,1.6vw,0.7rem)] font-semibold uppercase tracking-[0.32em] text-ink/85">
          {tagline}
        </p>
      )}
    </div>
  );
}
