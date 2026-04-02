import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = new URL("../src", import.meta.url).pathname;
const DTO_DIRS = ["auth", "products", "sales", "purchases", "receivables", "customers", "suppliers", "taxes", "fixed-assets", "accounts", "journals", "profile", "companies", "subscriptions", "plans"];

const decorators = [
  "@Is",
  "@Validate",
  "@Matches",
  "@Min",
  "@Max",
  "@Length",
  "@IsOptional",
  "@Transform",
];

const hasValidationDecorators = (content) => decorators.some((d) => content.includes(d));

const scanDir = async (dir) => {
  const full = join(ROOT, dir, "dto");
  try {
    const files = await readdir(full);
    const dtos = files.filter((f) => f.endsWith(".ts"));
    const results = [];
    for (const file of dtos) {
      const content = await readFile(join(full, file), "utf8");
      results.push({ file: join(dir, "dto", file), ok: hasValidationDecorators(content) });
    }
    return results;
  } catch {
    return [];
  }
};

const run = async () => {
  const all = [];
  for (const dir of DTO_DIRS) {
    const res = await scanDir(dir);
    all.push(...res);
  }
  const missing = all.filter((r) => !r.ok);
  console.log(`Scanned ${all.length} DTO files.`);
  if (missing.length) {
    console.log("Potential DTOs without validation decorators:");
    for (const entry of missing) {
      console.log(`- ${entry.file}`);
    }
    process.exit(1);
  }
  console.log("All DTOs appear to include validation decorators.");
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
