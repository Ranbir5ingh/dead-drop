import type {
  CreateDropResponse,
  DropDetail,
  DropListItem,
  FindAttemptResponse,
  HiderDrop,
  LeaderboardResponse,
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

function baseUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_URL;
  if (!value) {
    throw new ApiError("NEXT_PUBLIC_API_URL is not set on this frontend.", 0);
  }
  return value.replace(/\/$/, "");
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
    response = await fetch(`${baseUrl()}/api${path}`, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new ApiError("The field radio is quiet. Check your connection, then try once more.", 0);
  }
  if (!response.ok) throw new ApiError(await readMessage(response), response.status);
  return (await response.json()) as T;
}

export function listDrops(): Promise<DropListItem[]> {
  return send("/drops", undefined, 20_000);
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
  areaName: string;
  hiderName: string;
  photo: File | null;
}): Promise<CreateDropResponse> {
  const form = new FormData();
  form.set("vicinityDescription", input.vicinityDescription);
  form.set("objectDescription", input.objectDescription);
  form.set("areaName", input.areaName);
  form.set("hiderName", input.hiderName);
  if (input.photo) form.set("photo", input.photo);
  return send("/drops", { method: "POST", body: form }, 60_000);
}

export function publishDrop(id: string, hiderName: string): Promise<PublishDropResponse> {
  return send(
    `/drops/${id}/publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ hiderName }),
    },
    20_000,
  );
}

export function discardDrop(id: string, hiderName: string): Promise<{ ok: true }> {
  return send(
    `/drops/${id}?hiderName=${encodeURIComponent(hiderName)}`,
    { method: "DELETE" },
    20_000,
  );
}

export function submitFind(
  id: string,
  finderName: string,
  photo: File,
): Promise<FindAttemptResponse> {
  const form = new FormData();
  form.set("finderName", finderName);
  form.set("photo", photo);
  return send(`/drops/${id}/finds`, { method: "POST", body: form }, 90_000);
}
