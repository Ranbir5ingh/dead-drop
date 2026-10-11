import Link from "next/link";
import type { Difficulty } from "@deaddrop/shared";
import { difficultyLabel } from "@/lib/labels";

export function Stamp({ difficulty }: { difficulty: Difficulty }) {
  const label = difficultyLabel(difficulty);
  return (
    <span className={`stamp stamp-${difficulty}`} aria-label={`Difficulty ${difficulty}, ${label}`}>
      <b>{difficulty}</b>
      {label}
    </span>
  );
}

export function ChunkLink({
  href,
  children,
  tone = "ink",
}: {
  href: string;
  children: React.ReactNode;
  tone?: "ink" | "paper";
}) {
  return (
    <Link className={tone === "paper" ? "chunk paper" : "chunk"} href={href}>
      {children}
    </Link>
  );
}

export function Outro({ children }: { children: React.ReactNode }) {
  return <p className="outro hand">{children}</p>;
}

export function Unfolding({ label }: { label: string }) {
  return (
    <p className="hand loading-line" role="status">
      {label}
    </p>
  );
}

export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="bone bone-kicker" />
      <div className="bone bone-title" />
      <div className="bone bone-line" />
      <div className="board">
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </div>
    </div>
  );
}

export function HuntSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <p className="eyebrow">where you are</p>
      <div className="bone bone-title" />
      <div className="bone bone-line" />
      <div className="radar" aria-hidden="true">
        <span />
      </div>
      <p className="quiet">Reading this device, then the riddles within 8 km.</p>
      <div className="board">
        <div className="skeleton-card" />
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </div>
    </div>
  );
}

export function BoardSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="bone bone-kicker" />
      <div className="bone bone-title" />
      <div className="bone bone-line" />
      <div className="skeleton-table">
        <div className="bone bone-row" />
        <div className="bone bone-row" />
        <div className="bone bone-row" />
        <div className="bone bone-row" />
      </div>
    </div>
  );
}

export function DropSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="bone bone-kicker" />
      <div className="bone bone-title" />
      <div className="skeleton-sheet" />
    </div>
  );
}

export function FormSkeleton({ label }: { label: string }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="bone bone-kicker" />
      <div className="bone bone-title" />
      <p className="quiet">{label}</p>
      <div className="bone bone-field" />
      <div className="bone bone-field" />
      <div className="bone bone-area" />
    </div>
  );
}

export function TrailError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="slip" role="alert">
      <p className="hand slip-title">The field radio is quiet.</p>
      <p>{message}</p>
      {onRetry ? (
        <div className="actions">
          <button className="chunk" type="button" onClick={onRetry}>
            Try the radio again
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function Doodle() {
  return (
    <svg className="doodle" viewBox="0 0 220 28" aria-hidden="true">
      <path
        d="M2 16 C 30 4, 40 26, 70 14 S 120 2, 150 16 190 24, 218 10"
        fill="none"
        stroke="#1b140f"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="168" cy="8" r="3" fill="#b42318" />
    </svg>
  );
}
