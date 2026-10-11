"use client";

import { useEffect, useRef } from "react";

export function SuccessBurst({
  kicker,
  title,
  detail,
}: {
  kicker: string;
  title: string;
  detail: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let revert: (() => void) | undefined;
    let cancelled = false;
    void import("gsap").then(({ default: gsap }) => {
      if (cancelled) return;
      const ctx = gsap.context(() => {
        gsap.from("[data-burst]", {
          y: 18,
          opacity: 0,
          stagger: 0.08,
          duration: 0.5,
          ease: "power2.out",
        });
        gsap.fromTo(
          "[data-dot]",
          { scale: 0, opacity: 1 },
          {
            x: () => gsap.utils.random(-120, 120),
            y: () => gsap.utils.random(-110, 50),
            scale: 1,
            opacity: 0,
            duration: 0.95,
            stagger: 0.02,
            ease: "power2.out",
          },
        );
      }, node);
      revert = () => ctx.revert();
    });
    return () => {
      cancelled = true;
      revert?.();
    };
  }, []);

  return (
    <div className="burst riddle-sheet" ref={root}>
      <div className="burst-dots" aria-hidden="true">
        {Array.from({ length: 14 }, (_, index) => (
          <i data-dot key={index} />
        ))}
      </div>
      <p className="burst-kicker hand" data-burst>
        {kicker}
      </p>
      <p className="burst-title" data-burst>
        {title}
      </p>
      <p data-burst>{detail}</p>
    </div>
  );
}
