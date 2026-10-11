"use client";

import { useState, useSyncExternalStore } from "react";
import type { CreateDropResponse } from "@deaddrop/shared";
import { PhotoField } from "@/components/photo-field";
import { SuccessBurst } from "@/components/success-burst";
import { Stamp, TrailError } from "@/components/ui";
import { ApiError, createDrop, discardDrop, publishDrop } from "@/lib/api";
import { preparePhoto } from "@/lib/image";
import { useDisplayName, writeDisplayName } from "@/lib/name";

const PREVIEW_KEY = "deaddrop.preview";
const previewListeners = new Set<() => void>();
let previewRaw: string | null = null;
let previewSnapshot: CreateDropResponse | null = null;
let previewKnown = false;

type Phase = "edit" | "inking" | "preview" | "publishing" | "live";

function parsePreview(raw: string | null): CreateDropResponse | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const record = value as Partial<CreateDropResponse>;
    if (
      typeof record.id !== "string" ||
      typeof record.riddle !== "string" ||
      typeof record.areaName !== "string" ||
      typeof record.hiderName !== "string" ||
      typeof record.createdAt !== "string" ||
      record.status !== "preview"
    ) {
      return null;
    }
    if (record.difficulty !== 1 && record.difficulty !== 2 && record.difficulty !== 3) return null;
    return {
      id: record.id,
      riddle: record.riddle,
      difficulty: record.difficulty,
      areaName: record.areaName,
      hiderName: record.hiderName,
      status: "preview",
      createdAt: record.createdAt,
    };
  } catch {
    return null;
  }
}

function readPreview(): CreateDropResponse | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(PREVIEW_KEY);
  if (previewKnown && raw === previewRaw) return previewSnapshot;
  previewRaw = raw;
  previewSnapshot = parsePreview(raw);
  previewKnown = true;
  return previewSnapshot;
}

function savePreview(drop: CreateDropResponse | null): void {
  if (drop) sessionStorage.setItem(PREVIEW_KEY, JSON.stringify(drop));
  else sessionStorage.removeItem(PREVIEW_KEY);
  previewRaw = sessionStorage.getItem(PREVIEW_KEY);
  previewSnapshot = drop;
  previewKnown = true;
  for (const listener of previewListeners) listener();
}

function usePreview(): CreateDropResponse | null {
  return useSyncExternalStore(
    (listener) => {
      previewListeners.add(listener);
      return () => previewListeners.delete(listener);
    },
    readPreview,
    () => null,
  );
}

export function HideForm() {
  const savedName = useDisplayName();
  const preview = usePreview();
  const [name, setName] = useState<string | null>(null);
  const displayName = name ?? savedName;
  const [phase, setPhase] = useState<Phase>("edit");
  const [liveDrop, setLiveDrop] = useState<CreateDropResponse | null>(null);
  const [area, setArea] = useState("");
  const [vicinity, setVicinity] = useState("");
  const [object, setObject] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const shown: Phase = phase === "edit" && preview ? "preview" : phase;

  async function ink(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPhase("inking");
    try {
      const prepared = photo ? await preparePhoto(photo) : null;
      const drop = await createDrop({
        hiderName: displayName,
        areaName: area,
        vicinityDescription: vicinity,
        objectDescription: object,
        photo: prepared,
      });
      writeDisplayName(displayName);
      savePreview(drop);
      setPhase("preview");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "The referee could not ink a riddle.");
      setPhase("edit");
    }
  }

  async function confirm() {
    if (!preview) return;
    setError(null);
    setPhase("publishing");
    try {
      await publishDrop(preview.id, preview.hiderName);
      setLiveDrop(preview);
      savePreview(null);
      writeDisplayName(preview.hiderName);
      setPhase("live");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "The drop did not go live.");
      setPhase("preview");
    }
  }

  async function startOver() {
    if (preview) {
      await discardDrop(preview.id, preview.hiderName).catch(() => undefined);
    }
    savePreview(null);
    setPhase("edit");
    setError(null);
  }

  if (shown === "live" && liveDrop) {
    return (
      <div>
        <SuccessBurst
          kicker="it's live"
          title="Now go place it."
          detail="The board can see the riddle. Nobody can see the spot. That lives with you. Leave the object for a stranger, then put the phone away."
        />
        <p className="live-note quiet">Area on the card: {liveDrop.areaName}</p>
      </div>
    );
  }

  if ((shown === "preview" || shown === "publishing") && preview) {
    return (
      <div>
        <p className="eyebrow">the referee wrote this</p>
        <h1>Read it. Then decide.</h1>
        <article className="riddle-sheet section">
          <div className="meta">
            <p className="area">{preview.areaName}</p>
            <Stamp difficulty={preview.difficulty} />
          </div>
          <p className="riddle">{preview.riddle}</p>
        </article>
        <p className="quiet live-note">
          Hunters will not see what you hid or where, exactly. If the riddle points at a door,
          start over.
        </p>
        {error ? <TrailError message={error} /> : null}
        <div className="actions">
          <button className="chunk" type="button" onClick={() => void confirm()} disabled={shown === "publishing"}>
            {shown === "publishing" ? "Pinning it to the board…" : "It's placed — make it live"}
          </button>
          <button className="chunk paper" type="button" onClick={() => void startOver()} disabled={shown === "publishing"}>
            Write a different one
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void ink(event)}>
      <p className="eyebrow">you keep the exact spot</p>
      <h1>Hide something small.</h1>
      <p className="deck">
        A stone, a note, a sticker. Public ground you are allowed to be on. The referee turns
        your notes into a riddle. The answer stays off the board.
      </p>
      <div className="section">
        <label className="field">
          <span>Display name</span>
          <span className="hint">Saved on this phone only. No account.</span>
          <input
            value={displayName}
            onChange={(event) => setName(event.target.value)}
            maxLength={40}
            required
            autoComplete="nickname"
          />
        </label>
        <label className="field">
          <span>Broad area</span>
          <span className="hint">A park or a neighborhood. Not a street address.</span>
          <input
            value={area}
            onChange={(event) => setArea(event.target.value)}
            maxLength={80}
            required
            placeholder="Riverside walk"
          />
        </label>
        <label className="field">
          <span>Vicinity</span>
          <span className="hint">What a person would feel standing nearby. No door numbers.</span>
          <textarea
            value={vicinity}
            onChange={(event) => setVicinity(event.target.value)}
            maxLength={600}
            required
            minLength={10}
          />
        </label>
        <label className="field">
          <span>What you hid</span>
          <span className="hint">Only the referee sees this. Hunters get the riddle, never the answer.</span>
          <textarea
            value={object}
            onChange={(event) => setObject(event.target.value)}
            maxLength={300}
            required
            minLength={5}
          />
        </label>
        <PhotoField
          label="Vicinity photo, optional"
          hint="A photo of the area, not a map pin. It is stored, not shown on the board."
          onPhoto={setPhoto}
        />
      </div>
      {error ? <TrailError message={error} /> : null}
      {shown === "inking" ? <p className="hand loading-line">The referee is inking a riddle…</p> : null}
      <div className="actions">
        <button className="chunk" type="submit" disabled={shown === "inking"}>
          Ink a riddle
        </button>
      </div>
    </form>
  );
}
