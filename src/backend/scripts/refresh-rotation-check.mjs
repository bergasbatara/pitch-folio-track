import { execFileSync } from "node:child_process";
import os from "node:os";
import { join } from "node:path";

const API_URL = process.env.API_URL ?? "http://localhost:3000";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:8080";
const STRONG_PASSWORD = process.env.SECURITY_STRONG_PASSWORD ?? "Strong#Pass1";

const log = (label, ok, info = "") => {
  const status = ok ? "PASS" : "FAIL";
  const suffix = info ? ` - ${info}` : "";
  console.log(`[${status}] ${label}${suffix}`);
};

const runCurl = (args) => {
  return execFileSync("curl", args, { encoding: "utf8" });
};

const parseStatus = (raw) => {
  const match = raw.match(/HTTP\/\d\.\d\s+(\d{3})/);
  return match ? Number(match[1]) : 0;
};

const parseSetCookieValue = (raw, name) => {
  const re = new RegExp(`^Set-Cookie:\\s*${name}=([^;]+)`, "im");
  const match = raw.match(re);
  return match ? match[1] : null;
};

const run = () => {
  console.log(`API_URL=${API_URL}`);
  console.log(`FRONTEND_URL=${FRONTEND_URL}`);

  const email = `rotation-check-${Date.now()}@example.com`;
  const name = "Rotation Check";
  const cookieFile = join(os.tmpdir(), `rotation-cookies-${Date.now()}.txt`);

  // Register → write cookies to jar
  const regRaw = runCurl([
    "-i",
    "-s",
    "-c",
    cookieFile,
    "-X",
    "POST",
    `${API_URL}/auth/register`,
    "-H",
    `Origin: ${FRONTEND_URL}`,
    "-H",
    "Content-Type: application/json",
    "-d",
    JSON.stringify({ email, password: STRONG_PASSWORD, name }),
  ]);
  const regStatus = parseStatus(regRaw);
  log("Register", regStatus === 201 || regStatus === 200, `status=${regStatus}`);
  if (!(regStatus === 201 || regStatus === 200)) process.exit(1);

  const oldRefresh = parseSetCookieValue(regRaw, "refresh_token");
  log("Initial refresh token issued", !!oldRefresh);
  if (!oldRefresh) process.exit(1);

  // Refresh → rotate token, update jar
  const refreshRaw = runCurl([
    "-i",
    "-s",
    "-b",
    cookieFile,
    "-c",
    cookieFile,
    "-X",
    "POST",
    `${API_URL}/auth/refresh`,
    "-H",
    `Origin: ${FRONTEND_URL}`,
  ]);
  const refreshStatus = parseStatus(refreshRaw);
  log("Refresh", refreshStatus === 201 || refreshStatus === 200, `status=${refreshStatus}`);
  if (!(refreshStatus === 201 || refreshStatus === 200)) process.exit(1);

  const newRefresh = parseSetCookieValue(refreshRaw, "refresh_token");
  log("Refresh token rotates", !!newRefresh && newRefresh !== oldRefresh);
  if (!newRefresh) process.exit(1);

  // Reuse old refresh token via body, WITHOUT cookies → must be 401
  const reuseRaw = runCurl([
    "-i",
    "-s",
    "-X",
    "POST",
    `${API_URL}/auth/refresh`,
    "-H",
    `Origin: ${FRONTEND_URL}`,
    "-H",
    "Content-Type: application/json",
    "-d",
    JSON.stringify({ refreshToken: oldRefresh }),
  ]);
  const reuseStatus = parseStatus(reuseRaw);
  log("Reuse old refresh token rejected", reuseStatus === 401, `status=${reuseStatus}`);

  // After reuse detection, the session (newRefresh) should be invalidated too → 401
  const afterRaw = runCurl([
    "-i",
    "-s",
    "-b",
    cookieFile,
    "-X",
    "POST",
    `${API_URL}/auth/refresh`,
    "-H",
    `Origin: ${FRONTEND_URL}`,
  ]);
  const afterStatus = parseStatus(afterRaw);
  log("Session invalidated after reuse", afterStatus === 401, `status=${afterStatus}`);

  console.log(`Note: test user ${email} was created for this check.`);
};

try {
  run();
} catch (err) {
  console.error(err?.message ?? err);
  process.exit(1);
}
