import { headers } from "next/headers";

export const diamondAlibiOrigin = "https://diamondalibi.eydrenworks.com";

const hostedOrigins = [
  "https://diamond-alibi-preview.lanternmere-wow.workers.dev",
  diamondAlibiOrigin,
];

const localOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3087",
];

export async function trustedAuthOrigin() {
  const origin = (await headers()).get("origin");
  if (!origin) return null;
  if (hostedOrigins.includes(origin)) return origin;
  if (origin === "http://127.0.0.1:3002" && process.env.DA_LOCAL_WORKER_PREVIEW === "1") return origin;
  if (process.env.NODE_ENV !== "production" && localOrigins.includes(origin)) return origin;
  return null;
}
