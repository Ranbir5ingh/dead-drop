"use client";

import { useEffect, useRef } from "react";

export default function Template({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let revert: (() => void) | undefined;
    let cancelled = false;
    void import("gsap").then(({ default: gsap }) => {
      if (cancelled || !ref.current) return;
      const ctx = gsap.context(() => {
        gsap.from(node, { opacity: 0, y: 16, duration: 0.45, ease: "power2.out" });
      });
      revert = () => ctx.revert();
    });
    return () => {
      cancelled = true;
      revert?.();
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}
