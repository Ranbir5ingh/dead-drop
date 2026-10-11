"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, authProviders, login, oauthStart, signup } from "@/lib/api";
import { refreshSession } from "@/lib/session";
import { TrailError } from "@/components/ui";

function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/hunt";
  return value;
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const oauthError = params.get("error");
  const next = safeNext(params.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [providers, setProviders] = useState<{ google: boolean; github: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void authProviders()
      .then((row) => {
        if (!cancelled) setProviders(row);
      })
      .catch(() => {
        if (!cancelled) setProviders({ google: false, github: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        await signup({ email, password, displayName });
      } else {
        await login({ email, password });
      }
      await refreshSession();
      router.push(next);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "The account did not open.");
      setBusy(false);
    }
  }

  return (
    <div className="auth-layout">
      <div>
        <p className="eyebrow">{mode === "signup" ? "make a name that scores" : "welcome back"}</p>
        <h1>{mode === "signup" ? "Claim a name." : "Log in."}</h1>
        <p className="deck">
          Scores stick to an account, not a nickname typed on the trail. The password is hashed.
          The session lives in a cookie the page script cannot read.
        </p>
      </div>
      <form className="auth-card" onSubmit={(event) => void submit(event)}>
        {oauthError === "oauth-off" ? (
          <TrailError message="Google and GitHub sign-in are built. This server does not have those apps connected yet. Email still opens an account." />
        ) : null}
        {oauthError && oauthError !== "oauth-off" ? (
          <TrailError message="That sign-in did not finish. Try email, or start the provider again." />
        ) : null}
        <div className="oauth-row">
          <a className="chunk paper" href={oauthStart("google")}>
            Continue with Google
          </a>
          <a className="chunk paper" href={oauthStart("github")}>
            Continue with GitHub
          </a>
        </div>
        <p className="quiet oauth-or">or use email</p>
        {providers && !providers.google && !providers.github ? (
          <p className="quiet">
            Google and GitHub use the real sign-in flow. They switch on when this server has
            client credentials. Email works now.
          </p>
        ) : null}
        {mode === "signup" ? (
          <label className="field">
            <span>Display name</span>
            <span className="hint">This is the name on the board. Letters only.</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
              minLength={2}
              maxLength={40}
              autoComplete="nickname"
            />
          </label>
        ) : null}
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label className="field">
          <span>Password</span>
          <span className="hint">At least 10 characters. Never your email.</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={mode === "signup" ? 10 : 1}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        </label>
        {error ? <TrailError message={error} /> : null}
        <button className="chunk" type="submit" disabled={busy}>
          {busy ? "Opening the gate…" : mode === "signup" ? "Create the account" : "Log in"}
        </button>
      </form>
    </div>
  );
}
