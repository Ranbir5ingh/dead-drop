import type {
  CreateDropResponse,
  DropDetail,
  DropListItem,
  FindAttemptResponse,
  HiderDrop,
  LeaderboardResponse,
  PlaceSuggestion,
  PublicUser,
  PublishDropResponse,
} from "@deaddrop/shared";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Same-origin proxy. The session cookie never has to be third-party. */
function apiPath(path: string): string {
  return `/backend/api${path}`;
}

async function readMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "message" in body) {
      const message = (body as { message: unknown }).message;
      if (typeof message === "string" && message.trim()) return message;
      if (Array.isArray(message)) {
        const text = message.filter((item) => typeof item === "string").join(" ");
        if (text) return text;
      }
    }
  } catch {
    /* The body was not JSON. */
  }
  return `The trail answered ${response.status}.`;
}

async function send<T>(path: string, init: RequestInit | undefined, timeoutMs: number): Promise<T> {
  let response: Response;
  try {
    response = await fetch(apiPath(path), {
      ...init,
      credentials: "include",
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new ApiError("The field radio is quiet. Check your connection, then try once more.", 0);
  }
  if (!response.ok) throw new ApiError(await readMessage(response), response.status);
  return (await response.json()) as T;
}

export function listDrops(lat: number, lng: number): Promise<DropListItem[]> {
  const query = new URLSearchParams({ lat: String(lat), lng: String(lng) });
  return send(`/drops?${query.toString()}`, undefined, 20_000);
}

export function currentUser(): Promise<{ user: PublicUser | null }> {
  return send("/auth/me", undefined, 15_000);
}

export function authProviders(): Promise<{ google: boolean; github: boolean }> {
  return send("/auth/providers", undefined, 12_000);
}

export function signup(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<{ user: PublicUser }> {
  return send(
    "/auth/signup",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(input),
    },
    20_000,
  );
}

export function login(input: { email: string; password: string }): Promise<{ user: PublicUser }> {
  return send(
    "/auth/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(input),
    },
    20_000,
  );
}

export function logout(): Promise<{ ok: true }> {
  return send("/auth/logout", { method: "POST" }, 15_000);
}

export function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  return send(`/places?q=${encodeURIComponent(query)}`, undefined, 12_000);
}

export function myDrops(): Promise<HiderDrop[]> {
  return send("/drops/mine", undefined, 20_000);
}

export function getDrop(id: string): Promise<DropDetail> {
  return send(`/drops/${id}`, undefined, 20_000);
}

export function hiderDrops(name: string): Promise<HiderDrop[]> {
  return send(`/drops/by-hider/${encodeURIComponent(name)}`, undefined, 20_000);
}

export function leaderboard(): Promise<LeaderboardResponse> {
  return send("/leaderboard", undefined, 20_000);
}

export function createDrop(input: {
  vicinityDescription: string;
  objectDescription: string;
  placeId: string;
  photo: File | null;
}): Promise<CreateDropResponse> {
  const form = new FormData();
  form.set("vicinityDescription", input.vicinityDescription);
  form.set("objectDescription", input.objectDescription);
  form.set("placeId", input.placeId);
  if (input.photo) form.set("photo", input.photo);
  return send("/drops", { method: "POST", body: form }, 60_000);
}

export function publishDrop(id: string): Promise<PublishDropResponse> {
  return send(`/drops/${id}/publish`, { method: "POST" }, 20_000);
}

export function discardDrop(id: string): Promise<{ ok: true }> {
  return send(`/drops/${id}`, { method: "DELETE" }, 20_000);
}

export function submitFind(id: string, photo: File): Promise<FindAttemptResponse> {
  const form = new FormData();
  form.set("photo", photo);
  return send(`/drops/${id}/finds`, { method: "POST", body: form }, 90_000);
}

export function oauthStart(provider: "google" | "github"): string {
  return apiPath(`/auth/oauth/${provider}`);
}
