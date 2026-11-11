import type { MetadataRoute } from "next";

// Lets students add RoomFinder to their phone's home screen and open it like an app
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RoomFinder",
    short_name: "RoomFinder",
    description: "Find verified, affordable rooms near your university in Phnom Penh.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
