"use client";

import { useEffect, useRef } from "react";
import { ChunkLink } from "@/components/ui";

function Star() {
  return (
    <svg viewBox="0 0 60 60" fill="none" aria-hidden="true">
      <path
        d="M30 4 L 36 22 L 55 24 L 40 36 L 45 55 L 30 44 L 15 55 L 20 36 L 5 24 L 24 22 Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
          y: "-=4",
          duration: 2.4,
          yoyo: true,
          repeat: -1,
          stagger: 0.2,
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
    <section className="hero-stage" ref={root}>
      <div className="hero-grid" aria-hidden="true" />
      <div className="star star-a" aria-hidden="true">
        <Star />
      </div>
      <div className="star star-b" aria-hidden="true">
        <Star />
      </div>
      <div className="star star-c" aria-hidden="true">
        <Star />
      </div>
      <div className="hero">
        <div>
          <div className="sticker-kicker tape" data-hero-item>
            <span className="hand">a field game · public ground only</span>
          </div>
          <h1 data-hero-item>
            <span className="hero-plain">Hide</span>
            <span className="hero-script">
              treasure.
              <svg className="hero-scribble" viewBox="0 0 220 24" aria-hidden="true">
                <path
                  d="M4 14 C 40 6, 70 20, 105 12 S 175 6, 216 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>
          <ul className="hero-lines" data-hero-item>
            <li>
              <span className="dim">you stash</span>
              <span className="arrow">→</span>
              a small object outdoors
            </li>
            <li>
              <span className="dim">they hunt</span>
              <span className="arrow">→</span>
              by riddle, never a pin
            </li>
            <li>
              <span className="dim">the referee</span>
              <span className="arrow">→</span>
              checks the photo
            </li>
          </ul>
          <div className="actions" data-hero-item>
            <ChunkLink href="/hide">Hide one</ChunkLink>
            <ChunkLink href="/hunt" tone="ghost">
              Hunt a riddle
            </ChunkLink>
          </div>
        </div>
        <div className="map-card" data-hero-item aria-hidden="true">
          <svg viewBox="0 0 360 320">
            <rect width="360" height="320" fill="#fffef9" />
            <g fill="none" stroke="#171512" strokeOpacity="0.25" strokeWidth="1.4">
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
                <path d="M8 0c8 0 14 6 14 14 0 10-14 24-14 24S-6 24-6 14C-6 6 0 0 8 0z" fill="#e8442e" />
                <circle cx="8" cy="13" r="4" fill="#faf3e8" />
              </g>
              <g data-pin transform="translate(242 176)">
                <path d="M8 0c8 0 14 6 14 14 0 10-14 24-14 24S-6 24-6 14C-6 6 0 0 8 0z" fill="#2323ee" />
                <circle cx="8" cy="13" r="4" fill="#faf3e8" />
              </g>
              <g data-pin transform="translate(188 78)">
                <path d="M8 0c8 0 14 6 14 14 0 10-14 24-14 24S-6 24-6 14C-6 6 0 0 8 0z" fill="#ffc93c" />
                <circle cx="8" cy="13" r="4" fill="#171512" />
              </g>
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
}
