import type { BarberShop, Coordinates, UserPosition } from "../types";
import { haversineKm } from "../utils/distance";
import { computeOpenStatus } from "../utils/opening-hours";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const OVERPASS_TIMEOUT_MS = 20000;
const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

type SearchBarberParams = Coordinates & {
  radiusKm: number;
};

export class OverpassTemporaryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OverpassTemporaryError";
  }
}

export function isOverpassTemporaryError(error: unknown) {
  return error instanceof OverpassTemporaryError;
}

function buildOverpassQuery(lat: number, lon: number, radiusMeters: number) {
  return `
[out:json][timeout:25];
(
  node(around:${radiusMeters},${lat},${lon})["shop"="barber"];
  way(around:${radiusMeters},${lat},${lon})["shop"="barber"];
  node(around:${radiusMeters},${lat},${lon})["shop"="hairdresser"];
  way(around:${radiusMeters},${lat},${lon})["shop"="hairdresser"];
);
out center tags;
  `.trim();
}

function normalizeAddress(tags: Record<string, string>) {
  const street = tags["addr:street"] ?? "";
  const house = tags["addr:housenumber"] ?? "";
  const district =
    tags["addr:suburb"] ?? tags["addr:city"] ?? tags["addr:village"] ?? "";
  const firstLine = [street, house].filter(Boolean).join(" ").trim();
  return [firstLine, district].filter(Boolean).join(", ") || "Alamat belum tersedia";
}

function normalizeOverpassElement(
  element: OverpassElement,
  origin: Coordinates
): BarberShop | null {
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  if (typeof lat !== "number" || typeof lon !== "number") {
    return null;
  }

  const tags = element.tags ?? {};
  const name = tags.name ?? "Tukang cukur terdekat";
  const distanceKm = haversineKm(origin.lat, origin.lon, lat, lon);
  const openingHours = tags.opening_hours ?? null;
  const rating = normalizeRating(tags.rating ?? tags.stars ?? null);

  return {
    id: `${element.type}-${element.id}`,
    name,
    address: normalizeAddress(tags),
    lat,
    lon,
    distanceKm,
    rating,
    openingHours,
    openStatus: computeOpenStatus(openingHours),
  };
}

function normalizeRating(rawRating: string | null) {
  if (!rawRating) {
    return null;
  }

  const parsed = Number.parseFloat(rawRating.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.min(parsed, 5);
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchOverpassWithEndpoint(endpoint: string, query: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, OVERPASS_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: query,
      headers: {
        "Content-Type": "text/plain;charset=UTF-8",
      },
      signal: controller.signal,
    });

    if (response.ok) {
      return (await response.json()) as OverpassResponse;
    }

    if (RETRYABLE_STATUSES.has(response.status)) {
      throw new OverpassTemporaryError(
        `Overpass endpoint error (${response.status})`
      );
    }

    throw new Error(`Overpass request failed (${response.status})`);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new OverpassTemporaryError("Overpass timeout");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchOverpass(query: string) {
  let lastTemporaryError: OverpassTemporaryError | null = null;

  for (let index = 0; index < OVERPASS_ENDPOINTS.length; index += 1) {
    const endpoint = OVERPASS_ENDPOINTS[index];

    try {
      return await fetchOverpassWithEndpoint(endpoint, query);
    } catch (error) {
      if (isOverpassTemporaryError(error)) {
        lastTemporaryError = error;
        await sleep(350 * (index + 1));
        continue;
      }
      throw error;
    }
  }

  throw (
    lastTemporaryError ??
    new OverpassTemporaryError("Overpass temporary unavailable")
  );
}

export async function searchBarberShops({
  lat,
  lon,
  radiusKm,
}: SearchBarberParams): Promise<BarberShop[]> {
  const query = buildOverpassQuery(lat, lon, radiusKm * 1000);
  const data = await fetchOverpass(query);
  const normalized = (data.elements ?? [])
    .map((element) => normalizeOverpassElement(element, { lat, lon }))
    .filter((item): item is BarberShop => item !== null)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const seen = new Set<string>();
  return normalized.filter((shop) => {
    const key = `${shop.name}-${shop.lat.toFixed(5)}-${shop.lon.toFixed(5)}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

type NominatimResult = {
  lat: string;
  lon: string;
  display_name?: string;
};

export async function geocodeLocation(query: string): Promise<UserPosition | null> {
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(
    query
  )}&format=jsonv2&limit=1&accept-language=id`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim request failed (${response.status})`);
  }

  const data = (await response.json()) as NominatimResult[];
  const first = data[0];
  if (!first) {
    return null;
  }

  return {
    lat: Number(first.lat),
    lon: Number(first.lon),
    label: first.display_name || query,
  };
}
