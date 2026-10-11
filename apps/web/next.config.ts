import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
