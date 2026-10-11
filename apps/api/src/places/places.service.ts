import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { PlaceSuggestion } from "@deaddrop/shared";
import { and, eq, gt } from "drizzle-orm";
import { scanRiddle } from "../ai/safety";
import { DbService } from "../db/db.service";
import { placePicks } from "../db/schema";

const KEEP_MS = 30 * 60 * 1000;
const ALLOWED_OSM = new Set([
  "park",
  "garden",
  "playground",
  "nature_reserve",
  "attraction",
  "viewpoint",
  "beach",
  "neighbourhood",
  "neighborhood",
  "suburb",
  "quarter",
  "locality",
  "city",
  "town",
  "village",
  "peak",
  "waterfall",
  "forest",
  "recreation_ground",
  "picnic_site",
  "common",
]);

interface PickedPlace {
  id: string;
  areaName: string;
  latitude: number;
  longitude: number;
}

@Injectable()
export class PlacesService {
  constructor(
    private readonly db: DbService,
    private readonly config: ConfigService,
  ) {}

  async search(query: string): Promise<PlaceSuggestion[]> {
    const q = query.trim().replace(/\s+/g, " ");
    if (q.length < 2 || q.length > 80) {
      throw new BadRequestException("Type at least two letters of a park or neighborhood.");
    }
    const mapsKey = this.config.get<string>("GOOGLE_MAPS_API_KEY")?.trim();
    const found = mapsKey ? await this.google(q, mapsKey) : await this.photon(q);
    const fresh = found.filter((place) => scanRiddle(place.areaName).length === 0).slice(0, 6);
    if (fresh.length === 0) return [];
    const expiresAt = new Date(Date.now() + KEEP_MS);
    const rows = await this.db.orm
      .insert(placePicks)
      .values(
        fresh.map((place) => ({
          areaName: place.areaName,
          label: place.label,
          latitude: place.latitude.toFixed(6),
          longitude: place.longitude.toFixed(6),
          expiresAt,
        })),
      )
      .returning({ id: placePicks.id, areaName: placePicks.areaName, label: placePicks.label });
    return rows;
  }

  async take(id: string): Promise<PickedPlace> {
    const now = new Date();
    const [row] = await this.db.orm
      .delete(placePicks)
      .where(and(eq(placePicks.id, id), gt(placePicks.expiresAt, now)))
      .returning();
    if (!row) {
      throw new NotFoundException("That place expired. Search for it again.");
    }
    return {
      id: row.id,
      areaName: row.areaName,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
    };
  }

  private async photon(query: string): Promise<Array<PlaceSuggestion & { latitude: number; longitude: number }>> {
    const url = new URL("https://photon.komoot.io/api/");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "8");
    url.searchParams.set("lang", "en");
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "DeadDrop/1.0 (public treasure hunt)" },
        signal: AbortSignal.timeout(8_000),
      });
    } catch {
      throw new BadRequestException("Place search is quiet. Try once more.");
    }
    if (!response.ok) throw new BadRequestException("Place search is quiet. Try once more.");
    const body: unknown = await response.json().catch(() => null);
    if (!body || typeof body !== "object" || !("features" in body) || !Array.isArray(body.features)) {
      return [];
    }
    const suggestions: Array<PlaceSuggestion & { latitude: number; longitude: number }> = [];
    for (const feature of body.features) {
      if (!feature || typeof feature !== "object") continue;
      const geometry = (feature as { geometry?: { coordinates?: unknown } }).geometry;
      const coords = geometry?.coordinates;
      const props = (feature as { properties?: Record<string, unknown> }).properties ?? {};
      if (!Array.isArray(coords) || coords.length < 2) continue;
      const longitude = Number(coords[0]);
      const latitude = Number(coords[1]);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
      if (typeof props.housenumber === "string") continue;
      const kind = typeof props.osm_value === "string" ? props.osm_value : "";
      if (kind && !ALLOWED_OSM.has(kind)) continue;
      const name = typeof props.name === "string" ? props.name.trim() : "";
      if (name.length < 2) continue;
      const where = [props.city, props.state, props.country].find((part) => typeof part === "string") as
        | string
        | undefined;
      suggestions.push({
        id: "",
        areaName: name.slice(0, 80),
        label: where ? `${name}, ${where}` : name,
        latitude,
        longitude,
      });
    }
    return suggestions;
  }

  private async google(
    query: string,
    key: string,
  ): Promise<Array<PlaceSuggestion & { latitude: number; longitude: number }>> {
    const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat",
      },
      body: JSON.stringify({
        input: query,
        includedPrimaryTypes: ["park", "tourist_attraction", "neighborhood", "locality"],
        languageCode: "en",
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return this.photon(query);
    const body: unknown = await response.json().catch(() => null);
    if (!body || typeof body !== "object" || !("suggestions" in body) || !Array.isArray(body.suggestions)) {
      return [];
    }
    const out: Array<PlaceSuggestion & { latitude: number; longitude: number }> = [];
    for (const item of body.suggestions.slice(0, 6)) {
      const prediction = (item as { placePrediction?: { placeId?: string; text?: { text?: string } } })
        .placePrediction;
      const placeId = prediction?.placeId;
      const label = prediction?.text?.text;
      if (!placeId || !label) continue;
      const point = await this.googlePoint(placeId, key);
      if (!point) continue;
      const areaName = label.split(",")[0]?.trim().slice(0, 80) ?? "";
      if (areaName.length < 2) continue;
      out.push({ id: "", label, areaName, ...point });
    }
    return out.length > 0 ? out : this.photon(query);
  }

  private async googlePoint(placeId: string, key: string): Promise<{ latitude: number; longitude: number } | null> {
    const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "location",
      },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return null;
    const body: unknown = await response.json().catch(() => null);
    if (!body || typeof body !== "object" || !("location" in body)) return null;
    const location = (body as { location?: { latitude?: unknown; longitude?: unknown } }).location;
    const latitude = Number(location?.latitude);
    const longitude = Number(location?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
  }
}
