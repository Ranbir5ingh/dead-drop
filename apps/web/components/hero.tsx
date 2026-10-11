"use client";

import { useEffect, useRef } from "react";
import { ChunkLink } from "@/components/ui";

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let revert: (() => void) | undefined;
    let cancelled = false;
    void import("gsap").then(({ default: gsap }) => {
      if (cancelled) return;
      const ctx = gsap.context(() => {
        gsap.from("[data-hero-item]", {
          y: 28,
          opacity: 0,
          stagger: 0.12,
          duration: 0.8,
          ease: "power3.out",
        });
        gsap.to("[data-pin]", {
          y: -12,
          duration: 1.7,
          yoyo: true,
          repeat: -1,
          stagger: 0.18,
          ease: "sine.inOut",
        });
      }, node);
      revert = () => ctx.revert();
    });
    return () => {
      cancelled = true;
      revert?.();
    };
  }, []);

  return (
    <section className="hero" ref={root}>
      <div>
        <p className="eyebrow" data-hero-item>
          a field game for people, not errands
        </p>
        <h1 data-hero-item>
          Hide treasure.
          <br />
          Hunt others&apos;.
          <br />
          The AI referees.
        </h1>
        <p className="deck" data-hero-item>
          You stash something small outdoors — a painted stone, a paper crane, a ridiculous
          bottle cap. The referee writes a riddle and never a pin. Someone else walks until the
          world matches the words. Both of you score. The object stays for the next person.
        </p>
        <div className="actions" data-hero-item>
          <ChunkLink href="/hide">Hide one</ChunkLink>
          <ChunkLink href="/hunt" tone="paper">
            Hunt a riddle
          </ChunkLink>
        </div>
      </div>
      <div className="map-card" data-hero-item aria-hidden="true">
        <svg viewBox="0 0 360 320">
          <rect width="360" height="320" fill="#f7efe0" />
          <g fill="none" stroke="#1b140f" strokeOpacity="0.25" strokeWidth="1.4">
            <path d="M-10 70C40 30 90 110 150 70s90-40 140 10 70 20 90-10" />
            <path d="M-10 120C50 80 100 160 160 120s90-30 130 20 60 10 90-20" />
            <path d="M10 180C70 140 120 220 190 180s80-20 120 30" />
            <path d="M-10 240C60 200 130 280 200 240s90-30 150 20" />
            <circle cx="120" cy="150" r="28" />
            <circle cx="120" cy="150" r="48" />
            <circle cx="250" cy="210" r="22" />
            <circle cx="250" cy="210" r="44" />
          </g>
          <g>
            <g data-pin transform="translate(112 118)">
              <path d="M8 0c8 0 14 6 14 14 0 10-14 24-14 24S-6 24-6 14C-6 6 0 0 8 0z" fill="#b42318" />
              <circle cx="8" cy="13" r="4" fill="#f4ead7" />
            </g>
            <g data-pin transform="translate(242 176)">
              <path d="M8 0c8 0 14 6 14 14 0 10-14 24-14 24S-6 24-6 14C-6 6 0 0 8 0z" fill="#1f4a32" />
              <circle cx="8" cy="13" r="4" fill="#f4ead7" />
            </g>
            <g data-pin transform="translate(188 78)">
              <path d="M8 0c8 0 14 6 14 14 0 10-14 24-14 24S-6 24-6 14C-6 6 0 0 8 0z" fill="#8a5e0b" />
              <circle cx="8" cy="13" r="4" fill="#f4ead7" />
            </g>
          </g>
        </svg>
      </div>
    </section>
  );
}
