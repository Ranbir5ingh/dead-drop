"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

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
  return "The useful part happens with the screen off.";
}

export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

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
        </nav>
      </header>
      <main id="content">{children}</main>
      <footer className="footer">
        <p className="outro hand">{closerFor(pathname)}</p>
        <p className="fine">Public places only. No meetings. No exact spots on this board.</p>
      </footer>
    </div>
  );
}
