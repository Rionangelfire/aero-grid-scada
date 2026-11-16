# Test report — AERO-GRID SCADA simulator

Date: November 16, 2026. Harness: `harness-test.js` in this directory,
puppeteer-core 25.17.0 driving Chromium `/opt/meta-chromium/chrome`
(headless). Assembled file: `index.html`, 1,993 lines, 104,750 bytes,
md5 `1961e9dbf8bcd632c687c5e83b128ef0`.

**Result: 21/21 checks passed. Zero non-CDN console/page errors.**

## Which file each check ran against

The deliverable keeps its CDN links (Tailwind Play CDN, Google Fonts).
Headless Chromium in this sandbox cannot reach CDNs, and loopback HTTP
serving is blocked by the sandbox's local-network-access checks, so the
harness loads pages via `file://`. A probe confirmed `file://` is a secure
context here with working `crypto.randomUUID` and IndexedDB read/write.

- **Check 1 + all screenshots** ran against a styled copy at
  `/tmp/aerogrid-styled/index.html`, which differs from the deliverable in
  exactly 2 lines: the Tailwind script src points at a local copy of the
  Play CDN build, and the Google Fonts link points at a local CSS file with
  13 locally downloaded woff2 fonts (zero remaining remote references).
  This copy exists only to verify styled rendering; it was never modified
  into the deliverable, and the deliverable was never modified to pass a
  test.
- **Checks 2–21** ran against the deliverable itself,
  `~/workspace/portfolio/aero-grid-scada/index.html`, loaded via `file://`.
  Without Tailwind, the page is unstyled in this run (layout collapses, the
  canvas is shorter), but every element, handler, and IndexedDB operation
  is the real deliverable code. Console output was filtered for the two
  known CDN failure patterns (`ERR_TUNNEL_CONNECTION_FAILED`,
  `Failed to load resource` / `net::ERR_`); the "non-CDN errors" count
  below is what remains after that filter. Zero remained.

## Per-check results

| # | Check | File | Result | Evidence |
|---|---|---|---|---|
| 1 | Page loads, zero console/page errors | styled copy | PASS | 0 console errors, 0 page errors, 0 warnings; Tailwind compiled (`--tw-` style present); body font Inter; boot log present |
| 2 | Canvas draws non-blank pixels | deliverable | PASS | Canvas 1264×154 (unstyled height), 14,610 lit pixels of 61,600 sampled |
| 3 | `metric-nominal` shows 12 | deliverable | PASS | `nominal=12` |
| 4 | Telemetry pills change over time | deliverable | PASS | `15.3 m/s\|5.16 MW` → `14.1 m/s\|3.99 MW` over 1.6 s |
| 5 | Comm Blackout toggles badge + ring + log, restores | deliverable | PASS | OFF→ACTIVE→OFF, ring-amber-400/60 + ring-2 on/off, `FLEET COMM BLACKOUT` + restore log |
| 6 | 32 m/s Squall toggles badge + ring + log, restores | deliverable | PASS | CALM→SQUALL→CALM, ring-purple-400/60, `MICROBURST ALERT` + `Squall subsided` |
| 7 | GPS Spoof/Drift toggles badge + ring + log, restores | deliverable | PASS | OFF→DRIFT→OFF, ring-rose-400/60, `GNSS SPOOF` + `GNSS integrity verified` |
| 8 | Tether Tension toggles badge + ring + log, restores | deliverable | PASS | NOM→RECALL→NOM, ring-orange-400/60, `TETHER TENSION ANOMALY` + `Tether tension nominal` |
| 9 | Pitot Corruption toggles badge + ring + log, restores | deliverable | PASS | OFF→NOISE→OFF, ring-cyan-400/60, `PITOT SENSOR CORRUPTION` + `Pitot-static sensor fusion stabilized` (V1-sourced completion) |
| 10 | Edge Battery Low toggles badge + ring + log, restores | deliverable | PASS | 100%→LOW→100%, ring-yellow-400/60, `EDGE BATTERY LOW` + `Edge battery nominal` (**Torque-authored completion**) |
| 11 | Density slider to 24 updates label | deliverable | PASS | Label `24 Kites`, no errors; restored to 12 |
| 12 | Geofence toggle off/on logs correctly | deliverable | PASS | `Geofencing DISABLED` then `Geofencing & Exclusion Avoidance ENABLED` |
| 13 | All 4 layer toggles work | deliverable | PASS | Geofences, Airspace Layer, Risk Heatmap, Paths all toggle class state and restore |
| 14 | Archive modal: KPIs render, 3 tabs switch, closes | deliverable | PASS | Availability 100.0%, Estimated MTBF 2s, MTTR 2.8s, Energy 0.017 MWh, 2 mission rows; Missions/Incidents/Analytics tabs all switch; closes |
| 15 | Save Mission writes IndexedDB `missions` record + log | deliverable | PASS | missions 0→1, record id `MSN-9BC791F0`, commit log entry present |
| 16 | Fault activation writes incident with replay snapshot | deliverable | PASS | New record cause `Comm Blackout`, replay snapshot 90 frames (3 s at ~30 fps) |
| 17 | Replay Event shows banner + REPLAY BUFFER badge, Exit restores | deliverable | PASS | Banner shown + badge `REPLAY BUFFER`; Exit restores banner hidden + `LIVE TELEMETRY` |
| 18 | Reset writes new-session log, resets badges | deliverable | PASS | `New Digital Twin session MSN-5B118F9B`; badges `OFF,CALM,OFF,NOM,OFF,100%` |
| 19 | Purge shows confirm; accepting clears stores | deliverable | PASS | Confirm dialog shown (`Delete all archived missions…`); after accept: incidents 0, exports 0, purge log present. Missions = 1 because the dashboard refresh re-saves the current mission — by design, not a failure. |
| 20 | Viewport resize causes no errors | deliverable | PASS | 900×700 → 1280×900, page errors 0 before and after |
| 21 | Export JSON produces log entry, no errors | deliverable | PASS | `Exported Digital Twin telemetry` log present, page errors 0 |

Static verification (before the headless run): `node --check` on the
extracted inline script — PASS. Marker grep — DOCTYPE ×1, `</html>` ×1,
six fault handlers ×1 each, btnReset ×1, `initDB()` ×2, resize listener ×1,
zero `<!-- ... existing code ... -->` placeholders.

## Screenshots

Saved in `screenshots/` (from the styled copy, 1280×900):

- `styled-main.jpg` — main view: radar canvas with 12 kites, FAA-D1/TFR-09
  zones, telemetry pills, metric cards, control deck, boot log line with a
  `MSN-XXXXXXXX` mission ID.
- `styled-fault.jpg` — Comm Blackout active: all 12 kites in amber holding
  orbits, Edge Holding 12, grid generation dropped, blackout log entry.
- `styled-archive.jpg` — archive modal: KPI cards, power-trend chart, fault
  frequency bars (Comm Blackout: 1, from the styled run's own fault click —
  real persisted data).

## Honest limitations

- The CDN limitation: checks 2–21 ran without Tailwind/Fonts loaded, so
  styled layout was verified only on the styled copy (check 1 and the
  screenshots). The styled copy is line-identical to the deliverable except
  the two CDN→local swaps.
- The Export JSON download file itself was not captured in headless Chrome
  (blob downloads do not land in the harness download directory); check 21
  verifies the log entry and the absence of errors, not the downloaded
  file's bytes. The export path (Blob + anchor click + IndexedDB receipt)
  was read in the source and the receipt write is covered by the same
  IndexedDB machinery verified in checks 15/16.
- The harness runs one browser session per file; long-session behavior
  (hours of runtime, large IndexedDB growth) was not tested.
- The proximity-breach auto-logger fires during normal runs (kites near
  zones at startup), so the incidents store accumulates proximity records
  alongside fault records; check 16 accounts for this by diffing record
  IDs. This is the app's own behavior, not a test artifact.
- Not tested: touch/drag interaction on the canvas (zone dragging, kite
  clicking), keyboard-only use, or any browser other than the harness
  Chromium. Those paths exist in the source and were read, not exercised.
