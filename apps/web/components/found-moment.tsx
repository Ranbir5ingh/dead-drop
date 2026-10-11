"use client";

import { useEffect, useState } from "react";
import type { HiderDrop } from "@deaddrop/shared";
import { ChunkLink } from "@/components/ui";
import { SuccessBurst } from "@/components/success-burst";
import { ApiError, myDrops } from "@/lib/api";
import { readSeenCounts, writeSeenCounts } from "@/lib/name";
import { useSession } from "@/lib/session";

export function FoundMoment() {
  const { user, ready } = useSession();
  const [fresh, setFresh] = useState<HiderDrop[]>([]);

  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;
    void myDrops()
      .then((drops) => {
        if (cancelled) return;
        const seen = readSeenCounts();
        const unseen = drops.filter((drop) => drop.findCount > (seen[drop.id] ?? 0) && drop.findCount > 0);
        if (unseen.length === 0) return;
        const next = { ...seen };
        for (const drop of drops) next[drop.id] = drop.findCount;
        writeSeenCounts(next);
        setFresh(unseen.slice(0, 3));
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError) return;
      });
    return () => {
      cancelled = true;
    };
  }, [ready, user]);

  if (fresh.length === 0) return null;
  const top = fresh[0];
  if (!top) return null;
  const points = fresh.reduce((sum, drop) => sum + drop.points, 0);

  return (
    <div className="section" aria-live="polite">
      <SuccessBurst
        kicker="variable reward, wholesome edition"
        title="Your drop was found."
        detail={
          fresh.length === 1
            ? `${top.areaName} has been found ${top.findCount} ${top.findCount === 1 ? "time" : "times"}. You scored ${points}.`
            : `${fresh.length} of your drops were found. You scored ${points}.`
        }
      />
      <div className="actions">
        <ChunkLink href="/hide">Hide the next one</ChunkLink>
        <ChunkLink href="/hunt" tone="paper">
          Or go hunt
        </ChunkLink>
      </div>
    </div>
  );
}
