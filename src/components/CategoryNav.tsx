import { useEffect, useState } from "react";
import type { MenuCategory } from "../types";
import { cn } from "../utils/cn";

interface Props {
  categories: MenuCategory[];
  className?: string;
}

/** Barra pegajosa con accesos rápidos a cada categoría */
export function CategoryNav({ categories, className }: Props) {
  const [active, setActive] = useState<string>(categories[0]?.id ?? "");

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

  if (categories.length === 0) return null;

  return (
    <nav
      aria-label="Categorías del menú"
      className={cn(
        "sticky z-30 -mx-4 mb-2 bg-paper/85 px-4 py-2 backdrop-blur-md sm:-mx-8 sm:px-8 md:-mx-14 md:px-14",
        className ?? "top-0",
      )}
    >
      <ul className="no-scrollbar flex gap-2 overflow-x-auto">
        {categories.map((c) => (
          <li key={c.id} className="shrink-0">
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
                  : "border-ink/20 bg-surface/40 text-ink hover:border-ink/50",
              )}
            >
              {c.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
