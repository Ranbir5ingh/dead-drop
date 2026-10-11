"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageSkeleton } from "@/components/ui";
import { logout } from "@/lib/api";
import { refreshSession, useSession } from "@/lib/session";

const GAME = [
  { href: "/hide", label: "Hide" },
  { href: "/hunt", label: "Hunt" },
  { href: "/leaderboard", label: "Board" },
];

const GUEST = [
  { href: "/login", label: "Log in" },
  { href: "/signup", label: "Sign up" },
];

function closerFor(pathname: string): string {
  if (pathname.startsWith("/hide")) return "Place it. Then put the phone away.";
  if (pathname.startsWith("/hunt")) return "One riddle is enough. Go outside.";
  if (pathname.startsWith("/drop")) return "Read it once. Then look with your eyes.";
  if (pathname.startsWith("/leaderboard")) return "Ranks are a souvenir. The walk was the point.";
  if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
    return "A name on the board is an account, not a nickname.";
  }
  return "The useful part happens with the screen off.";
}

function isProtected(pathname: string): boolean {
  return ["/hide", "/hunt", "/leaderboard", "/drop"].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function isCurrent(pathname: string, href: string): boolean {
  if (href === "/hunt") return pathname === "/hunt" || pathname.startsWith("/drop");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready } = useSession();
  const [leaving, setLeaving] = useState(false);
  const locked = isProtected(pathname);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!ready || !locked || user) return;
    router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [ready, locked, user, pathname, router]);

  async function signOut() {
    setLeaving(true);
    try {
      await logout();
    } catch {
      /* Clearing the cookies is what ends the session. */
    }
    await refreshSession();
    setLeaving(false);
    router.push("/");
  }

  const items = user ? GAME : GUEST;

  return (
    <div className="shell">
      <a className="skip" href="#content">
        Skip to the trail
      </a>
      <header className="topbar">
        <Link className="wordmark" href="/">
          <span className="pin-dot" aria-hidden="true" />
          Dead Drop
        </Link>
      </header>
      <main id="content">{locked && (!ready || !user) ? <PageSkeleton /> : children}</main>
      <footer className="footer">
        <p className="outro hand">{closerFor(pathname)}</p>
        <p className="fine">Public places only. No meetings. Distance, never a pin.</p>
      </footer>
      <nav className="dock" aria-label="Game">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
        {user ? (
          <button type="button" onClick={() => void signOut()} disabled={leaving}>
            {leaving ? "Leaving…" : user.displayName}
          </button>
        ) : null}
      </nav>
    </div>
  );
}
