import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DMail — Custom Domain Email",
    short_name: "DMail",
    description: "Production-grade custom domain email web application.",
    start_url: "/mail/inbox",
    display: "standalone",
    background_color: "#0f0608",
    theme_color: "#8B1E2D",
    orientation: "any",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Inbox",
        url: "/mail/inbox",
        description: "Open DMail Inbox",
      },
      {
        name: "Settings",
        url: "/mail/settings",
        description: "Open DMail Settings",
      },
    ],
  };
}
