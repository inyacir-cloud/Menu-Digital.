import type { MenuCategory, MenuItem } from "../types";
import { resolveImage } from "../data/menu";
import { cn } from "../utils/cn";
import { MenuItemRow } from "./MenuItemRow";
import { MenuItemCard } from "./MenuItemCard";
import { Sparkle } from "./Sparkle";

interface Props {
  category: MenuCategory;
  qtyOf: (itemId: string) => number;
  closed?: boolean;
  onQuickAdd: (item: MenuItem, category: MenuCategory) => void;
  onOpen: (item: MenuItem, category: MenuCategory) => void;
  onDecrement: (itemId: string) => void;
}

export function MenuSection({ category, qtyOf, closed, onQuickAdd, onOpen, onDecrement }: Props) {
  const imageLeft = category.imageSide === "left";
  const image = resolveImage(category.image);
  const blend = category.blend !== false;
  const grid = category.layout === "grid";

  const itemProps = (item: MenuItem) => ({
    item,
    qty: qtyOf(item.id),
    closed,
    onQuickAdd: () => onQuickAdd(item, category),
    onOpen: () => onOpen(item, category),
    onDecrement: () => onDecrement(item.id),
  });

  return (
    <section id={category.id} className="scroll-mt-24" aria-labelledby={`${category.id}-title`}>
      <div className={cn("grid items-center gap-2", image && "md:grid-cols-2 md:gap-8 lg:gap-12")}>
        {/* Contenido */}
        <div className={cn("order-2 md:order-1", imageLeft && "md:order-2")}>
          <header>
            <h2
              id={`${category.id}-title`}
              className="text-[1.9rem] font-bold tracking-tight text-ink sm:text-4xl"
            >
              {category.title}
            </h2>
            <span className="mt-1 block h-1 w-10 rounded-full bg-mustard" aria-hidden="true" />
            {category.description && (
              <p className="mt-2 text-sm text-ink/60 sm:text-[0.95rem]">{category.description}</p>
            )}
          </header>

          {category.items.length === 0 ? (
            <p className="mt-3 text-ink/55">Próximamente…</p>
          ) : grid ? (
            <ul
              className={cn(
                "mt-3 grid grid-cols-2 gap-2 sm:gap-3",
                !image && "md:grid-cols-3 lg:grid-cols-4",
              )}
            >
              {category.items.map((item) => (
                <MenuItemCard key={item.id} {...itemProps(item)} />
              ))}
            </ul>
          ) : (
            <ul className="mt-2 space-y-0.5 sm:pl-4 md:mt-3 md:pl-6">
              {category.items.map((item) => (
                <MenuItemRow key={item.id} {...itemProps(item)} />
              ))}
            </ul>
          )}

        </div>

        {/* Foto */}
        {image && (
          <div className={cn("order-1 md:order-2", imageLeft && "md:order-1")}>
            <div className="relative mx-auto w-[72%] max-w-[300px] sm:w-[60%] md:w-[92%] md:max-w-[420px]">
              <Sparkle
                className={cn(
                  "absolute -top-4 z-10 md:-top-6",
                  imageLeft ? "-left-6 -scale-x-100 md:-left-10" : "-right-6 md:-right-10",
                )}
              />
              <img
                src={image}
                alt={category.imageAlt ?? category.title}
                loading="lazy"
                decoding="async"
                className={cn(
                  "aspect-square w-full object-cover transition-transform duration-500 ease-out hover:rotate-1 hover:scale-[1.04]",
                  blend
                    ? "food-photo"
                    : "rounded-[2rem] shadow-[0_24px_40px_-20px_rgba(0,0,0,0.5)] ring-4 ring-white/70",
                )}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
