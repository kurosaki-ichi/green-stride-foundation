import { useCallback, useEffect, useRef, useState } from "react";

export type GeoPoint = {
  latitude: number;
  longitude: number;
  area?: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
};

export type PlaceSuggestion = {
  id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  area?: string;
  city?: string;
  state?: string;
  country?: string;
};

const NOMINATIM = "https://nominatim.openstreetmap.org";

function pickAddressParts(addr: Record<string, string> | undefined) {
  if (!addr) return {};
  const area =
    addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || addr.locality;
  const city = addr.city || addr.town || addr.village || addr.municipality || addr.county;
  const state = addr.state || addr.region;
  const country = addr.country;
  return { area, city, state, country };
}

export function useGeolocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrent = useCallback(async (): Promise<GeoPoint | null> => {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not available");
      return null;
    }
    setLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 60000,
        }),
      );
      const { latitude, longitude } = pos.coords;
      try {
        const res = await fetch(
          `${NOMINATIM}/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
          { headers: { Accept: "application/json" } },
        );
        const json = await res.json();
        const parts = pickAddressParts(json.address);
        return {
          latitude,
          longitude,
          address: json.display_name,
          ...parts,
        };
      } catch {
        return { latitude, longitude };
      }
    } catch (e: any) {
      setError(e?.message || "Could not get location");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchCurrent, loading, error };
}

export function usePlaceAutocomplete() {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const ctrl = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((q: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (ctrl.current) ctrl.current.abort();
    if (!q || q.trim().length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      const c = new AbortController();
      ctrl.current = c;
      try {
        const res = await fetch(
          `${NOMINATIM}/search?format=jsonv2&q=${encodeURIComponent(q)}&addressdetails=1&limit=6`,
          { signal: c.signal, headers: { Accept: "application/json" } },
        );
        const json = await res.json();
        const items: PlaceSuggestion[] = (json || []).map((r: any) => {
          const parts = pickAddressParts(r.address);
          const label =
            r.address?.suburb || r.address?.neighbourhood || r.address?.quarter ||
            r.address?.city || r.address?.town || r.address?.village || r.name || r.display_name;
          return {
            id: `${r.place_id}`,
            label,
            address: r.display_name,
            latitude: Number(r.lat),
            longitude: Number(r.lon),
            ...parts,
          };
        });
        setSuggestions(items);
      } catch {
        /* abort/network */
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (ctrl.current) ctrl.current.abort();
  }, []);

  return { suggestions, loading, search, clear: () => setSuggestions([]) };
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
