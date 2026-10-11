"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { MAX_FIND_ATTEMPTS, type DropDetail, type FindAttemptResponse } from "@deaddrop/shared";
import { PhotoField } from "@/components/photo-field";
import { SuccessBurst } from "@/components/success-burst";
import { Stamp, TrailError, Unfolding } from "@/components/ui";
import { ApiError, getDrop, submitFind } from "@/lib/api";
import { preparePhoto } from "@/lib/image";
import { useDisplayName, writeDisplayName } from "@/lib/name";

export function DropView() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const savedName = useDisplayName();
  const [name, setName] = useState<string | null>(null);
  const displayName = name ?? savedName;
  const [drop, setDrop] = useState<DropDetail | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [phase, setPhase] = useState<"read" | "camera" | "sending" | "done">("read");
  const [verdict, setVerdict] = useState<FindAttemptResponse | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void getDrop(id)
      .then((row) => {
        if (cancelled) return;
        setDrop(row);
        setError(null);
        setLoadedFor(id);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setDrop(null);
        setError(caught instanceof ApiError ? caught.message : "That riddle did not unfold.");
        setLoadedFor(id);
      });
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  async function judge(event: React.FormEvent) {
    event.preventDefault();
    if (!drop || !photo) return;
    setPhase("sending");
    setError(null);
    try {
      const prepared = await preparePhoto(photo);
      const result = await submitFind(drop.id, displayName, prepared);
      writeDisplayName(displayName);
      setVerdict(result);
      setPhase("done");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "The referee did not answer.");
      setPhase("camera");
    }
  }

  if (loadedFor !== id) return <Unfolding label="Unfolding the riddle…" />;
  if (error || !drop) {
    return (
      <TrailError
        message={error ?? "That riddle did not unfold."}
        onRetry={() => {
          setError(null);
          setLoadedFor(null);
          setAttempt((value) => value + 1);
        }}
      />
    );
  }

  return (
    <div>
      <p className="eyebrow">{drop.seeded ? "a sample, not a stash" : "no map from here"}</p>
      <h1>{drop.areaName}</h1>
      <article className="riddle-sheet section">
        <div className="meta">
          <div>
            <p className="area">Hidden by {drop.hiderName}</p>
            <p className="quiet">
              {drop.findCount} {drop.findCount === 1 ? "find" : "finds"} · {drop.status === "open" ? "Live" : "Retired"}
            </p>
          </div>
          <Stamp difficulty={drop.difficulty} />
        </div>
        <p className="riddle">{drop.riddle}</p>
      </article>

      {drop.seeded ? (
        <div className="slip">
          <p className="hand slip-title">Nothing is waiting out there.</p>
          <p>
            This riddle is sample ink so the board is not empty on a new database. It cannot be
            scored. Hide a real object if you want the walk.
          </p>
          <div className="actions">
            <Link className="chunk" href="/hide">
              Hide a real one
            </Link>
          </div>
        </div>
      ) : null}

      {!drop.seeded && phase === "read" ? (
        <div className="section">
          <p>Read it once more. Then search with your eyes, not this screen.</p>
          <div className="actions">
            <button className="chunk" type="button" onClick={() => setPhase("camera")}>
              I found it
            </button>
          </div>
        </div>
      ) : null}

      {!drop.seeded && (phase === "camera" || phase === "sending") ? (
        <form className="section" onSubmit={(event) => void judge(event)}>
          <div className="slip">
            <p className="hand slip-title">The referee has to see it.</p>
            <p>
              Your photo is sent to the server. On the public demo, that server asks Gemma at
              Google AI Studio, so the picture leaves your phone. A local Ollama referee keeps
              that hop on the machine running the API. No faces. No house numbers. Uncertainty is
              a no.
            </p>
          </div>
          <label className="field">
            <span>Display name</span>
            <input
              value={displayName}
              onChange={(event) => setName(event.target.value)}
              maxLength={40}
              required
            />
          </label>
          <PhotoField
            label="Photo of the object"
            hint="Fill the frame with the thing itself. A couch photo will not pass."
            onPhoto={setPhoto}
          />
          {error ? <TrailError message={error} /> : null}
          {phase === "sending" ? <p className="hand loading-line">The referee is looking…</p> : null}
          <div className="actions">
            <button className="chunk" type="submit" disabled={!photo || phase === "sending"}>
              Ask the referee
            </button>
          </div>
        </form>
      ) : null}

      {!drop.seeded && phase === "done" && verdict ? (
        <div className="section" aria-live="polite">
          {verdict.match ? (
            <>
              <SuccessBurst
                kicker="verified"
                title={`+${verdict.pointsAwarded}`}
                detail={`${verdict.reason} ${drop.hiderName} scores ${verdict.hiderPointsAwarded} too. Leave the object where it is.`}
              />
              <div className="actions">
                <Link className="chunk" href="/hide">
                  Hide one for someone else
                </Link>
              </div>
            </>
          ) : (
            <div className="slip">
              <p className="hand slip-title">Not this time.</p>
              <p>{verdict.reason}</p>
              <p className="quiet">
                {verdict.attemptsRemaining > 0
                  ? `${verdict.attemptsRemaining} of ${MAX_FIND_ATTEMPTS} looks left. Walk once around it, or leave it for someone else.`
                  : "That's three looks. Leave this one for the next person."}
              </p>
              <div className="actions">
                {verdict.attemptsRemaining > 0 ? (
                  <button
                    className="chunk"
                    type="button"
                    onClick={() => {
                      setPhoto(null);
                      setVerdict(null);
                      setPhase("camera");
                    }}
                  >
                    Try a closer photo
                  </button>
                ) : (
                  <Link className="chunk" href="/hide">
                    Hide one of your own
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
