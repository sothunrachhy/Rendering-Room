import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Version skew: a tab opened before a deploy, then used after it. With a deployment ID,
  // Next.js sees that the tab's version and the server's differ and loads the page fresh
  // instead of failing ("This page couldn't load"). Vercel gives every deploy its own ID;
  // locally it's unset, which turns this off. See
  // node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/deploymentId.md
  deploymentId: process.env.VERCEL_DEPLOYMENT_ID,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
