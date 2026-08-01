/* ============================================================
   Default configuration
   ------------------------------------------------------------
   This file is the ONLY thing to replace when shipping the app
   to another restaurant: it uses exactly the same JSON schema
   as the file produced by the Settings "Export" button
   (schemaVersion 2).

   - language : UI language ('en', 'fr' or 'zh-TW') — language
     files are packaged with the app under lang/
   - minutes : default timer duration (decimals allowed)
   - shortLabel : short bold label shown on buttons and rows
     (essential to tell all the 🥟 apart)
   - color : accent color (button / row color bar)
   - icons : optional image icons ({ id, name, image: dataURI })
   ============================================================ */

const DEFAULT_CONFIG = {
  "schemaVersion": 2,
  "restaurantName": "Restaurant",
  "language": "fr",
  "sortOrder": "asc",
  "addMode": "both",
  "tableMax": 20,
  "alarmVolume": 0.8,
  "durationPresets": [5, 10, 15],
  "icons": [],
  "foods": [

    /* ---------- FRYING station ---------- */
    { "id": "nems",               "name": "Nems",                                                   "shortLabel": "NEMS",            "icon": "🌯", "color": "#FF9800", "minutes": 6,  "category": "frying", "enabled": true },
    { "id": "beignets-crevettes", "name": "Beignets de crevettes",                                  "shortLabel": "B. CREVETTES",    "icon": "🍤", "color": "#FFB74D", "minutes": 4,  "category": "frying", "enabled": true },
    { "id": "beignets-seiche",    "name": "Beignets de seiche",                                     "shortLabel": "B. SEICHE",       "icon": "🦑", "color": "#90A4AE", "minutes": 4,  "category": "frying", "enabled": true },
    { "id": "samoussas",          "name": "Samoussas",                                              "shortLabel": "SAMOUSSAS",       "icon": "🥟", "color": "#FFD54F", "minutes": 5,  "category": "frying", "enabled": true },
    { "id": "raviolis-frits",     "name": "Raviolis frits (porc/crevettes)",                        "shortLabel": "RAV. FRITS",      "icon": "🥟", "color": "#A1887F", "minutes": 5,  "category": "frying", "enabled": true },
    { "id": "poulet-frit",        "name": "Poulet frit (orange/citron/caramel/5 parfums/cantonnais)","shortLabel": "POULET FRIT",    "icon": "🍗", "color": "#F4511E", "minutes": 8,  "category": "frying", "enabled": true },
    { "id": "poulet-pane",        "name": "Poulet pané (menu enfant)",                              "shortLabel": "POULET PANÉ",     "icon": "🍗", "color": "#FFCA28", "minutes": 7,  "category": "frying", "enabled": true },
    { "id": "canard-laque",       "name": "Canard laqué (remise en température/friture)",           "shortLabel": "CANARD",          "icon": "🦆", "color": "#8D6E63", "minutes": 10, "category": "frying", "enabled": true },
    { "id": "travers-porc",       "name": "Travers de porc",                                        "shortLabel": "TRAVERS",         "icon": "🍖", "color": "#C62828", "minutes": 10, "category": "frying", "enabled": true },

    /* ---------- STEAMING station (menu states 15 min cooking) ---------- */
    { "id": "ha-kao",             "name": "Ha-Kao (raviolis crevettes)",                            "shortLabel": "HA-KAO",          "icon": "🥟", "color": "#00897B", "minutes": 15, "category": "steaming",  "enabled": true },
    { "id": "fan-ko",             "name": "Fan-Ko (raviolis porc)",                                 "shortLabel": "FAN-KO",          "icon": "🥟", "color": "#8E24AA", "minutes": 15, "category": "steaming",  "enabled": true },
    { "id": "raviolis-royaux",    "name": "Raviolis royaux",                                        "shortLabel": "RAV. ROYAUX",     "icon": "🥟", "color": "#FDD835", "minutes": 15, "category": "steaming",  "enabled": true },
    { "id": "ha-mai",             "name": "Ha-Mai (bouchées crevettes)",                            "shortLabel": "HA-MAI",          "icon": "🥟", "color": "#039BE5", "minutes": 15, "category": "steaming",  "enabled": true },
    { "id": "sieu-mai",           "name": "Sieu-Mai (bouchées porc)",                               "shortLabel": "SIEU-MAI",        "icon": "🥟", "color": "#E53935", "minutes": 15, "category": "steaming",  "enabled": true },
    { "id": "bouchees-poulet",    "name": "Bouchées poulet",                                        "shortLabel": "B. POULET",       "icon": "🥟", "color": "#FB8C00", "minutes": 15, "category": "steaming",  "enabled": true },
    { "id": "raviolis-varies",    "name": "Raviolis variés vapeur",                                 "shortLabel": "RAV. VARIÉS",     "icon": "🥟", "color": "#43A047", "minutes": 15, "category": "steaming",  "enabled": true },
    { "id": "pekinois-vapeur",    "name": "Raviolis pékinois vapeur",                               "shortLabel": "PÉKINOIS VAP.",   "icon": "🥟", "color": "#5E35B1", "minutes": 15, "category": "steaming",  "enabled": true },
    { "id": "pekinois-grilles",   "name": "Raviolis pékinois grillés",                              "shortLabel": "PÉKINOIS GRILL.", "icon": "🥟", "color": "#6D4C41", "minutes": 30, "category": "steaming",  "enabled": true },
    { "id": "shichuannais",       "name": "Raviolis shichuannais",                                  "shortLabel": "SHICHUAN",        "icon": "🌶️", "color": "#D81B60", "minutes": 15, "category": "steaming",  "enabled": true },
    { "id": "boules-coco",        "name": "Boules de coco vapeur",                                  "shortLabel": "BOULES COCO",     "icon": "🥥", "color": "#EEEEEE", "minutes": 15, "category": "steaming",  "enabled": true },
    { "id": "gambas-ail",         "name": "Gambas vapeur à l'ail",                                  "shortLabel": "GAMBAS AIL",      "icon": "🦐", "color": "#FF7043", "minutes": 15, "category": "steaming",  "enabled": true }
  ]
};
