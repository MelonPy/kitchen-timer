/* ============================================================
   Language file — French (Français)
   ------------------------------------------------------------
   Packaged with the app; registers itself in APP_LANGUAGES.
   Any missing key falls back to English (lang/en.js).
   ============================================================ */

window.APP_LANGUAGES = window.APP_LANGUAGES || {};
window.APP_LANGUAGES['fr'] = {
  name: 'Français',
  strings: {
    'app.windowTitle': 'Timer Cuisine',
    'topbar.title': 'Minuteur cuisine',

    'main.empty': 'Aucun minuteur en cours.<br>Appuyez sur <strong>＋</strong> pour en lancer un.',
    'main.add': '＋ Ajouter',
    'main.customBadge': 'CUSTOM',
    'main.tableBadge': 'T{n}',

    'common.table': 'Table',
    'common.tableLong': 'TABLE {n}',

    'add.cancel': '✕ Annuler',
    'add.tabFoods': '🍜 Aliments',
    'add.tabDurations': '⏱ Durées',
    'add.plus1m': '＋1 min',
    'add.minus1m': '−1 min',
    'add.plus10s': '＋10 s',
    'add.minus10s': '−10 s',
    'add.start': '▶ Démarrer',

    'category.frying': 'FRITURE 🍟',
    'category.steaming': 'VAPEUR ♨️',
    'category.other': 'AUTRES',
    'foodCat.frying': 'Friture',
    'foodCat.steaming': 'Vapeur',
    'foodCat.other': 'Autre',

    'time.min': '{n} min',
    'time.minSec': '{m} min {s} s',

    'settings.title': 'Réglages',
    'settings.close': '✕ Fermer',
    'settings.sortTitle': 'Tri des minuteurs',
    'settings.sortAsc': '⬆ Croissant<br><small>fin proche en haut</small>',
    'settings.sortDesc': '⬇ Décroissant<br><small>fin proche en bas</small>',
    'settings.modeTitle': 'Menu d’ajout',
    'settings.modeFoods': 'Aliments',
    'settings.modeDurations': 'Durées',
    'settings.modeBoth': 'Les deux',
    'settings.durationsTitle': 'Durées prédéfinies',
    'settings.addDuration': '＋ Ajouter',
    'settings.foodsTitle': 'Aliments',
    'settings.addFood': '＋ Ajouter un aliment',
    'settings.iconsTitle': 'Icônes',
    'settings.importImages': '🖼 Importer des images',
    'settings.importPack': '📦 Importer un pack',
    'settings.aiPrompt': '✨ Générer un pack d’icônes avec l’IA',
    'settings.tablesTitle': 'Numéros de table',
    'settings.alarmTitle': 'Alarme',
    'settings.testAlarm': '🔔 Tester l’alarme',
    'settings.restaurantTitle': 'Restaurant',
    'settings.restaurantPlaceholder': 'Nom du restaurant',
    'settings.ioTitle': 'Import / Export',
    'settings.export': '⬇ Exporter',
    'settings.import': '⬆ Importer',
    'settings.languageTitle': 'Langue',

    'food.enabled': '✔ Activé',
    'food.disabled': 'Désactivé',
    'food.labelPlaceholder': 'Étiquette',
    'food.unitMin': 'min',
    'food.new': 'Nouvel aliment',

    'icons.none': 'Aucune icône importée — les aliments utilisent des emojis.',

    'delete.title': 'Supprimer ce minuteur ?',
    'delete.confirm': '🗑 Supprimer',
    'delete.cancel': 'Annuler',

    'adjust.title': 'Ajuster le temps',
    'adjust.plus1': '＋1 min',
    'adjust.plus5': '＋5 min',
    'adjust.minus1': '−1 min',
    'adjust.minus5': '−5 min',
    'adjust.confirm': '✔ Valider',
    'adjust.cancel': 'Annuler',

    'numpad.title': 'Numéro de table',
    'numpad.cancel': 'Annuler',

    'import.replace': 'Remplacer tout',
    'import.merge': 'Fusionner',
    'import.cancel': 'Annuler',
    'import.summary': 'Fichier valide : {n} aliment(s){from}. Que faire ?',
    'import.from': ' — « {name} »',

    'iconPicker.title': 'Choisir une icône',
    'iconPicker.mine': 'Mes icônes',
    'iconPicker.emojis': 'Emojis',
    'iconPicker.cancel': 'Annuler',

    'colorPicker.title': 'Choisir une couleur',
    'colorPicker.cancel': 'Annuler',

    'prompt.title': 'Prompt à copier dans votre IA',
    'prompt.help': 'Collez ce texte dans ChatGPT, Claude, Gemini… L’IA renverra un fichier JSON à charger via « 📦 Importer un pack » (ou des PNG individuels à charger via « 🖼 Importer des images »). La liste des plats est modifiable ci-dessous.',
    'prompt.copy': '📋 Copier le prompt',
    'prompt.copied': '✔ Copié !',
    'prompt.close': 'Fermer',
    'prompt.template': [
      'Génère une icône pour CHACUN des plats listés ci-dessous.',
      '',
      'Style imposé, identique pour toutes les icônes :',
      '- réaliste mais simple : le plat doit être reconnaissable au premier coup d’œil, sans détails superflus ;',
      '- un seul sujet par icône, bien centré, qui remplit le cadre ;',
      '- fond 100 % transparent, sans texte, sans assiette, sans décor ;',
      '- carré de 256 × 256 pixels, format PNG.',
      '',
      'Liste des plats :',
      '{dishes}',
      '',
      'Réponds UNIQUEMENT avec un fichier JSON téléchargeable, au format exact suivant',
      '(une entrée par plat, « name » reprend le nom EXACT de la liste ci-dessus) :',
      '',
      '{',
      '  "schemaVersion": 1,',
      '  "type": "icon-pack",',
      '  "icons": [',
      '    { "name": "Nom du plat", "image": "data:image/png;base64,..." }',
      '  ]',
      '}',
      '',
      'Si tu ne peux pas produire ce JSON, fournis à la place un fichier PNG par plat,',
      'nommé exactement comme dans la liste (exemple : « Nems.png »).'
    ].join('\n'),

    'msg.exported': 'Fichier exporté ✔',
    'msg.replaced': 'Configuration remplacée ✔ ({n} aliments)',
    'msg.merged': 'Fusion terminée ✔ ({foods} aliment(s), {icons} icône(s))',
    'msg.iconsResult': '{imported} icône(s) importée(s), {assigned} aliment(s) associé(s) automatiquement.',
    'msg.iconsUnreadable': ' {n} image(s) illisible(s) ignorée(s).',
    'msg.storageFull': 'Stockage plein : supprimez des icônes ou importez un pack plus léger.',

    'err.notConfig': 'Fichier invalide : ce n’est pas une configuration.',
    'err.noSchema': 'Fichier invalide : champ « schemaVersion » manquant.',
    'err.badVersion': 'Version de fichier non prise en charge (schemaVersion {v}).',
    'err.noFoods': 'Fichier invalide : liste « foods » manquante.',
    'err.foodNoName': 'Fichier invalide : un aliment n’a pas de nom.',
    'err.badDuration': 'Fichier invalide : durée incorrecte pour « {name} ».',
    'err.badPresets': 'Fichier invalide : « durationPresets » doit être une liste.',
    'err.badIcons': 'Fichier invalide : « icons » doit être une liste.',
    'err.badIcon': 'Fichier invalide : une icône est mal formée (nom ou image manquants).',
    'err.notJson': 'Fichier invalide : ce n’est pas un JSON lisible.',
    'err.readFail': 'Impossible de lire le fichier.',

    'err.packNoType': 'Fichier invalide : champ « type: "icon-pack" » manquant.',
    'err.packVersion': 'Version de pack non prise en charge (schemaVersion {v}).',
    'err.packEmpty': 'Fichier invalide : le pack ne contient aucune icône.',
    'err.packIconNoName': 'Fichier invalide : une icône du pack n’a pas de nom.',
    'err.packIconNoImage': 'Fichier invalide : image manquante pour « {name} » (data URI attendu).'
  }
};
