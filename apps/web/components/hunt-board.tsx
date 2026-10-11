"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NEARBY_RADIUS_METERS, type DropListItem } from "@deaddrop/shared";
import { HuntSkeleton, Stamp, TrailError } from "@/components/ui";
import { ApiError, listDrops } from "@/lib/api";
import { locationMessage, readDeviceLocation } from "@/lib/geo";
import { hiddenWhen } from "@/lib/when";

type Phase = "locating" | "blocked" | "ready";

function formatDistance(meters: number): string {
  if (meters < 950) return `${Math.max(1, Math.round(meters / 10) * 10)} m`;
  const km = meters / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

export function HuntBoard() {
  const [drops, setDrops] = useState<DropListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("locating");
  const [area, setArea] = useState("All");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setPhase("locating");
    setDrops(null);
    void readDeviceLocation()
      .then((point) => listDrops(point.lat, point.lng))
      .then((rows) => {
        if (cancelled) return;
        setDrops(rows);
        setError(null);
        setPhase("ready");
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setDrops([]);
        setError(
          caught instanceof ApiError ? caught.message : locationMessage(caught),
        );
        setPhase(caught instanceof ApiError ? "ready" : "blocked");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (phase === "locating") return <HuntSkeleton />;

  if (phase === "blocked") {
    return (
      <div className="gate">
        <p className="eyebrow">this phone, this radius</p>
        <h1>The hunt starts where you are.</h1>
        <p className="deck">
          Allow location for this page. Dead Drop asks for riddles within{" "}
          {NEARBY_RADIUS_METERS / 1000} km and does not keep the reading. The board never shows a
          pin.
        </p>
        {error ? <TrailError message={error} /> : null}
        <div className="actions">
          <button className="chunk" type="button" onClick={() => setAttempt((value) => value + 1)}>
            Use this device&apos;s location
          </button>
        </div>
      </div>
    );
  }

  const areas = Array.from(new Set((drops ?? []).map((drop) => drop.areaName)));
  const visible = (drops ?? []).filter((drop) => area === "All" || drop.areaName === area);

  return (
    <div>
      <p className="eyebrow">within {NEARBY_RADIUS_METERS / 1000} km of this phone</p>
      <h1>Pick one. Then look up.</h1>
      <p className="deck">
        These are real drops near you, closest first. Distance is the only location on the card.
        There is no pin, no address, and nothing underneath to scroll forever.
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
          <p className="hand slip-title">Nothing is hidden this close.</p>
          <p>
            No live drop sits within {NEARBY_RADIUS_METERS / 1000} km of this device. Sample
            riddles without a real place stay off this list. Hide one here if the ground is
            public.
          </p>
          <div className="actions">
            <Link className="chunk" href="/hide">
              Hide one nearby
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
              <p className="distance">{formatDistance(drop.distanceMeters)} away</p>
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
