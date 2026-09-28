// calculate-date-vue/scripts/lib/holidaySources.mjs

/** @typedef {"vn-ngay-le" | "all-vevents"} IncludeRule */

/**
 * @typedef {object} HolidaySource
 * @property {string} code
 * @property {string} label
 * @property {string} icsUrl
 * @property {IncludeRule} includeRule
 * @property {string} outFile
 */

/** @type {HolidaySource[]} */
export const HOLIDAY_SOURCES = [
  {
    code: "vn",
    label: "Việt Nam",
    icsUrl:
      "https://calendar.google.com/calendar/ical/vi.vietnamese%23holiday%40group.v.calendar.google.com/public/basic.ics",
    includeRule: "vn-ngay-le",
    outFile: "src/data/holidays-vn.json",
  },
  {
    code: "jp",
    label: "Nhật Bản",
    icsUrl:
      "https://calendar.google.com/calendar/ical/en.japanese.official%23holiday%40group.v.calendar.google.com/public/basic.ics",
    includeRule: "all-vevents",
    outFile: "src/data/holidays-jp.json",
  },
  {
    code: "us",
    label: "Hoa Kỳ",
    icsUrl:
      "https://calendar.google.com/calendar/ical/en.usa.official%23holiday%40group.v.calendar.google.com/public/basic.ics",
    includeRule: "all-vevents",
    outFile: "src/data/holidays-us.json",
  },
  {
    code: "cn",
    label: "Trung Quốc",
    icsUrl:
      "https://calendar.google.com/calendar/ical/en.china.official%23holiday%40group.v.calendar.google.com/public/basic.ics",
    includeRule: "all-vevents",
    outFile: "src/data/holidays-cn.json",
  },
];
