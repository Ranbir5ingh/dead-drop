"use client";

import { useEffect, useState } from "react";
import type { PlaceSuggestion } from "@deaddrop/shared";
import { ApiError, searchPlaces } from "@/lib/api";

export function PlaceField({
  selected,
  onSelect,
}: {
  selected: PlaceSuggestion | null;
  onSelect: (place: PlaceSuggestion | null) => void;
}) {
  const [query, setQuery] = useState(selected?.label ?? "");
  const [options, setOptions] = useState<PlaceSuggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (selected && query === selected.label) return;
    if (query.trim().length < 2) {
      setOptions([]);
      return;
    }
    const handle = window.setTimeout(() => {
      setBusy(true);
      void searchPlaces(query.trim())
        .then((rows) => {
          setOptions(rows);
          setNote(rows.length === 0 ? "No public park or neighborhood matched that." : null);
        })
        .catch((error: unknown) => {
          setOptions([]);
          setNote(error instanceof ApiError ? error.message : "Place search did not answer.");
        })
        .finally(() => setBusy(false));
    }, 280);
    return () => window.clearTimeout(handle);
  }, [query, selected]);

  return (
    <div className="field">
      <span>Real place</span>
      <span className="hint">
        A park, garden, or neighborhood. Not a street address. The pin stays on the server so nearby
        hunters can find the riddle. The board never shows it.
      </span>
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          if (selected) onSelect(null);
        }}
        placeholder="Lodhi Garden"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={options.length > 0}
        required
      />
      {busy ? <p className="quiet">Searching real places…</p> : null}
      {options.length > 0 ? (
        <ul className="place-menu" role="listbox">
          {options.map((place) => (
            <li key={place.id}>
              <button
                type="button"
                role="option"
                onClick={() => {
                  onSelect(place);
                  setQuery(place.label);
                  setOptions([]);
                  setNote(null);
                }}
              >
                {place.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {note ? <p className="quiet">{note}</p> : null}
    </div>
  );
}
