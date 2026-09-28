// calculate-date-vue/scripts/lib/parseVnIcs.mjs

/** @param {string} text */
export function unfoldIcs(text) {
  return text.replace(/\r?\n[ \t]/g, "");
}

/**
 * @param {string} icsText
 * @returns {{ date: string, name: string }[]}
 */
export function parseVnHolidays(icsText) {
  const text = unfoldIcs(icsText);
  const holidays = [];
  const blocks = text.split("BEGIN:VEVENT").slice(1);

  for (const block of blocks) {
    const body = block.split("END:VEVENT")[0] ?? "";
    const desc = field(body, "DESCRIPTION");
    const firstLine = (desc ?? "").split("\\n")[0].trim();
    if (firstLine !== "Ngày lễ") continue;

    const dt = field(body, "DTSTART");
    const summary = field(body, "SUMMARY");
    if (!dt || !summary) continue;

    const date = normalizeIcsDate(dt);
    if (!date) continue;

    holidays.push({ date, name: unescapeIcs(summary) });
  }

  holidays.sort((a, b) => a.date.localeCompare(b.date));
  return holidays;
}

/** @param {string} body @param {string} name */
function field(body, name) {
  const re = new RegExp(`^${name}(?:;[^:]*)?:(.*)$`, "m");
  const m = body.match(re);
  return m ? m[1].trim() : null;
}

/** @param {string} raw DTSTART value possibly with params already stripped by field() */
function normalizeIcsDate(raw) {
  // field() already stripped `DTSTART;VALUE=DATE:` → value like 20260101
  const m = raw.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

/** @param {string} value */
function unescapeIcs(value) {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}
