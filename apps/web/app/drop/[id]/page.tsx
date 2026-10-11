import type { Metadata } from "next";
import { Suspense } from "react";
import { DropView } from "@/components/drop-view";
import { DropSkeleton } from "@/components/ui";

export const metadata: Metadata = { title: "The riddle" };

export default function DropPage() {
  return (
    <Suspense fallback={<DropSkeleton />}>
      <DropView />
    </Suspense>
  );
}
