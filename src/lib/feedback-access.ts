import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

export type FeedbackIdentity = { subject: string; owner: boolean };
export type FeedbackAccessConfig = {
  issuer: string;
  audience: string;
  ownerSubject: string;
};
let keySet: { issuer: string; keys: JWTVerifyGetKey } | undefined;

export function feedbackAccessConfig(): FeedbackAccessConfig | null {
  const issuer = process.env.FEEDBACK_ACCESS_ISSUER;
  const audience = process.env.FEEDBACK_ACCESS_AUDIENCE;
  const ownerSubject = process.env.FEEDBACK_OWNER_SUBJECT;
  if (
    !issuer ||
    !/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer) ||
    !audience ||
    !ownerSubject
  )
    return null;
  return { issuer, audience, ownerSubject };
}

export async function verifyFeedbackIdentity(
  token: string | null,
  config: FeedbackAccessConfig | null,
  keys?: JWTVerifyGetKey,
): Promise<FeedbackIdentity | null> {
  if (!token || token.length > 16384 || !config) return null;
  try {
    if (!keys) {
      if (keySet?.issuer !== config.issuer)
        keySet = {
          issuer: config.issuer,
          keys: createRemoteJWKSet(
            new URL(`${config.issuer}/cdn-cgi/access/certs`),
            { timeoutDuration: 5000 },
          ),
        };
      keys = keySet.keys;
    }
    const { payload } = await jwtVerify(token, keys, {
      issuer: config.issuer,
      audience: config.audience,
      algorithms: ["RS256"],
      requiredClaims: ["sub", "exp", "iat", "email"],
    });
    if (
      typeof payload.sub !== "string" ||
      !payload.sub ||
      typeof payload.email !== "string" ||
      !payload.email
    )
      return null;
    return { subject: payload.sub, owner: payload.sub === config.ownerSubject };
  } catch {
    return null;
  }
}
