# Assembly record — AERO-GRID SCADA simulator

Assembled file: `index.html` — 1,993 lines, 104,750 bytes,
md5 `1961e9dbf8bcd632c687c5e83b128ef0`.

The file was never supplied complete. It was assembled from three sources,
plus a small Torque-authored completion that Robert authorized on
Nov 16, 2026 (~03:19 CST). No sourced line was altered except the two
documented V1→V2 adaptations below. Nothing from the PDF cover sheet, the
LaTeX "CV", or the pasted assessment's proposals was implemented.

## Sources

| # | Source | File in `sources/` | Size | md5 |
|---|---|---|---|---|
| 1 | V2 paste, chat message sent 2026-11-16 03:07:40 CST (09:07:40 UTC), recovered byte-exact from the message database | `v2-paste.html` | 99,995 bytes | `3c463be4c179adae9a5bc5c4b80bbbe0` |
| 2 | V1 paste, chat message sent 2026-11-16 03:03:52 CST (09:03:52 UTC), recovered byte-exact from the message database (assessment prose excluded; code block only) | `v1-paste.html` | 99,995 bytes | `8d85a17aecbaf9db742dda93046c3319` |
| 3 | Fragment upload `Airborne_Wind_Energy_Flight_Control_Simulator_1_2wz3.html` (uploaded 3×, all byte-identical) | `fragment-upload.html` | 15,573 bytes | `d3e9837f06c6c9c5672903d531c0418f` |

The two pastes were recovered with md5-verified chunked queries against the
message database — no transcription. The fragment file's md5 was verified
on receipt and again after copying into `sources/`.

## The V2 cut point (exact)

The V2 paste ends mid-line, with no trailing newline. Its final line
(line 1902 of the paste) is exactly:

```
            ui.btnSensorCorrupt.classList.toggle('ring-2', state.sensorCorruptionAc
```

The assembled line 1902 completes it with the suffix `tive);` taken from
the tail of V1 line 1888 (the same statement in V1's sensor handler).
Everything after line 1902 in the assembled file comes from V1, the
fragment, or the Torque-authored completion.

## Line map — assembled file

| Assembled lines | Origin | Notes |
|---|---|---|
| 1–1901 | V2 paste lines 1–1901 | Byte-identical (verified by diff). |
| 1902 | V2 line 1902 prefix + V1 line 1888 suffix `tive);` | The cut line, completed. |
| 1903–1907 | V1 paste lines 1889–1893 | Sensor handler completion: ring-cyan toggle, addLog, close. Byte-identical (verified by diff). No adaptation needed: the sync/async difference lives in the listener signature and the `recordFaultEvent` call, both before V2's cut and already in V2 form. |
| 1908 | Blank separator | Follows the file's own blank-line pattern between handler blocks. No code. |
| 1909–1913 | V1 paste lines 1895–1899 | Battery handler start. TWO adaptations (see below); otherwise byte-identical. |
| 1914–1920 | **Torque-authored** | Battery handler completion (see below). Headed by a `// TORQUE-ADDED:` comment. |
| 1921 | Blank separator | Same as line 1908. |
| 1922–1971 | Fragment lines 271–320 | Complete `ui.btnReset` handler. Byte-identical (verified by diff). |
| 1972 | Blank separator | Same as line 1908. |
| 1973 | Fragment line 322 | `// Boot Digital Twin Platform` comment. Byte-identical. |
| 1974–1990 | **Torque-authored** | Boot sequence (see below). Headed by a `// TORQUE-ADDED:` comment. |
| 1991–1993 | Structural closers | `</script>`, `</body>`, `</html>`. Listed here as required; no source contained them because both pastes were truncated mid-script. |

## V1 → V2 adaptations (exactly two)

V1's handlers are synchronous; V2's are `async` with awaited
`recordFaultEvent` calls. The battery handler start taken from V1 was
adapted to the V2 pattern in exactly two places:

1. Line 1909: `ui.btnBatteryFault.addEventListener('click', () => {`
   → `ui.btnBatteryFault.addEventListener('click', async () => {`
2. Line 1911: `recordFaultEvent('Battery Fault', state.batteryFaultActive);`
   → `await recordFaultEvent('Battery Fault', state.batteryFaultActive);`

Verified by diff: those two lines are the only differences between V1
lines 1895–1899 and assembled lines 1909–1913. V1 content never overrides
a V2 revision (UUID mission IDs, async writes, "Estimated MTBF" label,
purge confirmation are all V2 and untouched).

## Torque-authored completion (exists in no source)

Authorized by Robert, Nov 16, 2026 ~03:19 CST. Each block is headed in the
file by a `// TORQUE-ADDED:` comment. Line ranges below are assembled-file
lines.

### 1. Battery handler completion — lines 1914–1920

- Lines 1914–1915: the `// TORQUE-ADDED:` comment.
- Line 1916: `ui.btnBatteryFault.classList.toggle('ring-yellow-400/60', state.batteryFaultActive);`
  The ring class is evidenced by the fragment's reset handler, which removes
  `ring-yellow-400/60` from the battery button along with the other five
  handlers' ring classes.
- Lines 1917–1919: the `addLog` ternary, following the other five handlers'
  pattern exactly (activate message / restore message, levels `'warn'` /
  `'success'`). The wording is Torque's:
  `'EDGE BATTERY LOW: Onboard autonomy degraded on affected units.'` /
  `'Edge battery nominal. Onboard autonomy restored.'`
- Line 1920: handler close `});`.

Trivial whitespace difference, recorded honestly: the other five handlers'
activate-message lines end with a trailing space after the string literal;
Torque's two addLog lines (1918–1919) do not. No functional effect.

### 2. Boot sequence — lines 1974–1990

- Lines 1974–1977: the `// TORQUE-ADDED:` comment.
- Line 1978: `window.addEventListener('resize', resizeCanvas);`
- Lines 1979–1983: `initDB().then(...)` calling `resizeCanvas()`,
  `initWindParticles()`, the startup log, and `requestAnimationFrame(animate)`.
- Lines 1984–1990: `.catch(...)` branch that still boots the sim if
  IndexedDB fails (console.error + a warn-level log + the same boot calls).

The startup log reproduces the format evidenced by the live Canvas preview
of the revised version, with the mission ID interpolated:

```
AERO-GRID Digital Twin online (${state.currentMission.id}). IndexedDB Mission & Incident Archive active.
```

The Canvas preview showed the literal string
`AERO-GRID Digital Twin online (MSN-B608DDDB). IndexedDB Mission & Incident Archive active.`
The log level `'success'` is Torque's choice, documented here and in the
code comment. The catch-branch log wording (`IndexedDB unavailable; running
without persistence.`) is Torque's.

### 3. Closing tags — lines 1991–1993

`</script>`, `</body>`, `</html>`. Structural only.

## Placement decisions (Torque's, documented)

- The reset handler sits after the battery handler and before the boot code:
  it is the last event handler, and the boot comment + sequence close the
  script. This matches the fragment's own ordering (reset handler, then the
  `// Boot Digital Twin Platform` comment).
- The boot comment on line 1973 comes from the fragment (line 322), placed
  immediately above the Torque boot sequence it introduces.

## Discarded material

- V1 paste line 1900, a partial line (`            ui.btnBatteryFault.classList.toggle`,
  no trailing newline — the V1 paste's own cut point), was DISCARDED, not
  used. The Torque completion starts fresh with the full ring-yellow line
  (assembled line 1916). Nothing in the assembled file derives from the
  partial line.
- All `<!-- ... existing code ... -->` placeholder lines in the fragment
  (lines 1, 132, 157, 233, 260, 270, 323) were excluded. Zero placeholders
  remain in the assembled file (verified by grep).
- Everything else in the fragment duplicates V2 and was not used.

## Assembly verification (static)

- `node --check` on the extracted inline script (72,793 bytes; the page has
  2 script tags: 1 Tailwind CDN + 1 inline): PASS.
- Marker grep: `<!DOCTYPE html>` ×1, `</html>` ×1, all six fault handlers ×1
  each, `btnReset` ×1, `initDB()` ×2 (definition + boot call),
  `requestAnimationFrame(animate)` ×3 (animation loop + 2 boot branches),
  resize listener ×1, `TORQUE-ADDED` ×2 blocks, boot comment ×1.
- Diffs listed in the line map above: V2 1–1901, V1 1889–1893, fragment
  271–320, and fragment line 322 are all byte-identical to their assembled
  counterparts; V1 1895–1899 differs in exactly the two adaptations.

Functional verification is in TEST-REPORT.md (21/21 checks passed).
