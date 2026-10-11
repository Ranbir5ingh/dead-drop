import type { Metadata } from "next";
import { FoundMoment } from "@/components/found-moment";
import { HideForm } from "@/components/hide-form";

export const metadata: Metadata = { title: "Hide" };

export default function HidePage() {
  return (
    <>
      <FoundMoment />
      <HideForm />
    </>
  );
}
