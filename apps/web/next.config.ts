import path from "node:path";
import type { NextConfig } from "next";

const apiOrigin = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8787").replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Browser calls stay on this origin (`/backend/...`) so the session cookie
  // is first-party. The rewrite reaches the Nest API.
  async rewrites() {
    return [{ source: "/backend/:path*", destination: `${apiOrigin}/:path*` }];
  },
  // The dev server listens on 0.0.0.0. Browsers that open 127.0.0.1 are a
  // different host, and Next blocks their dev assets (including the HMR
  // socket) unless that host is listed. Without it, client pages stay on
  // the server shell and never load the board.
  allowedDevOrigins: ["127.0.0.1"],
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    // The shared package is linked above this app. Turbopack only resolves
    // inside its root, and this repo keeps a lockfile per app.
    root: path.join(__dirname, "../.."),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
