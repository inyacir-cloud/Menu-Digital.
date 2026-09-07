export interface LatLng {
  lat: number;
  lng: number;
}

/** Centro por defecto del mapa: Ciudad de México */
export const DEFAULT_CENTER: LatLng = { lat: 19.4326, lng: -99.1332 };

export function isGeolocationAvailable(): boolean {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

/** Pide la ubicación actual del dispositivo */
export function getCurrentPosition(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!isGeolocationAvailable()) {
      reject(new Error("Tu dispositivo no permite obtener la ubicación."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        const messages: Record<number, string> = {
          1: "No diste permiso para usar tu ubicación. Actívalo en el navegador o marca el punto en el mapa.",
          2: "No pudimos obtener tu ubicación. Revisa el GPS o marca el punto en el mapa.",
          3: "La búsqueda de ubicación tardó demasiado. Intenta de nuevo o marca el punto en el mapa.",
        };
        reject(new Error(messages[err.code] ?? "No pudimos obtener tu ubicación."));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  });
}

/** Enlace a Google Maps para compartir el punto exacto */
export function mapsLink({ lat, lng }: LatLng): string {
  return `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

interface NominatimAddress {
  road?: string;
  house_number?: string;
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
  postcode?: string;
}

/**
 * Dirección aproximada a partir de coordenadas (OpenStreetMap / Nominatim).
 * Devuelve null si el servicio no responde: el cliente puede escribirla a mano.
 */
export async function reverseGeocode(point: LatLng): Promise<string | null> {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1` +
    `&lat=${point.lat}&lon=${point.lng}&accept-language=es`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = (await res.json()) as { display_name?: string; address?: NominatimAddress };
    const a = data.address;
    if (!a) return data.display_name ?? null;

    const street = [a.road, a.house_number].filter(Boolean).join(" ");
    const colonia = a.neighbourhood ?? a.suburb ?? a.quarter;
    const city = a.city ?? a.town ?? a.village ?? a.municipality;
    const parts = [street, colonia && `Col. ${colonia}`, city, a.postcode].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : (data.display_name ?? null);
  } catch {
    return null;
  }
}
