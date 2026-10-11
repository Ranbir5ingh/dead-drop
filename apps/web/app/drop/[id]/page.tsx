import type { Metadata } from "next";
import { Suspense } from "react";
import { DropView } from "@/components/drop-view";
import { Unfolding } from "@/components/ui";

export const metadata: Metadata = { title: "The riddle" };

export default function DropPage() {
  return (
    <Suspense fallback={<Unfolding label="Unfolding the riddle…" />}>
      <DropView />
    </Suspense>
  );
}
