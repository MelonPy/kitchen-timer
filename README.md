# ⏱ Kitchen Timer

Kitchen multi-timer for a wall-mounted tablet (**frying** and **steaming**
stations). Installable web app (PWA), **fully offline**, no account, no server.
Big buttons, readable from 2 meters, designed for wet hands and a noisy
kitchen. **Industrial** styling: amber digits on LED-style displays, steel
plates, hazard stripes on finished timers.

**Languages**: English (US), Français, 繁體中文 — switchable in Settings.
Language files are packaged with the app under `lang/` (no network needed).

## Contents

| File | Role |
|---|---|
| `index.html` | App structure (main screen + overlays) |
| `style.css` | Styles (dark industrial theme, very large controls) |
| `app.js` | All the logic (timers, alarm, settings, i18n, import/export) |
| `default-config.js` | Default config — **the only file to replace for another restaurant** |
| `lang/en.js` `lang/fr.js` `lang/zh-TW.js` | Language files (English is the fallback) |
| `sw.js` | Service worker (offline cache) |
| `manifest.webmanifest` | PWA manifest (fullscreen install) |
| `icons/` | App icons |

## Getting started

The PWA must be served over **HTTPS** (or `http://localhost` for testing).
Two simple options:

1. **Free static hosting** (recommended for the tablet): drop the folder
   as-is on GitHub Pages, Netlify, Cloudflare Pages… Once installed on the
   tablet, the app works **without any connection**.

2. **Local test on a PC**:

   ```bash
   python -m http.server 5173
   ```

   then open `http://localhost:5173`.

## Installing on the tablet

### Android (Chrome)
1. Open the app URL in Chrome.
2. Menu `⋮` → **"Add to Home screen"** (or "Install app").
3. Launch from the icon: fullscreen, no address bar.

### iPad (Safari)
1. Open the app URL in Safari.
2. **Share** button → **"Add to Home Screen"**.
3. Launch from the icon.

### Important: screen sleep
The app keeps the screen awake while a timer runs (Wake Lock API). If the
tablet is old and the screen still turns off, set screen sleep to
**"never"** in the tablet's display settings (documented fallback).

### Sound tip
Browsers block audio until the screen has been touched once. After a
tablet reboot, **tap the app screen once** (anywhere) to unlock the alarm.

## Usage

- **＋ Add** → tap a food = the timer starts (2 taps total).
- **Table** number: optional — an empty field ("—") at the top of the add
  screen; tapping it opens a numpad to type and confirm the number *before*
  picking the food. Confirming an empty entry clears the table.
- Every timer row shows its **table badge** ("—" when unset): tapping the
  badge opens the same numpad to set, change or clear the table at any
  time, even while the timer is ringing.
- **Free duration**: "Durations" tab, ±1 min / ±10 s steppers.
- Last minute: the row turns **amber and pulses**.
- Cooking done: the row turns **flashing red** with hazard stripes, the
  alarm repeats until **OK** is pressed. Dismissing one timer does not
  silence other finished timers.
- **Adjust a timer**: tapping its **countdown** opens a ＋1 / ＋5 / −1 / −5 min
  box with a live preview, applied on confirm. Also works on a **ringing**
  timer: adding time relaunches it ("2 more minutes!") and silences its
  part of the alarm.
- Cancel a timer: tapping **✕** opens a floating confirmation menu
  (Delete / Cancel) — no direct deletion, protects against stray taps.
- Multiple simultaneous timers for the same food work fine
  (e.g. 3 batches of nems for 3 tables).

## Settings

⚙️ button, bottom right:

- sort direction (soonest at top or bottom) — the list is never reordered
  while counting down, only when a timer is added/finished/adjusted;
- add menu: foods, durations, or both;
- editable duration presets;
- foods: name, short label, icon, color, duration, category, enable,
  delete, add;
- table number range (numpad validation bound);
- alarm volume + test button;
- **language**: English / Français / 繁體中文;
- image icon management (see below).

## Image icons & AI generation

Foods use emojis by default, but the **Icons** section in Settings loads
real images (stored offline inside the app, resized to 128 px):

- **🖼 Import images**: one or more PNG/JPG/WebP files. The file name is
  the icon name; if a food has the same name (or short label), the icon is
  **auto-assigned** to it.
- **📦 Import a pack**: a JSON file
  `{ "schemaVersion": 1, "type": "icon-pack", "icons": [{ "name": "...", "image": "data:image/png;base64,..." }] }`.
  Same auto-assignment by name.
- **✨ Generate an icon pack with AI**: opens a copyable text area with a
  **ready-to-use prompt**, pre-filled with the menu's dish list (editable
  before copying), in the app's current language. Paste it into your AI
  (ChatGPT, Claude, Gemini…): it is asked to produce *realistic but simple*
  icons (transparent background, 256 × 256 px) returned either as a JSON
  pack to import directly, or as individual PNGs named after the dishes.
- Each food can then pick its icon (imported images or emojis) in the food
  editor. Deleting an icon reverts the affected foods to the generic 🍽️.

Icons are part of the exported configuration (`schemaVersion: 2`): they
travel with the export file to another restaurant. Older `schemaVersion: 1`
files (without icons) can still be imported.

## Deploying to another restaurant (import/export)

The whole configuration follows a versioned JSON schema (`schemaVersion: 2`):
foods (name, icon, color, duration, category, enabled), image icons,
duration presets, sort order, add-menu mode, table range, volume, language.

- **Export** (Settings): downloads `timer-config-<restaurant-name>.json`.
- **Import**: pick a JSON file with the same schema. The file is validated
  before being applied (clear error message, nothing changes if invalid),
  then two choices: **Replace all** or **Merge** (adds imported foods and
  icons, skipping duplicates by name).
- The built-in defaults live in `default-config.js`: same schema. Shipping
  the app to another restaurant only means replacing that file (or
  importing its JSON from Settings). It also sets the default `language`.

## Technical notes

- Timers store their **absolute end time**; the remaining time is
  recomputed from `Date.now()` on every tick → no drift when the tab is
  throttled, and exact resume after a page reload.
- Alarm generated with the **Web Audio API** (no audio files).
- All user-facing strings come from `lang/*.js`; English is the fallback
  for any missing key. To add a language, copy `lang/en.js`, translate,
  register its code, include it in `index.html` and `sw.js`, and add a
  button in the Settings language section.
- App updates: bump the cache version in `sw.js`.
