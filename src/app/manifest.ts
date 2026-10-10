import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Diamond Alibi",
    short_name: "Diamond Alibi",
    description: "The stats don't lie. Your teammates might.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#071A2B",
    theme_color: "#071A2B",
    icons: [
      {
        src: "/brand/diamond-alibi-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/diamond-alibi-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
