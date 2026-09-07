import type { Settings } from "../types";
import { Blob } from "./Blob";
import { BrandLogo } from "./SombreroLogo";
import { PlusIcon, WhatsAppIcon } from "./icons";

interface Props {
  settings: Settings;
  onSecret: () => void;
}

export function Header({ settings, onSecret }: Props) {
  return (
    <header className="relative">
      <div className="grid grid-cols-1 md:grid-cols-[42%_1fr]">
        {/* Mancha mostaza con el logo dentro */}
        <div className="relative">
          <Blob className="w-[72vw] max-w-[420px] md:w-[110%] md:max-w-none" />
          <div className="absolute left-[4%] top-[4%] w-[40vw] max-w-[240px] md:left-[8%] md:top-[6%] md:w-[60%] md:max-w-none">
            <BrandLogo
              name={settings.name}
              tagline={settings.tagline}
              logo={settings.logo}
              onSecret={onSecret}
            />
          </div>
        </div>

        {/* Título */}
        <div className="px-5 pt-3 text-center md:px-4 md:pt-12 lg:pt-14">
          <h1 className="font-display text-[clamp(3.75rem,15vw,7.75rem)] leading-none tracking-[0.04em] text-ink">
            MENÚ
          </h1>
          {settings.welcome && (
            <p className="mt-2 -rotate-2 font-script text-[clamp(1.9rem,6.2vw,3.25rem)] font-bold leading-[1.05] text-ink md:mt-4">
              {settings.welcome}
            </p>
          )}

          {/* Instrucción de uso del menú digital */}
          <div className="mt-6 inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-ink/15 bg-surface/50 px-4 py-2 text-xs font-medium text-ink/80 backdrop-blur-sm md:mt-8 md:text-sm">
            <span>Toca</span>
            <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-mustard text-on-mustard shadow-sm">
              <PlusIcon className="h-3.5 w-3.5" />
            </span>
            <span>junto al precio para armar tu pedido y envíalo por</span>
            <span className="inline-flex items-center gap-1 font-bold text-wa-deep">
              <WhatsAppIcon className="h-4 w-4" /> WhatsApp
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
