// AERO-GRID SCADA headless verification harness.
// Loads the deliverable and a styled /tmp copy (local Tailwind + Fonts) via
// file:// — loopback HTTP is blocked by this sandbox's local-network-access
// checks, and a probe confirmed file:// is a secure context here with working
// IndexedDB + crypto.randomUUID. The styled copy differs from the deliverable
// in exactly 2 lines (CDN script/link swapped for local files).
const puppeteer = require('/home/hatch/workspace/.harness/node_modules/puppeteer-core');
const crypto = require('crypto');
const fs = require('fs');

const POLICY_PATH = '/home/hatch/workspace/.harness/webgl-policy.txt';
const POLICY_SHA = crypto.createHash('sha256').update(fs.readFileSync(POLICY_PATH)).digest('hex');
const PROJ_DIR = '/home/hatch/workspace/portfolio/aero-grid-scada';
const STYLED_DIR = '/tmp/aerogrid-styled';
const OUT = PROJ_DIR + '/screenshots';
fs.mkdirSync(OUT, { recursive: true });

const results = [];
function check(num, name, pass, evidence) {
  results.push({ num, name, pass: !!pass, evidence: String(evidence).slice(0, 240) });
  console.log((pass ? 'PASS' : 'FAIL') + ' | #' + num + ' ' + name + ' | ' + String(evidence).slice(0, 240));
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const CDN_NOISE = m => m.includes('ERR_TUNNEL_CONNECTION_FAILED') || m.includes('Failed to load resource') || m.includes('net::ERR_');

const IDB_READ = store => `
  (async () => {
    const db = await new Promise((res, rej) => {
      const q = indexedDB.open('AeroGridDigitalTwinDB', 1);
      q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error);
    });
    const rows = await new Promise((res, rej) => {
      const q = db.transaction(${JSON.stringify(store)}, 'readonly').objectStore(${JSON.stringify(store)}).getAll();
      q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error);
    });
    db.close();
    return rows;
  })()`;

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/opt/meta-chromium/chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-device-scale-factor=1', '--no-proxy-server',
      '--disable-features=LocalNetworkAccessChecks,BlockInsecurePrivateNetworkRequests',
      '--hatch-webgl-allowed-domains-file=' + POLICY_PATH,
      '--hatch-webgl-allowed-domains-sha256=' + POLICY_SHA],
  });

  // ---------- STYLED COPY: check 1 + screenshots ----------
  {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    const errs = [], pageErrs = [], warns = [];
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); else if (m.type() === 'warning') warns.push(m.text()); });
    page.on('pageerror', e => pageErrs.push(String(e)));
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto('file://' + STYLED_DIR + '/index.html', { waitUntil: 'load', timeout: 45000 });
    await sleep(4500); // Tailwind Play CDN compiles in-browser
    const tw = await page.evaluate(() => ({
      twStyle: [...document.querySelectorAll('style')].some(s => s.textContent.includes('--tw-')),
      headerBg: getComputedStyle(document.querySelector('header')).backgroundColor,
      bodyFont: getComputedStyle(document.body).fontFamily.slice(0, 30),
      modalHidden: document.getElementById('archive-modal').classList.contains('hidden'),
      log0: document.getElementById('event-log').textContent.includes('Digital Twin online'),
    }));
    check(1, 'styled copy loads, zero console/page errors', errs.length === 0 && pageErrs.length === 0 && tw.twStyle && tw.log0,
      'consoleErrors=' + errs.length + ' pageErrors=' + pageErrs.length + ' warnings=' + warns.length + ' tw=' + tw.twStyle + ' font=' + tw.bodyFont + ' bootlog=' + tw.log0 + ' | ' + errs.concat(pageErrs).join(' ; '));
    await page.screenshot({ path: OUT + '/styled-main.jpg', type: 'jpeg', quality: 80 });
    await page.click('#btn-comm-drop');
    await sleep(700);
    await page.screenshot({ path: OUT + '/styled-fault.jpg', type: 'jpeg', quality: 80 });
    await page.click('#btn-comm-drop');
    await page.click('#btn-open-archive');
    await sleep(700);
    await page.screenshot({ path: OUT + '/styled-archive.jpg', type: 'jpeg', quality: 80 });
    await ctx.close();
  }

  // ---------- DELIVERABLE: checks 2-21 ----------
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  const errs = [], pageErrs = [];
  page.on('console', m => { if (m.type() === 'error' && !CDN_NOISE(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => pageErrs.push(String(e)));
  const dialogs = [];
  page.on('dialog', async d => { dialogs.push(d.message()); await d.accept(); });
  try {
    const cdp = await page.createCDPSession();
    await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: '/tmp/aerogrid-downloads', eventsEnabled: false }).catch(() => {});
  } catch (e) { /* download behavior best-effort only */ }
  fs.mkdirSync('/tmp/aerogrid-downloads', { recursive: true });

  await page.setViewport({ width: 1280, height: 900 });
  await page.goto('file://' + PROJ_DIR + '/index.html', { waitUntil: 'load', timeout: 45000 });
  await sleep(2500);

  const logText = () => page.evaluate(() => document.getElementById('event-log').textContent);

  // #2 canvas draws non-blank pixels
  const px = await page.evaluate(() => {
    const c = document.getElementById('simCanvas');
    const g = c.getContext('2d');
    const d = g.getImageData(0, 0, Math.min(c.width, 400), Math.min(c.height, 300)).data;
    let lit = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 60) lit++;
    return { w: c.width, h: c.height, lit, total: d.length / 4 };
  });
  check(2, 'canvas draws non-blank pixels', px.w > 0 && px.lit > 500, JSON.stringify(px));

  // #3 metric-nominal shows 12
  const nominal = await page.evaluate(() => document.getElementById('metric-nominal').textContent);
  check(3, 'metric-nominal shows 12', nominal === '12', 'nominal=' + nominal);

  // #4 telemetry pills change over time
  const t1 = await page.evaluate(() => document.getElementById('telemetry-wind').textContent + '|' + document.getElementById('telemetry-power').textContent);
  await sleep(1600);
  const t2 = await page.evaluate(() => document.getElementById('telemetry-wind').textContent + '|' + document.getElementById('telemetry-power').textContent);
  check(4, 'telemetry pills change over time', t1 !== t2, t1 + ' -> ' + t2);

  // #5-10 fault buttons
  const FAULTS = [
    { n: 5, btn: '#btn-comm-drop', badge: '#badge-comm', off: 'OFF', on: 'ACTIVE', ring: 'ring-amber-400/60', act: 'FLEET COMM BLACKOUT', res: 'uplink restored' },
    { n: 6, btn: '#btn-weather', badge: '#badge-weather', off: 'CALM', on: 'SQUALL', ring: 'ring-purple-400/60', act: 'MICROBURST ALERT', res: 'Squall subsided' },
    { n: 7, btn: '#btn-gps-drift', badge: '#badge-gps', off: 'OFF', on: 'DRIFT', ring: 'ring-rose-400/60', act: 'GNSS SPOOF', res: 'GNSS integrity verified' },
    { n: 8, btn: '#btn-tether-fail', badge: '#badge-tether', off: 'NOM', on: 'RECALL', ring: 'ring-orange-400/60', act: 'TETHER TENSION ANOMALY', res: 'Tether tension nominal' },
    { n: 9, btn: '#btn-sensor-corrupt', badge: '#badge-sensor', off: 'OFF', on: 'NOISE', ring: 'ring-cyan-400/60', act: 'PITOT SENSOR CORRUPTION', res: 'Pitot-static sensor fusion stabilized' },
    { n: 10, btn: '#btn-battery-fault', badge: '#badge-battery', off: '100%', on: 'LOW', ring: 'ring-yellow-400/60', act: 'EDGE BATTERY LOW', res: 'Edge battery nominal' },
  ];
  for (const f of FAULTS) {
    const before = await page.evaluate(s => document.querySelector(s).textContent, f.badge);
    await page.click(f.btn);
    await sleep(450);
    const on = await page.evaluate(f2 => ({
      badge: document.querySelector(f2.badge).textContent,
      ring: document.querySelector(f2.btn).classList.contains(f2.ring),
      ring2: document.querySelector(f2.btn).classList.contains('ring-2'),
      log: document.getElementById('event-log').textContent.includes(f2.act),
    }), f);
    await page.click(f.btn);
    await sleep(450);
    const off = await page.evaluate(f2 => ({
      badge: document.querySelector(f2.badge).textContent,
      ring: document.querySelector(f2.btn).classList.contains(f2.ring),
      log: document.getElementById('event-log').textContent.includes(f2.res),
    }), f);
    check(f.n, 'fault ' + f.btn + ' toggles badge+ring+log and restores',
      before === f.off && on.badge === f.on && on.ring && on.ring2 && on.log && off.badge === f.off && !off.ring && off.log,
      'before=' + before + ' on=' + JSON.stringify(on) + ' off=' + JSON.stringify(off));
  }

  // #11 density slider to 24
  await page.evaluate(() => {
    const s = document.getElementById('slider-density');
    s.value = '24'; s.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await sleep(400);
  const dens = await page.evaluate(() => document.getElementById('density-val').textContent);
  check(11, 'density slider to 24 updates label', dens === '24 Kites', 'label=' + dens);
  await page.evaluate(() => {
    const s = document.getElementById('slider-density');
    s.value = '12'; s.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await sleep(300);

  // #12 geofence toggle off/on
  await page.evaluate(() => document.getElementById('toggle-geofence').click());
  await sleep(300);
  const geoOff = (await logText()).includes('Geofencing DISABLED');
  await page.evaluate(() => document.getElementById('toggle-geofence').click());
  await sleep(300);
  const geoOn = (await logText()).includes('Geofencing & Exclusion Avoidance ENABLED');
  check(12, 'geofence toggle off/on logs correctly', geoOff && geoOn, 'off=' + geoOff + ' on=' + geoOn);

  // #13 layer toggles
  let layersOk = true; const layerEv = [];
  for (const id of ['#btn-show-zones', '#btn-show-airspace', '#btn-show-heatmap', '#btn-show-trails']) {
    const c0 = await page.evaluate(s => document.querySelector(s).className, id);
    await page.click(id); await sleep(150);
    const c1 = await page.evaluate(s => document.querySelector(s).className, id);
    await page.click(id); await sleep(150);
    const c2 = await page.evaluate(s => document.querySelector(s).className, id);
    const ok = c0 !== c1 && c1 !== c2 && c0 === c2;
    layersOk = layersOk && ok; layerEv.push(id + ':' + ok);
  }
  check(13, 'all 4 layer toggles work', layersOk, layerEv.join(' '));

  // #15 Save Mission writes to IndexedDB (before modal, to keep counts clean)
  const mBefore = await page.evaluate(IDB_READ('missions'));
  await page.click('#btn-commit-mission');
  await sleep(600);
  const mAfter = await page.evaluate(IDB_READ('missions'));
  const saveLog = (await logText()).includes('committed to Digital Twin IndexedDB Archive');
  check(15, 'Save Mission writes missions record + log', mAfter.length === mBefore.length + 1 && saveLog,
    'before=' + mBefore.length + ' after=' + mAfter.length + ' log=' + saveLog + ' id=' + (mAfter[mAfter.length - 1] || {}).id);

  // #16 fault activation writes incident with replay snapshot
  const iBefore = await page.evaluate(IDB_READ('incidents'));
  const idsBefore = new Set(iBefore.map(r => r.id));
  await page.click('#btn-comm-drop');
  await sleep(600);
  const iAfter = await page.evaluate(IDB_READ('incidents'));
  const fresh = iAfter.filter(r => !idsBefore.has(r.id));
  const mine = fresh.find(r => r.cause === 'Comm Blackout');
  const snapOk = mine && Array.isArray(mine.replaySnapshot) && mine.replaySnapshot.length > 0;
  check(16, 'fault activation writes incident with replay snapshot',
    !!mine && snapOk,
    'before=' + iBefore.length + ' after=' + iAfter.length + ' new=' + fresh.length + ' cause=' + (mine && mine.cause) + ' snapLen=' + ((mine && mine.replaySnapshot) || []).length);
  await page.click('#btn-comm-drop');
  await sleep(300);

  // #17 Replay Event banner + badge, Exit restores
  await page.click('#btn-replay');
  await sleep(400);
  const rep = await page.evaluate(() => ({
    banner: !document.getElementById('replay-banner').classList.contains('hidden'),
    badge: document.getElementById('system-mode-badge').textContent.includes('REPLAY BUFFER'),
  }));
  await page.click('#btn-exit-replay');
  await sleep(300);
  const repOff = await page.evaluate(() => ({
    banner: document.getElementById('replay-banner').classList.contains('hidden'),
    badge: document.getElementById('system-mode-badge').textContent.includes('LIVE TELEMETRY'),
  }));
  check(17, 'Replay shows banner+badge, Exit restores', rep.banner && rep.badge && repOff.banner && repOff.badge, JSON.stringify(rep) + ' ' + JSON.stringify(repOff));

  // #18 Reset writes new-session log, resets badges
  await page.click('#btn-reset');
  await sleep(600);
  const resetLog = await page.evaluate(() => {
    const m = document.getElementById('event-log').textContent.match(/New Digital Twin session (MSN-[A-Z0-9]+)/);
    return m ? m[1] : null;
  });
  const badges = await page.evaluate(() => ['#badge-comm', '#badge-weather', '#badge-gps', '#badge-tether', '#badge-sensor', '#badge-battery'].map(s => document.querySelector(s).textContent).join(','));
  check(18, 'Reset logs new session + resets badges', !!resetLog && badges === 'OFF,CALM,OFF,NOM,OFF,100%', 'session=' + resetLog + ' badges=' + badges);

  // #14 archive modal: KPIs, 3 tabs, close
  await page.click('#btn-open-archive');
  await sleep(600);
  const arch = await page.evaluate(() => ({
    open: !document.getElementById('archive-modal').classList.contains('hidden'),
    avail: document.getElementById('kpi-availability').textContent,
    mtbf: document.getElementById('kpi-mtbf').textContent,
    mttr: document.getElementById('kpi-mttr').textContent,
    energy: document.getElementById('kpi-energy').textContent,
    rows: document.getElementById('missions-table-body').children.length,
  }));
  const kpiOk = arch.open && /\d/.test(arch.avail) && arch.mtbf.length > 0 && arch.mttr.length > 0 && arch.energy.includes('MWh');
  const tab = async (tabName, paneId) => {
    await page.evaluate(t => document.querySelector(`[data-tab="${t}"]`).click(), tabName);
    await sleep(200);
    return page.evaluate(p => !document.getElementById(p).classList.contains('hidden'), paneId);
  };
  const tM = await tab('missions', 'tab-missions');
  const tI = await tab('incidents', 'tab-incidents');
  const tA = await tab('analytics', 'tab-analytics');
  await page.click('#btn-close-archive');
  await sleep(300);
  const closed = await page.evaluate(() => document.getElementById('archive-modal').classList.contains('hidden'));
  check(14, 'archive modal KPIs + 3 tabs + close', kpiOk && tM && tI && tA && closed, JSON.stringify(arch) + ' tabs=' + [tM, tI, tA] + ' closed=' + closed);

  // #19 Purge shows confirm; accepting clears stores
  await page.click('#btn-open-archive');
  await sleep(500);
  await page.click('#btn-clear-db');
  await sleep(700);
  const purgedLog = (await logText()).includes('Archive purged');
  const incAfter = await page.evaluate(IDB_READ('incidents'));
  const expAfter = await page.evaluate(IDB_READ('exports'));
  const misAfter = await page.evaluate(IDB_READ('missions'));
  const dlgOk = dialogs.some(d => d.includes('Delete all archived missions'));
  check(19, 'Purge confirm shown; accept clears incidents+exports', dlgOk && purgedLog && incAfter.length === 0 && expAfter.length === 0,
    'dialog=' + dlgOk + ' log=' + purgedLog + ' incidents=' + incAfter.length + ' exports=' + expAfter.length + ' missions=' + misAfter.length + ' (dashboard re-saves current mission)');
  await page.click('#btn-close-archive');
  await sleep(200);

  // #20 viewport resize, no errors
  const errBefore = pageErrs.length;
  await page.setViewport({ width: 900, height: 700 });
  await sleep(600);
  await page.setViewport({ width: 1280, height: 900 });
  await sleep(400);
  check(20, 'viewport resize causes no errors', pageErrs.length === errBefore, 'pageErrorsBefore=' + errBefore + ' after=' + pageErrs.length);

  // #21 Export JSON click: log entry, no errors
  await page.click('#btn-export-json');
  await sleep(600);
  const expLog = (await logText()).includes('Exported Digital Twin telemetry');
  check(21, 'Export JSON produces log entry, no errors', expLog && pageErrs.length === errBefore, 'log=' + expLog + ' pageErrors=' + pageErrs.length);

  const appErrs = errs.concat(pageErrs);
  console.log('\n--- NON-CDN CONSOLE/PAGE ERRORS (deliverable run): ' + appErrs.length + ' ---');
  appErrs.forEach(m => console.log(m));
  const passed = results.filter(r => r.pass).length;
  console.log('\nSUMMARY: ' + passed + '/' + results.length + ' checks passed');
  await browser.close();
  process.exit(passed === results.length ? 0 : 1);
})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(2); });
