type JwtKeySet = {
  currentKid: string;
  currentSecret: string;
  secretsByKid: Record<string, string>;
  allSecrets: string[];
};

export const parseJwtKeys = (rawKeys: string | undefined, legacySecret: string | undefined, label: string): JwtKeySet => {
  const trimmed = String(rawKeys ?? "").trim();
  if (trimmed) {
    const secretsByKid: Record<string, string> = {};
    const pairs = trimmed.split(",").map((p) => p.trim()).filter(Boolean);
    for (const pair of pairs) {
      const idx = pair.indexOf(":");
      if (idx === -1) {
        throw new Error(`${label} must be "kid:secret,kid2:secret2"`);
      }
      const kid = pair.slice(0, idx).trim();
      const secret = pair.slice(idx + 1).trim();
      if (!kid || !secret) {
        throw new Error(`${label} contains empty kid/secret`);
      }
      secretsByKid[kid] = secret;
    }
    const currentKid = pairs[0].slice(0, pairs[0].indexOf(":")).trim();
    const currentSecret = secretsByKid[currentKid];
    return {
      currentKid,
      currentSecret,
      secretsByKid,
      allSecrets: Object.values(secretsByKid),
    };
  }

  if (!legacySecret) {
    throw new Error(`${label} missing and legacy secret not set`);
  }
  return {
    currentKid: "legacy",
    currentSecret: legacySecret,
    secretsByKid: { legacy: legacySecret },
    allSecrets: [legacySecret],
  };
};

export const getJwtKid = (token: string): string | null => {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const headerJson = Buffer.from(parts[0], "base64url").toString("utf8");
    const header = JSON.parse(headerJson) as { kid?: unknown };
    return typeof header.kid === "string" && header.kid.trim() ? header.kid : null;
  } catch {
    return null;
  }
};
