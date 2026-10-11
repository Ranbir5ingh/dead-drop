"use client";

import { useSyncExternalStore } from "react";
import type { PublicUser } from "@deaddrop/shared";
import { restoreSession } from "@/lib/api";

let user: PublicUser | null = null;
let ready = false;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function refreshSession(): Promise<void> {
  if (inflight) return inflight;
  inflight = restoreSession()
    .then((next) => {
      user = next;
      ready = true;
    })
    .catch(() => {
      user = null;
      ready = true;
    })
    .finally(() => {
      inflight = null;
      emit();
    });
  return inflight;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!ready) void refreshSession();
  return () => listeners.delete(listener);
}

export function useSession(): { user: PublicUser | null; ready: boolean } {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => user,
    () => null,
  );
  const loaded = useSyncExternalStore(
    subscribe,
    () => ready,
    () => false,
  );
  return { user: snapshot, ready: loaded };
}
