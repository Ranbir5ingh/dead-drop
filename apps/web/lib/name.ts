import { useSyncExternalStore } from "react";

const NAME_KEY = "deaddrop.displayName";
const SEEN_KEY = "deaddrop.seenFindCounts";
const nameListeners = new Set<() => void>();

function emitName(): void {
  for (const listener of nameListeners) listener();
}

export function readDisplayName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(NAME_KEY)?.trim() ?? "";
}

export function writeDisplayName(name: string): void {
  window.localStorage.setItem(NAME_KEY, name.trim());
  emitName();
}

function subscribeName(listener: () => void): () => void {
  nameListeners.add(listener);
  return () => nameListeners.delete(listener);
}

export function useDisplayName(): string {
  return useSyncExternalStore(subscribeName, readDisplayName, () => "");
}

export function readSeenCounts(): Record<string, number> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(SEEN_KEY);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const counts: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "number" && Number.isFinite(value)) counts[key] = value;
    }
    return counts;
  } catch {
    return {};
  }
}

export function writeSeenCounts(counts: Record<string, number>): void {
  window.localStorage.setItem(SEEN_KEY, JSON.stringify(counts));
}
