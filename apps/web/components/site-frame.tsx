"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/lib/api";
import { refreshSession, useSession } from "@/lib/session";

const LINKS = [
  { href: "/hide", label: "Hide" },
  { href: "/hunt", label: "Hunt" },
  { href: "/leaderboard", label: "Board" },
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

export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready } = useSession();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  async function signOut() {
    setLeaving(true);
    try {
      await logout();
    } catch {
      /* The cookie clear is what matters. A quiet radio still logs you out locally. */
    }
    await refreshSession();
    setLeaving(false);
    router.push("/");
  }

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
        <nav className="nav" aria-label="Game">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
          {!ready ? <span className="bone bone-nav" aria-hidden="true" /> : null}
          {ready && !user ? (
            <Link href="/login" aria-current={pathname === "/login" ? "page" : undefined}>
              Log in
            </Link>
          ) : null}
          {ready && user ? (
            <button className="nav-account" type="button" onClick={() => void signOut()} disabled={leaving}>
              {leaving ? "Leaving…" : user.displayName}
            </button>
          ) : null}
        </nav>
      </header>
      <main id="content">{children}</main>
      <footer className="footer">
        <p className="outro hand">{closerFor(pathname)}</p>
        <p className="fine">Public places only. No meetings. Distance, never a pin.</p>
      </footer>
    </div>
  );
}
