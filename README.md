# AERO-GRID SCADA — AWE Fleet Flight Control & Geofencing Simulator

A browser-based **simulation** of an airborne wind energy (AWE) kite fleet:
up to 24 tethered kites flying figure-8 harvest patterns inside FAA-style
exclusion zones, with geofencing, fault injection, an event log, mission
archiving, and incident replay. Single self-contained HTML file — no
backend, no accounts, no build step.

## Honest framing — read this first

- **This is a simulation.** Every kite, wind reading, power figure, and
  fault is generated locally in your browser. The wind model is a sine
  wave plus randomness; power output is a cubic wind-speed calculation
  over simulated values. Nothing here measures, controls, or connects to
  real hardware, real aircraft, or real energy infrastructure.
- **No live data.** There is no feed, no API, and no telemetry source.
  The "LIVE TELEMETRY" badge and the "AERO-GRID Digital Twin" wording are
  the app's own in-app labels for its simulated display — the numbers
  behind them are computed on the page, in real time, from the simulation
  itself.
- **Persistence is browser-local.** Missions, incidents, and export
  receipts are stored in the browser's IndexedDB on the origin serving
  the file. Nothing is uploaded or synced anywhere. Clearing the browser's
  site data (or the in-app Purge DB button) removes it.
- **Availability and reliability figures shown in the app** (fleet
  availability %, estimated MTBF, MTTR, energy yield) are computed from
  the simulated session only. They are not measurements of any real
  system, and no availability claim about any real system is made here.
- **Not for operational use.** This is a learning and demonstration
  project about SCADA-style interfaces, geofencing logic, and
  incident-archive design. It is not flight software, not a control
  system, and not connected to any airspace authority.

## What it simulates

- A fleet of tethered energy kites (4–24, default 12) flying phase-locked
  figure-8 patterns around anchor points in Sector 04-W, with two
  draggable exclusion zones (FAA-D1 airport, TFR-09 no-fly).
- Wind modeled as a sine wave with gusts; grid generation from a cubic
  wind-power relation; a risk index from proximity conflicts and active
  faults.
- Geofencing with corridor repulsion: kites steer away from exclusion
  zones when geofencing is on; turning it off lets them drift through.
- Six injectable faults: comm blackout, severe squall, GPS spoof/drift,
  tether tension, pitot sensor corruption, and edge battery low — each
  with its own fleet behavior, badge, and log entries.
- An audit event log, a persistent mission/incident archive with
  reliability KPIs, 3-second incident replay snapshots, JSON export, and
  a reset that archives the current mission and starts a fresh session.

## Architecture

One file, `index.html` (~1,993 lines), no build step:

- **Presentation:** Tailwind CSS (Play CDN) + Google Fonts (Inter,
  JetBrains Mono). A `<canvas>` radar view renders the sector, kites,
  zones, wind particles, trails, and heatmap; DOM panels render metrics,
  controls, the log, and the archive modal.
- **Simulation loop:** `requestAnimationFrame` drives `animate()`, which
  advances wind, kite physics (figure-8 paths, tether extension, fault
  fault effects, proximity detection, and the rolling telemetry history
  (~30 snapshots/second, kept for replay).
- **State:** a single `state` object (fleet, faults, mission, zones,
  audit log) plus a `ui` element cache. No framework.
- **Persistence:** IndexedDB database `AeroGridDigitalTwinDB`, version 1,
  with three stores — `missions` (keyed by mission ID), `incidents`
  (auto-increment, each with a replay snapshot), and `exports`
  (auto-increment receipts). Writes are awaited, except the proximity
  breach logger, which is fire-and-forget with a catch handler. If IndexedDB is
  unavailable, the sim still boots and runs without persistence.
- **Mission IDs:** `MSN-` + 8 hex characters from `crypto.randomUUID()`,
  with a `Math.random()` fallback.

## Controls

| Control | What it does |
|---|---|
| Geofencing toggle | Enables/disables corridor repulsion and zone avoidance |
| Fleet Density slider | 4–24 kites; re-lays out the fleet and re-indexes fault targets |
| Layer toggles | Geofences, Airspace Layer, Risk Heatmap, Paths |
| Comm Blackout | Fleet enters 52% circular holding orbits; power drops |
| 32 m/s Squall | Severe weather; kites auto-winch to ground stow |
| GPS Spoof/Drift | Positional bias on 2 units; drift rendering |
| Tether Tension | Emergency rapid recall on 2 units |
| Pitot Corruption | High-frequency wind-vector noise in flight estimators |
| Edge Battery Low | Degraded onboard autonomy on affected units |
| Click a kite | Toggles that unit's comm link (holding orbit / harvest) |
| Drag an exclusion zone | Repositions it; corridors recalculate |
| Save Mission | Writes the current mission to the IndexedDB archive |
| Digital Twin Archive | Opens the modal: reliability KPIs, mission table, incident reports, Purge DB |
| Replay Event | Replays the last 12 seconds of telemetry; Exit returns to live |
| Export JSON | Downloads the session telemetry as JSON, logs an export receipt |
| Reset | Archives the current mission, clears all faults, starts a new session |

## How to run

Open `index.html` in a modern desktop browser. Internet access is needed
for the Tailwind CSS and Google Fonts CDNs (without them the simulation
still runs, but unstyled). No server, install, or account is required.
For the full styled experience, serve or open it with internet available.

## Provenance

The file was assembled from three incomplete sources — a revised (V2)
paste, an earlier (V1) paste, and a fragment upload carrying the reset
handler — plus a small Torque-authored completion (the end of the battery
fault handler, the boot sequence, and the closing tags) that exists in no
source and is labeled `// TORQUE-ADDED:` in the file. The full provenance
map, including the exact truncation point, every sourced line range, and
the two V1→V2 adaptations, is in ASSEMBLY.md. The sources themselves are
preserved in `sources/`.

## Verification

- Static: `node --check` on the inline script passes; source diffs confirm
  every sourced section is byte-identical to its source except the two
  documented adaptations.
- Integrity: `MANIFEST.sha256` records the SHA-256 checksum of every file
  in this snapshot; verify with `sha256sum -c MANIFEST.sha256`.
- Headless: 21/21 functional checks passed in Chromium (fault toggles,
  slider, geofence, layers, archive modal, IndexedDB writes, replay,
  reset, purge, resize, export), with zero non-CDN console/page errors.
  See TEST-REPORT.md, including its honest limitations.
- Security: static audit in SECURITY-AUDIT.md — no exfiltration path, no
  user-input injection channel, no backend. Not a penetration test.

## Files

| File | Contents |
|---|---|
| `index.html` | The simulator (the deliverable) |
| `README.md` | This file |
| `ASSEMBLY.md` | Provenance map and Torque-added listing |
| `TEST-REPORT.md` | Headless verification results (21/21) |
| `SECURITY-AUDIT.md` | Static security review |
| `POLISH-NOTES.md` | What was done, and what was deliberately not changed |
| `walkthrough-script.md` | Narration script for an avatar walkthrough clip |
| `harness-test.js` | The headless verification harness |
| `MANIFEST.sha256` | SHA-256 checksums of every file in this snapshot |
| `sources/` | The three source files the assembly was built from |
| `screenshots/` | Styled main view, fault-active view, archive modal |
