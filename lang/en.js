/* ============================================================
   Language file — English (US)
   ------------------------------------------------------------
   Language files are plain scripts packaged with the app (no
   network fetch, PWA-friendly). Each one registers itself in
   the global APP_LANGUAGES registry. English is the fallback:
   any key missing from another language falls back to this file.
   Placeholders like {n} are replaced at runtime.
   ============================================================ */

window.APP_LANGUAGES = window.APP_LANGUAGES || {};
window.APP_LANGUAGES['en'] = {
  name: 'English',
  strings: {
    'app.windowTitle': 'Kitchen Timer',
    'topbar.title': 'Kitchen timer',

    'main.empty': 'No timers running.<br>Press <strong>＋</strong> to start one.',
    'main.add': '＋ Add',
    'main.customBadge': 'CUSTOM',
    'main.tableBadge': 'T{n}',

    'common.table': 'Table',
    'common.tableLong': 'TABLE {n}',

    'add.cancel': '✕ Cancel',
    'add.tabFoods': '🍜 Foods',
    'add.tabDurations': '⏱ Durations',
    'add.plus1m': '＋1 min',
    'add.minus1m': '−1 min',
    'add.plus10s': '＋10 s',
    'add.minus10s': '−10 s',
    'add.start': '▶ Start',

    'category.frying': 'FRYING 🍟',
    'category.steaming': 'STEAMING ♨️',
    'category.other': 'OTHERS',
    'foodCat.frying': 'Frying',
    'foodCat.steaming': 'Steaming',
    'foodCat.other': 'Other',

    'time.min': '{n} min',
    'time.minSec': '{m} min {s} s',

    'settings.title': 'Settings',
    'settings.close': '✕ Close',
    'settings.sortTitle': 'Timer sorting',
    'settings.sortAsc': '⬆ Ascending<br><small>soonest on top</small>',
    'settings.sortDesc': '⬇ Descending<br><small>soonest at bottom</small>',
    'settings.modeTitle': 'Add menu',
    'settings.modeFoods': 'Foods',
    'settings.modeDurations': 'Durations',
    'settings.modeBoth': 'Both',
    'settings.durationsTitle': 'Duration presets',
    'settings.addDuration': '＋ Add',
    'settings.foodsTitle': 'Foods',
    'settings.addFood': '＋ Add a food',
    'settings.iconsTitle': 'Icons',
    'settings.importImages': '🖼 Import images',
    'settings.importPack': '📦 Import a pack',
    'settings.aiPrompt': '✨ Generate an icon pack with AI',
    'settings.tablesTitle': 'Table numbers',
    'settings.alarmTitle': 'Alarm',
    'settings.testAlarm': '🔔 Test the alarm',
    'settings.restaurantTitle': 'Restaurant',
    'settings.restaurantPlaceholder': 'Restaurant name',
    'settings.ioTitle': 'Import / Export',
    'settings.export': '⬇ Export',
    'settings.import': '⬆ Import',
    'settings.languageTitle': 'Language',

    'food.enabled': '✔ Enabled',
    'food.disabled': 'Disabled',
    'food.labelPlaceholder': 'Label',
    'food.unitMin': 'min',
    'food.new': 'New food',

    'icons.none': 'No icons imported — foods use emojis.',

    'delete.title': 'Delete this timer?',
    'delete.confirm': '🗑 Delete',
    'delete.cancel': 'Cancel',

    'adjust.title': 'Adjust time',
    'adjust.plus1': '＋1 min',
    'adjust.plus5': '＋5 min',
    'adjust.minus1': '−1 min',
    'adjust.minus5': '−5 min',
    'adjust.confirm': '✔ Confirm',
    'adjust.cancel': 'Cancel',

    'numpad.title': 'Table number',
    'numpad.cancel': 'Cancel',

    'import.replace': 'Replace all',
    'import.merge': 'Merge',
    'import.cancel': 'Cancel',
    'import.summary': 'Valid file: {n} food(s){from}. What do you want to do?',
    'import.from': ' — “{name}”',

    'iconPicker.title': 'Choose an icon',
    'iconPicker.mine': 'My icons',
    'iconPicker.emojis': 'Emojis',
    'iconPicker.cancel': 'Cancel',

    'colorPicker.title': 'Choose a color',
    'colorPicker.cancel': 'Cancel',

    'prompt.title': 'Prompt to copy into your AI',
    'prompt.help': 'Paste this text into ChatGPT, Claude, Gemini… The AI will return a JSON file to load via “📦 Import a pack” (or individual PNGs to load via “🖼 Import images”). The dish list below is editable.',
    'prompt.copy': '📋 Copy the prompt',
    'prompt.copied': '✔ Copied!',
    'prompt.close': 'Close',
    'prompt.template': [
      'Generate one icon for EACH dish listed below.',
      '',
      'Required style, identical for every icon:',
      '- realistic but simple: the dish must be recognizable at a glance, without superfluous details;',
      '- a single subject per icon, well centered, filling the frame;',
      '- 100% transparent background, no text, no plate, no decor;',
      '- 256 × 256 pixel square, PNG format.',
      '',
      'Dish list:',
      '{dishes}',
      '',
      'Reply ONLY with a downloadable JSON file in exactly the following format',
      '(one entry per dish, "name" must repeat the EXACT name from the list above):',
      '',
      '{',
      '  "schemaVersion": 1,',
      '  "type": "icon-pack",',
      '  "icons": [',
      '    { "name": "Dish name", "image": "data:image/png;base64,..." }',
      '  ]',
      '}',
      '',
      'If you cannot produce this JSON, provide instead one PNG file per dish,',
      'named exactly as in the list (example: "Nems.png").'
    ].join('\n'),

    'msg.exported': 'File exported ✔',
    'msg.replaced': 'Configuration replaced ✔ ({n} foods)',
    'msg.merged': 'Merge complete ✔ ({foods} food(s), {icons} icon(s))',
    'msg.iconsResult': '{imported} icon(s) imported, {assigned} food(s) auto-assigned.',
    'msg.iconsUnreadable': ' {n} unreadable image(s) skipped.',
    'msg.storageFull': 'Storage full: delete some icons or import a lighter pack.',

    'err.notConfig': 'Invalid file: this is not a configuration.',
    'err.noSchema': 'Invalid file: missing “schemaVersion” field.',
    'err.badVersion': 'Unsupported file version (schemaVersion {v}).',
    'err.noFoods': 'Invalid file: missing “foods” list.',
    'err.foodNoName': 'Invalid file: a food has no name.',
    'err.badDuration': 'Invalid file: bad duration for “{name}”.',
    'err.badPresets': 'Invalid file: “durationPresets” must be a list.',
    'err.badIcons': 'Invalid file: “icons” must be a list.',
    'err.badIcon': 'Invalid file: an icon is malformed (missing name or image).',
    'err.notJson': 'Invalid file: this is not readable JSON.',
    'err.readFail': 'Could not read the file.',

    'err.packNoType': 'Invalid file: missing “type: "icon-pack"” field.',
    'err.packVersion': 'Unsupported pack version (schemaVersion {v}).',
    'err.packEmpty': 'Invalid file: the pack contains no icons.',
    'err.packIconNoName': 'Invalid file: a pack icon has no name.',
    'err.packIconNoImage': 'Invalid file: missing image for “{name}” (data URI expected).'
  }
};
