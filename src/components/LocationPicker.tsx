import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLng } from "../utils/geo";
import { DEFAULT_CENTER, getCurrentPosition, reverseGeocode } from "../utils/geo";
import { cn } from "../utils/cn";
import { CheckIcon, CloseIcon, PinIcon, TargetIcon } from "./icons";

interface Props {
  /** Punto inicial (si el cliente ya había marcado uno) */
  initial?: LatLng | null;
  onClose: () => void;
  onConfirm: (point: LatLng, address: string) => void;
}

/** Pin dibujado con CSS: evita depender de las imágenes de Leaflet */
const pinIcon = L.divIcon({
  className: "",
  html: `<div style="
      width:34px;height:34px;margin-left:-17px;margin-top:-34px;
      background:var(--color-terracotta,#c8691e);
      border:3px solid #fff;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);box-shadow:0 4px 10px rgba(0,0,0,.4);
    "></div>`,
  iconSize: [34, 34],
  iconAnchor: [0, 0],
});

export function LocationPicker({ initial, onClose, onConfirm }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<L.Map | null>(null);
  const markerObj = useRef<L.Marker | null>(null);

  const [point, setPoint] = useState<LatLng | null>(initial ?? null);
  const [address, setAddress] = useState("");
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Coloca el pin, centra el mapa y busca la dirección */
  const place = useCallback(async (p: LatLng, fly = true) => {
    setPoint(p);
    setError(null);
    const map = mapObj.current;
    if (map) {
      if (fly) map.setView([p.lat, p.lng], Math.max(map.getZoom(), 17), { animate: true });
      if (markerObj.current) markerObj.current.setLatLng([p.lat, p.lng]);
      else markerObj.current = L.marker([p.lat, p.lng], { icon: pinIcon, draggable: true }).addTo(map);

      markerObj.current.off("dragend");
      markerObj.current.on("dragend", () => {
        const ll = markerObj.current!.getLatLng();
        void place({ lat: ll.lat, lng: ll.lng }, false);
      });
    }
    setLoadingAddress(true);
    const found = await reverseGeocode(p);
    setLoadingAddress(false);
    if (found) setAddress((prev) => (prev.trim() === "" || prev === address ? found : found));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Inicializar el mapa
  useEffect(() => {
    if (!mapRef.current || mapObj.current) return;
    const start = initial ?? DEFAULT_CENTER;
    const map = L.map(mapRef.current, { zoomControl: true, attributionControl: true }).setView(
      [start.lat, start.lng],
      initial ? 17 : 12,
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(map);
    map.on("click", (e: L.LeafletMouseEvent) => void place({ lat: e.latlng.lat, lng: e.latlng.lng }, false));
    mapObj.current = map;

    if (initial) void place(initial);
    else void locate();

    // El contenedor se muestra dentro de un panel: recalcular tamaño
    setTimeout(() => map.invalidateSize(), 150);

    return () => {
      map.remove();
      mapObj.current = null;
      markerObj.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function locate() {
    setLocating(true);
    setError(null);
    try {
      const p = await getCurrentPosition();
      await place(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos obtener tu ubicación.");
    } finally {
      setLocating(false);
    }
  }

  const canConfirm = point !== null && address.trim().length >= 5;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4" role="presentation">
      <div className="absolute inset-0 animate-fade bg-ink/60 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="loc-title"
        className="relative flex max-h-[92dvh] w-full animate-slide-up flex-col overflow-hidden rounded-t-3xl bg-paper-light text-ink shadow-2xl sm:max-w-lg sm:animate-pop sm:rounded-3xl"
      >
        <header className="flex items-center gap-3 border-b border-ink/10 px-4 py-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-terracotta text-white">
            <PinIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="loc-title" className="text-base font-bold leading-tight">
              Marca tu dirección
            </h2>
            <p className="text-[0.7rem] text-ink/60">Usa tu ubicación o toca el mapa para poner el pin</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink/60 transition hover:bg-ink/10 hover:text-ink"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </header>

        <div className="relative">
          <div ref={mapRef} className="h-[45dvh] min-h-[240px] w-full bg-paper-dark sm:h-72" />
          <button
            type="button"
            onClick={() => void locate()}
            disabled={locating}
            className="absolute bottom-3 right-3 z-[500] inline-flex items-center gap-2 rounded-full bg-ink px-3.5 py-2 text-xs font-bold text-paper shadow-lg transition hover:opacity-90 active:scale-95 disabled:opacity-60"
          >
            <TargetIcon className={cn("h-4 w-4", locating && "animate-spin")} />
            {locating ? "Buscando…" : "Mi ubicación"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {error && (
            <p className="mb-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
              {error}
            </p>
          )}

          <label className="block">
            <span className="text-xs font-semibold text-ink/70">
              Dirección de entrega {loadingAddress && <span className="text-ink/45">· buscando…</span>}
            </span>
            <textarea
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Toca el mapa o usa tu ubicación; luego agrega número interior y referencias"
              className="mt-1 w-full resize-none rounded-xl border border-ink/15 bg-surface px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-ink focus:ring-2 focus:ring-mustard/40"
            />
          </label>

          <p className="mt-1.5 text-[0.7rem] leading-snug text-ink/50">
            {point
              ? "Revisa la dirección y agrega referencias (color de puerta, piso, entre calles). Enviaremos también el punto exacto del mapa."
              : "Aún no marcas un punto. Toca el mapa o usa el botón “Mi ubicación”."}
          </p>
        </div>

        <footer className="flex items-center gap-2 border-t border-ink/10 bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-paper/60"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => point && onConfirm(point, address.trim())}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-wa py-3 text-sm font-bold text-white shadow-lg transition hover:bg-wa-deep active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckIcon className="h-4 w-4" />
            Usar esta dirección
          </button>
        </footer>
      </div>
    </div>
  );
}
