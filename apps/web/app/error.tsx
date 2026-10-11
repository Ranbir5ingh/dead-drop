"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="slip" role="alert">
      <p className="hand slip-title">The page tore.</p>
      <p>The scrapbook hit a snag. The drops are still out there.</p>
      <div className="actions">
        <button className="chunk" type="button" onClick={reset}>
          Try this page again
        </button>
      </div>
    </div>
  );
}
