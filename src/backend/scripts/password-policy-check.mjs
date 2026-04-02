const API_URL = process.env.API_URL ?? "http://localhost:3000";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:8080";
const STRONG_PASSWORD = process.env.SECURITY_STRONG_PASSWORD ?? "Strong#Pass1";
const WEAK_PASSWORD = process.env.SECURITY_WEAK_PASSWORD ?? "weak123";

const log = (label, ok, info = "") => {
  const status = ok ? "PASS" : "FAIL";
  const suffix = info ? ` - ${info}` : "";
  console.log(`[${status}] ${label}${suffix}`);
};

const request = async (path, options = {}) => {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      Origin: FRONTEND_URL,
      "Cache-Control": "no-store",
    },
  });
  return res;
};

const readJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const run = async () => {
  console.log(`API_URL=${API_URL}`);
  console.log(`FRONTEND_URL=${FRONTEND_URL}`);

  const email = `security-check-${Date.now()}@example.com`;
  const name = "Security Check";

  // Weak password should be rejected
  const weakRes = await request("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: WEAK_PASSWORD, name }),
  });
  const weakBody = await readJson(weakRes);
  log(
    "Password policy rejects weak password",
    weakRes.status === 400,
    `status=${weakRes.status}${weakBody?.message ? ` msg=${weakBody.message}` : ""}`,
  );

  // Strong password should be accepted
  const strongRes = await request("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: STRONG_PASSWORD, name }),
  });
  const strongBody = await readJson(strongRes);
  const strongOk = strongRes.status === 201 || strongRes.status === 200;
  log(
    "Password policy accepts strong password",
    strongOk,
    `status=${strongRes.status}`,
  );
  if (!strongOk) {
    console.error(strongBody);
    process.exit(1);
  }

  // Trigger lockout with 5 failed logins
  const failures = 5;
  let lastStatus = 0;
  let lastMessage = "";
  for (let i = 0; i < failures; i += 1) {
    const res = await request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "Wrong#Pass1" }),
    });
    lastStatus = res.status;
    const body = await readJson(res);
    lastMessage = body?.message ?? "";
  }

  // Attempt correct login; should be locked
  const lockedRes = await request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: STRONG_PASSWORD }),
  });
  const lockedBody = await readJson(lockedRes);
  const lockedMsg = lockedBody?.message ?? "";
  const lockoutDetected = lockedRes.status === 401 && lockedMsg.toLowerCase().includes("locked");

  log(
    "Lockout after 5 failures",
    lockoutDetected,
    `status=${lockedRes.status}${lockedMsg ? ` msg=${lockedMsg}` : ""}`,
  );

  console.log(
    `Note: test user ${email} is locked for the configured duration; this is expected.`,
  );
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
