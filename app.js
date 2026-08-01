/* ============================================================
   Kitchen Timer — main logic
   ------------------------------------------------------------
   Key implementation points:

   • ACCURACY: each timer stores its absolute END time
     (endTime = Date.now() + duration). Every tick recomputes the
     remaining time from Date.now() — never a decremented counter,
     so there is no drift even when the browser throttles the tab.

   • PERSISTENCE: timers + config live in localStorage. After an
     accidental reload, timers resume exactly where they were
     (thanks to the absolute timestamps).

   • SORTING: the list is re-sorted ONLY when a timer is added,
     removed, finished or explicitly adjusted — never while
     counting down, so rows don't jump under the user's finger.

   • ALARM: Web Audio API, generated tones (no external files).
     It repeats as long as at least one finished timer is shown.
     Dismissing one finished timer does NOT silence the others.
     The audio context is unlocked on the first user gesture
     (a browser requirement).

   • SCREEN: Wake Lock API while any timer is running. Fallback
     if the API is missing (old browsers): set the tablet's
     screen sleep to "never" (see README).

   • I18N: every user-facing string comes from the language files
     packaged under lang/ (en = fallback, fr, zh-TW). Static HTML
     is translated via data-i18n attributes, dynamic strings via
     t(). The language is a config setting (Settings → Language).
   ============================================================ */

'use strict';

/* ---------- Constants ---------- */
const CONFIG_KEY = 'kitchenTimer.config.v1';
const TIMERS_KEY = 'kitchenTimer.timers.v1';
const TICK_MS = 250;                // display refresh period
const WARNING_MS = 60 * 1000;       // last minute → pulsing amber
const DOUBLE_TAP_MS = 400;          // accidental double-start guard
const CUSTOM_MIN_S = 10;            // minimum free duration
const CUSTOM_MAX_S = 599 * 60;

const EMOJI_PALETTE = ['🌯','🍤','🦑','🥟','🍗','🦆','🍖','🌶️','🥥','🦐','🍚','🍜','🥠','🍢','🍱','🥡','🍥','🧆','🍟','🍡','🥓','🐟','🦀','🍲','🥩','🍕'];
const COLOR_PALETTE = ['#FF9800','#F4511E','#E53935','#D81B60','#8E24AA','#5E35B1','#039BE5','#00897B','#43A047','#FDD835','#FFB74D','#A1887F','#6D4C41','#90A4AE','#EEEEEE','#FF7043'];
const CATEGORIES = ['frying', 'steaming', 'other'];
/* Backward compatibility with schemaVersion ≤ 2 French tokens */
const LEGACY_CATEGORIES = { friture: 'frying', vapeur: 'steaming', autre: 'other' };

/* ---------- Global state ---------- */
let config = null;          // configuration (same schema as the JSON export)
let timers = [];            // active timers (running OR finished, not dismissed)
let order = [];             // ids in display order, frozen between two sorts
let rows = new Map();       // id → row DOM references (fast tick updates)

let selectedTable = null;   // table number picked in the add overlay
let customSeconds = 300;    // free duration being edited
let lastStart = 0;          // last start timestamp (double-tap guard)

let pendingImport = null;   // validated config awaiting Replace/Merge choice
let iconTargetFoodId = null;// food id being edited (icon/color pickers)

let adjustId = null;        // timer id being time-adjusted (+/−)
let adjustDelta = 0;        // correction in ms, applied only on confirm
let deleteId = null;        // timer id awaiting delete confirmation
let numpadEntry = '';       // digits typed on the numpad (string, max 3)
let numpadTimerId = null;   // timer whose table is being edited (null → add overlay)

let audioCtx = null;        // Web Audio context (created on first gesture)
let masterGain = null;
let alarmInterval = null;   // alarm repeat loop
let wakeLock = null;

/* ---------- Small DOM helpers ---------- */
const $ = (id) => document.getElementById(id);

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function uid(prefix) {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ============================================================
   I18N: translation lookup + static DOM translation
   ============================================================ */

/** Returns the translated string for a key; {var} placeholders replaced. */
function t(key, vars) {
  const lang = (config && APP_LANGUAGES[config.language]) || APP_LANGUAGES.en;
  let s = lang.strings[key];
  if (s === undefined) s = APP_LANGUAGES.en.strings[key];   // English fallback
  if (s === undefined) return key;                          // last resort
  if (vars) {
    for (const k of Object.keys(vars)) s = s.split('{' + k + '}').join(vars[k]);
  }
  return s;
}

/** Translates all static HTML marked with data-i18n attributes. */
function applyTranslations() {
  document.documentElement.lang = config.language;
  document.title = t('app.windowTitle') + ' — ' + config.restaurantName;
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  /* Trusted packaged translations may contain markup (<br>, <strong>) */
  document.querySelectorAll('[data-i18n-html]').forEach((node) => {
    node.innerHTML = t(node.dataset.i18nHtml);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
}

/* ============================================================
   CONFIGURATION: load, validate, save
   ============================================================ */

/** Fills a raw config object with defaults for any missing value. */
function normalizeConfig(raw) {
  const d = DEFAULT_CONFIG;
  const c = {
    schemaVersion: 2,
    restaurantName: typeof raw.restaurantName === 'string' ? raw.restaurantName : d.restaurantName,
    language: typeof raw.language === 'string' && APP_LANGUAGES[raw.language] ? raw.language : d.language,
    sortOrder: raw.sortOrder === 'desc' ? 'desc' : 'asc',
    addMode: ['foods', 'durations', 'both'].includes(raw.addMode) ? raw.addMode : d.addMode,
    tableMax: Number.isFinite(raw.tableMax) ? Math.min(99, Math.max(1, Math.round(raw.tableMax))) : d.tableMax,
    alarmVolume: Number.isFinite(raw.alarmVolume) ? Math.min(1, Math.max(0, raw.alarmVolume)) : d.alarmVolume,
    durationPresets: Array.isArray(raw.durationPresets)
      ? raw.durationPresets.filter((m) => Number.isFinite(m) && m > 0).map((m) => Math.round(m))
      : d.durationPresets.slice(),
    foods: [],
    icons: []
  };
  /* Image icons (schemaVersion 2): { id, name, image: dataURI } */
  const rawIcons = Array.isArray(raw.icons) ? raw.icons : [];
  for (const ic of rawIcons) {
    if (!ic || typeof ic.name !== 'string' || !ic.name.trim()) continue;
    if (typeof ic.image !== 'string' || !ic.image.startsWith('data:image/')) continue;
    c.icons.push({
      id: typeof ic.id === 'string' && ic.id ? ic.id : uid('i'),
      name: ic.name.trim(),
      image: ic.image
    });
  }
  const rawFoods = Array.isArray(raw.foods) ? raw.foods : d.foods;
  for (const f of rawFoods) {
    if (!f || typeof f.name !== 'string' || !f.name.trim()) continue;
    let cat = LEGACY_CATEGORIES[f.category] || f.category;
    c.foods.push({
      id: typeof f.id === 'string' && f.id ? f.id : uid('f'),
      name: f.name.trim(),
      shortLabel: typeof f.shortLabel === 'string' && f.shortLabel.trim() ? f.shortLabel.trim() : f.name.trim().toUpperCase().slice(0, 16),
      icon: typeof f.icon === 'string' && f.icon ? f.icon : '🍽️',
      color: typeof f.color === 'string' && f.color ? f.color : '#FF9800',
      minutes: Number.isFinite(f.minutes) && f.minutes > 0 ? f.minutes : 5,
      category: CATEGORIES.includes(cat) ? cat : 'other',
      enabled: f.enabled !== false
    });
  }
  return c;
}

/** Validates an imported config file. Returns { ok: true } or { ok: false, error }. */
function validateImportedConfig(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: t('err.notConfig') };
  }
  if (raw.schemaVersion === undefined) {
    return { ok: false, error: t('err.noSchema') };
  }
  if (raw.schemaVersion !== 1 && raw.schemaVersion !== 2) {
    return { ok: false, error: t('err.badVersion', { v: raw.schemaVersion }) };
  }
  if (!Array.isArray(raw.foods)) {
    return { ok: false, error: t('err.noFoods') };
  }
  for (const f of raw.foods) {
    if (!f || typeof f.name !== 'string' || !f.name.trim()) {
      return { ok: false, error: t('err.foodNoName') };
    }
    if (f.minutes !== undefined && (!Number.isFinite(f.minutes) || f.minutes <= 0)) {
      return { ok: false, error: t('err.badDuration', { name: f.name }) };
    }
  }
  if (raw.durationPresets !== undefined && !Array.isArray(raw.durationPresets)) {
    return { ok: false, error: t('err.badPresets') };
  }
  if (raw.icons !== undefined) {
    if (!Array.isArray(raw.icons)) {
      return { ok: false, error: t('err.badIcons') };
    }
    for (const ic of raw.icons) {
      if (!ic || typeof ic.name !== 'string' || typeof ic.image !== 'string' || !ic.image.startsWith('data:image/')) {
        return { ok: false, error: t('err.badIcon') };
      }
    }
  }
  return { ok: true };
}

/** Validates a standalone icon pack (the file produced by the user's AI). */
function validateIconPack(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: t('err.notConfig') };
  }
  if (raw.type !== 'icon-pack') {
    return { ok: false, error: t('err.packNoType') };
  }
  if (raw.schemaVersion !== 1) {
    return { ok: false, error: t('err.packVersion', { v: raw.schemaVersion }) };
  }
  if (!Array.isArray(raw.icons) || !raw.icons.length) {
    return { ok: false, error: t('err.packEmpty') };
  }
  for (const ic of raw.icons) {
    if (!ic || typeof ic.name !== 'string' || !ic.name.trim()) {
      return { ok: false, error: t('err.packIconNoName') };
    }
    if (typeof ic.image !== 'string' || !ic.image.startsWith('data:image/')) {
      return { ok: false, error: t('err.packIconNoImage', { name: ic.name }) };
    }
  }
  return { ok: true };
}

function loadConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    config = normalizeConfig(raw ? JSON.parse(raw) : DEFAULT_CONFIG);
  } catch (e) {
    // Corrupted storage → restart from the bundled defaults
    config = normalizeConfig(DEFAULT_CONFIG);
  }
  saveConfig();
}

function saveConfig() {
  // Returns false when storage is full (useful for icon imports)
  try { localStorage.setItem(CONFIG_KEY, JSON.stringify(config)); return true; }
  catch (e) { return false; }
}

/* ============================================================
   TIMERS: persistence, lifecycle
   ============================================================ */

function loadTimers() {
  try {
    const raw = localStorage.getItem(TIMERS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (Array.isArray(list)) {
      timers = list.filter((tm) => tm && Number.isFinite(tm.endTime));
    }
  } catch (e) {
    timers = [];
  }
  // Timers whose end time is already past will be marked "finished"
  // by the first tick (and the alarm will ring).
}

function saveTimers() {
  try { localStorage.setItem(TIMERS_KEY, JSON.stringify(timers)); } catch (e) { /* storage full: keep running in memory */ }
}

/**
 * Creates and starts a timer.
 * opts: { label, icon (null → CUSTOM badge), color, durationMs }
 */
function addTimer(opts) {
  timers.push({
    id: uid('t'),
    label: opts.label,
    icon: opts.icon || null,
    color: opts.color || null,
    table: selectedTable,
    durationMs: opts.durationMs,
    endTime: Date.now() + opts.durationMs,
    finished: false,
    finishedAt: 0
  });
  saveTimers();
  sortAndRender();          // sorting allowed: a timer was just added
  updateWakeLock();
}

function deleteTimer(id) {
  timers = timers.filter((tm) => tm.id !== id);
  saveTimers();
  sortAndRender();          // sorting allowed: a timer was just removed
  updateAlarm();            // stops the alarm ONLY if no finished timer remains
  updateWakeLock();
}

/** Double-start guard: ignores a second tap that comes too fast. */
function doubleTapGuard() {
  const now = Date.now();
  if (now - lastStart < DOUBLE_TAP_MS) return true;
  lastStart = now;
  return false;
}

/* ============================================================
   TICK: remaining time recomputed from Date.now() (never a countdown)
   ============================================================ */

function formatMMSS(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
}

function tick() {
  const now = Date.now();

  // 1. Detect timers that just finished
  let justFinished = false;
  for (const tm of timers) {
    if (!tm.finished && tm.endTime <= now) {
      tm.finished = true;
      tm.finishedAt = now;
      justFinished = true;
    }
  }
  if (justFinished) {
    saveTimers();
    sortAndRender();        // sorting allowed: a timer just finished
    updateAlarm();
  }

  // 2. Top bar clock (updated only when the minute changes)
  const d = new Date();
  const hhmm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  const clockEl = $('topbar-clock');
  if (clockEl.textContent !== hhmm) clockEl.textContent = hhmm;

  // 3. Update the display WITHOUT reordering rows
  for (const tm of timers) {
    if (tm.finished) continue;                // finished rows are static (OK)
    const refs = rows.get(tm.id);
    if (!refs) continue;
    const remaining = tm.endTime - now;
    refs.time.textContent = formatMMSS(remaining);
    refs.el.classList.toggle('warning', remaining <= WARNING_MS);
  }

  // 4. The adjust preview follows the passing time
  if (adjustId !== null && !$('adjust-overlay').hidden) {
    updateAdjustDisplay();
  }
}

/* ============================================================
   LIST RENDERING
   ============================================================ */

/**
 * Re-sorts then rebuilds the list. Call ONLY on add, remove,
 * finish or explicit user adjustment (never from the display tick).
 * Finished timers are pinned on top, then the others by remaining
 * time in the direction chosen in Settings.
 */
function sortAndRender() {
  const now = Date.now();
  const copy = timers.slice();
  copy.sort((a, b) => {
    if (a.finished !== b.finished) return a.finished ? -1 : 1;
    if (a.finished) return a.finishedAt - b.finishedAt;
    const ra = a.endTime - now;
    const rb = b.endTime - now;
    return config.sortOrder === 'desc' ? rb - ra : ra - rb;
  });
  order = copy.map((tm) => tm.id);
  renderList();
}

function renderList() {
  const container = $('timer-list');
  container.textContent = '';
  rows.clear();
  for (const id of order) {
    const tm = timers.find((x) => x.id === id);
    if (!tm) continue;
    container.appendChild(buildRow(tm));
  }
  $('empty-message').hidden = timers.length > 0;
}

function buildRow(tm) {
  const row = el('div', 'timer-row' + (tm.finished ? ' finished' : ''));
  if (tm.color) row.style.setProperty('--color', tm.color);

  // Icon: the food's emoji or image, or a CUSTOM text badge for free durations
  let icon;
  if (tm.icon) {
    icon = el('div', 'timer-icon');
    fillIcon(icon, tm.icon);
  } else {
    icon = el('div', 'custom-badge', t('main.customBadge'));
  }
  row.appendChild(icon);

  row.appendChild(el('div', 'timer-label', tm.label));

  // Table badge — always shown, "—" when unset. Tapping it opens the
  // numpad to set, change or clear the table, even on a ringing timer.
  const hasTable = tm.table !== null && tm.table !== undefined;
  const badge = el('span', 'table-badge' + (hasTable ? '' : ' empty'),
    hasTable ? t('main.tableBadge', { n: tm.table }) : '—');
  badge.addEventListener('click', () => openNumpad(tm.id));
  row.appendChild(badge);

  if (tm.finished) {
    // Finished row: time frozen at 00:00 + giant OK button.
    // Tapping the countdown allows adding time back (relaunch).
    // Dismissing THIS timer does not stop the other finished
    // timers' alarm (updateAlarm only stops when none remain).
    const doneTime = el('div', 'timer-time', '00:00');
    doneTime.addEventListener('click', () => openAdjust(tm.id));
    row.appendChild(doneTime);
    const okBtn = el('button', 'btn-ok', 'OK');
    okBtn.addEventListener('click', () => deleteTimer(tm.id));
    row.appendChild(okBtn);
    rows.set(tm.id, { el: row, time: null });
    return row;
  }

  // Tapping the countdown opens the +/− time adjustment
  const time = el('div', 'timer-time', formatMMSS(tm.endTime - Date.now()));
  time.addEventListener('click', () => openAdjust(tm.id));
  row.appendChild(time);

  // ✕ button → floating confirmation menu (never deletes directly,
  // protects against imprecise taps)
  const cancelBtn = el('button', 'btn-cancel-row', '✕');
  cancelBtn.addEventListener('click', () => openDeleteConfirm(tm.id));
  row.appendChild(cancelBtn);

  rows.set(tm.id, { el: row, time });
  return row;
}

/* ============================================================
   DELETE: floating confirmation menu
   ============================================================ */

function openDeleteConfirm(id) {
  const tm = timers.find((x) => x.id === id);
  if (!tm) return;
  deleteId = id;
  $('delete-label').textContent =
    tm.label + (tm.table !== null && tm.table !== undefined ? ' — ' + t('common.tableLong', { n: tm.table }) : '');
  $('delete-overlay').hidden = false;
}

function confirmDelete() {
  const id = deleteId;
  deleteId = null;
  $('delete-overlay').hidden = true;
  if (id !== null) deleteTimer(id);   // no-op if already removed meanwhile
}

/* ============================================================
   TIME ADJUST: +/− 1 and 5 min on an existing timer
   ------------------------------------------------------------
   Opened by tapping a row's countdown. Also works on a FINISHED
   (ringing) timer: adding time relaunches it ("2 more minutes!")
   and silences its part of the alarm. The correction is applied
   only on confirm.
   ============================================================ */

function openAdjust(id) {
  const tm = timers.find((x) => x.id === id);
  if (!tm) return;
  adjustId = id;
  adjustDelta = 0;
  $('adjust-label').textContent =
    tm.label + (tm.table !== null && tm.table !== undefined ? ' — ' + t('common.tableLong', { n: tm.table }) : '');
  updateAdjustDisplay();
  $('adjust-overlay').hidden = false;
}

function closeAdjust() {
  $('adjust-overlay').hidden = true;
  adjustId = null;
  adjustDelta = 0;
}

/**
 * Refreshes the preview: projected time = current remaining + delta.
 * The base keeps ticking while the box is open, so tick() calls
 * this function too.
 */
function updateAdjustDisplay() {
  const tm = timers.find((x) => x.id === adjustId);
  if (!tm) { closeAdjust(); return; }   // timer vanished meanwhile
  const base = tm.finished ? 0 : Math.max(0, tm.endTime - Date.now());
  // Cannot remove more than the remaining time
  if (base + adjustDelta < 0) adjustDelta = -base;
  $('adjust-display').textContent = formatMMSS(base + adjustDelta);
  const deltaEl = $('adjust-delta');
  if (adjustDelta === 0) {
    deltaEl.textContent = '±0';
    deltaEl.className = 'delta-zero';
  } else {
    deltaEl.textContent = (adjustDelta > 0 ? '＋ ' : '− ') + formatMMSS(Math.abs(adjustDelta));
    deltaEl.className = adjustDelta > 0 ? 'delta-plus' : 'delta-minus';
  }
}

function confirmAdjust() {
  const tm = timers.find((x) => x.id === adjustId);
  const delta = adjustDelta;
  closeAdjust();
  if (!tm) return;
  const now = Date.now();
  const base = tm.finished ? 0 : Math.max(0, tm.endTime - now);
  const next = Math.max(0, base + delta);
  tm.endTime = now + next;
  if (tm.finished && next > 0) {
    // Relaunch a ringing timer: it becomes "running" again
    tm.finished = false;
    tm.finishedAt = 0;
  }
  // If next === 0 on a running timer, the next tick makes it ring —
  // intended behavior ("remove all remaining time").
  saveTimers();
  sortAndRender();          // explicit user action → re-sort allowed
  updateAlarm();            // stops the alarm if no finished timer remains
}

/* ============================================================
   AUDIO: generated alarm (Web Audio API, no files)
   ============================================================ */

/** Creates/wakes the audio context. Called on the first user gesture. */
function unlockAudio() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioCtx = new Ctx();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = config.alarmVolume;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

/** One short square beep (loud and piercing, fit for a noisy kitchen). */
function beep(freq, at, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.9, at + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(at);
  osc.stop(at + duration + 0.05);
}

/** One alarm burst: 3 alternating beeps, distinctive pattern. */
function alarmBurst() {
  if (!audioCtx || audioCtx.state !== 'running') return; // audio not unlocked yet
  const t0 = audioCtx.currentTime;
  beep(880, t0, 0.16);
  beep(1245, t0 + 0.20, 0.16);
  beep(880, t0 + 0.40, 0.16);
}

/** Starts/stops the alarm loop depending on finished timers. */
function updateAlarm() {
  const anyFinished = timers.some((tm) => tm.finished);
  if (anyFinished && alarmInterval === null) {
    alarmBurst();
    alarmInterval = setInterval(alarmBurst, 1100);
  } else if (!anyFinished && alarmInterval !== null) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
}

/* ============================================================
   WAKE LOCK: the screen must never sleep while cooking
   ============================================================ */

async function updateWakeLock() {
  const needed = timers.length > 0;
  if (needed && !wakeLock && 'wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } catch (e) {
      // Denied (low battery, hidden page, …) — fallback: set the
      // tablet's screen sleep to "never" (see README).
    }
  } else if (!needed && wakeLock) {
    wakeLock.release().catch(() => {});
    wakeLock = null;
  }
}

/* ============================================================
   ADD OVERLAY
   ============================================================ */

function openAdd() {
  selectedTable = null;
  customSeconds = 300;
  updateTableField();
  renderFoods();
  renderDurations();
  updateCustomDisplay();
  const mode = config.addMode;
  $('add-tabs').hidden = mode !== 'both';
  showPanel(mode === 'durations' ? 'durations' : 'foods');
  $('add-overlay').hidden = false;
}

function closeAdd() {
  $('add-overlay').hidden = true;
}

function showPanel(which) {
  $('foods-panel').hidden = which !== 'foods';
  $('durations-panel').hidden = which !== 'durations';
  $('tab-foods').classList.toggle('active', which === 'foods');
  $('tab-durations').classList.toggle('active', which === 'durations');
}

/* ---------- Table number: field + numpad ---------- */

/** Updates the "Table" field: chosen number, or "—" when none. */
function updateTableField() {
  const field = $('table-field');
  field.textContent = selectedTable === null ? '—' : String(selectedTable);
  field.classList.toggle('selected', selectedTable !== null);
}

/**
 * Opens the numpad. With a timer id, it edits that timer's table
 * (badge tap on a row); without one, it edits the add-overlay
 * selection. Note: the table-field click listener passes the click
 * event here, hence the explicit string check.
 */
function openNumpad(timerId) {
  numpadTimerId = typeof timerId === 'string' ? timerId : null;
  if (numpadTimerId) {
    const tm = timers.find((x) => x.id === numpadTimerId);
    if (!tm) return;
    numpadEntry = tm.table === null || tm.table === undefined ? '' : String(tm.table);
  } else {
    numpadEntry = selectedTable === null ? '' : String(selectedTable);
  }
  updateNumpadDisplay(false);
  $('numpad-overlay').hidden = false;
}

function updateNumpadDisplay(error) {
  const display = $('numpad-display');
  display.textContent = numpadEntry === '' ? '—' : numpadEntry;
  display.classList.toggle('error', !!error);
}

/**
 * Confirms the entry: empty → no table; otherwise the number must
 * be within 1..tableMax (a setting), or the display flashes red
 * and the numpad stays open. The value goes either to the timer
 * being edited (badge tap) or to the add-overlay selection.
 */
function confirmNumpad() {
  const apply = (value) => {
    if (numpadTimerId) {
      const tm = timers.find((x) => x.id === numpadTimerId);
      if (tm) {
        tm.table = value;
        saveTimers();
        renderList();       // rebuild rows, keep the current order (no re-sort)
      }
    } else {
      selectedTable = value;
      updateTableField();
    }
    numpadTimerId = null;
    $('numpad-overlay').hidden = true;
  };
  if (numpadEntry === '') {
    apply(null);
    return;
  }
  const n = parseInt(numpadEntry, 10);
  if (Number.isFinite(n) && n >= 1 && n <= config.tableMax) {
    apply(n);
  } else {
    updateNumpadDisplay(true);
    setTimeout(() => updateNumpadDisplay(false), 600);
  }
}

/* ---------- Foods and durations panels ---------- */

/** Grid of enabled foods, grouped by category. */
function renderFoods() {
  const panel = $('foods-panel');
  panel.textContent = '';
  for (const cat of CATEGORIES) {
    const foods = config.foods.filter((f) => f.enabled && f.category === cat);
    if (!foods.length) continue;
    panel.appendChild(el('div', 'category-title', t('category.' + cat)));
    const grid = el('div', 'foods-grid');
    for (const f of foods) {
      const btn = el('button', 'food-btn');
      btn.type = 'button';
      btn.style.setProperty('--color', f.color);
      const iconSpan = el('span', 'icon');
      fillIcon(iconSpan, f.icon);
      btn.appendChild(iconSpan);
      btn.appendChild(el('span', 'name', f.shortLabel));
      btn.appendChild(el('span', 'duration', formatMinutes(f.minutes)));
      // 1 tap = immediate start ("+" then food = 2 taps total)
      btn.addEventListener('click', () => {
        if (doubleTapGuard()) return;
        addTimer({
          label: f.shortLabel,
          icon: f.icon,
          color: f.color,
          durationMs: Math.round(f.minutes * 60000)
        });
        closeAdd();
      });
      grid.appendChild(btn);
    }
    panel.appendChild(grid);
  }
}

function formatMinutes(minutes) {
  if (Number.isInteger(minutes)) return t('time.min', { n: minutes });
  const m = Math.floor(minutes);
  const s = Math.round((minutes - m) * 60);
  return t('time.minSec', { m, s });
}

/** Duration preset buttons (immediate start, CUSTOM badge). */
function renderDurations() {
  const grid = $('durations-grid');
  grid.textContent = '';
  for (const m of config.durationPresets) {
    const btn = el('button', 'duration-btn', t('time.min', { n: m }));
    btn.type = 'button';
    btn.addEventListener('click', () => {
      if (doubleTapGuard()) return;
      addTimer({ label: t('time.min', { n: m }), icon: null, color: null, durationMs: m * 60000 });
      closeAdd();
    });
    grid.appendChild(btn);
  }
}

function updateCustomDisplay() {
  const mm = Math.floor(customSeconds / 60);
  const ss = customSeconds % 60;
  $('custom-display').textContent = String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
}

/* ============================================================
   SETTINGS
   ============================================================ */

function openSettings() {
  renderSettings();
  $('settings-overlay').hidden = false;
}

function closeSettings() {
  $('settings-overlay').hidden = true;
  $('import-message').textContent = '';
  $('import-message').className = 'io-message';
  $('icons-message').textContent = '';
  $('icons-message').className = 'io-message';
}

/** Reloads every settings control from the config. */
function renderSettings() {
  updateChoiceButtons('sort-choice', config.sortOrder);
  updateChoiceButtons('mode-choice', config.addMode);
  updateChoiceButtons('language-choice', config.language);
  renderDurationPresets();
  renderFoodsList();
  renderIconsGrid();
  $('table-max-display').textContent = '1 – ' + config.tableMax;
  $('volume-slider').value = config.alarmVolume;
  $('restaurant-input').value = config.restaurantName;
}

function updateChoiceButtons(groupId, value) {
  $(groupId).querySelectorAll('button').forEach((b) => {
    b.classList.toggle('active', b.dataset.val === value);
  });
}

/** Duration preset chips, with removal. */
function renderDurationPresets() {
  const container = $('duration-presets-list');
  container.textContent = '';
  for (const m of config.durationPresets) {
    const chip = el('span', 'duration-chip', t('time.min', { n: m }) + ' ');
    const btn = el('button', null, '✕');
    btn.type = 'button';
    btn.addEventListener('click', () => {
      config.durationPresets = config.durationPresets.filter((x) => x !== m);
      saveConfig();
      renderDurationPresets();
    });
    chip.appendChild(btn);
    container.appendChild(chip);
  }
}

/** Full food list editor. */
function renderFoodsList() {
  const container = $('foods-list');
  container.textContent = '';
  for (const cat of CATEGORIES) {
    const foods = config.foods.filter((f) => f.category === cat);
    if (!foods.length) continue;
    container.appendChild(el('div', 'category-title', t('category.' + cat)));
    for (const f of foods) container.appendChild(buildFoodCard(f));
  }
}

function buildFoodCard(f) {
  const card = el('div', 'food-card' + (f.enabled ? '' : ' disabled-card'));
  card.style.setProperty('--color', f.color);

  // Icon → opens the picker (image icons + emojis)
  const iconBtn = el('button', 'icon-btn');
  iconBtn.type = 'button';
  fillIcon(iconBtn, f.icon);
  iconBtn.addEventListener('click', () => openIconPicker(f.id));
  card.appendChild(iconBtn);

  // Full name
  const nameInput = el('input', 'name-input');
  nameInput.type = 'text';
  nameInput.value = f.name;
  nameInput.addEventListener('change', () => {
    if (nameInput.value.trim()) f.name = nameInput.value.trim();
    saveConfig();
  });
  card.appendChild(nameInput);

  // Short label (shown on buttons and rows)
  const labelInput = el('input', 'label-input');
  labelInput.type = 'text';
  labelInput.placeholder = t('food.labelPlaceholder');
  labelInput.value = f.shortLabel;
  labelInput.addEventListener('change', () => {
    if (labelInput.value.trim()) f.shortLabel = labelInput.value.trim().toUpperCase();
    saveConfig();
  });
  card.appendChild(labelInput);

  // Default duration (minutes)
  const minutesInput = el('input', 'minutes-input');
  minutesInput.type = 'number';
  minutesInput.min = '0.5';
  minutesInput.max = '600';
  minutesInput.step = '0.5';
  minutesInput.value = f.minutes;
  minutesInput.addEventListener('change', () => {
    const v = parseFloat(minutesInput.value);
    if (Number.isFinite(v) && v > 0) f.minutes = v;
    minutesInput.value = f.minutes;
    saveConfig();
  });
  card.appendChild(minutesInput);
  card.appendChild(el('span', 'unit', t('food.unitMin')));

  // Color → opens the color picker
  const colorBtn = el('button', 'color-btn', ' ');
  colorBtn.type = 'button';
  colorBtn.style.background = f.color;
  colorBtn.addEventListener('click', () => {
    iconTargetFoodId = f.id;
    $('color-overlay').hidden = false;
  });
  card.appendChild(colorBtn);

  // Category
  const select = document.createElement('select');
  for (const cat of CATEGORIES) {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = t('foodCat.' + cat);
    if (f.category === cat) opt.selected = true;
    select.appendChild(opt);
  }
  select.addEventListener('change', () => {
    f.category = select.value;
    saveConfig();
    renderFoodsList();      // the food moves to another group
  });
  card.appendChild(select);

  // Enabled / disabled
  const toggleBtn = el('button', 'toggle-btn' + (f.enabled ? ' on' : ''), f.enabled ? t('food.enabled') : t('food.disabled'));
  toggleBtn.type = 'button';
  toggleBtn.addEventListener('click', () => {
    f.enabled = !f.enabled;
    saveConfig();
    renderFoodsList();
  });
  card.appendChild(toggleBtn);

  // Permanent removal
  const deleteBtn = el('button', 'delete-btn', '🗑');
  deleteBtn.type = 'button';
  deleteBtn.addEventListener('click', () => {
    config.foods = config.foods.filter((x) => x.id !== f.id);
    saveConfig();
    renderFoodsList();
  });
  card.appendChild(deleteBtn);

  return card;
}

/**
 * Opens the icon picker for a food: imported image icons first
 * (refreshed on every open), then the emojis.
 */
function openIconPicker(foodId) {
  iconTargetFoodId = foodId;
  const grid = $('custom-icons-grid');
  grid.textContent = '';
  $('custom-icons-title').hidden = config.icons.length === 0;
  for (const ic of config.icons) {
    const b = el('button');
    b.type = 'button';
    b.title = ic.name;
    const img = document.createElement('img');
    img.src = ic.image;
    img.alt = ic.name;
    img.className = 'icon-img';
    b.appendChild(img);
    b.addEventListener('click', () => {
      const f = config.foods.find((x) => x.id === iconTargetFoodId);
      if (f) { f.icon = 'img:' + ic.id; saveConfig(); renderFoodsList(); }
      $('icon-picker-overlay').hidden = true;
    });
    grid.appendChild(b);
  }
  $('icon-picker-overlay').hidden = false;
}

/* ============================================================
   IMAGE ICONS: management, import, auto-assignment
   ------------------------------------------------------------
   A food can use either an emoji or an image icon (icon field =
   "img:<iconId>"). Images are stored as data URIs in config.icons,
   resized to 128 px to keep localStorage small. Two import paths:
   - individual image files (named after the dish);
   - a JSON "pack" { type: "icon-pack", icons: [...] } that the
     user's AI generates from the copyable prompt.
   ============================================================ */

/** Normalizes a name for comparison (lowercase, no accents/punctuation). */
function normalizeName(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Fills a container with a food's icon: emoji or image. */
function fillIcon(container, iconStr) {
  container.textContent = '';
  if (iconStr && iconStr.startsWith('img:')) {
    const ic = config.icons.find((i) => i.id === iconStr.slice(4));
    if (ic) {
      const img = document.createElement('img');
      img.src = ic.image;
      img.alt = '';
      img.className = 'icon-img';
      container.appendChild(img);
      return;
    }
    container.textContent = '🍽️';   // icon deleted meanwhile → fallback
    return;
  }
  container.textContent = iconStr || '🍽️';
}

/** Resizes an image (data URI) to a square PNG of `size` px. */
function resizeImage(dataUri, size) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const ratio = Math.min(size / img.width, size / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('unreadable image'));
    img.src = dataUri;
  });
}

/** Adds an icon (or replaces the image when the name already exists). */
function addIcon(name, image) {
  const existing = config.icons.find((i) => normalizeName(i.name) === normalizeName(name));
  if (existing) {
    existing.image = image;
    return existing;
  }
  const icon = { id: uid('i'), name, image };
  config.icons.push(icon);
  return icon;
}

/** Assigns the icon to foods whose name or label matches. */
function assignIconToFoods(icon) {
  const target = normalizeName(icon.name);
  let count = 0;
  for (const f of config.foods) {
    if (normalizeName(f.name) === target || normalizeName(f.shortLabel) === target) {
      f.icon = 'img:' + icon.id;
      count++;
    }
  }
  return count;
}

/** Import of individual image files (file name = dish name). */
async function importImageFiles(files) {
  let imported = 0;
  let assigned = 0;
  let failed = 0;
  for (const file of files) {
    try {
      const dataUri = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const image = await resizeImage(dataUri, 128);
      const name = file.name.replace(/\.[^.]+$/, '');
      const icon = addIcon(name, image);
      assigned += assignIconToFoods(icon);
      imported++;
    } catch (e) {
      failed++;
    }
  }
  finishIconImport(imported, assigned, failed);
}

/** Import of a JSON pack generated by the user's AI. */
function importIconPack(file) {
  const reader = new FileReader();
  reader.onload = async () => {
    let raw;
    try {
      raw = JSON.parse(reader.result);
    } catch (e) {
      showIconsMessage(t('err.notJson'), true);
      return;
    }
    const verdict = validateIconPack(raw);
    if (!verdict.ok) {
      showIconsMessage(verdict.error, true);   // nothing is modified
      return;
    }
    let imported = 0;
    let assigned = 0;
    let failed = 0;
    for (const ic of raw.icons) {
      try {
        const image = await resizeImage(ic.image, 128);
        const icon = addIcon(ic.name.trim(), image);
        assigned += assignIconToFoods(icon);
        imported++;
      } catch (e) {
        failed++;
      }
    }
    finishIconImport(imported, assigned, failed);
  };
  reader.onerror = () => showIconsMessage(t('err.readFail'), true);
  reader.readAsText(file);
}

function finishIconImport(imported, assigned, failed) {
  const ok = saveConfig();
  renderIconsGrid();
  renderFoodsList();
  sortAndRender();               // running rows may use these icons
  if (!ok) {
    showIconsMessage(t('msg.storageFull'), true);
    return;
  }
  let msg = t('msg.iconsResult', { imported, assigned });
  if (failed) msg += t('msg.iconsUnreadable', { n: failed });
  showIconsMessage(msg, imported === 0);
}

/** Deletes an icon; foods that used it fall back to 🍽️. */
function deleteIcon(id) {
  config.icons = config.icons.filter((i) => i.id !== id);
  for (const f of config.foods) {
    if (f.icon === 'img:' + id) f.icon = '🍽️';
  }
  saveConfig();
  renderIconsGrid();
  renderFoodsList();
  sortAndRender();
}

/** Imported icons grid in Settings. */
function renderIconsGrid() {
  const grid = $('icons-grid');
  grid.textContent = '';
  if (!config.icons.length) {
    grid.appendChild(el('p', 'no-icons', t('icons.none')));
    return;
  }
  for (const ic of config.icons) {
    const card = el('div', 'icon-card');
    const img = document.createElement('img');
    img.src = ic.image;
    img.alt = ic.name;
    card.appendChild(img);
    card.appendChild(el('span', 'icon-name', ic.name));
    const btn = el('button', 'delete-btn', '🗑');
    btn.type = 'button';
    btn.addEventListener('click', () => deleteIcon(ic.id));
    card.appendChild(btn);
    grid.appendChild(card);
  }
}

function showIconsMessage(text, isError) {
  const node = $('icons-message');
  node.textContent = text;
  node.className = 'io-message ' + (isError ? 'error' : 'success');
}

/* ---------- AI prompt: copyable snippet ---------- */

/**
 * Builds the prompt to paste into the user's AI to generate a
 * "realistic but simple" icon pack from the current menu. The
 * dish list is pre-filled but editable in the text area.
 */
function buildAiPrompt() {
  const dishes = config.foods.filter((f) => f.enabled).map((f) => '- ' + f.name).join('\n');
  return t('prompt.template', { dishes });
}

function openAiPrompt() {
  $('prompt-text').value = buildAiPrompt();
  $('prompt-overlay').hidden = false;
}

async function copyPrompt() {
  const text = $('prompt-text').value;
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    // Fallback for contexts without the Clipboard API
    $('prompt-text').select();
    document.execCommand('copy');
  }
  const btn = $('btn-copy-prompt');
  btn.textContent = t('prompt.copied');
  setTimeout(() => { btn.textContent = t('prompt.copy'); }, 1500);
}

/* ============================================================
   IMPORT / EXPORT (fully offline: Blob + <input type=file>)
   ============================================================ */

function exportConfig() {
  const data = JSON.stringify(config, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const slug = (config.restaurantName || 'restaurant')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // strip accents
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  a.href = url;
  a.download = 'timer-config-' + (slug || 'restaurant') + '.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showImportMessage(t('msg.exported'), false);
}

function readConfigFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let raw;
    try {
      raw = JSON.parse(reader.result);
    } catch (e) {
      showImportMessage(t('err.notJson'), true);
      return;
    }
    const verdict = validateImportedConfig(raw);
    if (!verdict.ok) {
      showImportMessage(verdict.error, true);   // nothing is modified
      return;
    }
    pendingImport = raw;
    $('import-summary').textContent = t('import.summary', {
      n: raw.foods.length,
      from: raw.restaurantName ? t('import.from', { name: raw.restaurantName }) : ''
    });
    $('import-overlay').hidden = false;
  };
  reader.onerror = () => showImportMessage(t('err.readFail'), true);
  reader.readAsText(file);
}

/** Replaces the whole configuration with the imported one. */
function importReplace() {
  config = normalizeConfig(pendingImport);
  finishImport(t('msg.replaced', { n: config.foods.length }));
}

/** Adds imported foods and icons to the existing ones, skipping duplicates (by name). */
function importMerge() {
  const imported = normalizeConfig(pendingImport);

  // 1. Icons: reuse duplicates (by name), remap colliding ids
  const idMap = {};               // imported id → final id in the config
  const byName = new Map(config.icons.map((i) => [normalizeName(i.name), i.id]));
  const existingIds = new Set(config.icons.map((i) => i.id));
  let iconsAdded = 0;
  for (const ic of imported.icons) {
    const already = byName.get(normalizeName(ic.name));
    if (already) { idMap[ic.id] = already; continue; }
    let finalId = ic.id;
    if (existingIds.has(finalId)) finalId = uid('i');
    idMap[ic.id] = finalId;
    config.icons.push({ id: finalId, name: ic.name, image: ic.image });
    existingIds.add(finalId);
    byName.set(normalizeName(ic.name), finalId);
    iconsAdded++;
  }

  // 2. Foods: skip duplicates by name, remap icon references
  const existingNames = new Set(config.foods.map((f) => f.name.trim().toLowerCase()));
  let foodsAdded = 0;
  for (const f of imported.foods) {
    if (existingNames.has(f.name.trim().toLowerCase())) continue;
    if (f.icon.startsWith('img:')) {
      const newId = idMap[f.icon.slice(4)];
      f.icon = newId ? 'img:' + newId : '🍽️';
    }
    f.id = uid('f');            // avoids any id collision
    config.foods.push(f);
    foodsAdded++;
  }
  finishImport(t('msg.merged', { foods: foodsAdded, icons: iconsAdded }));
}

function finishImport(message) {
  pendingImport = null;
  $('import-overlay').hidden = true;
  saveConfig();
  if (masterGain) masterGain.gain.value = config.alarmVolume;
  applyTranslations();            // the imported file may change the language
  $('topbar-name').textContent = config.restaurantName.toUpperCase();
  renderSettings();
  sortAndRender();                // the sort direction may have changed
  showImportMessage(message, false);
}

function showImportMessage(text, isError) {
  const node = $('import-message');
  node.textContent = text;
  node.className = 'io-message ' + (isError ? 'error' : 'success');
}

/* ============================================================
   SERVICE WORKER (offline PWA)
   ============================================================ */

function registerServiceWorker() {
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {
      // Non-blocking failure (e.g. served over plain HTTP).
      // The app still works, just without the offline cache.
    });
  }
}

/* ============================================================
   INITIALIZATION + EVENT WIRING
   ============================================================ */

function bindEvents() {
  /* Audio unlock on the first gesture (browser requirement).
     The listener stays active to resume a suspended context. */
  document.addEventListener('pointerdown', unlockAudio, { passive: true });

  /* Main screen */
  $('btn-add').addEventListener('click', openAdd);
  $('btn-settings').addEventListener('click', openSettings);

  /* Add overlay */
  $('btn-close-add').addEventListener('click', closeAdd);
  $('tab-foods').addEventListener('click', () => showPanel('foods'));
  $('tab-durations').addEventListener('click', () => showPanel('durations'));
  $('custom-steppers').querySelectorAll('button').forEach((b) => {
    b.addEventListener('click', () => {
      customSeconds = Math.min(CUSTOM_MAX_S, Math.max(CUSTOM_MIN_S, customSeconds + parseInt(b.dataset.delta, 10)));
      updateCustomDisplay();
    });
  });
  $('btn-start-custom').addEventListener('click', () => {
    if (doubleTapGuard()) return;
    const mm = Math.floor(customSeconds / 60);
    const ss = customSeconds % 60;
    const label = ss === 0
      ? t('time.min', { n: mm })
      : t('time.minSec', { m: mm, s: String(ss).padStart(2, '0') });
    addTimer({ label, icon: null, color: null, durationMs: customSeconds * 1000 });
    closeAdd();
  });

  /* Timer deletion: confirmation via floating menu */
  $('btn-delete-confirm').addEventListener('click', confirmDelete);
  $('btn-delete-cancel').addEventListener('click', () => {
    deleteId = null;
    $('delete-overlay').hidden = true;
  });

  /* Timer time adjustment (+/− 1 and 5 min) */
  $('adjust-grid').querySelectorAll('button[data-delta]').forEach((b) => {
    b.addEventListener('click', () => {
      adjustDelta += parseInt(b.dataset.delta, 10) * 1000;
      updateAdjustDisplay();
    });
  });
  $('btn-adjust-confirm').addEventListener('click', confirmAdjust);
  $('btn-adjust-cancel').addEventListener('click', closeAdjust);

  /* Table number: field → numpad */
  $('table-field').addEventListener('click', openNumpad);
  $('numpad-grid').querySelectorAll('button[data-digit]').forEach((b) => {
    b.addEventListener('click', () => {
      if (numpadEntry.length < 3) numpadEntry += b.dataset.digit;
      updateNumpadDisplay(false);
    });
  });
  $('btn-numpad-erase').addEventListener('click', () => {
    numpadEntry = numpadEntry.slice(0, -1);
    updateNumpadDisplay(false);
  });
  $('btn-numpad-ok').addEventListener('click', confirmNumpad);
  $('btn-numpad-cancel').addEventListener('click', () => {
    numpadTimerId = null;
    $('numpad-overlay').hidden = true;
  });

  /* Settings */
  $('btn-close-settings').addEventListener('click', closeSettings);

  $('sort-choice').querySelectorAll('button').forEach((b) => {
    b.addEventListener('click', () => {
      config.sortOrder = b.dataset.val;
      saveConfig();
      updateChoiceButtons('sort-choice', config.sortOrder);
      sortAndRender();        // apply the new direction right away
    });
  });

  $('mode-choice').querySelectorAll('button').forEach((b) => {
    b.addEventListener('click', () => {
      config.addMode = b.dataset.val;
      saveConfig();
      updateChoiceButtons('mode-choice', config.addMode);
    });
  });

  /* Language switch: retranslate static DOM + rebuild dynamic views */
  $('language-choice').querySelectorAll('button').forEach((b) => {
    b.addEventListener('click', () => {
      config.language = b.dataset.val;
      saveConfig();
      updateChoiceButtons('language-choice', config.language);
      applyTranslations();
      renderSettings();
      sortAndRender();        // CUSTOM / table badges are translated
    });
  });

  $('btn-add-duration').addEventListener('click', () => {
    const v = parseInt($('new-duration-input').value, 10);
    if (!Number.isFinite(v) || v < 1 || v > 180) return;
    if (!config.durationPresets.includes(v)) {
      config.durationPresets.push(v);
      config.durationPresets.sort((a, b) => a - b);
      saveConfig();
    }
    renderDurationPresets();
  });

  $('btn-add-food').addEventListener('click', () => {
    const name = t('food.new');
    config.foods.push({
      id: uid('f'),
      name,
      shortLabel: name.toUpperCase(),
      icon: '🍽️',
      color: '#FF9800',
      minutes: 5,
      category: 'other',
      enabled: true
    });
    saveConfig();
    renderFoodsList();
    // Bring the new card into view
    const cards = $('foods-list').querySelectorAll('.food-card');
    if (cards.length) cards[cards.length - 1].scrollIntoView({ block: 'center' });
  });

  $('btn-table-minus').addEventListener('click', () => {
    config.tableMax = Math.max(1, config.tableMax - 1);
    saveConfig();
    $('table-max-display').textContent = '1 – ' + config.tableMax;
  });
  $('btn-table-plus').addEventListener('click', () => {
    config.tableMax = Math.min(99, config.tableMax + 1);
    saveConfig();
    $('table-max-display').textContent = '1 – ' + config.tableMax;
  });

  $('volume-slider').addEventListener('input', () => {
    config.alarmVolume = parseFloat($('volume-slider').value);
    saveConfig();
    if (masterGain) masterGain.gain.value = config.alarmVolume;
  });
  $('btn-test-alarm').addEventListener('click', () => {
    unlockAudio();            // the click is a gesture: audio unlocks here
    alarmBurst();
  });

  $('restaurant-input').addEventListener('change', () => {
    config.restaurantName = $('restaurant-input').value.trim() || 'Restaurant';
    saveConfig();
    $('topbar-name').textContent = config.restaurantName.toUpperCase();
    document.title = t('app.windowTitle') + ' — ' + config.restaurantName;
  });

  /* Icons: imports + AI prompt */
  $('btn-import-images').addEventListener('click', () => {
    $('images-file-input').value = '';
    $('images-file-input').click();
  });
  $('images-file-input').addEventListener('change', () => {
    const files = Array.from($('images-file-input').files);
    if (files.length) importImageFiles(files);
  });
  $('btn-import-pack').addEventListener('click', () => {
    $('pack-file-input').value = '';
    $('pack-file-input').click();
  });
  $('pack-file-input').addEventListener('change', () => {
    const f = $('pack-file-input').files[0];
    if (f) importIconPack(f);
  });
  $('btn-ai-prompt').addEventListener('click', openAiPrompt);
  $('btn-copy-prompt').addEventListener('click', copyPrompt);
  $('btn-close-prompt').addEventListener('click', () => { $('prompt-overlay').hidden = true; });

  /* Config import / export */
  $('btn-export').addEventListener('click', exportConfig);
  $('btn-import').addEventListener('click', () => {
    $('config-file-input').value = '';   // allows re-importing the same file
    $('config-file-input').click();
  });
  $('config-file-input').addEventListener('change', () => {
    const f = $('config-file-input').files[0];
    if (f) readConfigFile(f);
  });
  $('btn-import-replace').addEventListener('click', importReplace);
  $('btn-import-merge').addEventListener('click', importMerge);
  $('btn-import-cancel').addEventListener('click', () => {
    pendingImport = null;
    $('import-overlay').hidden = true;
  });

  /* Icon / color pickers (food editor) */
  const emojiGrid = $('emoji-grid');
  for (const e of EMOJI_PALETTE) {
    const b = el('button', null, e);
    b.type = 'button';
    b.addEventListener('click', () => {
      const f = config.foods.find((x) => x.id === iconTargetFoodId);
      if (f) { f.icon = e; saveConfig(); renderFoodsList(); }
      $('icon-picker-overlay').hidden = true;
    });
    emojiGrid.appendChild(b);
  }
  $('btn-icon-picker-cancel').addEventListener('click', () => { $('icon-picker-overlay').hidden = true; });

  const colorGrid = $('color-grid');
  for (const c of COLOR_PALETTE) {
    const b = el('button', null, ' ');
    b.type = 'button';
    b.style.background = c;
    b.style.minHeight = '64px';
    b.addEventListener('click', () => {
      const f = config.foods.find((x) => x.id === iconTargetFoodId);
      if (f) { f.color = c; saveConfig(); renderFoodsList(); }
      $('color-overlay').hidden = true;
    });
    colorGrid.appendChild(b);
  }
  $('btn-color-cancel').addEventListener('click', () => { $('color-overlay').hidden = true; });

  /* Wake lock: re-request when the app becomes visible again */
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') updateWakeLock();
  });
}

function init() {
  loadConfig();
  loadTimers();
  bindEvents();
  applyTranslations();
  $('topbar-name').textContent = config.restaurantName.toUpperCase();
  sortAndRender();
  updateWakeLock();
  registerServiceWorker();
  // Display tick: recomputes the remaining time from Date.now() each time.
  setInterval(tick, TICK_MS);
  tick();
}

init();
