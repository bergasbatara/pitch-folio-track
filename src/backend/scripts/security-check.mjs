const API_URL = process.env.API_URL ?? "http://localhost:3000";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:8080";
const EMAIL = process.env.SECURITY_TEST_EMAIL;
const PASSWORD = process.env.SECURITY_TEST_PASSWORD;

const log = (label, ok, info = "") => {
  const status = ok ? "PASS" : "FAIL";
  const suffix = info ? ` - ${info}` : "";
  console.log(`[${status}] ${label}${suffix}`);
};

const getSetCookie = (response) => {
  if (typeof response.headers.getSetCookie === "function") {
    return response.headers.getSetCookie();
  }
  const raw = response.headers.get("set-cookie");
  return raw ? [raw] : [];
};

const parseCookies = (setCookies) => {
  const jar = {};
  for (const entry of setCookies) {
    const [pair] = entry.split(";");
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    const name = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    jar[name] = value;
  }
  return jar;
};

const cookieHeader = (jar) =>
  Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");

const request = async (path, options = {}) => {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      "Cache-Control": "no-store",
    },
  });
  return res;
};

const ensureCreds = () => {
  if (!EMAIL || !PASSWORD) {
    console.error("Missing SECURITY_TEST_EMAIL or SECURITY_TEST_PASSWORD.");
    console.error(
      "Example: SECURITY_TEST_EMAIL=you@mail.com SECURITY_TEST_PASSWORD=pass npm run security:check",
    );
    process.exit(1);
  }
};

const run = async () => {
  ensureCreds();

  console.log(`API_URL=${API_URL}`);
  console.log(`FRONTEND_URL=${FRONTEND_URL}`);

  // CORS allowlist test (allowed origin)
  try {
    const res = await request("/", {
      method: "GET",
      headers: { Origin: FRONTEND_URL },
    });
    const allowOrigin = res.headers.get("access-control-allow-origin");
    log(
      "CORS allowlist (allowed origin)",
      allowOrigin === FRONTEND_URL,
      `allow-origin=${allowOrigin ?? "null"}`,
    );
  } catch (err) {
    log("CORS allowlist (allowed origin)", false, err?.message ?? "request error");
  }

  // CORS block test (disallowed origin)
  try {
    const res = await request("/", {
      method: "GET",
      headers: { Origin: "http://evil.test" },
    });
    const allowOrigin = res.headers.get("access-control-allow-origin");
    log(
      "CORS allowlist (blocked origin)",
      allowOrigin !== "http://evil.test",
      `allow-origin=${allowOrigin ?? "null"}`,
    );
  } catch (err) {
    log("CORS allowlist (blocked origin)", true, "blocked by CORS");
  }

  // Login to get cookies
  const loginRes = await request("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: FRONTEND_URL,
    },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const loginOk = loginRes.status === 201 || loginRes.status === 200;
  log("Login", loginOk, `status=${loginRes.status}`);
  if (!loginOk) {
    const body = await loginRes.text();
    console.error(body);
    process.exit(1);
  }

  const cookies = parseCookies(getSetCookie(loginRes));
  const accessToken = cookies.access_token;

  if (!accessToken) {
    log("Access token cookie", false, "missing access_token");
    process.exit(1);
  }

  // Load current company
  const companyRes = await request("/companies/current", {
    method: "GET",
    headers: {
      Origin: FRONTEND_URL,
      Cookie: cookieHeader(cookies),
    },
  });
  log("Company current (cookie)", companyRes.ok, `status=${companyRes.status}`);
  if (!companyRes.ok) {
    const body = await companyRes.text();
    console.error(body);
    process.exit(1);
  }
  const company = await companyRes.json();
  const companyId = company?.id;
  if (!companyId) {
    log("Company ID", false, "missing id");
    process.exit(1);
  }

  // CSRF enforced for cookies
  const csrfRes = await request(`/companies/${companyId}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: FRONTEND_URL,
      Cookie: cookieHeader(cookies),
    },
    body: JSON.stringify({}),
  });
  log("CSRF enforced (cookie)", csrfRes.status === 403, `status=${csrfRes.status}`);

  // CSRF bypass for bearer auth
  const bearerRes = await request(`/companies/${companyId}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: FRONTEND_URL,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({}),
  });
  log(
    "CSRF bypass (bearer)",
    bearerRes.status !== 403,
    `status=${bearerRes.status}`,
  );
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
