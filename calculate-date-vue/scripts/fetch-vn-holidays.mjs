// calculate-date-vue/scripts/fetch-vn-holidays.mjs
// Compat wrapper — prefer `npm run holidays:vn`.
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const script = join(dirname(fileURLToPath(import.meta.url)), "fetch-holidays.mjs");
const result = spawnSync(process.execPath, [script, "vn"], {
  stdio: "inherit",
});
process.exit(result.status ?? 1);
