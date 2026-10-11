"use client";

import { useEffect, useState } from "react";
import type { LeaderboardResponse } from "@deaddrop/shared";
import { HIDER_POINT_FACTOR, HUNTER_POINT_FACTOR } from "@deaddrop/shared";
import { TrailError, Unfolding } from "@/components/ui";
import { ApiError, leaderboard } from "@/lib/api";

export function LeaderboardView() {
  const [board, setBoard] = useState<LeaderboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void leaderboard()
      .then((rows) => {
        if (!cancelled) {
          setBoard(rows);
          setError(null);
        }
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(caught instanceof ApiError ? caught.message : "The board did not load.");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (error) {
    return (
      <TrailError
        message={error}
        onRetry={() => {
          setError(null);
          setAttempt((value) => value + 1);
        }}
      />
    );
  }
  if (!board) return <Unfolding label="Counting souvenirs…" />;

  const empty = board.hiders.length === 0 && board.hunters.length === 0;

  return (
    <div>
      <p className="eyebrow">scores mean a verified photo</p>
      <h1>The souvenir table</h1>
      <p className="deck">
        Hunters earn {HUNTER_POINT_FACTOR} × difficulty. Hiders earn {HIDER_POINT_FACTOR} ×
        difficulty when someone actually finds the drop. Sample riddles are not on this table.
        Nothing here expires, and nothing scolds you for a quiet week.
      </p>
      {empty ? (
        <div className="slip">
          <p className="hand slip-title">No scores yet.</p>
          <p>They start when one person hides something and another person proves they found it.</p>
        </div>
      ) : null}
      <section className="section">
        <h2>Hiders</h2>
        <BoardTable
          headers={["", "Name", "Drops", "Finds received", "Points"]}
          rows={board.hiders.map((row) => [
            String(row.rank),
            row.name,
            String(row.dropsHidden),
            String(row.findsReceived),
            String(row.points),
          ])}
          empty="No live drops from real hiders yet."
        />
      </section>
      <section className="section">
        <h2>Hunters</h2>
        <BoardTable
          headers={["", "Name", "Finds", "Avg difficulty", "Points"]}
          rows={board.hunters.map((row) => [
            String(row.rank),
            row.name,
            String(row.finds),
            row.avgDifficultyCleared.toFixed(2),
            String(row.points),
          ])}
          empty="No verified finds yet."
        />
      </section>
    </div>
  );
}

function BoardTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: string[][];
  empty: string;
}) {
  if (rows.length === 0) return <p className="quiet">{empty}</p>;
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header || "rank"} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row[1]}-${row[0]}`}>
              {row.map((cell, index) => (
                <td key={`${row[1]}-${index}`}>
                  {index === 0 ? <span className="rank">{cell}</span> : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
