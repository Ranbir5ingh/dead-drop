"use client";

import { useEffect, useRef } from "react";

const STEPS = [
  {
    n: "01",
    title: "Hide",
    body: "Describe the vicinity and the object. You keep the exact spot. The referee inks a riddle and refuses to draw a map.",
  },
  {
    n: "02",
    title: "Hunt",
    body: "Read one riddle. Put the phone in a pocket. Look with your eyes until the place agrees with the words.",
  },
  {
    n: "03",
    title: "Found",
    body: "Photograph it. The referee is strict and sometimes says no. A real match scores both of you. Leave the object where it is.",
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
