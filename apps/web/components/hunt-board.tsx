"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { DropListItem } from "@deaddrop/shared";
import { Stamp, TrailError, Unfolding } from "@/components/ui";
import { ApiError, listDrops } from "@/lib/api";
import { hiddenWhen } from "@/lib/when";

export function HuntBoard() {
  const [drops, setDrops] = useState<DropListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [area, setArea] = useState("All");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void listDrops()
      .then((rows) => {
        if (!cancelled) {
          setDrops(rows);
          setError(null);
        }
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setDrops([]);
        setError(caught instanceof ApiError ? caught.message : "The board did not load.");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (!drops && !error) return <Unfolding label="Unfolding the map…" />;

  const areas = Array.from(new Set((drops ?? []).map((drop) => drop.areaName)));
  const visible = (drops ?? []).filter((drop) => area === "All" || drop.areaName === area);

  return (
    <div>
      <p className="eyebrow">riddles, not directions</p>
      <h1>Pick one. Then look up.</h1>
      <p className="deck">
        Forty drops fit on this screen, and that is the whole board. There is nothing underneath
        to scroll forever. Choose a card and go outside.
      </p>
      {areas.length > 1 ? (
        <div className="chips" role="group" aria-label="Areas">
          {["All", ...areas].map((name) => (
            <button
              key={name}
              type="button"
              className="chip"
              aria-pressed={area === name}
              onClick={() => setArea(name)}
            >
              {name}
            </button>
          ))}
        </div>
      ) : null}
      {error ? (
        <TrailError
          message={error}
          onRetry={() => {
            setError(null);
            setAttempt((value) => value + 1);
          }}
        />
      ) : null}
      {!error && visible.length === 0 ? (
        <div className="slip">
          <p className="hand slip-title">The map is blank.</p>
          <p>No one has hidden anything here yet. The board stays empty until a person does.</p>
          <div className="actions">
            <Link className="chunk" href="/hide">
              Hide the first one
            </Link>
          </div>
        </div>
      ) : null}
      <div className="board">
        {visible.map((drop) => (
          <div className="tilt" key={drop.id}>
            <Link
              className="sticker"
              href={`/drop/${drop.id}`}
              onPointerEnter={(event) => lift(event.currentTarget, true)}
              onPointerLeave={(event) => lift(event.currentTarget, false)}
            >
              {drop.seeded ? <p className="sample">Sample — nothing is physically hidden</p> : null}
              <p className="teaser">{drop.riddleTeaser}</p>
              <div className="meta">
                <div>
                  <p className="area">{drop.areaName}</p>
                  <p className="quiet">
                    {drop.hiderName} · {drop.findCount} {drop.findCount === 1 ? "find" : "finds"} ·{" "}
                    {hiddenWhen(drop.createdAt)}
                  </p>
                  <p className="quiet">{drop.status === "open" ? "Live" : "Retired"}</p>
                </div>
                <Stamp difficulty={drop.difficulty} />
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function lift(node: HTMLElement, up: boolean) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!window.matchMedia("(hover: hover)").matches) return;
  void import("gsap").then(({ default: gsap }) => {
    gsap.to(node, { y: up ? -8 : 0, duration: 0.28, ease: "power2.out" });
  });
}
