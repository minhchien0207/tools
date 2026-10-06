# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

## Ngày lễ (multi-country)

Bundled snapshots (no browser fetch at runtime):

- `src/data/holidays-vn.json` — Việt Nam
- `src/data/holidays-jp.json` — Nhật Bản
- `src/data/holidays-us.json` — Hoa Kỳ
- `src/data/holidays-cn.json` — Trung Quốc

Refresh (requires network; CLI arg is **required** — `vn|jp|us|cn|all`):

```bash
npm run holidays:vn    # one country
npm run holidays:jp
npm run holidays:us
npm run holidays:cn
npm run holidays:all   # all four sequentially
```

Or: `node scripts/fetch-holidays.mjs <vn|jp|us|cn|all>`

On HTTP/parse/0-holidays failure for a country, that country’s existing JSON is left untouched. `holidays:all` fails the run if any country fails (earlier successes in the same run may already be written). Commit updated JSON after a successful refresh.
