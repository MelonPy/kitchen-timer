/* ============================================================
   Language file — Traditional Chinese, Taiwan (繁體中文)
   ------------------------------------------------------------
   Packaged with the app; registers itself in APP_LANGUAGES.
   Any missing key falls back to English (lang/en.js).
   ============================================================ */

window.APP_LANGUAGES = window.APP_LANGUAGES || {};
window.APP_LANGUAGES['zh-TW'] = {
  name: '繁體中文',
  strings: {
    'app.windowTitle': '廚房計時器',
    'topbar.title': '廚房計時器',

    'main.empty': '目前沒有計時器。<br>按 <strong>＋</strong> 開始計時。',
    'main.add': '＋ 新增',
    'main.customBadge': '自訂',
    'main.tableBadge': '桌{n}',

    'common.table': '桌號',
    'common.tableLong': '桌號 {n}',

    'add.cancel': '✕ 取消',
    'add.tabFoods': '🍜 菜品',
    'add.tabDurations': '⏱ 時間',
    'add.plus1m': '＋1 分',
    'add.minus1m': '−1 分',
    'add.plus10s': '＋10 秒',
    'add.minus10s': '−10 秒',
    'add.start': '▶ 開始',

    'category.frying': '油炸 🍟',
    'category.steaming': '清蒸 ♨️',
    'category.other': '其他',
    'foodCat.frying': '油炸',
    'foodCat.steaming': '清蒸',
    'foodCat.other': '其他',

    'time.min': '{n} 分鐘',
    'time.minSec': '{m} 分 {s} 秒',

    'settings.title': '設定',
    'settings.close': '✕ 關閉',
    'settings.sortTitle': '計時器排序',
    'settings.sortAsc': '⬆ 遞增<br><small>最快結束的在上方</small>',
    'settings.sortDesc': '⬇ 遞減<br><small>最快結束的在下方</small>',
    'settings.modeTitle': '新增選單',
    'settings.modeFoods': '菜品',
    'settings.modeDurations': '時間',
    'settings.modeBoth': '兩者皆有',
    'settings.durationsTitle': '預設時間',
    'settings.addDuration': '＋ 新增',
    'settings.foodsTitle': '菜品',
    'settings.addFood': '＋ 新增菜品',
    'settings.iconsTitle': '圖示',
    'settings.importImages': '🖼 匯入圖片',
    'settings.importPack': '📦 匯入圖示包',
    'settings.aiPrompt': '✨ 用 AI 產生圖示包',
    'settings.tablesTitle': '桌號範圍',
    'settings.alarmTitle': '警報',
    'settings.testAlarm': '🔔 測試警報',
    'settings.restaurantTitle': '餐廳',
    'settings.restaurantPlaceholder': '餐廳名稱',
    'settings.ioTitle': '匯入 / 匯出',
    'settings.export': '⬇ 匯出',
    'settings.import': '⬆ 匯入',
    'settings.languageTitle': '語言',

    'food.enabled': '✔ 啟用',
    'food.disabled': '停用',
    'food.labelPlaceholder': '簡稱',
    'food.unitMin': '分鐘',
    'food.new': '新菜品',

    'icons.none': '尚未匯入圖示 — 菜品目前使用 emoji。',

    'delete.title': '刪除此計時器？',
    'delete.confirm': '🗑 刪除',
    'delete.cancel': '取消',

    'adjust.title': '調整時間',
    'adjust.plus1': '＋1 分',
    'adjust.plus5': '＋5 分',
    'adjust.minus1': '−1 分',
    'adjust.minus5': '−5 分',
    'adjust.confirm': '✔ 確定',
    'adjust.cancel': '取消',

    'numpad.title': '桌號',
    'numpad.cancel': '取消',

    'import.replace': '全部取代',
    'import.merge': '合併',
    'import.cancel': '取消',
    'import.summary': '檔案有效：{n} 道菜品{from}。要如何處理？',
    'import.from': ' —「{name}」',

    'iconPicker.title': '選擇圖示',
    'iconPicker.mine': '我的圖示',
    'iconPicker.emojis': 'Emoji',
    'iconPicker.cancel': '取消',

    'colorPicker.title': '選擇顏色',
    'colorPicker.cancel': '取消',

    'prompt.title': '複製到你的 AI 的提示詞',
    'prompt.help': '將此文字貼到 ChatGPT、Claude、Gemini… AI 會回傳一個 JSON 檔案，用「📦 匯入圖示包」載入（或回傳個別 PNG，用「🖼 匯入圖片」載入）。下方菜色清單可以修改。',
    'prompt.copy': '📋 複製提示詞',
    'prompt.copied': '✔ 已複製！',
    'prompt.close': '關閉',
    'prompt.template': [
      '請為下方清單中的每一道菜各產生一個圖示。',
      '',
      '所有圖示必須遵守相同的風格：',
      '- 寫實但簡潔：一眼就能認出這道菜，不要多餘細節；',
      '- 每個圖示只有一個主體，置中並填滿畫面；',
      '- 背景 100% 透明，不含文字、盤子或裝飾；',
      '- 256 × 256 像素正方形，PNG 格式。',
      '',
      '菜色清單：',
      '{dishes}',
      '',
      '請「只」回覆一個可下載的 JSON 檔案，格式必須完全如下',
      '（每道菜一筆，「name」必須與上方清單中的名稱完全一致）：',
      '',
      '{',
      '  "schemaVersion": 1,',
      '  "type": "icon-pack",',
      '  "icons": [',
      '    { "name": "菜名", "image": "data:image/png;base64,..." }',
      '  ]',
      '}',
      '',
      '如果無法產生這個 JSON，請改為每道菜提供一個 PNG 檔案，',
      '檔名必須與清單中的名稱完全一致（例如：「Nems.png」）。'
    ].join('\n'),

    'msg.exported': '檔案已匯出 ✔',
    'msg.replaced': '設定已全部取代 ✔（{n} 道菜品）',
    'msg.merged': '合併完成 ✔（{foods} 道菜品、{icons} 個圖示）',
    'msg.iconsResult': '已匯入 {imported} 個圖示，自動套用到 {assigned} 道菜品。',
    'msg.iconsUnreadable': ' 已略過 {n} 張無法讀取的圖片。',
    'msg.storageFull': '儲存空間已滿：請刪除部分圖示或匯入較小的圖示包。',

    'err.notConfig': '檔案無效：這不是設定檔。',
    'err.noSchema': '檔案無效：缺少「schemaVersion」欄位。',
    'err.badVersion': '不支援的檔案版本（schemaVersion {v}）。',
    'err.noFoods': '檔案無效：缺少「foods」清單。',
    'err.foodNoName': '檔案無效：有菜品沒有名稱。',
    'err.badDuration': '檔案無效：「{name}」的時間不正確。',
    'err.badPresets': '檔案無效：「durationPresets」必須是清單。',
    'err.badIcons': '檔案無效：「icons」必須是清單。',
    'err.badIcon': '檔案無效：有圖示格式錯誤（缺少名稱或圖片）。',
    'err.notJson': '檔案無效：無法解析為 JSON。',
    'err.readFail': '無法讀取檔案。',

    'err.packNoType': '檔案無效：缺少「type: "icon-pack"」欄位。',
    'err.packVersion': '不支援的圖示包版本（schemaVersion {v}）。',
    'err.packEmpty': '檔案無效：圖示包內沒有任何圖示。',
    'err.packIconNoName': '檔案無效：圖示包中有圖示沒有名稱。',
    'err.packIconNoImage': '檔案無效：「{name}」缺少圖片（需要 data URI）。'
  }
};
