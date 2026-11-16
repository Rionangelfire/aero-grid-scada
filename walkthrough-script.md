# Walkthrough script — AERO-GRID SCADA simulator (avatar video)

Status: script draft only. The video clip itself is Robert's step via his
Meta AI route — no video was produced here.

## Required label (must appear wherever the video appears)

The narration is an AI voice speaking as Robert's avatar, made with AI for
fun to walk through the explanation, not his real voice.

Placement: burn this label into the video itself (on-screen text, readable
for the full clip or at minimum the opening seconds), and repeat it in the
post caption / description on every platform where the video is published
(portfolio site, GitHub README, LinkedIn). This follows the standing rule
for every AI-generated video of Robert: the narration and likeness are AI
speaking as his avatar, made for fun, not his real voice.

## Narration script (first person, ~70 seconds, ~190 words)

> This is AERO-GRID SCADA, a simulation of an airborne wind energy kite
> fleet I put together as a single web page. Everything you're seeing is
> generated locally in the browser — a sine wind model plus randomness.
> Nothing here connects to real hardware, real aircraft, or a real grid.
>
> Twelve kites fly figure-eight harvest patterns inside geofenced
> corridors, around two exclusion zones I can drag to test rerouting. The
> wind, grid generation, and risk index all update live from the sim
> itself.
>
> The right panel is where it gets interesting: six fault injections.
> Comm blackout drops the fleet into holding orbits. A squall winches
> everything to the ground. GPS spoof, tether tension, pitot corruption,
> and edge battery each degrade the fleet a different way — and every one
> of them writes an incident record with a replay snapshot.
>
> The archive is the part I'm proudest of: missions, incidents, and
> reliability numbers persisted in the browser's own database, with a
> twelve-second replay I can scrub through after any event. Save a
> mission, purge the archive, export the telemetry as JSON — it all stays
> local. Simulated fleet. Real interface thinking.

## Shot list

Captured from the running app at desktop width unless noted. Screenshot
files in `screenshots/` match shots 1–3.

| # | Time | Shot (on-screen action) | Narration cue |
|---|---|---|---|
| 1 | 0:00–0:14 | Main view, full page. Radar canvas with 12 kites, zones, telemetry pills, metric cards. | "This is AERO-GRID SCADA…" through "…or a real grid." |
| 2 | 0:14–0:28 | Hold on the radar canvas. Slow zoom or hold as kites fly the figure-8 paths; drag one exclusion zone briefly to show rerouting. | "Twelve kites fly figure-eight…" through "…from the sim itself." |
| 3 | 0:28–0:45 | Control deck. Click Comm Blackout: badges flip, kites enter amber holding orbits, power drops, log entry appears. Click again to restore. | "The right panel is where it gets interesting…" through "…with a replay snapshot." |
| 4 | 0:45–1:02 | Click Digital Twin Archive. Hold on the KPI cards and fault bars, then switch to the Mission Archive and Incident Reports tabs. Click Load Replay Snapshot on one incident, show the replay banner, then Exit. | "The archive is the part I'm proudest of…" through "…after any event." |
| 5 | 1:02–1:10 | Back on the main view. Click Export JSON (log entry appears), then hold on the full page. | "Save a mission, purge the archive…" through "…Real interface thinking." |
| 6 | 0:00–1:10 | Label overlay (all shots): the required label text, burned in. | — |

Optional closer (if the Meta AI route allows a final card): the app's own
header line — "AERO-GRID SCADA · Utility-Scale Airborne Wind Energy ATC,
Airspace & Contingency Platform" — with the simulation disclaimer from the
README's honest-framing section in the caption.

## Facts boundary

Only the following claims may be made about the app in the video, the
caption, or the post. Everything here was verified against the running app
or the audited file (see TEST-REPORT.md and SECURITY-AUDIT.md).

May claim:

- Browser-based simulation of an airborne wind energy kite fleet, single
  self-contained HTML file, no backend, no accounts.
- All telemetry is generated locally (sine wind model + randomness);
  nothing connects to real hardware, aircraft, or energy infrastructure.
- 4–24 kites (default 12) flying figure-8 patterns; two draggable
  exclusion zones; geofencing toggle with corridor repulsion.
- Six fault injections: comm blackout, severe squall, GPS spoof/drift,
  tether tension, pitot corruption, edge battery low — each with badge,
  ring highlight, log entries, and an IndexedDB incident record.
- IndexedDB persistence in the visitor's own browser: missions,
  incidents with replay snapshots, export receipts; Purge DB clears them.
- 12-second incident telemetry replay with a replay-mode banner.
- JSON export downloads a file locally and logs an export receipt.
- Reliability KPIs (availability, estimated MTBF, MTTR, energy yield) are
  computed from the simulated session only.
- The file was assembled from incomplete pastes plus a small labeled
  Torque-authored completion (battery handler ending, boot sequence,
  closing tags); verified 21/21 in headless checks.

Must NOT claim:

- Any connection to real kites, turbines, aircraft, ATC, FAA systems, or
  a power grid; any live or real-world data of any kind.
- That availability, MTBF, MTTR, or energy figures measure a real system.
- A backend, cloud service, edge deployment, distributed nodes, accounts,
  sync, or saved progress beyond the visitor's own browser.
- Operational, production, or flight-safety readiness of any kind.
- That the narration or likeness is Robert's real voice or appearance —
  the required label above governs.
