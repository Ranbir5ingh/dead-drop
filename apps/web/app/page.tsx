import type { Metadata } from "next";
import { FoundMoment } from "@/components/found-moment";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { Doodle } from "@/components/ui";

export const metadata: Metadata = {
  title: "Hide treasure. Hunt others'.",
};

export default function HomePage() {
  return (
    <>
      <FoundMoment />
      <Hero />
      <Doodle />
      <HowItWorks />
      <section className="slip">
        <h2 className="hand slip-title">Public ground, not a meetup</h2>
        <p>
          Dead Drop never introduces you to the other player and never arranges a meeting. You
          are looking for objects, not people. Hide things only in public places you are allowed
          to be. Never on a private doorstep. Never anything dangerous, perishable, or that you
          would mind a stranger picking up and putting back.
        </p>
        <p>
          On the hosted demo, find-photos are sent to Google AI Studio so Gemma can referee them.
          The riddle never includes an address, a phone number, or coordinates. The exact spot
          stays in your head.
        </p>
      </section>
    </>
  );
}
