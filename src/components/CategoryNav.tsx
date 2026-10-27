import { useEffect, useRef, useState } from "react";
import type { MenuCategory } from "../types";
import { cn } from "../utils/cn";
import { NotificationCenter, type MenuNotification } from "./NotificationCenter";

interface Props {
  categories: MenuCategory[];
  notifications: MenuNotification[];
  onUseCoupon: (code: string) => void;
  onGoToCombos: () => void;
  onGoToWater: () => void;
  stickyOffset?: number;
  className?: string;
}

/** Barra pegajosa con accesos rápidos a cada categoría */
export function CategoryNav({
  categories,
  notifications,
  onUseCoupon,
  onGoToCombos,
  onGoToWater,
  stickyOffset = 0,
  className,
}: Props) {
  const [active, setActive] = useState<string>(categories[0]?.id ?? "");
  const [isSticky, setIsSticky] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const stickySentinelRef = useRef<HTMLSpanElement>(null);
  const bellSlotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sections = categories
      .map((c) => document.getElementById(c.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [categories]);

  useEffect(() => {
    const sentinel = stickySentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { rootMargin: `-${stickyOffset}px 0px 0px 0px`, threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [stickyOffset]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const updateScrollEdges = () => {
      setCanScrollLeft(list.scrollLeft > 1);
      setCanScrollRight(list.scrollLeft + list.clientWidth < list.scrollWidth - 1);
    };

    updateScrollEdges();
    list.addEventListener("scroll", updateScrollEdges, { passive: true });
    const resizeObserver = new ResizeObserver(updateScrollEdges);
    resizeObserver.observe(list);
    return () => {
      list.removeEventListener("scroll", updateScrollEdges);
      resizeObserver.disconnect();
    };
  }, [categories]);

  useEffect(() => {
    const list = listRef.current;
    const selected = list?.querySelector<HTMLElement>(`[data-category-id="${CSS.escape(active)}"]`);
    if (!list || !selected) return;

    const itemLeft = selected.offsetLeft;
    const itemRight = itemLeft + selected.offsetWidth;
    if (itemLeft < list.scrollLeft) {
      list.scrollTo({ left: itemLeft, behavior: "smooth" });
    } else if (itemRight > list.scrollLeft + list.clientWidth) {
      list.scrollTo({ left: itemRight - list.clientWidth, behavior: "smooth" });
    }
  }, [active]);

  if (categories.length === 0) return null;

  return (
    <>
      <span ref={stickySentinelRef} className="pointer-events-none block h-px -mb-px" aria-hidden="true" />
      <nav
        aria-label="Categorías del menú"
        className={cn(
          "sticky z-50 -mx-4 mb-2 flex min-w-0 items-center gap-1 bg-mustard px-2 py-2 sm:-mx-8 sm:px-4 md:-mx-14 md:px-6",
          className ?? "top-0",
        )}
      >
        <ul
          ref={listRef}
          className="no-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto whitespace-nowrap py-0.5"
          style={{
            maskImage: isSticky
              ? `linear-gradient(to right, ${canScrollLeft ? "transparent, black 2rem" : "black 0"}, black calc(100% - 1.5rem), ${canScrollRight ? "transparent" : "black"} 100%)`
              : "none",
            WebkitMaskImage: isSticky
              ? `linear-gradient(to right, ${canScrollLeft ? "transparent, black 2rem" : "black 0"}, black calc(100% - 1.5rem), ${canScrollRight ? "transparent" : "black"} 100%)`
              : "none",
          }}
        >
          {categories.map((c) => (
            <li key={c.id} className="shrink-0" data-category-id={c.id}>
              <a
                href={`#${c.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(c.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={cn(
                  "inline-block rounded-full border px-4 py-1.5 text-sm font-semibold transition",
                  active === c.id
                    ? "border-ink bg-ink text-paper"
                    : "border-ink/20 bg-white/35 text-ink hover:border-ink/50 hover:bg-white/60",
                )}
              >
                {c.title}
              </a>
            </li>
          ))}
        </ul>
        <div
          ref={bellSlotRef}
          className={cn("h-12 shrink-0 transition-[width] duration-300 ease-in-out motion-reduce:duration-0", isSticky ? "w-[60px]" : "w-0")}
          aria-hidden="true"
        />
        <NotificationCenter
          notifications={notifications}
          onUseCoupon={onUseCoupon}
          onGoToCombos={onGoToCombos}
          onGoToWater={onGoToWater}
          docked={isSticky}
          dockTargetRef={bellSlotRef}
        />
      </nav>
    </>
  );
}
