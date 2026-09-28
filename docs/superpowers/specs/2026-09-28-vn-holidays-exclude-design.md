# Design: Loại trừ ngày lễ Việt Nam (calculate-date-vue)

**Date:** 2026-09-28  
**Status:** Approved for planning  
**Scope:** Phase 1 — Việt Nam only  
**App:** `calculate-date-vue`

## Problem

Người dùng cần loại trừ ngày nghỉ lễ khi tính khoảng ngày / cộng dồn. Hiện chỉ có loại trừ thứ trong tuần và nhập từng ngày cụ thể. Việc thêm tay các ngày Tết / lễ quốc gia dễ sót và mất thời gian.

## Goal

Cho phép bật “Loại trừ ngày lễ VN”, xem checklist các ngày nghỉ thật trong cửa sổ tính toán (mặc định đã chọn), bỏ từng ngày nếu cần, rồi đưa các ngày đã chọn vào pipeline `excludedDates` hiện có.

## Non-goals (phase 1)

- Nhiều quốc gia (Nhật, Mỹ, Singapore, …) — chỉ thiết kế chỗ mở rộng bằng file dữ liệu sau.
- Fetch ICS Google lúc runtime trên GitHub Pages (không CORS; Pages không có proxy).
- Sửa logic lõi `calculate()` ngoài việc tái sử dụng `excludedDates`.
- Đặt UI chọn lễ trên `CriteriaSummary.vue` (summary chỉ hiển thị).

## Feasibility notes (verified)

- Feed ICS công khai Google “Ngày lễ ở Việt Nam” trả về HTTP 200, ~216 sự kiện, phủ khoảng **2021–2031**.
- Phân loại hữu ích qua `DESCRIPTION`:
  - **Ngày lễ** — ngày nghỉ / nghỉ bù (dùng trong phase 1).
  - **Ngày lễ kỷ niệm** — bỏ.
  - Sự kiện kiểu **Ngày làm việc** — bỏ.
- Trình duyệt **không** gọi trực tiếp ICS được (`Access-Control-Allow-Origin` absent).
- App deploy static (GitHub Pages) → nguồn dữ liệu phase 1 là **snapshot JSON đóng gói**.

## Architecture

```
scripts/fetch-vn-holidays.mjs
        │  (dev: tải ICS → lọc → ghi JSON)
        ▼
src/data/holidays-vn.json        # { updatedAt, source, holidays: [{ date, name }] }
        │  import tĩnh (bundled — không phụ thuộc CORS / BASE_URL fetch)
        ▼
src/lib/holidays.ts              # types + filter theo cửa sổ + map dd/MM/yyyy
        │
        ▼
CalculatorForm.vue               # UI master checkbox + chip list
        │  sync selected → excludedDates
        ▼
useDateCalculator.ts             # isExcluded() đã đọc excludedDates (không đổi công thức)
        │
        ▼
CriteriaSummary.vue              # chip “Lễ VN · N” từ prop đếm sẵn
```

### Data file shape

```json
{
  "updatedAt": "2026-09-28",
  "source": "https://calendar.google.com/calendar/ical/vi.vietnamese%23holiday%40group.v.calendar.google.com/public/basic.ics",
  "holidays": [
    { "date": "2026-01-01", "name": "Tết dương lịch" }
  ]
}
```

- `date`: ISO `yyyy-MM-dd` (all-day ICS `DTSTART;VALUE=DATE`).
- Chỉ giữ event có dòng `DESCRIPTION` đầu = `Ngày lễ` (sau unfold ICS); bỏ `Ngày lễ kỷ niệm` và mọi summary/desc kiểu ngày làm việc.
- Load runtime: **import tĩnh** `src/data/holidays-vn.json` (Vite bundle). Không `fetch` ICS, không `fetch` JSON lúc mở trang.
- Script refresh: `npm run holidays:vn` ghi đè `src/data/holidays-vn.json` — chạy tay khi cần. CI cron là phase sau.

### Window rules

| Chế độ | Cửa sổ hiện list lễ |
| --- | --- |
| Khoảng ngày (`calcType === "1"`) | `[startDate, endDate]` inclusive |
| Cộng dồn (`calcType === "2"`) | Cả năm dương lịch của `startDate` |

Đổi start/end/kiểu tính → lọc lại list:

- Ngày lễ vẫn nằm trong cửa sổ mới: giữ trạng thái đã bỏ tick của user.
- Ngày lễ mới vào cửa sổ: mặc định **được chọn**.
- Ngày lễ rơi khỏi cửa sổ: không còn trong UI; nếu đã nằm trong `excludedDates` vì lễ, gỡ khỏi `excludedDates` khi sync.

### Sync model

- Nguồn chân lý khi tính toán vẫn là `excludedDates: string[]` (`dd/MM/yyyy`).
- UI lễ là bộ chọn nhanh: selected holidays được **union** vào `excludedDates`.
- Bỏ tick / tắt master → remove các ngày đó khỏi `excludedDates`.
- Trùng với ngày thêm tay: một entry duy nhất trong `excludedDates`; gỡ từ UI lễ cũng gỡ entry đó (user có thể thêm lại bằng DatePicker).

Không thêm store/ownership phức tạp trong phase 1.

## UI (CalculatorForm)

Đặt block mới **sau “Loại trừ thứ”, trước “Loại trừ ngày cụ thể”**, cùng nhịp typography/spacing hiện có.

### Master row

- Label: **Loại trừ ngày lễ VN**
- Control: **checkbox** native (hoặc styled checkbox) màu `#0071e3`, phản hồi tức thì trên press (`active:scale` như chip hiện có). Không dùng switch riêng trong phase 1.
- Disabled khi chưa có `startDate`. Dataset import fail ở build-time sẽ làm build/typecheck lỗi — không có nhánh “JSON thiếu” lúc runtime trừ khi tách dynamic import sau này; phase 1 coi data luôn có sau khi chạy script một lần và commit file.

### Expanded list (khi master ON)

- Chip wrap giống block loại trừ ngày cụ thể (`CalculatorForm.vue` ~L309–323).
- Mỗi chip: `dd/MM/yyyy · {name}` (tabular-nums cho ngày).
- Mặc định **tất cả selected** (fill xanh như chip excluded).
- Tap chip: toggle selected ↔ unselected (unselected = viền xám, chữ xám — vẫn thấy trong list để chọn lại).
- List dài (Tết): `max-height` + scroll; cạnh cuộn dùng fade nhẹ thay vì kẻ cứng; tôn trọng `prefers-reduced-motion` (expand = cross-fade/opacity, không spring bounce).

### Empty / error captions

- Không có lễ trong cửa sổ (master ON): “Không có ngày lễ trong khoảng này”.
- Chưa start: “Chọn ngày bắt đầu trước”.

### CriteriaSummary

- Prop mới: `vnHolidayExcludedCount: number` (App tính = số phần tử `excludedDates` nằm trong tập key lễ của cửa sổ hiện tại).
- Khi `vnHolidayExcludedCount > 0`: hiện chip **`Lễ VN · N`**.
- Không cần biết trạng thái master checkbox; không đặt UI chỉnh sửa lễ trên summary — nút **Sửa** mở lại form.

## Components / modules

| Unit | Responsibility | Depends on |
| --- | --- | --- |
| `scripts/fetch-vn-holidays.mjs` | Tải ICS, lọc “Ngày lễ”, ghi `src/data/holidays-vn.json` | Node fetch |
| `src/data/holidays-vn.json` | Snapshot đã lọc, commit vào repo | script |
| `src/lib/holidays.ts` | Types + filter theo range/year + format `dd/MM/yyyy` | `date-fns`, JSON import |
| `CalculatorForm.vue` | Master checkbox + chips; emit cập nhật `excludedDates` | `holidays.ts` |
| `App.vue` | Tính `vnHolidayExcludedCount` truyền xuống summary | `holidays.ts`, state form |
| `CriteriaSummary.vue` | Chip `Lễ VN · N` | prop `vnHolidayExcludedCount` |
| `useDateCalculator.ts` | Giữ nguyên; đã exclude theo `excludedDates` | — |

Optional nhỏ: composable `useVnHolidays(window)` nếu form phình — chỉ tách khi logic filter/sync > ~40 dòng trong SFC.

## Error handling

- Script `holidays:vn` fail (mạng/ICS lỗi) → **không** ghi đè JSON cũ; exit non-zero.
- Runtime không fetch mạng: data đi cùng bundle. Nếu `startDate` thiếu → disable checkbox + caption.
- Khoảng ngày thiếu `endDate` khi `calcType === "1"`: master vẫn bật được nếu đã có `startDate`; cửa sổ tạm = chỉ các lễ trùng `startDate` cho đến khi có `endDate` (tránh list cả năm nhầm chế độ khoảng). Có `endDate` thì dùng `[start, end]`.

## Testing

1. **Filter unit:** ICS/fixture → chỉ “Ngày lễ”; loại kỷ niệm và ngày làm việc.
2. **Window unit:** khoảng ngày vs năm cộng dồn; biên đầu/cuối inclusive.
3. **Sync unit:** bật master thêm đúng keys; bỏ tick gỡ key; tắt master gỡ hết keys lễ đang selected trong cửa sổ.
4. **UI smoke:** Tết nhiều ngày hiển thị/scroll; tính kết quả không còn ngày đã chọn; summary hiện “Lễ VN · N”.
5. **A11y/motion:** `aria-pressed` / checkbox label; reduced-motion không dùng hiệu ứng nhảy.

## Future extensions (out of scope now)

- `src/data/holidays-{cc}.json` + selector quốc gia.
- GitHub Action cron refresh snapshot từ ICS.
- Proxy/runtime ICS nếu chuyển hosting có backend.

## Success criteria

- User chọn start (và end nếu cần), bật “Loại trừ ngày lễ VN”, thấy list nghỉ thật đã tick, bỏ tick được từng ngày, bấm “Tính kết quả” → các ngày còn tick không xuất hiện trong kết quả.
- Không cần CORS/proxy trên GitHub Pages.
- Không phá flow loại trừ thứ / ngày cụ thể hiện có.
