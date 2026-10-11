"use client";

import { useEffect, useRef } from "react";

const STEPS = [
  {
    n: "01",
    title: "Hide",
    body: "Sign in, pick a real park, and describe the vicinity. The referee inks a riddle. The pin stays off the card.",
  },
  {
    n: "02",
    title: "Hunt",
    body: "This phone asks for riddles within 8 km. You see distance, never a pin. Then you look with your eyes.",
  },
  {
    n: "03",
    title: "Found",
    body: "Photograph it under your account. The referee is strict and sometimes says no. A real match scores both of you.",
  },
];

export function HowItWorks() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let revert: (() => void) | undefined;
    let cancelled = false;
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ default: gsap }, { ScrollTrigger }]) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        const ctx = gsap.context(() => {
          gsap.from("[data-step]", {
            scrollTrigger: { trigger: node, start: "top 80%" },
            y: 36,
            opacity: 0,
            stagger: 0.14,
            duration: 0.7,
            ease: "power2.out",
          });
        }, node);
        revert = () => ctx.revert();
      },
    );
    return () => {
      cancelled = true;
      revert?.();
    };
  }, []);

  return (
    <section className="section" id="how" ref={root}>
      <p className="eyebrow">01 — the walk</p>
      <h2>Three beats, then the outdoors</h2>
      <div className="steps">
        {STEPS.map((step) => (
          <article className="step" data-step key={step.n}>
            <div className="step-num">{step.n}</div>
            <h3>{step.title}</h3>
            <p className="quiet">{step.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
