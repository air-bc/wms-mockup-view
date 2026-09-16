// WMS Mockup — 共通スクリプト

/**
 * ファイル選択時にラベルのテキストをファイル名に更新する
 * @param {string} inputId  - input[type=file] の id
 * @param {string} labelId  - 表示テキストを持つ span の id
 */
function handleFileChange(inputId, labelId) {
  const input = document.getElementById(inputId);
  const label = document.getElementById(labelId);
  if (!input || !label) return;

  if (input.files.length > 0) {
    label.textContent = input.files[0].name;
    label.classList.add('has-file');
  } else {
    label.textContent = 'ファイルを選択してください (.csv)';
    label.classList.remove('has-file');
  }
}

// === オフキャンバスパネル制御 (SCR-002) ===

function openDefinitionPanel() {
  document.getElementById('definitionOverlay').classList.add('is-open');
  document.getElementById('definitionPanel').classList.add('is-open');
}

function closeDefinitionPanel() {
  document.getElementById('definitionOverlay').classList.remove('is-open');
  document.getElementById('definitionPanel').classList.remove('is-open');
}

/**
 * 定義テーブルをキーワードで絞り込む
 * @param {string} query - 検索文字列（ファイルコード・商品名対象）
 */
function filterDefinitionTable(query) {
  const q = query.toLowerCase().trim();
  const rows = document.querySelectorAll('#definitionTableBody tr');
  rows.forEach(function (row) {
    const csvCol  = (row.dataset.csvCol  || '').toLowerCase();
    const dbField = (row.dataset.dbField || '').toLowerCase();
    const match = !q || csvCol.includes(q) || dbField.includes(q);
    row.classList.toggle('hidden', !match);
  });
}

// Escape キーでオフキャンバスを閉じる
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeDefinitionPanel();
});

// === 雑コード変換テンプレート エントリ操作 (SCR-002 機能3) ===

/**
 * 雑コード入力行（コード名 + テンプレート + 削除ボタン）を末尾に追加する
 */
function addMiscCodeEntry() {
  var list = document.getElementById('miscCodeList');
  if (!list) return;

  var row = document.createElement('div');
  row.className = 'misc-code-row';
  row.setAttribute('role', 'listitem');
  row.innerHTML =
    '<input type="text" class="misc-code-name-input" placeholder="雑コード名" aria-label="雑コード名">' +
    '<input type="text" class="template-input" placeholder="例: {品番}-{日付}" aria-label="変換テンプレート">' +
    '<button type="button" class="btn btn-icon-subtle" onclick="deleteMiscCodeEntry(this)" aria-label="このエントリを削除">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
        '<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>' +
      '</svg>' +
    '</button>';

  list.appendChild(row);
  // 追加した行のコード名フィールドにフォーカス
  row.querySelector('.misc-code-name-input').focus();
}

/**
 * 削除ボタンが属する .misc-code-row を DOM から除去する
 * @param {HTMLElement} btn - クリックされた削除ボタン要素
 */
function deleteMiscCodeEntry(btn) {
  var row = btn.closest('.misc-code-row');
  if (row) row.remove();
}

// === 在庫明細フィルタ (SCR-004-1) ===

/**
 * テキスト入力で明細テーブル行を絞り込む（商品コード・商品名詳細 対象、リアルタイム）
 */
function filterDetailTable() {
  var text = (document.getElementById('detailTextFilter') || {}).value || '';
  var q = text.toLowerCase().trim();

  document.querySelectorAll('#detailTableBody tr').forEach(function (row) {
    var code = (row.dataset.code || '').toLowerCase();
    var name = (row.dataset.name || '').toLowerCase();
    var match = !q || code.includes(q) || name.includes(q);
    row.classList.toggle('hidden', !match);
  });
}

// === 移動履歴 CSV出力 (SCR-004-2) ===

/**
 * 移動履歴テーブルの全行を CSV ファイルとしてダウンロードする
 */
function exportHistoryCSV() {
  var table = document.getElementById('inventoryHistoryTable');
  if (!table) return;

  var rows = [];
  table.querySelectorAll('tr').forEach(function (tr) {
    var cells = tr.querySelectorAll('th, td');
    var cols = Array.prototype.map.call(cells, function (cell) {
      var text = cell.textContent.trim().replace(/\s+/g, ' ');
      return '"' + text.replace(/"/g, '""') + '"';
    });
    rows.push(cols.join(','));
  });

  var bom = '﻿';
  var blob = new Blob([bom + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'inventory_history.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// === 入出荷予定情報 日付初期設定 (SCR-003) ===

/**
 * 最終更新日時を現在日時で設定する
 */
function initScheduleUpdatedAt() {
  var el = document.getElementById('scheduleUpdatedAt');
  if (!el) return;
  var now = new Date();
  var y  = now.getFullYear();
  var mo = String(now.getMonth() + 1).padStart(2, '0');
  var d  = String(now.getDate()).padStart(2, '0');
  var h  = String(now.getHours()).padStart(2, '0');
  var mi = String(now.getMinutes()).padStart(2, '0');
  var s  = String(now.getSeconds()).padStart(2, '0');
  el.textContent = '最終更新: ' + y + '/' + mo + '/' + d + ' ' + h + ':' + mi + ':' + s;
}

/**
 * 日付入力フィールドのデフォルト値を当日に設定する
 */
function initScheduleDate() {
  var input = document.getElementById('scheduleDate');
  if (!input) return;
  var today = new Date();
  var y = today.getFullYear();
  var m = String(today.getMonth() + 1).padStart(2, '0');
  var d = String(today.getDate()).padStart(2, '0');
  input.value = y + '-' + m + '-' + d;
}

// === 在庫一覧フィルタ (SCR-004) ===

/**
 * テキスト入力と状態チェックボックスを AND 条件でテーブル行を絞り込む
 */
function filterInventoryTable() {
  var text = (document.getElementById('inventoryTextFilter') || {}).value || '';
  var q = text.toLowerCase().trim();

  var checkedStatuses = [];
  document.querySelectorAll('.inventory-status-filter input[type="checkbox"]').forEach(function (cb) {
    if (cb.checked) checkedStatuses.push(cb.value);
  });

  document.querySelectorAll('#inventoryTableBody tr').forEach(function (row) {
    var code   = (row.dataset.code   || '').toLowerCase();
    var name   = (row.dataset.name   || '').toLowerCase();
    var status = row.dataset.status  || '';

    var textMatch   = !q || code.includes(q) || name.includes(q);
    var statusMatch = checkedStatuses.indexOf(status) !== -1;

    row.classList.toggle('hidden', !(textMatch && statusMatch));
  });
}

// === 文字列検索 (SCR-003 機能5) ===

function filterScheduleTables(query) {
  var q = query.toLowerCase();
  var SEARCH_INDICES = [2, 3, 4, 6, 9];
  ['inboundScheduleTable', 'outboundScheduleTable'].forEach(function (tableId) {
    var table = document.getElementById(tableId);
    if (!table) return;
    table.querySelectorAll('tbody tr').forEach(function (row) {
      var cells = row.querySelectorAll('td');
      var match = !q || SEARCH_INDICES.some(function (i) {
        return cells[i] && cells[i].textContent.toLowerCase().includes(q);
      });
      row.style.display = match ? '' : 'none';
    });
  });
}

// === 入荷予定一覧 文字列検索 (renew SCR-003) ===

function filterInboundScheduleTable(query) {
  var q = query.toLowerCase().trim();
  var table = document.getElementById('inboundScheduleTable');
  if (!table) return;
  // グループ行（伝票No・入荷元）はそのまま表示し、明細行は
  // 明細自身のテキストか、属する伝票のテキストに一致すれば表示する
  var groupText = [];
  table.querySelectorAll('tbody tr').forEach(function (row) {
    if (row.classList.contains('schedule-order-row')) {
      row.style.display = '';
      groupText = [1, 2].map(function (i) {
        return (row.cells[i] ? row.cells[i].textContent : '').toLowerCase();
      });
      return;
    }
    if (!q) { row.style.display = ''; return; }
    // 商品コード・商品名・ロット番号
    var itemMatch = [3, 4, 8].some(function (i) {
      return row.cells[i] && row.cells[i].textContent.toLowerCase().includes(q);
    });
    var groupMatch = groupText.some(function (t) { return t.includes(q); });
    row.style.display = (itemMatch || groupMatch) ? '' : 'none';
  });
}

// === 入荷予定確定 文字列検索（検索ボタン実行 / SCR-006）===

/**
 * 対象日インプットの値をカード見出しの表示に反映する。
 * 検索実行時にのみ呼ぶことで、インプット編集中に見出しと明細が食い違うのを防ぐ。
 */
function syncConfirmTargetDate() {
  var label = document.getElementById('confirmTargetDate');
  if (!label) return;
  var value = (document.getElementById('scheduleDate') || {}).value || '';
  label.textContent = value ? value.replace(/-/g, '/') + ' 分' : '';
}

function filterInboundConfirmTable() {
  var table = document.getElementById('inboundScheduleTable');
  if (!table) return;
  syncConfirmTargetDate();
  var input = document.getElementById('scheduleSearch');
  var q = ((input && input.value) || '').toLowerCase().trim();
  // 検索対象列はヘッダー名から解決する（入荷予定日列の有無で列位置が変わるため）
  var TARGET_HEADERS = ['伝票No', '商品コード', '商品名', '入荷元', 'ロット番号'];
  var indices = [];
  var headers = table.querySelectorAll('thead th');
  headers.forEach(function (th, i) {
    if (TARGET_HEADERS.indexOf(th.textContent.trim()) !== -1) indices.push(i);
  });
  table.querySelectorAll('tbody tr').forEach(function (row) {
    var match = !q || indices.some(function (i) {
      return row.cells[i] && row.cells[i].textContent.toLowerCase().includes(q);
    });
    row.style.display = match ? '' : 'none';
  });
}

// === 出荷予定一覧 文字列検索 (renew SCR-007) ===

function filterOutboundScheduleTable(query) {
  var q = query.toLowerCase();
  var SEARCH_INDICES = [3, 4, 5, 7, 10];
  var table = document.getElementById('outboundScheduleTable');
  if (!table) return;
  table.querySelectorAll('tbody tr').forEach(function (row) {
    var cells = row.querySelectorAll('td');
    var match = !q || SEARCH_INDICES.some(function (i) {
      return cells[i] && cells[i].textContent.toLowerCase().includes(q);
    });
    row.style.display = match ? '' : 'none';
  });
}

// === 特記事項インライン編集 (SCR-003 機能4) ===

/**
 * 特記事項欄の確定処理（Enter押下 or フォーカスアウト時）
 * 値が空でなければ is-confirmed を付与してボーダーを非表示にする。
 * 空の場合は is-confirmed を除去して未入力状態（ボーダー表示）に戻す。
 * @param {HTMLInputElement} input
 */
function confirmRemarksInput(input) {
  if (input.value.trim() !== '') {
    input.classList.add('is-confirmed');
  } else {
    input.classList.remove('is-confirmed');
  }
}

/**
 * 特記事項欄のフォーカス取得時（クリックによる再編集）
 * is-confirmed を除去してボーダーを再表示する。
 * @param {HTMLInputElement} input
 */
function editRemarksInput(input) {
  input.classList.remove('is-confirmed');
}

initScheduleDate();
initScheduleUpdatedAt();

// === 入荷検品・棚入れ検品 (SCR-006) ===

var VEHICLES = [
  { id: 'V001', time: '08:30', remarks: '大阪230 あ 1234',              itemCount: 3, totalQty: 15 },
  { id: 'V002', time: '09:15', remarks: '神戸330 い 5678 / 佐藤 一郎', itemCount: 2, totalQty: 8  },
  { id: 'V003', time: '10:00', remarks: '京都400 う 9012',              itemCount: 5, totalQty: 30 },
  { id: 'V004', time: '11:30', remarks: '',                             itemCount: 1, totalQty: 24 },
  { id: 'V005', time: '13:00', remarks: '兵庫150 お 7890',              itemCount: 4, totalQty: 20 },
];

var INBOUND_PRODUCTS = [
  { code: 'P-10001', name: '電動ドリル 18V',     qty: '5個' },
  { code: 'P-10002', name: '充電バッテリー 18V',  qty: '8個' },
  { code: 'P-10003', name: 'ドリルビットセット',   qty: '2個' },
];

var PUTAWAY_PRODUCTS = [
  { code: 'P-10001', name: '電動ドリル 18V',     qty: '5個' },
  { code: 'P-10002', name: '充電バッテリー 18V',  qty: '8個' },
  { code: 'P-10003', name: 'ドリルビットセット',   qty: '2個' },
];

// 車両ごとのチェック状態。V001・V002 は入荷検品済み（初期ダミー）
var inboundCheckState = {
  vehicles: {
    'V001': { inboundDone: true,  putawayDone: false,
              inboundChecked: { 'P-10001': true, 'P-10002': true, 'P-10003': true },
              putawayChecked: {} },
    'V002': { inboundDone: true,  putawayDone: false,
              inboundChecked: { 'P-10001': true, 'P-10002': true, 'P-10003': true },
              putawayChecked: {} },
    'V003': { inboundDone: false, putawayDone: false, inboundChecked: {}, putawayChecked: {} },
    'V004': { inboundDone: false, putawayDone: false, inboundChecked: {}, putawayChecked: {} },
    'V005': { inboundDone: false, putawayDone: false, inboundChecked: {}, putawayChecked: {} },
  },
  currentVehicleId: null,
  currentTab: 'inbound',
  pendingPutawayCode: null,
};

/**
 * SCR-006 画面初期化。DOMが存在する場合のみ実行する。
 */
function initInboundCheck() {
  if (!document.getElementById('view-inbound-list')) return;
  renderVehicleList('inbound');
  renderVehicleList('putaway');
  showPhoneView('view-inbound-list');
}

/**
 * 指定ビューを表示し他を非表示にする。ヘッダー・タブの表示状態も更新する。
 * @param {string} viewId
 */
function showPhoneView(viewId) {
  var views = ['view-inbound-list', 'view-putaway-list', 'view-inbound-products', 'view-putaway-products'];
  views.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.style.display = (id === viewId) ? '' : 'none';
  });

  var isMainView = (viewId === 'view-inbound-list' || viewId === 'view-putaway-list');
  var tabs    = document.getElementById('phoneTabs');
  var backBtn = document.getElementById('phoneBackBtn');
  var title   = document.getElementById('phoneTitle');

  if (tabs)    tabs.style.display    = isMainView ? '' : 'none';
  if (backBtn) backBtn.style.display = isMainView ? 'none' : '';

  if (title) {
    var titles = {
      'view-inbound-list':     '入荷検品・棚入れ検品',
      'view-putaway-list':     '入荷検品・棚入れ検品',
      'view-inbound-products': '入荷商品一覧',
      'view-putaway-products': '棚入れ商品一覧',
    };
    title.textContent = titles[viewId] || '';
  }
}

/**
 * タブ切り替え
 * @param {'inbound'|'putaway'} tab
 */
function switchInboundTab(tab) {
  inboundCheckState.currentTab = tab;
  var tabInbound = document.getElementById('tabInbound');
  var tabPutaway = document.getElementById('tabPutaway');
  if (tabInbound) tabInbound.classList.toggle('active', tab === 'inbound');
  if (tabPutaway) tabPutaway.classList.toggle('active', tab === 'putaway');
  showPhoneView(tab === 'inbound' ? 'view-inbound-list' : 'view-putaway-list');
}

/**
 * 車両行タップ時: 商品一覧サブ画面へ遷移する
 * @param {string} vehicleId
 * @param {'inbound'|'putaway'} type
 */
function navigateToProducts(vehicleId, type) {
  inboundCheckState.currentVehicleId = vehicleId;
  renderProductList(vehicleId, type);
  showPhoneView(type === 'inbound' ? 'view-inbound-products' : 'view-putaway-products');
}

/**
 * 戻るボタン: 元のリストビューへ戻る
 */
function navigateBack() {
  var tab = inboundCheckState.currentTab;
  showPhoneView(tab === 'inbound' ? 'view-inbound-list' : 'view-putaway-list');
  inboundCheckState.currentVehicleId = null;
}

/**
 * 商品行ダブルクリック時。入荷はそのままチェック、棚入れはモーダルを開く。
 * @param {string} productCode
 * @param {'inbound'|'putaway'} type
 */
function handleProductDblClick(productCode, type) {
  if (type === 'putaway') {
    openPutawayModal(productCode);
    return;
  }

  var vehicleId = inboundCheckState.currentVehicleId;
  if (!vehicleId) return;
  var vState = inboundCheckState.vehicles[vehicleId];
  if (!vState) return;

  if (vState.inboundChecked[productCode]) return;

  vState.inboundChecked[productCode] = true;

  var row = document.querySelector(
    '[data-product-code="' + productCode + '"][data-product-type="inbound"]'
  );
  if (row) row.classList.add('checked');

  var allChecked = INBOUND_PRODUCTS.every(function (p) { return vState.inboundChecked[p.code]; });
  if (allChecked) {
    vState.inboundDone = true;
    renderVehicleList('inbound');
    renderVehicleList('putaway');
  }
}

/**
 * 棚入れモーダルを開く
 * @param {string} productCode
 */
function openPutawayModal(productCode) {
  var vState = inboundCheckState.vehicles[inboundCheckState.currentVehicleId];
  if (!vState) return;
  var entry = vState.putawayChecked[productCode];
  if (entry && entry.checked) return;

  inboundCheckState.pendingPutawayCode = productCode;
  var overlay = document.getElementById('putawayModalOverlay');
  var modal   = document.getElementById('putawayModal');
  if (overlay) overlay.style.display = 'block';
  if (modal)   modal.style.display   = 'flex';
}

/**
 * 棚入れモーダルを閉じる
 */
function closePutawayModal() {
  inboundCheckState.pendingPutawayCode = null;
  var overlay = document.getElementById('putawayModalOverlay');
  var modal   = document.getElementById('putawayModal');
  if (overlay) overlay.style.display = 'none';
  if (modal)   modal.style.display   = 'none';
}

/**
 * モーダル内ダミー棚コードのダブルクリック: 棚コードスキャン完了として処理する
 */
function handleShelfDblClick() {
  var productCode = inboundCheckState.pendingPutawayCode;
  if (!productCode) return;

  var vehicleId = inboundCheckState.currentVehicleId;
  var vState = inboundCheckState.vehicles[vehicleId];
  if (!vState) return;

  var scannedLoc = 'L-99-99';
  vState.putawayChecked[productCode] = { checked: true, scannedLoc: scannedLoc };

  var row = document.querySelector(
    '[data-product-code="' + productCode + '"][data-product-type="putaway"]'
  );
  if (row) {
    row.classList.add('checked');
    var locEl = document.createElement('div');
    locEl.className = 'product-row-loc';
    locEl.textContent = scannedLoc;
    var codeEl = row.querySelector('.product-row-code');
    if (codeEl) row.insertBefore(locEl, codeEl);
  }

  closePutawayModal();

  var allChecked = PUTAWAY_PRODUCTS.every(function (p) {
    var e = vState.putawayChecked[p.code];
    return e && e.checked;
  });
  if (allChecked) {
    vState.putawayDone = true;
    renderVehicleList('putaway');
  }
}

/**
 * 指定タイプの車両リストを再描画する
 * @param {'inbound'|'putaway'} type
 */
function renderVehicleList(type) {
  var containerId = type === 'inbound' ? 'view-inbound-list' : 'view-putaway-list';
  var container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  var vehicles = VEHICLES.filter(function (v) {
    if (type === 'inbound') return true;
    // 棚入れ予定は入荷検品完了済みの車両のみ
    return inboundCheckState.vehicles[v.id] && inboundCheckState.vehicles[v.id].inboundDone;
  });

  vehicles.forEach(function (v) {
    var vState = inboundCheckState.vehicles[v.id];
    var isDone = type === 'inbound' ? vState.inboundDone : vState.putawayDone;

    var row = document.createElement('div');
    row.className = 'vehicle-row' + (isDone ? ' checked' : '');
    var label = (v.remarks && v.remarks.trim()) ? v.remarks : '未割当';
    row.innerHTML =
      '<div class="vehicle-row-top">' +
        '<span class="vehicle-check-icon" aria-hidden="true">✓</span>' +
        '<span>' + v.time + '&ensp;' + label + '</span>' +
      '</div>' +
      '<div class="vehicle-row-bottom">' +
        '<span class="vehicle-row-qty">' + v.itemCount + '品目 / ' + v.totalQty + '個</span>' +
        '<span class="vehicle-row-arrow" aria-hidden="true">›</span>' +
      '</div>';

    if (!isDone) {
      (function (vehicleId, t) {
        row.addEventListener('click', function () { navigateToProducts(vehicleId, t); });
      }(v.id, type));
    }

    container.appendChild(row);
  });
}

/**
 * 指定車両の商品リストを描画する
 * @param {string} vehicleId
 * @param {'inbound'|'putaway'} type
 */
function renderProductList(vehicleId, type) {
  var containerId = type === 'inbound' ? 'view-inbound-products' : 'view-putaway-products';
  var container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  var vState = inboundCheckState.vehicles[vehicleId];
  var checkedMap = type === 'inbound' ? vState.inboundChecked : vState.putawayChecked;
  var products = type === 'inbound' ? INBOUND_PRODUCTS : PUTAWAY_PRODUCTS;

  products.forEach(function (p) {
    var entry = type === 'putaway' ? checkedMap[p.code] : null;
    var isChecked = type === 'inbound' ? !!checkedMap[p.code] : !!(entry && entry.checked);
    var row = document.createElement('div');
    row.className = 'product-row' + (isChecked ? ' checked' : '');
    row.dataset.productCode = p.code;
    row.dataset.productType = type;

    var inner = '';
    if (type === 'putaway' && entry && entry.scannedLoc) {
      inner += '<div class="product-row-loc">' + entry.scannedLoc + '</div>';
    }
    inner +=
      '<div class="product-row-code">' +
        '<span class="product-check-icon" aria-hidden="true">✓</span>' +
        p.code + '&ensp;' + p.name +
      '</div>' +
      '<div class="product-row-qty">' + p.qty + '</div>';
    row.innerHTML = inner;

    (function (code, t) {
      row.addEventListener('dblclick', function () { handleProductDblClick(code, t); });
    }(p.code, type));

    container.appendChild(row);
  });
}

initInboundCheck();

// === 棚ロケ定義 (SCR-005) ===

var shelfLocations = [
  { code: 'A-01-01-1' },
  { code: 'A-01-01-2' },
  { code: 'A-01-02-1' },
  { code: 'A-02-01-1' },
  { code: 'B-01-01-1' },
  { code: 'B-01-02-1' },
  { code: 'C-01-01-1' },
];

var berths = [
  { id: 'B1', name: '第1バース' },
  { id: 'B2', name: '第2バース' },
  { id: 'B3', name: '第3バース' },
];

var dragSrcIndex = -1;

function initShelfLocation() {
  if (!document.getElementById('shelfTableBody')) return;
  renderShelfTable();
  renderPickRouteTable();
  renderBerthTable();
}

function switchShelfTab(tabName) {
  var map = {
    shelf: { panel: 'panelShelf', btn: 'tabShelf' },
    route: { panel: 'panelRoute', btn: 'tabRoute' },
    berth: { panel: 'panelBerth', btn: 'tabBerth' },
  };
  Object.keys(map).forEach(function (t) {
    var isActive = (t === tabName);
    var panel = document.getElementById(map[t].panel);
    var btn   = document.getElementById(map[t].btn);
    if (panel) panel.classList.toggle('active', isActive);
    if (btn) {
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    }
  });
}

function addShelfLocation() {
  var codeEl = document.getElementById('shelfCodeInput');
  var code   = codeEl ? codeEl.value.trim() : '';

  if (!code) {
    alert('棚ロケコードを入力してください。');
    return;
  }
  if (shelfLocations.some(function (s) { return s.code === code; })) {
    alert('棚ロケコード「' + code + '」はすでに登録されています。');
    return;
  }

  shelfLocations.push({ code: code });
  shelfLocations.sort(function (a, b) { return a.code < b.code ? -1 : a.code > b.code ? 1 : 0; });

  if (codeEl) codeEl.value = '';

  renderShelfTable();
  renderPickRouteTable();
}

function deleteShelfLocation(code) {
  if (!confirm('棚ロケ「' + code + '」を削除しますか？')) return;
  shelfLocations = shelfLocations.filter(function (s) { return s.code !== code; });
  renderShelfTable();
  renderPickRouteTable();
}

function renderShelfTable() {
  var tbody = document.getElementById('shelfTableBody');
  if (!tbody) return;
  var showPickOrder = !!document.getElementById('shelfPickOrderHeader');
  tbody.innerHTML = '';
  shelfLocations.forEach(function (s, index) {
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td style="width:32px"><input type="checkbox" class="shelf-row-check"></td>' +
      '<td>' + s.code + '</td>' +
      (showPickOrder ? '<td style="text-align:center; color:var(--ds-text-subtle)">' + (index + 1) + '</td>' : '') +
      '<td><button class="btn-delete" onclick="deleteShelfLocation(\'' + s.code + '\')">削除</button></td>';
    tbody.appendChild(tr);
  });
}

function toggleAllShelfChecks(masterCb) {
  document.querySelectorAll('.shelf-row-check').forEach(function (cb) {
    cb.checked = masterCb.checked;
  });
}

function printShelfQR() {
  alert('QR印刷（モックアップ）');
}

function renderPickRouteTable() {
  var tbody = document.getElementById('pickRouteTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  shelfLocations.forEach(function (s, index) {
    var tr = document.createElement('tr');
    tr.className = 'pick-route-row';
    tr.draggable = true;
    tr.dataset.index = index;
    tr.innerHTML =
      '<td style="text-align:center; color:var(--ds-text-subtle)">' + (index + 1) + '</td>' +
      '<td>' + s.code + '</td>' +
      '<td class="drag-handle" title="ドラッグして並び替え">&#8801;</td>';
    tbody.appendChild(tr);
  });

  initDragAndDrop();
}

/**
 * ドラッグ&ドロップのイベントを各行に設定する
 */
function initDragAndDrop() {
  var rows = document.querySelectorAll('.pick-route-row');

  rows.forEach(function (row) {
    row.addEventListener('dragstart', function (e) {
      dragSrcIndex = parseInt(row.dataset.index, 10);
      row.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    row.addEventListener('dragend', function () {
      row.classList.remove('dragging');
      document.querySelectorAll('.pick-route-row').forEach(function (r) {
        r.classList.remove('drag-over-top', 'drag-over-bottom');
      });
    });

    row.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      var rect = row.getBoundingClientRect();
      row.classList.remove('drag-over-top', 'drag-over-bottom');
      row.classList.add(e.clientY < rect.top + rect.height / 2 ? 'drag-over-top' : 'drag-over-bottom');
    });

    row.addEventListener('dragleave', function () {
      row.classList.remove('drag-over-top', 'drag-over-bottom');
    });

    row.addEventListener('drop', function (e) {
      e.preventDefault();
      var targetIndex = parseInt(row.dataset.index, 10);
      if (dragSrcIndex === targetIndex) return;

      var rect     = row.getBoundingClientRect();
      var isTop    = e.clientY < rect.top + rect.height / 2;
      var moved    = shelfLocations.splice(dragSrcIndex, 1)[0];
      // splice後のインデックス調整: 元位置より後ろならターゲットが1つ前にずれている
      var adjusted = dragSrcIndex < targetIndex ? targetIndex - 1 : targetIndex;
      shelfLocations.splice(isTop ? adjusted : adjusted + 1, 0, moved);

      renderPickRouteTable();
    });
  });
}

/**
 * バース一覧テーブルを再描画する
 */
function renderBerthTable() {
  var tbody = document.getElementById('berthTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  berths.forEach(function (b) {
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + b.id + '</td>' +
      '<td>' + b.name + '</td>' +
      '<td><button class="btn-delete" onclick="deleteBerth(\'' + b.id + '\')">削除</button></td>';
    tbody.appendChild(tr);
  });
}

/**
 * バースを追加する
 */
function addBerth() {
  var idEl   = document.getElementById('berthIdInput');
  var nameEl = document.getElementById('berthNameInput');
  var id     = idEl   ? idEl.value.trim()   : '';
  var name   = nameEl ? nameEl.value.trim() : '';

  if (!id) {
    alert('バース番号を入力してください。');
    return;
  }
  if (berths.some(function (b) { return b.id === id; })) {
    alert('バース番号「' + id + '」はすでに登録されています。');
    return;
  }

  berths.push({ id: id, name: name });
  if (idEl)   idEl.value   = '';
  if (nameEl) nameEl.value = '';

  renderBerthTable();
}

/**
 * バースを削除する
 * @param {string} id
 */
function deleteBerth(id) {
  if (!confirm('バース「' + id + '」を削除しますか？')) return;
  berths = berths.filter(function (b) { return b.id !== id; });
  renderBerthTable();
}

initShelfLocation();

// ============================================================
// SCR-008: 棚移動検品
// ============================================================

const PRODUCT_MASTER = {
  'ITM-001': '冷凍食品A',
  'ITM-002': '冷凍食品B',
  'ITM-003': '冷凍食品C',
  'ITM-010': '飲料C',
  'ITM-011': '飲料D',
};

const transferState = {
  sources: [],
  activeSourceIdx: null,
  lastSourceIdx: null,
  lastDestIdx: null,
};

function initShelfTransfer() {
  if (!document.getElementById('transferList')) return;

  transferState.sources = [
    {
      shelfCode: 'S-A01',
      products: [
        { code: 'ITM-001', name: '冷凍食品A', qty: 3 },
        { code: 'ITM-002', name: '冷凍食品B', qty: 1 },
      ],
      active: true,
      dests: [
        {
          shelfCode: 'S-C02',
          products: [
            { code: 'ITM-001', name: '冷凍食品A', qty: 3 },
            { code: 'ITM-002', name: '冷凍食品B', qty: 1 },
          ],
        },
      ],
    },
    {
      shelfCode: 'S-B03',
      products: [
        { code: 'ITM-010', name: '飲料C', qty: 2 },
      ],
      active: false,
      dests: [],
    },
  ];
  transferState.activeSourceIdx = 0;
  transferState.lastSourceIdx = 1;
  transferState.lastDestIdx = 0;

  renderTransfer();
  renderScanBar();

  var input = document.getElementById('scanInput');
  if (input) {
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') handleScanInput(this.value);
    });
    input.focus();
  }
}

function handleScanInput(value) {
  var v = value.trim();
  if (!v) return;
  if (isShelfCode(v)) {
    processShelfScan(v.toUpperCase());
  } else {
    processProductScan(v.toUpperCase());
  }
  renderScanBar();
  var input = document.getElementById('scanInput');
  if (input) { input.value = ''; input.focus(); }
}

function isShelfCode(value) {
  return value.toUpperCase().startsWith('S-');
}

function getCurrentMode() {
  return transferState.activeSourceIdx !== null ? 'dest' : 'source';
}

function processShelfScan(code) {
  if (getCurrentMode() === 'source') {
    transferState.sources.push({ shelfCode: code, products: [], active: false, dests: [] });
    transferState.lastSourceIdx = transferState.sources.length - 1;
  } else {
    var src = transferState.sources[transferState.activeSourceIdx];
    src.dests.push({ shelfCode: code, products: [] });
    transferState.lastDestIdx = src.dests.length - 1;
  }
  renderTransfer();
}

function processProductScan(code) {
  var name = getProductName(code);
  if (getCurrentMode() === 'source') {
    if (transferState.lastSourceIdx === null) return;
    var src = transferState.sources[transferState.lastSourceIdx];
    var existing = src.products.find(function (p) { return p.code === code; });
    if (existing) { existing.qty++; } else { src.products.push({ code: code, name: name, qty: 1 }); }
  } else {
    if (transferState.lastDestIdx === null) return;
    var src = transferState.sources[transferState.activeSourceIdx];
    var dest = src.dests[transferState.lastDestIdx];
    var existing = dest.products.find(function (p) { return p.code === code; });
    if (existing) { existing.qty++; } else { dest.products.push({ code: code, name: name, qty: 1 }); }
  }
  renderTransfer();
}

function setActiveSource(idx) {
  if (transferState.activeSourceIdx === idx) {
    transferState.sources[idx].active = false;
    transferState.activeSourceIdx = null;
    transferState.lastDestIdx = null;
  } else {
    if (transferState.activeSourceIdx !== null) {
      transferState.sources[transferState.activeSourceIdx].active = false;
    }
    transferState.sources[idx].active = true;
    transferState.activeSourceIdx = idx;
    var dests = transferState.sources[idx].dests;
    transferState.lastDestIdx = dests.length > 0 ? dests.length - 1 : null;
  }
  renderTransfer();
  renderScanBar();
  var input = document.getElementById('scanInput');
  if (input) input.focus();
}

function renderTransfer() {
  var list = document.getElementById('transferList');
  if (!list) return;
  list.innerHTML = '';

  if (transferState.sources.length === 0) {
    list.innerHTML = '<div class="transfer-col-empty">移動元棚QRをスキャンしてください</div>';
    return;
  }

  transferState.sources.forEach(function (src, idx) {
    var row = document.createElement('div');
    row.className = 'transfer-row';

    // 左: 移動元棚枠
    var srcSide = document.createElement('div');
    srcSide.className = 'transfer-row-source';

    var srcFrame = document.createElement('div');
    srcFrame.className = 'shelf-frame' + (src.active ? ' active' : '');
    srcFrame.onclick = function () { setActiveSource(idx); };

    var srcHeader = document.createElement('div');
    srcHeader.className = 'shelf-frame-header';
    var codeSpan = document.createElement('span');
    codeSpan.textContent = src.shelfCode;
    srcHeader.appendChild(codeSpan);
    if (src.active) {
      var badge = document.createElement('span');
      badge.className = 'shelf-frame-active-badge';
      badge.textContent = '選択中';
      srcHeader.appendChild(badge);
    }

    var srcProducts = document.createElement('div');
    srcProducts.className = 'shelf-frame-products';
    src.products.forEach(function (p) {
      var pRow = document.createElement('div');
      pRow.className = 'shelf-product-row';
      pRow.innerHTML = p.code + ' ' + p.name + ' <span class="shelf-product-qty">×' + p.qty + '</span>';
      srcProducts.appendChild(pRow);
    });

    srcFrame.appendChild(srcHeader);
    srcFrame.appendChild(srcProducts);
    srcSide.appendChild(srcFrame);

    // 右: 移動先棚枠（なければ空欄）
    var destSide = document.createElement('div');
    destSide.className = 'transfer-row-dest';

    if (src.dests.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'dest-slot-empty';
      destSide.appendChild(empty);
    } else {
      src.dests.forEach(function (dest) {
        var destFrame = document.createElement('div');
        destFrame.className = 'shelf-frame';

        var destHeader = document.createElement('div');
        destHeader.className = 'shelf-frame-header';
        destHeader.textContent = dest.shelfCode;

        var destProducts = document.createElement('div');
        destProducts.className = 'shelf-frame-products';
        dest.products.forEach(function (p) {
          var pRow = document.createElement('div');
          pRow.className = 'shelf-product-row';
          pRow.innerHTML = p.code + ' ' + p.name + ' <span class="shelf-product-qty">×' + p.qty + '</span>';
          destProducts.appendChild(pRow);
        });

        destFrame.appendChild(destHeader);
        destFrame.appendChild(destProducts);
        destSide.appendChild(destFrame);
      });
    }

    row.appendChild(srcSide);
    row.appendChild(destSide);
    list.appendChild(row);
  });
}

function renderScanBar() {
  var indicator = document.getElementById('scanModeIndicator');
  if (!indicator) return;
  if (getCurrentMode() === 'source') {
    indicator.textContent = '移動元をスキャン中';
    indicator.className = 'scan-mode-indicator mode-source';
  } else {
    indicator.textContent = '移動先をスキャン中';
    indicator.className = 'scan-mode-indicator mode-dest';
  }
}

function getProductName(code) {
  return PRODUCT_MASTER[code] || '(不明商品)';
}

initShelfTransfer();

/* ============================================================
   SCR-009: 差異管理
   ============================================================ */

var DIFF_DATA = [
  { stock: 10, counted: 8,  diff: -2, shelf: 'S-A01', item: 'ITM-001', status: '未確認' },
  { stock: 5,  counted: 5,  diff: 0,  shelf: 'S-A01', item: 'ITM-002', status: '未確認' },
  { stock: 20, counted: 23, diff: 3,  shelf: 'S-B03', item: 'ITM-010', status: '未確認' },
  { stock: 3,  counted: 0,  diff: -3, shelf: 'S-C02', item: 'ITM-003', status: '未確認' },
  { stock: 15, counted: 15, diff: 0,  shelf: 'S-C02', item: 'ITM-011', status: '未確認' },
];

var diffState = {
  filterWarningOnly: false,
  searchQuery: '',
};

function initDiffTable() {
  if (!document.getElementById('diffTableBody')) return;
  renderDiffTable();
}

function renderDiffTable() {
  var tbody = document.getElementById('diffTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  var query = diffState.searchQuery.toLowerCase();

  DIFF_DATA.forEach(function (row) {
    var matchesFilter = !diffState.filterWarningOnly || row.diff !== 0;
    var matchesSearch = !query ||
      row.shelf.toLowerCase().indexOf(query) !== -1 ||
      row.item.toLowerCase().indexOf(query) !== -1;

    var tr = document.createElement('tr');
    if (!matchesFilter || !matchesSearch) {
      tr.className = 'hidden';
    } else if (row.diff !== 0) {
      tr.className = 'diff-row-warning';
    }

    var diffSign = row.diff > 0 ? '+' + row.diff : String(row.diff);
    var badgeClass = row.status === '確認済み' ? 'checked' : 'unchecked';

    tr.innerHTML =
      '<td>' + row.stock + '</td>' +
      '<td>' + row.counted + '</td>' +
      '<td>' + diffSign + '</td>' +
      '<td>' + row.shelf + '</td>' +
      '<td>' + row.item + '</td>' +
      '<td><span class="diff-status-badge ' + badgeClass + '">' + row.status + '</span></td>';

    tbody.appendChild(tr);
  });
}

function toggleDiffFilter() {
  var btn = document.getElementById('diffFilterToggle');
  if (!btn) return;
  diffState.filterWarningOnly = !diffState.filterWarningOnly;
  btn.dataset.active = String(diffState.filterWarningOnly);
  if (diffState.filterWarningOnly) {
    btn.classList.add('active');
  } else {
    btn.classList.remove('active');
  }
  renderDiffTable();
}

function handleDiffSearch(value) {
  diffState.searchQuery = value;
  renderDiffTable();
}

function approveAllDiff() {
  if (!confirm('棚卸数を在庫数として確定します。よろしいですか？')) return;
  DIFF_DATA.forEach(function (row) {
    row.stock = row.counted;
    row.diff = 0;
    row.status = '確認済み';
  });
  renderDiffTable();
}

initDiffTable();

/* ============================================================
   SCR-009-1: 棚卸作業（棚一覧）
   ============================================================ */

var INVENTORY_SHELF_DATA = [
  { code: 'A-01-01-1', total: 5, scanned: 5 },
  { code: 'A-01-01-2', total: 3, scanned: 3 },
  { code: 'A-01-02-1', total: 4, scanned: 2 },
  { code: 'A-01-02-2', total: 2, scanned: 0 },
  { code: 'A-01-03-1', total: 4, scanned: 4 },
  { code: 'A-02-01-1', total: 3, scanned: 1 },
  { code: 'A-02-01-2', total: 3, scanned: 3 },
  { code: 'A-02-02-1', total: 5, scanned: 0 },
  { code: 'A-02-02-2', total: 2, scanned: 2 },
  { code: 'A-02-03-1', total: 4, scanned: 1 },
  { code: 'A-03-01-1', total: 3, scanned: 0 },
  { code: 'A-03-01-2', total: 3, scanned: 3 },
  { code: 'A-03-02-1', total: 6, scanned: 2 },
  { code: 'A-03-02-2', total: 2, scanned: 0 },
  { code: 'A-03-03-1', total: 1, scanned: 1 },
  { code: 'B-01-01-1', total: 4, scanned: 4 },
  { code: 'B-01-02-1', total: 3, scanned: 0 },
  { code: 'B-01-03-1', total: 3, scanned: 2 },
  { code: 'B-02-01-1', total: 4, scanned: 0 },
  { code: 'B-02-02-1', total: 5, scanned: 5 },
];

var inventoryShelfState = {
  filterCompleted: false,
  searchQuery: '',
};

function initInventoryShelfList() {
  if (!document.getElementById('shelfList')) return;
  renderShelfList();
}

function getFilteredShelves() {
  var query = inventoryShelfState.searchQuery.toLowerCase();
  return INVENTORY_SHELF_DATA.filter(function (shelf) {
    var isCompleted = shelf.scanned === shelf.total;
    var matchesFilter = !inventoryShelfState.filterCompleted || !isCompleted;
    var matchesSearch = !query || shelf.code.toLowerCase().indexOf(query) !== -1;
    return matchesFilter && matchesSearch;
  });
}

function createShelfCard(shelf) {
  var isCompleted = shelf.scanned === shelf.total;
  var pct = shelf.total > 0 ? Math.round((shelf.scanned / shelf.total) * 100) : 0;

  var card = document.createElement('div');
  card.className = 'shelf-card' + (isCompleted ? ' completed' : '');

  var badge = isCompleted
    ? '<span class="shelf-card-badge">完了</span>'
    : '';

  var fillClass = isCompleted ? 'fill-complete' : 'fill-incomplete';

  card.innerHTML =
    '<div class="shelf-card-header">' +
      '<span>' + shelf.code + '</span>' +
      badge +
    '</div>' +
    '<div class="shelf-card-progress">' +
      '<div class="shelf-progress-bar">' +
        '<div class="shelf-progress-bar-fill ' + fillClass + '" style="width:' + pct + '%"></div>' +
      '</div>' +
      '<span class="shelf-progress-text">' + shelf.scanned + ' / ' + shelf.total + '</span>' +
    '</div>';

  return card;
}

function renderShelfList() {
  var list = document.getElementById('shelfList');
  if (!list) return;
  list.innerHTML = '';
  var filtered = getFilteredShelves();
  filtered.forEach(function (shelf) {
    list.appendChild(createShelfCard(shelf));
  });
}

function toggleShelfCompletedFilter() {
  inventoryShelfState.filterCompleted = !inventoryShelfState.filterCompleted;
  var btn = document.getElementById('shelfFilterToggle');
  if (btn) {
    btn.classList.toggle('active', inventoryShelfState.filterCompleted);
    btn.setAttribute('aria-pressed', String(inventoryShelfState.filterCompleted));
  }
  renderShelfList();
}

function handleShelfSearchInput(value) {
  inventoryShelfState.searchQuery = value;
  renderShelfList();
}

function handleShelfScan(code) {
  var trimmed = code.trim();
  if (!trimmed) return;
  var shelf = INVENTORY_SHELF_DATA.find(function (s) {
    return s.code === trimmed;
  });
  if (shelf) {
    location.href = 'inventory_count_items.html';
  } else {
    alert('棚コード「' + trimmed + '」が見つかりません');
  }
}

initInventoryShelfList();

/* ============================================================
   SCR-009-1-1: 棚卸作業（商品一覧）
   ============================================================ */

var COUNT_ITEMS_SHELF = 'A-01-01-1';

var COUNT_ITEMS_DATA = [
  { code: 'ITM-001', name: '冷凍食品A', stock: 12, counted: null },
  { code: 'ITM-002', name: '冷凍食品B', stock: 8,  counted: null },
  { code: 'ITM-003', name: '冷凍食品C', stock: 5,  counted: null },
  { code: 'ITM-010', name: '飲料C',     stock: 20, counted: null },
  { code: 'ITM-011', name: '飲料D',     stock: 3,  counted: null },
];

var countItemsState = {
  modalTargetCode: null,
};

function initCountItems() {
  var codeEl = document.getElementById('countShelfCode');
  if (!codeEl) return;
  codeEl.textContent = COUNT_ITEMS_SHELF;
  renderCountItemsTable();
}

function renderCountItemsTable() {
  var tbody = document.getElementById('countItemsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  COUNT_ITEMS_DATA.forEach(function (item) {
    var isEntered = item.counted !== null;
    var tr = document.createElement('tr');
    if (isEntered) tr.classList.add('entered');
    tr.innerHTML =
      '<td class="col-num">' + item.stock + '</td>' +
      '<td class="col-num">' + (isEntered ? item.counted : '-') + '</td>' +
      '<td>' + item.code + '</td>' +
      '<td>' + item.name + '</td>' +
      '<td class="col-status"><span class="count-item-status ' + (isEntered ? 'entered' : 'empty') + '">' +
        (isEntered ? '入力済み' : '未入力') +
      '</span></td>';
    tbody.appendChild(tr);
  });
}

function handleCountItemScan(code) {
  var trimmed = code.trim();
  if (!trimmed) return;
  var item = COUNT_ITEMS_DATA.find(function (d) { return d.code === trimmed; });
  if (item) {
    openCountModal(trimmed);
  } else {
    alert('商品コード「' + trimmed + '」はこの棚に存在しません');
  }
}

function openCountModal(code) {
  var item = COUNT_ITEMS_DATA.find(function (d) { return d.code === code; });
  if (!item) return;
  countItemsState.modalTargetCode = code;
  document.getElementById('countModalCode').textContent = item.code;
  document.getElementById('countModalName').textContent = item.name;
  var input = document.getElementById('countModalInput');
  input.value = item.counted !== null ? item.counted : '';
  document.getElementById('countModalOverlay').style.display = 'flex';
  setTimeout(function () { input.focus(); input.select(); }, 50);
}

function closeCountModal() {
  document.getElementById('countModalOverlay').style.display = 'none';
  countItemsState.modalTargetCode = null;
  document.getElementById('countScanInput').focus();
}

function confirmCountModal() {
  var code = countItemsState.modalTargetCode;
  if (!code) return;
  var input = document.getElementById('countModalInput');
  var val = parseInt(input.value, 10);
  if (isNaN(val) || val < 0) {
    alert('0以上の整数を入力してください');
    return;
  }
  var item = COUNT_ITEMS_DATA.find(function (d) { return d.code === code; });
  if (item) item.counted = val;
  closeCountModal();
  renderCountItemsTable();
}

function completeCountItems() {
  if (!confirm('この棚の棚卸を完了します。よろしいですか？')) return;
  location.href = 'inventory_count_shelf_list.html';
}

initCountItems();

// === 在庫修正 (SCR-004-3) ===

var PRODUCT_CODE_MAP = {
  '電動ドリル 18V':       'P-10001',
  '充電バッテリーパック':   'P-10002',
  'スチールラック 180cm':  'P-20031',
  '作業用手袋 Lサイズ':    'P-30055',
  '安全ヘルメット 白':     'P-40012',
  '防塵マスク 10枚入':     'P-50023',
  'パレット 1100×1100':   'P-60011',
  'パレット 800×1200':    'P-60012',
  '台車 折りたたみ式':     'P-70034',
  '結束バンド 100本入':    'P-80021',
  '緩衝材 ロール':         'P-90005',
  '段ボール箱 Mサイズ':    'P-90010'
};

function onProductNameChange() {
  var select = document.getElementById('editProductName');
  var codeInput = document.getElementById('editProductCode');
  if (!select || !codeInput) return;
  codeInput.value = PRODUCT_CODE_MAP[select.value] || '';
}

// === 入荷予定確定・出荷予定確定 行取り消しトグル (SCR-005 / SCR-011) ===
function toggleRowCancel(btn) {
  var row = btn.closest('tr');
  var cancelling = !row.classList.contains('schedule-row--cancelled');
  row.classList.toggle('schedule-row--cancelled', cancelling);
  // 取消行は行選択チェックボックス以外の入力を無効化する
  row.querySelectorAll('select, input:not([type="checkbox"])').forEach(function (el) {
    el.disabled = cancelling;
  });
  if (cancelling) {
    btn.textContent = '取消解除';
    btn.classList.remove('btn-danger');
    btn.classList.add('btn-default');
  } else {
    btn.textContent = '取消';
    btn.classList.remove('btn-default');
    btn.classList.add('btn-danger');
  }
  var cb = row.querySelector('.row-checkbox');
  if (cb) onRowCheckboxChange(cb);
}

function onRowCheckboxChange(checkbox) {
  var row = checkbox.closest('tr');
  row.classList.toggle('schedule-row--selected', checkbox.checked);
  updateSelectAllState();
}

function updateSelectAllState() {
  var selectAll = document.getElementById('selectAllRows');
  if (!selectAll) return;
  var table = selectAll.closest('table');
  if (!table) return;
  var checkboxes = Array.from(table.querySelectorAll('tbody .row-checkbox'));
  var checkedCount = checkboxes.filter(function (cb) { return cb.checked; }).length;
  if (checkedCount === 0) {
    selectAll.checked = false;
    selectAll.indeterminate = false;
  } else if (checkedCount === checkboxes.length) {
    selectAll.checked = true;
    selectAll.indeterminate = false;
  } else {
    selectAll.checked = false;
    selectAll.indeterminate = true;
  }
}

function onSelectAllChange() {
  var selectAll = document.getElementById('selectAllRows');
  if (!selectAll) return;
  var table = selectAll.closest('table');
  if (!table) return;
  var checked = selectAll.checked;
  table.querySelectorAll('tbody .row-checkbox').forEach(function (cb) {
    cb.checked = checked;
    cb.closest('tr').classList.toggle('schedule-row--selected', checked);
  });
}

// === SCR-004 手動入力フォーム ===

function initManualForm() {
  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  var yyyy = tomorrow.getFullYear();
  var mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
  var dd = String(tomorrow.getDate()).padStart(2, '0');
  var el = document.getElementById('inboundScheduleDate');
  if (el) el.value = yyyy + '-' + mm + '-' + dd;
  populateInboundSupplierSelect();
  addInboundItemRow();
}

function populateInboundSupplierSelect() {
  var sel = document.getElementById('supplier');
  if (!sel || typeof supplierData === 'undefined') return;
  supplierData.forEach(function(s) {
    var opt = document.createElement('option');
    opt.value = s.company;
    opt.textContent = s.company;
    sel.appendChild(opt);
  });
}

var INBOUND_ITEM_MASTER = [
  { code: 'P-001', name: '商品A', unit: 'pallet' },
  { code: 'P-002', name: '商品B', unit: 'case' },
  { code: 'P-003', name: '商品C', unit: 'ball' },
  { code: 'P-004', name: '商品D', unit: 'piece' },
  { code: 'P-005', name: '商品E', unit: 'pallet' },
];

function createInboundItemRowHTML() {
  return '<div class="item-row">' +
    '<select name="itemCode[]" class="form-input" required onchange="onInboundItemCodeChange(this)">' +
      '<option value="">選択してください</option>' +
    '</select>' +
    '<select name="itemName[]" class="form-input" required onchange="onInboundItemNameChange(this)">' +
      '<option value="">選択してください</option>' +
    '</select>' +
    '<input type="number" name="quantity[]" class="form-input" min="1" placeholder="1" required>' +
    '<select name="unitType[]" class="form-input">' +
      '<option value="">-</option>' +
      '<option value="pallet">パレット</option>' +
      '<option value="case">ケース</option>' +
      '<option value="ball">ボール</option>' +
      '<option value="piece">ピース</option>' +
    '</select>' +
    '<input type="text" name="lotNo[]" class="form-input" placeholder="LOT-001">' +
    '<input type="date" name="expiryDate[]" class="form-input">' +
    '<input type="text" name="itemNote[]" class="form-input" placeholder="特記事項">' +
    '<button type="button" class="btn btn-icon-subtle" onclick="deleteInboundItemRow(this)" aria-label="行削除">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>' +
    '</button>' +
  '</div>';
}

function populateInboundItemSelects(row) {
  var codeEl = row.querySelector('[name="itemCode[]"]');
  var nameEl = row.querySelector('[name="itemName[]"]');
  if (!codeEl || !nameEl) return;
  INBOUND_ITEM_MASTER.forEach(function(item) {
    var optCode = document.createElement('option');
    optCode.value = item.code;
    optCode.textContent = item.code;
    codeEl.appendChild(optCode);
    var optName = document.createElement('option');
    optName.value = item.code;
    optName.textContent = item.name;
    nameEl.appendChild(optName);
  });
}

function onInboundItemCodeChange(sel) {
  var row = sel.closest('.item-row');
  var nameEl = row.querySelector('[name="itemName[]"]');
  var unitEl = row.querySelector('[name="unitType[]"]');
  var item = INBOUND_ITEM_MASTER.filter(function(i) { return i.code === sel.value; })[0];
  if (nameEl) nameEl.value = item ? item.code : '';
  if (unitEl) unitEl.value = item ? item.unit : '';
}

function onInboundItemNameChange(sel) {
  var row = sel.closest('.item-row');
  var codeEl = row.querySelector('[name="itemCode[]"]');
  var unitEl = row.querySelector('[name="unitType[]"]');
  var item = INBOUND_ITEM_MASTER.filter(function(i) { return i.code === sel.value; })[0];
  if (codeEl) codeEl.value = item ? item.code : '';
  if (unitEl) unitEl.value = item ? item.unit : '';
}

function addInboundItemRow() {
  var container = document.getElementById('inboundItemRowsContainer');
  if (!container) return;
  var div = document.createElement('div');
  div.innerHTML = createInboundItemRowHTML();
  var row = div.firstChild;
  container.appendChild(row);
  populateInboundItemSelects(row);
}

function deleteInboundItemRow(btn) {
  var container = document.getElementById('inboundItemRowsContainer');
  if (!container) return;
  var rows = container.querySelectorAll('.item-row');
  if (rows.length <= 1) return;
  btn.closest('.item-row').remove();
}

function renderModalItemList() {
  var list = document.getElementById('modalItemList');
  var container = document.getElementById('inboundItemRowsContainer');
  if (!list || !container) return;
  var rowCount = container.querySelectorAll('.item-row').length || 1;
  list.innerHTML = '';
  for (var i = 0; i < rowCount; i++) {
    var li = document.createElement('li');
    li.className = 'modal-item-list-row';
    li.textContent = 'P-00' + (i + 1) + ' 商品' + String.fromCharCode(65 + i) + ' / 数量: 10 / パレット';
    list.appendChild(li);
  }
}

function openRegisterConfirmModal() {
  renderModalItemList();
  openModal('registerConfirmModal');
}

function submitAndReloadSelf() {
  window.location.href = '005_inbound_schedule_register.html';
}

if (document.getElementById('manualInputForm')) {
  document.addEventListener('DOMContentLoaded', initManualForm);
}

// === SCR-006 入荷情報登録 ===

var INBOUND_REGISTER_KEEP = ['inboundDate', 'inboundTime', 'slipNo', 'supplier'];
var INBOUND_REGISTER_CLEAR = ['itemCode', 'itemName', 'shelfLocation', 'quantity', 'unitType', 'lotNo', 'expiryDate', 'note'];

function populateShelfSelect() {
  var sel = document.getElementById('shelfLocation');
  if (!sel) return;
  sel.innerHTML = '<option value="">棚ロケを選択</option>';
  shelfLocations.forEach(function(s) {
    var opt = document.createElement('option');
    opt.value = s.code;
    opt.textContent = s.code;
    sel.appendChild(opt);
  });
}

function initInboundRegister() {
  var today = new Date();
  var yyyy = today.getFullYear();
  var mm = String(today.getMonth() + 1).padStart(2, '0');
  var dd = String(today.getDate()).padStart(2, '0');
  var dateEl = document.getElementById('inboundDate');
  if (dateEl) dateEl.value = yyyy + '-' + mm + '-' + dd;
  populateShelfSelect();
}

function submitInboundAndContinue() {
  INBOUND_REGISTER_CLEAR.forEach(function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.value = '';
  });
  var first = document.getElementById(INBOUND_REGISTER_CLEAR[0]);
  if (first) first.focus();
}

function submitInboundAndNavigate() {
  window.location.href = '004_inbound_schedule_list.html';
}

if (document.getElementById('inboundRegisterForm')) {
  initInboundRegister();
}

// === SCR-008 出荷予定登録 ===

function initOutboundManualForm() {
  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  var yyyy = tomorrow.getFullYear();
  var mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
  var dd = String(tomorrow.getDate()).padStart(2, '0');
  var el = document.getElementById('outboundScheduleDate');
  if (el) el.value = yyyy + '-' + mm + '-' + dd;
  addItemRow();
}

function createItemRowHTML() {
  return '<div class="item-row">' +
    '<input type="text" name="itemCode[]" class="form-input" placeholder="P-001" required>' +
    '<input type="text" name="itemName[]" class="form-input" placeholder="商品A" required>' +
    '<input type="text" name="shelfLocation[]" class="form-input" placeholder="A-01-01">' +
    '<input type="number" name="quantity[]" class="form-input" min="1" placeholder="1" required>' +
    '<select name="unitType[]" class="form-input">' +
      '<option value="">-</option>' +
      '<option value="pallet">パレット</option>' +
      '<option value="case">ケース</option>' +
      '<option value="ball">ボール</option>' +
      '<option value="piece">ピース</option>' +
    '</select>' +
    '<input type="text" name="lotNo[]" class="form-input" placeholder="LOT-001">' +
    '<input type="date" name="expiryDate[]" class="form-input">' +
    '<button type="button" class="btn btn-icon-subtle" onclick="deleteItemRow(this)" aria-label="行削除">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>' +
    '</button>' +
  '</div>';
}

function addItemRow() {
  var container = document.getElementById('itemRowsContainer');
  if (!container) return;
  var div = document.createElement('div');
  div.innerHTML = createItemRowHTML();
  container.appendChild(div.firstChild);
}

function deleteItemRow(btn) {
  var container = document.getElementById('itemRowsContainer');
  if (!container) return;
  var rows = container.querySelectorAll('.item-row');
  if (rows.length <= 1) return;
  btn.closest('.item-row').remove();
}

function outboundSubmitAndContinue() {
  var el = document.getElementById('note');
  if (el) el.value = '';
  var container = document.getElementById('itemRowsContainer');
  if (container) {
    container.innerHTML = '';
    addItemRow();
  }
  var first = container && container.querySelector('input[name="itemCode[]"]');
  if (first) first.focus();
}

function outboundSubmitAndNavigate() {
  window.location.href = '009_outbound_schedule_list.html';
}

if (document.getElementById('outboundManualInputForm')) {
  initOutboundManualForm();
}

// === ヘッダー ユーザーメニュー ===

function toggleUserMenu() {
  var dropdown = document.getElementById('userMenuDropdown');
  var btn = document.getElementById('userMenuBtn');
  if (!dropdown) return;
  var isOpen = dropdown.classList.toggle('is-open');
  if (btn) btn.setAttribute('aria-expanded', String(isOpen));
}

document.addEventListener('click', function (e) {
  var menu = document.querySelector('.app-header-user-menu');
  if (menu && !menu.contains(e.target)) {
    var dropdown = document.getElementById('userMenuDropdown');
    var btn = document.getElementById('userMenuBtn');
    if (dropdown) dropdown.classList.remove('is-open');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }
});

// === ADM-001 ユーザー一覧 ===

var USER_DATA = [
  { loginId: 'admin01', name: '山田 太郎', role: '管理者',       status: 'active',   deleted: false },
  { loginId: 'admin02', name: '鈴木 花子', role: '管理者',       status: 'active',   deleted: false },
  { loginId: 'ope001',  name: '田中 一郎', role: 'オペレーター', status: 'active',   deleted: false },
  { loginId: 'ope002',  name: '佐藤 二郎', role: 'オペレーター', status: 'active',   deleted: false },
  { loginId: 'ope003',  name: '伊藤 三郎', role: 'オペレーター', status: 'active',   deleted: false },
  { loginId: 'ope004',  name: '渡辺 四郎', role: 'オペレーター', status: 'inactive', deleted: false },
  { loginId: 'ope005',  name: '中村 五郎', role: 'オペレーター', status: 'inactive', deleted: false },
  { loginId: 'ope006',  name: '小林 六子', role: 'オペレーター', status: 'active',   deleted: false },
];

function initUserList() {
  if (!document.getElementById('userTableBody')) return;
  renderUserList();
}

function renderUserList() {
  var tbody = document.getElementById('userTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  USER_DATA.filter(function (u) { return !u.deleted; }).forEach(function (u) {
    var isActive = u.status === 'active';
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + u.loginId + '</td>' +
      '<td>' + u.name + '</td>' +
      '<td>' + u.role + '</td>' +
      '<td><span class="user-status-badge user-status-badge--' + u.status + '">' +
        (isActive ? '✓ 有効' : '✕ 無効') +
      '</span></td>' +
      '<td class="user-ops">' +
        '<a href="adm_002_user_form.html?mode=edit&id=' + u.loginId + '" class="btn-edit">編集</a>' +
        '<button class="btn-edit" onclick="toggleUserStatus(\'' + u.loginId + '\')">' +
          (isActive ? '無効にする' : '有効にする') +
        '</button>' +
        '<button class="btn-danger" style="font-size:0.75rem;height:1.75rem;padding:0 var(--ds-space-100);border-radius:3px;border:none;cursor:pointer;white-space:nowrap;" onclick="deleteUser(\'' + u.loginId + '\')">削除</button>' +
      '</td>';
    tbody.appendChild(tr);
  });
}

function toggleUserStatus(loginId) {
  var user = USER_DATA.find(function (u) { return u.loginId === loginId; });
  if (!user) return;
  var next = user.status === 'active' ? '無効' : '有効';
  if (!confirm('このユーザーを' + next + 'にします。よろしいですか？')) return;
  user.status = user.status === 'active' ? 'inactive' : 'active';
  renderUserList();
}

function deleteUser(loginId) {
  var user = USER_DATA.find(function (u) { return u.loginId === loginId; });
  if (!user) return;
  if (!confirm('ユーザー「' + user.name + '」を削除します。よろしいですか？')) return;
  user.deleted = true;
  renderUserList();
}

// === ADM-002 ユーザー登録・編集 ===

function initUserForm() {
  if (!document.getElementById('userForm')) return;
  var params = new URLSearchParams(location.search);
  var mode = params.get('mode');
  var id   = params.get('id');

  if (mode === 'edit' && id) {
    var user = USER_DATA.find(function (u) { return u.loginId === id; });
    if (user) {
      document.getElementById('loginId').value = user.loginId;
      document.getElementById('loginId').readOnly = true;
      document.getElementById('loginId').classList.add('is-readonly');
      document.getElementById('userName').value = user.name;
      document.getElementById('userRole').value = user.role;
    }
    var title = document.getElementById('pageTitle');
    if (title) title.textContent = 'ユーザー編集';
  }
}

function validateUserForm() {
  var valid = true;
  [
    { id: 'loginId',  errorId: 'loginIdError',  msg: 'ログインIDを入力してください' },
    { id: 'userName', errorId: 'userNameError',  msg: '氏名を入力してください' },
    { id: 'userRole', errorId: 'userRoleError',  msg: '権限を選択してください' },
  ].forEach(function (f) {
    var el  = document.getElementById(f.id);
    var err = document.getElementById(f.errorId);
    if (!el || !err) return;
    if (!el.value.trim()) {
      err.classList.add('is-visible');
      valid = false;
    } else {
      err.classList.remove('is-visible');
    }
  });
  return valid;
}

function handleUserSave() {
  if (!validateUserForm()) return;
  window.location.href = 'adm_001_user_list.html';
}

function handleUserCancel() {
  window.location.href = 'adm_001_user_list.html';
}

// === 日付・時刻入力 クリックでピッカー起動（共通） ===
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('input[type="date"], input[type="time"]').forEach(function (el) {
    el.addEventListener('click', function () {
      try { el.showPicker(); } catch (_) {}
    });
  });

  // テーマ初期化（localStorage から復元）
  var savedTheme = localStorage.getItem('wms-theme') || '';
  document.documentElement.setAttribute('data-theme', savedTheme);
  var btn = document.getElementById('themeToggleBtn');
  if (btn) btn.title = savedTheme === 'green' ? 'テーマ: グリーン（クリックで切替）' : 'テーマ: デフォルト（クリックで切替）';
});

// === テーマ切替 ===

function toggleTheme() {
  var current = document.documentElement.getAttribute('data-theme') || '';
  var next = current === 'green' ? '' : 'green';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('wms-theme', next);
  var btn = document.getElementById('themeToggleBtn');
  if (btn) btn.title = next === 'green' ? 'テーマ: グリーン（クリックで切替）' : 'テーマ: デフォルト（クリックで切替）';
}

// === SCR-007 入荷履歴 ===

var INBOUND_HISTORY_DATA = [
  { datetime: '2026/05/09 17:00', slipNo: 'T-1004', itemCode: 'P-007', itemName: '商品G', shelf: 'D-04-01', supplier: '伊藤商店',   qty: 60,  unit: 'ピース',  lot: 'LOT-001', expiry: '2026/11/30', note: '' },
  { datetime: '2026/05/09 17:00', slipNo: 'T-1004', itemCode: 'P-008', itemName: '商品H', shelf: 'D-04-02', supplier: '伊藤商店',   qty: 40,  unit: '‐',       lot: 'LOT-002', expiry: '2027/01/20', note: '' },
  { datetime: '2026/05/09 15:00', slipNo: 'T-1003', itemCode: 'P-005', itemName: '商品E', shelf: 'C-03-01', supplier: '鈴木運輸',   qty: 80,  unit: 'ケース',  lot: 'LOT-003', expiry: '2026/09/01', note: '' },
  { datetime: '2026/05/09 15:00', slipNo: 'T-1003', itemCode: 'P-006', itemName: '商品F', shelf: 'C-03-02', supplier: '鈴木運輸',   qty: 150, unit: 'パレット', lot: 'LOT-004', expiry: '‐',         note: '' },
  { datetime: '2026/05/09 15:00', slipNo: 'T-1003', itemCode: 'P-006', itemName: '商品F', shelf: 'C-03-02', supplier: '鈴木運輸',   qty: 120, unit: 'パレット', lot: 'LOT-005', expiry: '‐',         note: '' },
  { datetime: '2026/05/09 13:00', slipNo: 'T-1002', itemCode: 'P-003', itemName: '商品C', shelf: 'B-02-01', supplier: '田中物産',   qty: 200, unit: 'ピース',  lot: 'LOT-006', expiry: '‐',         note: '' },
  { datetime: '2026/05/09 13:00', slipNo: 'T-1002', itemCode: 'P-004', itemName: '商品D', shelf: 'B-02-02', supplier: '田中物産',   qty: 30,  unit: 'ボール',  lot: 'LOT-007', expiry: '2027/03/15', note: '' },
  { datetime: '2026/05/09 10:00', slipNo: 'T-1001', itemCode: 'P-001', itemName: '商品A', shelf: 'A-01-01', supplier: '佐々木商事', qty: 100, unit: 'パレット', lot: 'LOT-008', expiry: '2026/12/31', note: '' },
  { datetime: '2026/05/09 10:00', slipNo: 'T-1001', itemCode: 'P-001', itemName: '商品A', shelf: 'A-01-01', supplier: '佐々木商事', qty: 80,  unit: 'パレット', lot: 'LOT-009', expiry: '2026/12/31', note: '' },
  { datetime: '2026/05/09 10:00', slipNo: 'T-1001', itemCode: 'P-002', itemName: '商品B', shelf: 'A-01-02', supplier: '佐々木商事', qty: 50,  unit: 'ケース',  lot: 'LOT-010', expiry: '2026/06/30', note: '' },
  { datetime: '2026/05/08 10:00', slipNo: 'T-0911', itemCode: 'P-009', itemName: '商品I', shelf: 'D-01-01', supplier: '伊藤商店',   qty: 50,  unit: 'ボール',  lot: 'LOT-011', expiry: '2027/02/28', note: '' },
  { datetime: '2026/05/08 10:00', slipNo: 'T-0911', itemCode: 'P-010', itemName: '商品J', shelf: 'D-01-02', supplier: '伊藤商店',   qty: 70,  unit: 'ピース',  lot: 'LOT-012', expiry: '‐',         note: '要冷蔵' },
  { datetime: '2026/05/07 15:00', slipNo: 'T-0910', itemCode: 'P-005', itemName: '商品E', shelf: 'C-03-01', supplier: '鈴木運輸',   qty: 100, unit: 'ケース',  lot: 'LOT-013', expiry: '2026/09/01', note: '' },
  { datetime: '2026/05/07 15:00', slipNo: 'T-0910', itemCode: 'P-006', itemName: '商品F', shelf: 'C-03-03', supplier: '鈴木運輸',   qty: 60,  unit: 'パレット', lot: 'LOT-014', expiry: '‐',         note: '' },
  { datetime: '2026/05/07 09:00', slipNo: 'T-0909', itemCode: 'P-001', itemName: '商品A', shelf: 'A-01-01', supplier: '佐々木商事', qty: 120, unit: 'パレット', lot: 'LOT-015', expiry: '2026/12/31', note: '' },
  { datetime: '2026/05/07 09:00', slipNo: 'T-0909', itemCode: 'P-002', itemName: '商品B', shelf: 'A-02-01', supplier: '佐々木商事', qty: 45,  unit: 'ケース',  lot: 'LOT-016', expiry: '2026/06/30', note: '' },
  { datetime: '2026/05/06 13:00', slipNo: 'T-0908', itemCode: 'P-003', itemName: '商品C', shelf: 'B-02-01', supplier: '田中物産',   qty: 150, unit: 'ピース',  lot: 'LOT-017', expiry: '‐',         note: '' },
  { datetime: '2026/05/06 13:00', slipNo: 'T-0908', itemCode: 'P-003', itemName: '商品C', shelf: 'B-02-02', supplier: '田中物産',   qty: 80,  unit: 'ピース',  lot: 'LOT-018', expiry: '‐',         note: '' },
  { datetime: '2026/05/05 10:00', slipNo: 'T-0907', itemCode: 'P-007', itemName: '商品G', shelf: 'D-04-01', supplier: '山田物流',   qty: 300, unit: 'ピース',  lot: 'LOT-019', expiry: '‐',         note: '要冷蔵' },
  { datetime: '2026/05/05 10:00', slipNo: 'T-0907', itemCode: 'P-008', itemName: '商品H', shelf: 'D-04-01', supplier: '山田物流',   qty: 90,  unit: 'ボール',  lot: 'LOT-020', expiry: '2027/06/30', note: '要冷蔵' },
  { datetime: '2026/05/02 09:30', slipNo: 'T-0906', itemCode: 'P-001', itemName: '商品A', shelf: 'A-01-01', supplier: '佐々木商事', qty: 120, unit: 'パレット', lot: 'LOT-021', expiry: '2026/12/31', note: '' },
  { datetime: '2026/05/02 09:30', slipNo: 'T-0906', itemCode: 'P-001', itemName: '商品A', shelf: 'A-01-02', supplier: '佐々木商事', qty: 75,  unit: 'パレット', lot: 'LOT-022', expiry: '2026/12/31', note: '' },
  { datetime: '2026/04/30 11:00', slipNo: 'T-0905', itemCode: 'P-006', itemName: '商品F', shelf: 'C-03-01', supplier: '鈴木運輸',   qty: 200, unit: 'パレット', lot: 'LOT-023', expiry: '‐',         note: '' },
  { datetime: '2026/04/29 10:00', slipNo: 'T-0903', itemCode: 'P-002', itemName: '商品B', shelf: 'A-01-02', supplier: '佐々木商事', qty: 30,  unit: 'ケース',  lot: 'LOT-024', expiry: '2026/06/30', note: '' },
  { datetime: '2026/04/29 10:00', slipNo: 'T-0903', itemCode: 'P-005', itemName: '商品E', shelf: 'C-03-01', supplier: '鈴木運輸',   qty: 80,  unit: 'ケース',  lot: 'LOT-025', expiry: '2026/09/01', note: '' }
];

var historyFiltered = INBOUND_HISTORY_DATA.slice();
var historyCurrentPage = 1;
var HISTORY_PAGE_SIZE = 20;

function initHistoryTable() {
  if (!document.getElementById('historyTableBody')) return;
  historyFiltered = INBOUND_HISTORY_DATA.slice();
  renderHistoryPage(1);
}

function filterHistory() {
  var startDate = document.getElementById('historyStartDate').value;
  var endDate   = document.getElementById('historyEndDate').value;
  var keyword   = document.getElementById('historySearch').value.toLowerCase();

  historyFiltered = INBOUND_HISTORY_DATA.filter(function (row) {
    if (startDate || endDate) {
      var rowDate = row.datetime.substring(0, 10).replace(/\//g, '-');
      if (startDate && rowDate < startDate) return false;
      if (endDate   && rowDate > endDate)   return false;
    }
    if (keyword) {
      var text = [row.slipNo, row.itemCode, row.itemName, row.supplier, row.lot]
        .join(' ').toLowerCase();
      if (text.indexOf(keyword) === -1) return false;
    }
    return true;
  });

  renderHistoryPage(1);
}

function renderHistoryPage(page) {
  historyCurrentPage = page;
  var start    = (page - 1) * HISTORY_PAGE_SIZE;
  var pageData = historyFiltered.slice(start, start + HISTORY_PAGE_SIZE);

  var tbody = document.getElementById('historyTableBody');
  tbody.innerHTML = '';

  pageData.forEach(function (row) {
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + row.datetime + '</td>' +
      '<td>' + row.slipNo   + '</td>' +
      '<td>' + row.itemCode + '</td>' +
      '<td>' + row.itemName + '</td>' +
      '<td>' + row.lot    + '</td>' +
      '<td>' + row.shelf    + '</td>' +
      '<td>' + row.supplier + '</td>' +
      '<td style="text-align:right">' + row.qty + '</td>' +
      '<td>' + row.unit   + '</td>' +
      '<td>' + row.expiry + '</td>' +
      '<td>' + row.note   + '</td>';
    tbody.appendChild(tr);
  });

  updateHistoryTotalCount(historyFiltered.length);
  renderHistoryPagination(historyFiltered.length, page);
}

function updateHistoryTotalCount(count) {
  var el = document.getElementById('historyTotalCount');
  if (el) el.textContent = '全 ' + count + ' 件';
}

function renderHistoryPagination(totalCount, page) {
  var totalPages = Math.ceil(totalCount / HISTORY_PAGE_SIZE);
  var container  = document.getElementById('historyPagination');
  if (!container) return;
  container.innerHTML = '';

  var prevBtn = document.createElement('button');
  prevBtn.className = 'history-pagination-btn';
  prevBtn.textContent = '< 前へ';
  prevBtn.disabled = (page === 1);
  prevBtn.setAttribute('aria-label', '前のページ');
  prevBtn.addEventListener('click', function () { renderHistoryPage(page - 1); });
  container.appendChild(prevBtn);

  for (var i = 1; i <= totalPages; i++) {
    (function (p) {
      var btn = document.createElement('button');
      btn.className = 'history-pagination-btn' + (p === page ? ' is-active' : '');
      btn.textContent = p;
      btn.setAttribute('aria-label', p + 'ページ');
      if (p === page) btn.setAttribute('aria-current', 'page');
      btn.addEventListener('click', function () { renderHistoryPage(p); });
      container.appendChild(btn);
    })(i);
  }

  var nextBtn = document.createElement('button');
  nextBtn.className = 'history-pagination-btn';
  nextBtn.textContent = '次へ >';
  nextBtn.disabled = (page >= totalPages || totalPages === 0);
  nextBtn.setAttribute('aria-label', '次のページ');
  nextBtn.addEventListener('click', function () { renderHistoryPage(page + 1); });
  container.appendChild(nextBtn);
}

// === SCR-012 出荷履歴 ===

var OUTBOUND_HISTORY_DATA = [
  { datetime: '2026/05/09 17:00', slipNo: 'S-2004', itemCode: 'P-007', itemName: '商品G', shelf: 'D-04-01', destination: '東京流通',    qty: 60,  unit: 'ピース',  lot: 'LOT-001', expiry: '2026/11/30', note: '' },
  { datetime: '2026/05/09 17:00', slipNo: 'S-2004', itemCode: 'P-008', itemName: '商品H', shelf: 'D-04-02', destination: '東京流通',    qty: 40,  unit: '‐',       lot: 'LOT-002', expiry: '2027/01/20', note: '' },
  { datetime: '2026/05/09 15:00', slipNo: 'S-2003', itemCode: 'P-005', itemName: '商品E', shelf: 'C-03-01', destination: '大阪物流',    qty: 80,  unit: 'ケース',  lot: 'LOT-003', expiry: '2026/09/01', note: '' },
  { datetime: '2026/05/09 15:00', slipNo: 'S-2003', itemCode: 'P-006', itemName: '商品F', shelf: 'C-03-02', destination: '大阪物流',    qty: 150, unit: 'パレット', lot: 'LOT-004', expiry: '‐',         note: '' },
  { datetime: '2026/05/09 15:00', slipNo: 'S-2003', itemCode: 'P-006', itemName: '商品F', shelf: 'C-03-02', destination: '大阪物流',    qty: 120, unit: 'パレット', lot: 'LOT-005', expiry: '‐',         note: '' },
  { datetime: '2026/05/09 13:00', slipNo: 'S-2002', itemCode: 'P-003', itemName: '商品C', shelf: 'B-02-01', destination: '名古屋商事',  qty: 200, unit: 'ピース',  lot: 'LOT-006', expiry: '‐',         note: '' },
  { datetime: '2026/05/09 13:00', slipNo: 'S-2002', itemCode: 'P-004', itemName: '商品D', shelf: 'B-02-02', destination: '名古屋商事',  qty: 30,  unit: 'ボール',  lot: 'LOT-007', expiry: '2027/03/15', note: '' },
  { datetime: '2026/05/09 10:00', slipNo: 'S-2001', itemCode: 'P-001', itemName: '商品A', shelf: 'A-01-01', destination: '福岡センター', qty: 100, unit: 'パレット', lot: 'LOT-008', expiry: '2026/12/31', note: '' },
  { datetime: '2026/05/09 10:00', slipNo: 'S-2001', itemCode: 'P-001', itemName: '商品A', shelf: 'A-01-01', destination: '福岡センター', qty: 80,  unit: 'パレット', lot: 'LOT-009', expiry: '2026/12/31', note: '' },
  { datetime: '2026/05/09 10:00', slipNo: 'S-2001', itemCode: 'P-002', itemName: '商品B', shelf: 'A-01-02', destination: '福岡センター', qty: 50,  unit: 'ケース',  lot: 'LOT-010', expiry: '2026/06/30', note: '' },
  { datetime: '2026/05/08 10:00', slipNo: 'S-1911', itemCode: 'P-009', itemName: '商品I', shelf: 'D-01-01', destination: '東京流通',    qty: 50,  unit: 'ボール',  lot: 'LOT-011', expiry: '2027/02/28', note: '' },
  { datetime: '2026/05/08 10:00', slipNo: 'S-1911', itemCode: 'P-010', itemName: '商品J', shelf: 'D-01-02', destination: '東京流通',    qty: 70,  unit: 'ピース',  lot: 'LOT-012', expiry: '‐',         note: '要冷蔵' },
  { datetime: '2026/05/07 15:00', slipNo: 'S-1910', itemCode: 'P-005', itemName: '商品E', shelf: 'C-03-01', destination: '大阪物流',    qty: 100, unit: 'ケース',  lot: 'LOT-013', expiry: '2026/09/01', note: '' },
  { datetime: '2026/05/07 15:00', slipNo: 'S-1910', itemCode: 'P-006', itemName: '商品F', shelf: 'C-03-03', destination: '大阪物流',    qty: 60,  unit: 'パレット', lot: 'LOT-014', expiry: '‐',         note: '' },
  { datetime: '2026/05/07 09:00', slipNo: 'S-1909', itemCode: 'P-001', itemName: '商品A', shelf: 'A-01-01', destination: '福岡センター', qty: 120, unit: 'パレット', lot: 'LOT-015', expiry: '2026/12/31', note: '' },
  { datetime: '2026/05/07 09:00', slipNo: 'S-1909', itemCode: 'P-002', itemName: '商品B', shelf: 'A-02-01', destination: '福岡センター', qty: 45,  unit: 'ケース',  lot: 'LOT-016', expiry: '2026/06/30', note: '' },
  { datetime: '2026/05/06 13:00', slipNo: 'S-1908', itemCode: 'P-003', itemName: '商品C', shelf: 'B-02-01', destination: '名古屋商事',  qty: 150, unit: 'ピース',  lot: 'LOT-017', expiry: '‐',         note: '' },
  { datetime: '2026/05/06 13:00', slipNo: 'S-1908', itemCode: 'P-003', itemName: '商品C', shelf: 'B-02-02', destination: '名古屋商事',  qty: 80,  unit: 'ピース',  lot: 'LOT-018', expiry: '‐',         note: '' },
  { datetime: '2026/05/05 10:00', slipNo: 'S-1907', itemCode: 'P-007', itemName: '商品G', shelf: 'D-04-01', destination: '札幌物流',    qty: 300, unit: 'ピース',  lot: 'LOT-019', expiry: '‐',         note: '要冷蔵' },
  { datetime: '2026/05/05 10:00', slipNo: 'S-1907', itemCode: 'P-008', itemName: '商品H', shelf: 'D-04-01', destination: '札幌物流',    qty: 90,  unit: 'ボール',  lot: 'LOT-020', expiry: '2027/06/30', note: '要冷蔵' },
  { datetime: '2026/05/02 09:30', slipNo: 'S-1906', itemCode: 'P-001', itemName: '商品A', shelf: 'A-01-01', destination: '福岡センター', qty: 120, unit: 'パレット', lot: 'LOT-021', expiry: '2026/12/31', note: '' },
  { datetime: '2026/05/02 09:30', slipNo: 'S-1906', itemCode: 'P-001', itemName: '商品A', shelf: 'A-01-02', destination: '福岡センター', qty: 75,  unit: 'パレット', lot: 'LOT-022', expiry: '2026/12/31', note: '' },
  { datetime: '2026/04/30 11:00', slipNo: 'S-1905', itemCode: 'P-006', itemName: '商品F', shelf: 'C-03-01', destination: '大阪物流',    qty: 200, unit: 'パレット', lot: 'LOT-023', expiry: '‐',         note: '' },
  { datetime: '2026/04/29 10:00', slipNo: 'S-1903', itemCode: 'P-002', itemName: '商品B', shelf: 'A-01-02', destination: '福岡センター', qty: 30,  unit: 'ケース',  lot: 'LOT-024', expiry: '2026/06/30', note: '' },
  { datetime: '2026/04/29 10:00', slipNo: 'S-1903', itemCode: 'P-005', itemName: '商品E', shelf: 'C-03-01', destination: '大阪物流',    qty: 80,  unit: 'ケース',  lot: 'LOT-025', expiry: '2026/09/01', note: '' },
];

var outboundHistoryFiltered  = OUTBOUND_HISTORY_DATA.slice();
var outboundHistoryCurrentPage = 1;

function initOutboundHistoryTable() {
  if (!document.getElementById('historyTableBody')) return;
  outboundHistoryFiltered = OUTBOUND_HISTORY_DATA.slice();
  renderOutboundHistoryPage(1);
}

function filterOutboundHistory() {
  var startDate = document.getElementById('historyStartDate').value;
  var endDate   = document.getElementById('historyEndDate').value;
  var keyword   = document.getElementById('historySearch').value.toLowerCase();

  outboundHistoryFiltered = OUTBOUND_HISTORY_DATA.filter(function (row) {
    if (startDate || endDate) {
      var rowDate = row.datetime.substring(0, 10).replace(/\//g, '-');
      if (startDate && rowDate < startDate) return false;
      if (endDate   && rowDate > endDate)   return false;
    }
    if (keyword) {
      var target = [row.slipNo, row.itemCode, row.itemName, row.lot, row.destination]
        .join('\t').toLowerCase();
      if (target.indexOf(keyword) === -1) return false;
    }
    return true;
  });

  renderOutboundHistoryPage(1);
}

function renderOutboundHistoryPage(page) {
  outboundHistoryCurrentPage = page;
  var start    = (page - 1) * HISTORY_PAGE_SIZE;
  var pageData = outboundHistoryFiltered.slice(start, start + HISTORY_PAGE_SIZE);

  var tbody = document.getElementById('historyTableBody');
  tbody.innerHTML = '';

  pageData.forEach(function (row) {
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + row.datetime     + '</td>' +
      '<td>' + row.slipNo       + '</td>' +
      '<td>' + row.itemCode     + '</td>' +
      '<td>' + row.itemName     + '</td>' +
      '<td>' + row.lot          + '</td>' +
      '<td>' + row.shelf        + '</td>' +
      '<td>' + row.destination  + '</td>' +
      '<td style="text-align:right">' + row.qty + '</td>' +
      '<td>' + row.unit         + '</td>' +
      '<td>' + row.expiry       + '</td>' +
      '<td>' + row.note         + '</td>';
    tbody.appendChild(tr);
  });

  updateOutboundHistoryTotalCount(outboundHistoryFiltered.length);
  renderOutboundHistoryPagination(outboundHistoryFiltered.length, page);
}

function updateOutboundHistoryTotalCount(count) {
  var el = document.getElementById('historyTotalCount');
  if (el) el.textContent = '全 ' + count + ' 件';
}

function renderOutboundHistoryPagination(totalCount, page) {
  var totalPages = Math.ceil(totalCount / HISTORY_PAGE_SIZE);
  var container  = document.getElementById('historyPagination');
  if (!container) return;
  container.innerHTML = '';

  var prevBtn = document.createElement('button');
  prevBtn.className = 'history-pagination-btn';
  prevBtn.textContent = '< 前へ';
  prevBtn.disabled = (page === 1);
  prevBtn.setAttribute('aria-label', '前のページ');
  prevBtn.addEventListener('click', function () { renderOutboundHistoryPage(page - 1); });
  container.appendChild(prevBtn);

  for (var i = 1; i <= totalPages; i++) {
    (function (p) {
      var btn = document.createElement('button');
      btn.className = 'history-pagination-btn' + (p === page ? ' is-active' : '');
      btn.textContent = p;
      btn.setAttribute('aria-label', p + 'ページ');
      if (p === page) btn.setAttribute('aria-current', 'page');
      btn.addEventListener('click', function () { renderOutboundHistoryPage(p); });
      container.appendChild(btn);
    })(i);
  }

  var nextBtn = document.createElement('button');
  nextBtn.className = 'history-pagination-btn';
  nextBtn.textContent = '次へ >';
  nextBtn.disabled = (page >= totalPages || totalPages === 0);
  nextBtn.setAttribute('aria-label', '次のページ');
  nextBtn.addEventListener('click', function () { renderOutboundHistoryPage(page + 1); });
  container.appendChild(nextBtn);
}

// === SCR-015 在庫管理（棚ロケ別） ===

var INVENTORY_DETAIL_DATA = [
  { shelf: 'A-01-01', itemCode: 'P-001', itemName: '商品A', lot: 'LOT-001', qty: 100, unit: 'パレット', expiry: '2027-03-31', receivedAt: '2026-01-15' },
  { shelf: 'A-01-01', itemCode: 'P-001', itemName: '商品A', lot: 'LOT-002', qty: 80,  unit: 'パレット', expiry: '2027-03-31', receivedAt: '2026-01-15' },
  { shelf: 'A-01-02', itemCode: 'P-002', itemName: '商品B', lot: 'LOT-003', qty: 60,  unit: 'ケース',   expiry: '2027-06-30', receivedAt: '2026-02-01' },
  { shelf: 'A-02-01', itemCode: 'P-001', itemName: '商品A', lot: 'LOT-004', qty: 120, unit: 'パレット', expiry: '2027-03-31', receivedAt: '2026-01-15' },
  { shelf: 'A-02-02', itemCode: 'P-002', itemName: '商品B', lot: 'LOT-005', qty: 45,  unit: 'ケース',   expiry: '2027-06-30', receivedAt: '2026-02-01' },
  { shelf: 'B-01-01', itemCode: 'P-003', itemName: '商品C', lot: 'LOT-006', qty: 300, unit: 'ピース',   expiry: '2026-12-31', receivedAt: '2026-01-20' },
  { shelf: 'B-01-02', itemCode: 'P-004', itemName: '商品D', lot: 'LOT-007', qty: 50,  unit: 'ボール',   expiry: '2027-01-31', receivedAt: '2026-03-01' },
  { shelf: 'B-02-01', itemCode: 'P-003', itemName: '商品C', lot: 'LOT-008', qty: 150, unit: 'ピース',   expiry: '2026-12-31', receivedAt: '2026-01-20' },
  { shelf: 'B-02-02', itemCode: 'P-004', itemName: '商品D', lot: 'LOT-009', qty: 30,  unit: 'ボール',   expiry: '2027-01-31', receivedAt: '2026-03-01' },
  { shelf: 'C-01-01', itemCode: 'P-005', itemName: '商品E', lot: 'LOT-010', qty: 80,  unit: 'ケース',   expiry: '2027-09-30', receivedAt: '2026-02-15' },
  { shelf: 'C-01-02', itemCode: 'P-006', itemName: '商品F', lot: 'LOT-011', qty: 200, unit: 'パレット', expiry: '2027-12-31', receivedAt: '2026-01-10' },
  { shelf: 'C-02-01', itemCode: 'P-005', itemName: '商品E', lot: 'LOT-012', qty: 60,  unit: 'ケース',   expiry: '2027-09-30', receivedAt: '2026-02-15' },
  { shelf: 'C-02-02', itemCode: 'P-006', itemName: '商品F', lot: 'LOT-013', qty: 180, unit: 'パレット', expiry: '2027-12-31', receivedAt: '2026-01-10' },
  { shelf: 'C-03-01', itemCode: 'P-005', itemName: '商品E', lot: 'LOT-014', qty: 100, unit: 'ケース',   expiry: '2027-09-30', receivedAt: '2026-02-15' },
  { shelf: 'C-03-02', itemCode: 'P-006', itemName: '商品F', lot: 'LOT-015', qty: 120, unit: 'パレット', expiry: '2027-12-31', receivedAt: '2026-01-10' },
  { shelf: 'D-01-01', itemCode: 'P-009', itemName: '商品I', lot: 'LOT-016', qty: 90,  unit: 'ボール',   expiry: '2027-04-30', receivedAt: '2026-03-10' },
  { shelf: 'D-01-02', itemCode: 'P-010', itemName: '商品J', lot: 'LOT-017', qty: 110, unit: 'ピース',   expiry: '2026-08-31', receivedAt: '2026-01-25' },
  { shelf: 'D-02-01', itemCode: 'P-007', itemName: '商品G', lot: 'LOT-018', qty: 250, unit: 'ピース',   expiry: '2026-11-30', receivedAt: '2026-03-15' },
  { shelf: 'D-02-02', itemCode: 'P-008', itemName: '商品H', lot: 'LOT-019', qty: 70,  unit: '‐',        expiry: '‐',          receivedAt: '2026-02-20' },
  { shelf: 'D-03-01', itemCode: 'P-009', itemName: '商品I', lot: 'LOT-020', qty: 50,  unit: 'ボール',   expiry: '2027-04-30', receivedAt: '2026-03-10' },
  { shelf: 'D-03-02', itemCode: 'P-010', itemName: '商品J', lot: 'LOT-021', qty: 75,  unit: 'ピース',   expiry: '2026-08-31', receivedAt: '2026-01-25' },
  { shelf: 'D-04-01', itemCode: 'P-007', itemName: '商品G', lot: 'LOT-022', qty: 150, unit: 'ピース',   expiry: '2026-11-30', receivedAt: '2026-03-15' },
  { shelf: 'D-04-01', itemCode: 'P-007', itemName: '商品G', lot: 'LOT-023', qty: 80,  unit: 'ピース',   expiry: '2026-11-30', receivedAt: '2026-03-15' },
  { shelf: 'D-04-02', itemCode: 'P-008', itemName: '商品H', lot: 'LOT-024', qty: 55,  unit: '‐',        expiry: '‐',          receivedAt: '2026-02-20' },
  { shelf: 'D-04-03', itemCode: 'P-010', itemName: '商品J', lot: 'LOT-025', qty: 130, unit: 'ピース',   expiry: '2026-08-31', receivedAt: '2026-01-25' },
];

var inventoryDetailFiltered   = INVENTORY_DETAIL_DATA.slice();
var inventoryDetailCurrentPage = 1;

function initInventoryDetailTable() {
  if (!document.getElementById('inventoryDetailTableBody')) return;
  inventoryDetailFiltered = INVENTORY_DETAIL_DATA.slice();
  renderInventoryDetailPage(1);
}

function filterInventoryDetail() {
  var keyword = document.getElementById('inventorySearch').value.toLowerCase();

  inventoryDetailFiltered = INVENTORY_DETAIL_DATA.filter(function (row) {
    if (keyword) {
      var target = [row.shelf, row.itemCode, row.itemName, row.lot]
        .join('\t').toLowerCase();
      if (target.indexOf(keyword) === -1) return false;
    }
    return true;
  });

  renderInventoryDetailPage(1);
}

function renderInventoryDetailPage(page) {
  inventoryDetailCurrentPage = page;
  var start    = (page - 1) * HISTORY_PAGE_SIZE;
  var pageData = inventoryDetailFiltered.slice(start, start + HISTORY_PAGE_SIZE);

  var tbody = document.getElementById('inventoryDetailTableBody');
  tbody.innerHTML = '';

  pageData.forEach(function (row) {
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + row.shelf      + '</td>' +
      '<td>' + row.itemCode   + '</td>' +
      '<td>' + row.itemName   + '</td>' +
      '<td>' + row.lot        + '</td>' +
      '<td style="text-align:right">' + row.qty + '</td>' +
      '<td>' + row.unit       + '</td>' +
      '<td>' + row.expiry     + '</td>' +
      '<td>' + row.receivedAt + '</td>';
    tbody.appendChild(tr);
  });

  updateInventoryDetailTotalCount(inventoryDetailFiltered.length);
  renderInventoryDetailPagination(inventoryDetailFiltered.length, page);
}

function updateInventoryDetailTotalCount(count) {
  var el = document.getElementById('inventoryDetailTotalCount');
  if (el) el.textContent = '全 ' + count + ' 件';
}

function renderInventoryDetailPagination(totalCount, page) {
  var totalPages = Math.ceil(totalCount / HISTORY_PAGE_SIZE);
  var container  = document.getElementById('inventoryDetailPagination');
  if (!container) return;
  container.innerHTML = '';

  var prevBtn = document.createElement('button');
  prevBtn.className = 'history-pagination-btn';
  prevBtn.textContent = '< 前へ';
  prevBtn.disabled = (page === 1);
  prevBtn.setAttribute('aria-label', '前のページ');
  prevBtn.addEventListener('click', function () { renderInventoryDetailPage(page - 1); });
  container.appendChild(prevBtn);

  for (var i = 1; i <= totalPages; i++) {
    (function (p) {
      var btn = document.createElement('button');
      btn.className = 'history-pagination-btn' + (p === page ? ' is-active' : '');
      btn.textContent = p;
      btn.setAttribute('aria-label', p + 'ページ');
      if (p === page) btn.setAttribute('aria-current', 'page');
      btn.addEventListener('click', function () { renderInventoryDetailPage(p); });
      container.appendChild(btn);
    })(i);
  }

  var nextBtn = document.createElement('button');
  nextBtn.className = 'history-pagination-btn';
  nextBtn.textContent = '次へ >';
  nextBtn.disabled = (page >= totalPages || totalPages === 0);
  nextBtn.setAttribute('aria-label', '次のページ');
  nextBtn.addEventListener('click', function () { renderInventoryDetailPage(page + 1); });
  container.appendChild(nextBtn);
}

// === SCR-014 在庫管理 ===

var INVENTORY_LOT_MODAL_DATA = [
  { lot: 'LOT-001', shelf: 'A-01-01', qty: 100, note: '' },
  { lot: 'LOT-002', shelf: 'A-01-01', qty: 80,  note: '' },
  { lot: 'LOT-003', shelf: 'A-01-02', qty: 60,  note: '' },
  { lot: 'LOT-004', shelf: 'A-02-01', qty: 120, note: '' },
  { lot: 'LOT-005', shelf: 'A-02-02', qty: 45,  note: '' },
  { lot: 'LOT-006', shelf: 'B-01-01', qty: 300, note: '' },
  { lot: 'LOT-007', shelf: 'B-01-02', qty: 50,  note: '' },
  { lot: 'LOT-008', shelf: 'B-02-01', qty: 150, note: '' },
  { lot: 'LOT-009', shelf: 'B-02-02', qty: 30,  note: '' },
  { lot: 'LOT-010', shelf: 'C-01-01', qty: 80,  note: '' },
  { lot: 'LOT-011', shelf: 'C-01-02', qty: 200, note: '' },
  { lot: 'LOT-012', shelf: 'C-02-01', qty: 60,  note: '' },
  { lot: 'LOT-013', shelf: 'C-02-02', qty: 180, note: '' },
  { lot: 'LOT-014', shelf: 'C-03-01', qty: 100, note: '' },
  { lot: 'LOT-015', shelf: 'C-03-02', qty: 120, note: '' },
  { lot: 'LOT-016', shelf: 'D-01-01', qty: 90,  note: '' },
  { lot: 'LOT-017', shelf: 'D-01-02', qty: 110, note: '要冷蔵' },
  { lot: 'LOT-018', shelf: 'D-02-01', qty: 250, note: '' },
  { lot: 'LOT-019', shelf: 'D-02-02', qty: 70,  note: '' },
  { lot: 'LOT-020', shelf: 'D-03-01', qty: 50,  note: '' },
  { lot: 'LOT-021', shelf: 'D-03-02', qty: 75,  note: '要冷蔵' },
  { lot: 'LOT-022', shelf: 'D-04-01', qty: 150, note: '' },
  { lot: 'LOT-023', shelf: 'D-04-01', qty: 80,  note: '' },
  { lot: 'LOT-024', shelf: 'D-04-02', qty: 55,  note: '' },
  { lot: 'LOT-025', shelf: 'D-04-03', qty: 130, note: '要冷蔵' },
];

var INVENTORY_LIST_DATA = [
  { itemCode: 'P-001', itemName: '商品A', lot: 'LOT-001', qty: 100, unit: 'パレット', expiry: '2027-03-31', receivedAt: '2026-01-15', noted: false },
  { itemCode: 'P-001', itemName: '商品A', lot: 'LOT-002', qty: 80,  unit: 'パレット', expiry: '2027-03-31', receivedAt: '2026-01-15', noted: false },
  { itemCode: 'P-001', itemName: '商品A', lot: 'LOT-004', qty: 120, unit: 'パレット', expiry: '2027-03-31', receivedAt: '2026-01-15', noted: false },
  { itemCode: 'P-002', itemName: '商品B', lot: 'LOT-003', qty: 60,  unit: 'ケース',   expiry: '2027-06-30', receivedAt: '2026-02-01', noted: false },
  { itemCode: 'P-002', itemName: '商品B', lot: 'LOT-005', qty: 45,  unit: 'ケース',   expiry: '2027-06-30', receivedAt: '2026-02-01', noted: false },
  { itemCode: 'P-003', itemName: '商品C', lot: 'LOT-006', qty: 300, unit: 'ピース',   expiry: '2026-12-31', receivedAt: '2026-01-20', noted: false },
  { itemCode: 'P-003', itemName: '商品C', lot: 'LOT-008', qty: 150, unit: 'ピース',   expiry: '2026-12-31', receivedAt: '2026-01-20', noted: false },
  { itemCode: 'P-004', itemName: '商品D', lot: 'LOT-007', qty: 50,  unit: 'ボール',   expiry: '2027-01-31', receivedAt: '2026-03-01', noted: false },
  { itemCode: 'P-004', itemName: '商品D', lot: 'LOT-009', qty: 30,  unit: 'ボール',   expiry: '2027-01-31', receivedAt: '2026-03-01', noted: false },
  { itemCode: 'P-005', itemName: '商品E', lot: 'LOT-010', qty: 80,  unit: 'ケース',   expiry: '2027-09-30', receivedAt: '2026-02-15', noted: false },
  { itemCode: 'P-005', itemName: '商品E', lot: 'LOT-012', qty: 60,  unit: 'ケース',   expiry: '2027-09-30', receivedAt: '2026-02-15', noted: false },
  { itemCode: 'P-005', itemName: '商品E', lot: 'LOT-014', qty: 100, unit: 'ケース',   expiry: '2027-09-30', receivedAt: '2026-02-15', noted: false },
  { itemCode: 'P-006', itemName: '商品F', lot: 'LOT-011', qty: 200, unit: 'パレット', expiry: '2027-12-31', receivedAt: '2026-01-10', noted: false },
  { itemCode: 'P-006', itemName: '商品F', lot: 'LOT-013', qty: 180, unit: 'パレット', expiry: '2027-12-31', receivedAt: '2026-01-10', noted: false },
  { itemCode: 'P-006', itemName: '商品F', lot: 'LOT-015', qty: 120, unit: 'パレット', expiry: '2027-12-31', receivedAt: '2026-01-10', noted: false },
  { itemCode: 'P-007', itemName: '商品G', lot: 'LOT-018', qty: 250, unit: 'ピース',   expiry: '2026-11-30', receivedAt: '2026-03-15', noted: false },
  { itemCode: 'P-007', itemName: '商品G', lot: 'LOT-022', qty: 150, unit: 'ピース',   expiry: '2026-11-30', receivedAt: '2026-03-15', noted: false },
  { itemCode: 'P-007', itemName: '商品G', lot: 'LOT-023', qty: 80,  unit: 'ピース',   expiry: '2026-11-30', receivedAt: '2026-03-15', noted: false },
  { itemCode: 'P-008', itemName: '商品H', lot: 'LOT-019', qty: 70,  unit: '‐',        expiry: '‐',          receivedAt: '2026-02-20', noted: false },
  { itemCode: 'P-008', itemName: '商品H', lot: 'LOT-024', qty: 55,  unit: '‐',        expiry: '‐',          receivedAt: '2026-02-20', noted: false },
  { itemCode: 'P-009', itemName: '商品I', lot: 'LOT-016', qty: 90,  unit: 'ボール',   expiry: '2027-04-30', receivedAt: '2026-03-10', noted: false },
  { itemCode: 'P-009', itemName: '商品I', lot: 'LOT-020', qty: 50,  unit: 'ボール',   expiry: '2027-04-30', receivedAt: '2026-03-10', noted: false },
  { itemCode: 'P-010', itemName: '商品J', lot: 'LOT-017', qty: 110, unit: 'ピース',   expiry: '2026-08-31', receivedAt: '2026-01-25', noted: true  },
  { itemCode: 'P-010', itemName: '商品J', lot: 'LOT-021', qty: 75,  unit: 'ピース',   expiry: '2026-08-31', receivedAt: '2026-01-25', noted: true  },
  { itemCode: 'P-010', itemName: '商品J', lot: 'LOT-025', qty: 130, unit: 'ピース',   expiry: '2026-08-31', receivedAt: '2026-01-25', noted: true  },
];

var inventoryListFiltered    = INVENTORY_LIST_DATA.slice();
var inventoryListCurrentPage = 1;

function initInventoryListTable() {
  if (!document.getElementById('inventoryListTableBody')) return;
  inventoryListFiltered = INVENTORY_LIST_DATA.slice();
  renderInventoryListPage(1);
}

function filterInventoryList() {
  var keyword = document.getElementById('inventoryListSearch').value.toLowerCase();

  inventoryListFiltered = INVENTORY_LIST_DATA.filter(function (row) {
    if (keyword) {
      var target = [row.itemCode, row.itemName, row.lot].join('\t').toLowerCase();
      if (target.indexOf(keyword) === -1) return false;
    }
    return true;
  });

  renderInventoryListPage(1);
}

function renderInventoryListPage(page) {
  inventoryListCurrentPage = page;
  var start    = (page - 1) * HISTORY_PAGE_SIZE;
  var pageData = inventoryListFiltered.slice(start, start + HISTORY_PAGE_SIZE);

  var tbody = document.getElementById('inventoryListTableBody');
  tbody.innerHTML = '';

  pageData.forEach(function (row) {
    var tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.innerHTML =
      '<td>' + row.itemCode   + '</td>' +
      '<td>' + row.itemName   + '</td>' +
      '<td>' + row.lot        + '</td>' +
      '<td style="text-align:right">' + row.qty + '</td>' +
      '<td>' + row.unit       + '</td>' +
      '<td>' + row.expiry     + '</td>' +
      '<td>' + row.receivedAt + '</td>' +
      '<td style="text-align:center">' + (row.noted ? '●' : '') + '</td>';
    tr.addEventListener('click', function () { openInventoryModal(row); });
    tbody.appendChild(tr);
  });

  updateInventoryListTotalCount(inventoryListFiltered.length);
  renderInventoryListPagination(inventoryListFiltered.length, page);
}

function openInventoryModal(rowData) {
  var modalItems = INVENTORY_LOT_MODAL_DATA.filter(function (d) { return d.lot === rowData.lot; });

  var el = document.getElementById('inventoryLotModalInfo');
  if (el) {
    el.innerHTML =
      '<span><strong>商品コード:</strong> ' + rowData.itemCode + '</span>' +
      '<span><strong>商品名:</strong> '     + rowData.itemName + '</span>' +
      '<span><strong>ロット番号:</strong> ' + rowData.lot      + '</span>' +
      '<span><strong>賞味期限:</strong> '   + rowData.expiry   + '</span>' +
      '<span><strong>入庫日:</strong> '     + rowData.receivedAt + '</span>';
  }

  var tbody = document.getElementById('inventoryLotModalTableBody');
  if (tbody) {
    tbody.innerHTML = '';
    modalItems.forEach(function (item) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + item.shelf + '</td>' +
        '<td style="text-align:right">' + item.qty + '</td>' +
        '<td>' + item.note + '</td>';
      tbody.appendChild(tr);
    });
  }

  openModal('inventoryLotModal');
}

function closeInventoryModal() {
  closeModal('inventoryLotModal');
}

function updateInventoryListTotalCount(count) {
  var el = document.getElementById('inventoryListTotalCount');
  if (el) el.textContent = '全 ' + count + ' 件';
}

function renderInventoryListPagination(totalCount, page) {
  var totalPages = Math.ceil(totalCount / HISTORY_PAGE_SIZE);
  var container  = document.getElementById('inventoryListPagination');
  if (!container) return;
  container.innerHTML = '';

  var prevBtn = document.createElement('button');
  prevBtn.className = 'history-pagination-btn';
  prevBtn.textContent = '< 前へ';
  prevBtn.disabled = (page === 1);
  prevBtn.setAttribute('aria-label', '前のページ');
  prevBtn.addEventListener('click', function () { renderInventoryListPage(page - 1); });
  container.appendChild(prevBtn);

  for (var i = 1; i <= totalPages; i++) {
    (function (p) {
      var btn = document.createElement('button');
      btn.className = 'history-pagination-btn' + (p === page ? ' is-active' : '');
      btn.textContent = p;
      btn.setAttribute('aria-label', p + 'ページ');
      if (p === page) btn.setAttribute('aria-current', 'page');
      btn.addEventListener('click', function () { renderInventoryListPage(p); });
      container.appendChild(btn);
    })(i);
  }

  var nextBtn = document.createElement('button');
  nextBtn.className = 'history-pagination-btn';
  nextBtn.textContent = '次へ >';
  nextBtn.disabled = (page >= totalPages || totalPages === 0);
  nextBtn.setAttribute('aria-label', '次のページ');
  nextBtn.addEventListener('click', function () { renderInventoryListPage(page + 1); });
  container.appendChild(nextBtn);
}

// === 引き当てチェック (SCR-010) ===
//
// React の /react/outbound/allocation-check（views/outbound/AllocationCheckView.jsx）と
// 同じ見た目・振る舞いを、ダミーデータで再現したもの。
// 「引き当て実行」で結果を取得し、ステータス（引き当て済み / 出荷予定）ごとの
// 2ブロックに分けて表示する。行クリックで明細（棚ロケ単位の引当内訳）を開閉する。
//
// ダミーデータ前提の割り切り（バックエンド実装時に見直す）:
// - 「引き当て済みに変更」「削除」は画面上のデータを書き換えるだけ
// - 「引き当て表印刷」「引き当て表のまとめて印刷」は実際には印刷しない
// - 開始日・終了日は入力を受け取るだけで、絞り込みには使っていない

var ALLOCATION_EMPTY_MARK = '‐';

// ブロックごとにチェックボックスの用途が異なる。
// - 引き当て済み: 「引き当て表のまとめて印刷」の対象選択
// - 出荷予定:     「引き当て済みに変更」の対象選択
// deletable: 「操作」列を削除ボタンにするか。出荷予定の段階では引き当て表を印刷できず、
//            代わりに削除ができるため、ブロックごとに操作の中身を入れ替える。
var ALLOCATION_STATUS_BLOCKS = [
  { key: 'allocated', label: '引き当て済み', badgeClass: 'status-badge--warning',     deletable: false },
  { key: 'draft',     label: '出荷予定',     badgeClass: 'status-badge--information', deletable: true }
];

// ダミーデータの日付は表示日基準で組み立てる（開始日・終了日の既定値が今日のため）
function allocationDateString(offsetDays) {
  var d = new Date();
  d.setDate(d.getDate() + (offsetDays || 0));
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

function allocationDateTimeString(offsetDays, hour, minute) {
  var d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

// 引き当て成功した棚ロケ1件分。
// currentQuantity は「その引き当ての直前の在庫数」。画面の残在庫数はここから引当数を引いて求める
function allocationStock(locationCode, allocatedQuantity, currentQuantity, lotNumber) {
  return {
    location_code: locationCode,
    lot_number: lotNumber || 'LOT-00001',
    expiry_date: allocationDateString(120),
    allocated_quantity: allocatedQuantity,
    current_quantity: currentQuantity
  };
}

// 引き当てシミュレーションの結果（バックエンドの simulate_outbound_stock_availability 相当）。
// ALLOCATED が先、DRAFT が後、それぞれ出荷予定日順に並んでいる想定
function buildAllocationDummyResults() {
  return [
    // ===== 引き当て済み（ALLOCATED）=====
    // 単一棚ロケからの引き当て
    {
      schedule_id: 101,
      order_number: 'ORD-20260901-001',
      outbound_date: allocationDateString(0),
      created_at: allocationDateTimeString(-3, 9, 0),
      status: 'allocated',
      partner_name: '株式会社山田商店',
      result: true,
      items: [
        {
          schedule_item_id: 1001,
          item_code: 'ITEM-00001', item_name: 'テスト商品 1', item_unit: '個',
          lot_number: 'LOT-00001', expiry_date: allocationDateString(120),
          quantity: 50, result: true, shortage_quantity: 0,
          allocated_stocks: [allocationStock('A-01-01-1', 50, 200)]
        },
        {
          schedule_item_id: 1002,
          item_code: 'ITEM-00002', item_name: 'テスト商品 2', item_unit: 'kg',
          lot_number: '', expiry_date: null,
          quantity: 80, result: true, shortage_quantity: 0,
          allocated_stocks: [allocationStock('A-01-02-1', 80, 300, 'LOT-00007')]
        }
      ]
    },
    // 1つの明細が3つの棚ロケに分割して引き当てられたケース
    {
      schedule_id: 102,
      order_number: 'ORD-20260901-002',
      outbound_date: allocationDateString(1),
      created_at: allocationDateTimeString(-2, 10, 30),
      status: 'allocated',
      partner_name: '鈴木物産株式会社',
      result: true,
      items: [
        {
          schedule_item_id: 1003,
          item_code: 'ITEM-00003', item_name: 'テスト商品 3', item_unit: 'L',
          lot_number: 'LOT-00012', expiry_date: allocationDateString(200),
          quantity: 120, result: true, shortage_quantity: 0,
          allocated_stocks: [
            allocationStock('B-02-01-1', 50, 50, 'LOT-00012'),
            allocationStock('B-02-01-2', 40, 40, 'LOT-00012'),
            allocationStock('B-02-03-1', 30, 90, 'LOT-00012')
          ]
        }
      ]
    },

    // ===== 出荷予定（DRAFT）=====
    // すべてOK。「引き当て済みに変更」でチェックできる
    {
      schedule_id: 201,
      order_number: 'ORD-20260901-003',
      outbound_date: allocationDateString(0),
      created_at: allocationDateTimeString(-1, 14, 0),
      status: 'draft',
      partner_name: '田中運輸株式会社',
      result: true,
      items: [
        {
          schedule_item_id: 2001,
          item_code: 'ITEM-00004', item_name: 'テスト商品 4', item_unit: '箱',
          lot_number: '', expiry_date: null,
          quantity: 60, result: true, shortage_quantity: 0,
          allocated_stocks: [
            allocationStock('C-01-01-1', 40, 40, 'LOT-00021'),
            allocationStock('C-01-02-1', 20, 120, 'LOT-00022')
          ]
        },
        {
          schedule_item_id: 2002,
          item_code: 'ITEM-00005', item_name: 'テスト商品 5', item_unit: 'パック',
          lot_number: 'LOT-00030', expiry_date: allocationDateString(60),
          quantity: 15, result: true, shortage_quantity: 0,
          allocated_stocks: [allocationStock('C-02-01-1', 15, 45, 'LOT-00030')]
        }
      ]
    },
    // 在庫がまったく無くNG（allocated_stocks が空）の明細を含む
    {
      schedule_id: 202,
      order_number: 'ORD-20260901-004',
      outbound_date: allocationDateString(0),
      created_at: allocationDateTimeString(-1, 15, 20),
      status: 'draft',
      partner_name: '佐藤フーズ株式会社',
      result: false,
      items: [
        {
          schedule_item_id: 2003,
          item_code: 'ITEM-00006', item_name: 'テスト商品 6', item_unit: 'ケース',
          lot_number: 'LOT-00099', expiry_date: allocationDateString(30),
          quantity: 40, result: false, shortage_quantity: 40,
          allocated_stocks: []
        },
        {
          schedule_item_id: 2004,
          item_code: 'ITEM-00007', item_name: 'テスト商品 7', item_unit: '個',
          lot_number: '', expiry_date: null,
          quantity: 25, result: true, shortage_quantity: 0,
          allocated_stocks: [allocationStock('C-03-01-1', 25, 80, 'LOT-00041')]
        }
      ]
    },
    // 一部だけ引き当てられて不足したNG（部分引当）
    {
      schedule_id: 203,
      order_number: 'ORD-20260901-005',
      outbound_date: allocationDateString(2),
      created_at: allocationDateTimeString(0, 8, 45),
      status: 'draft',
      partner_name: '高橋ストア株式会社',
      result: false,
      items: [
        {
          schedule_item_id: 2005,
          item_code: 'ITEM-00008', item_name: 'テスト商品 8', item_unit: 'kg',
          lot_number: '', expiry_date: null,
          quantity: 100, result: false, shortage_quantity: 30,
          allocated_stocks: [
            allocationStock('D-01-01-1', 50, 50, 'LOT-00050'),
            allocationStock('D-01-02-1', 20, 20, 'LOT-00051')
          ]
        }
      ]
    },
    // すべてOKの単純なケース（検索・絞り込みの確認用）
    {
      schedule_id: 204,
      order_number: 'ORD-20260901-006',
      outbound_date: allocationDateString(3),
      created_at: allocationDateTimeString(0, 11, 5),
      status: 'draft',
      partner_name: '株式会社山田商店',
      result: true,
      items: [
        {
          schedule_item_id: 2006,
          item_code: 'ITEM-00009', item_name: 'テスト商品 9', item_unit: '個',
          lot_number: '', expiry_date: null,
          quantity: 10, result: true, shortage_quantity: 0,
          allocated_stocks: [allocationStock('D-02-01-1', 10, 500, 'LOT-00060')]
        }
      ]
    }
  ];
}

// 画面の状態。React の useState 相当をまとめて持つ
var allocationState = {
  executed: false,   // 「引き当て実行」を押すまで結果セクションを出さない
  loading: false,
  error: '',
  results: [],
  keyword: '',       // 取得済みの結果に対するフロント側の簡易検索
  // 既定は「出荷予定」のみ。この画面の主目的が出荷予定を引き当て済みへ変更することなので、
  // 引き当て済みは必要なときだけチェックして参照する
  statusFilters: { allocated: false, draft: true },
  expandedIds: [],   // 明細を開いている schedule_id
  selectedIds: [],   // チェックされている schedule_id
  pendingConfirm: null // 確認モーダルで「はい」を押したときに実行する処理
};

function allocationHasId(list, id) {
  return list.indexOf(id) !== -1;
}

function allocationToggleId(list, id) {
  var i = list.indexOf(id);
  if (i === -1) {
    list.push(id);
  } else {
    list.splice(i, 1);
  }
}

function allocationEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function allocationFormatDate(value) {
  if (!value) return ALLOCATION_EMPTY_MARK;
  return value.replace(/-/g, '/');
}

// 受注日時（ISO8601）を「YYYY/MM/DD HH:mm」で表示する
function allocationFormatDateTime(value) {
  if (!value) return ALLOCATION_EMPTY_MARK;
  var d = new Date(value);
  if (isNaN(d.getTime())) return ALLOCATION_EMPTY_MARK;
  return d.getFullYear() + '/' +
    String(d.getMonth() + 1).padStart(2, '0') + '/' +
    String(d.getDate()).padStart(2, '0') + ' ' +
    String(d.getHours()).padStart(2, '0') + ':' +
    String(d.getMinutes()).padStart(2, '0');
}

function allocationResultBadge(ok) {
  return '<span class="allocation-badge allocation-badge--' + (ok ? 'ok">OK' : 'ng">NG') + '</span>';
}

function initAllocationCheck() {
  var today = allocationDateString(0);
  var from = document.getElementById('allocationDateFrom');
  var to   = document.getElementById('allocationDateTo');
  if (from) from.value = today;
  if (to)   to.value   = today;
  renderAllocationSections();
}

function runAllocationCheck() {
  var from = document.getElementById('allocationDateFrom');
  var to   = document.getElementById('allocationDateTo');
  var startDate = from ? from.value : '';
  var endDate   = to ? to.value : '';

  allocationState.executed = true;
  // 再実行のたびに展開状態・選択状態はリセットする（前回結果の選択が残ると誤操作の原因になる）
  allocationState.expandedIds = [];
  allocationState.selectedIds = [];

  if (startDate && endDate && startDate > endDate) {
    allocationState.error = '開始日は終了日以前の日付を指定してください';
    allocationState.loading = false;
    allocationState.results = [];
    renderAllocationSections();
    return;
  }

  allocationState.error = '';
  allocationState.loading = true;
  allocationState.results = [];
  renderAllocationSections();

  // 実際の通信と同じく非同期で解決させる（ローディング表示の確認のため少し遅らせる）
  setTimeout(function () {
    allocationState.loading = false;
    allocationState.results = buildAllocationDummyResults();
    updateAllocationUpdatedAt();
    renderAllocationSections();
  }, 300);
}

// 最終更新は React 側に合わせて「HH:mm」で表示する
function updateAllocationUpdatedAt() {
  var el = document.getElementById('scheduleUpdatedAt');
  if (!el) return;
  var now = new Date();
  el.textContent = '最終更新: ' +
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0');
}

function setAllocationKeyword(value) {
  allocationState.keyword = value;
  renderAllocationSections();
}

function toggleAllocationStatusFilter(key) {
  allocationState.statusFilters[key] = !allocationState.statusFilters[key];
  renderAllocationSections();
}

function toggleAllocationDetail(scheduleId) {
  allocationToggleId(allocationState.expandedIds, scheduleId);
  renderAllocationSections();
}

function toggleAllocationSelect(scheduleId) {
  allocationToggleId(allocationState.selectedIds, scheduleId);
  renderAllocationSections();
}

// チェックボックスを操作できる条件。チェックボックスの用途がブロックごとに異なるため、
// 引き当て済みは常に選択可（引き当て表の印刷対象）、
// 出荷予定は引き当て結果OKのものだけ選択可（引き当て済みへの変更対象）とする
function isAllocationSelectable(schedule) {
  if (schedule.status === 'allocated') return true;
  return schedule.result;
}

// 検索キーワード（受注No・出荷先の部分一致）で絞り込む
function filteredAllocationResults() {
  var q = allocationState.keyword.trim().toLowerCase();
  if (!q) return allocationState.results;
  return allocationState.results.filter(function (s) {
    return s.order_number.toLowerCase().indexOf(q) !== -1 ||
      s.partner_name.toLowerCase().indexOf(q) !== -1;
  });
}

function allocationRowsOf(blockKey) {
  return filteredAllocationResults().filter(function (s) {
    return s.status === blockKey;
  });
}

// ヘッダーのボタンは、そのブロック内で選択されている行だけを対象にする
// （検索で絞り込まれて表示されていない行は対象外）
function allocationSelectedRowsOf(blockKey) {
  return allocationRowsOf(blockKey).filter(function (s) {
    return allocationHasId(allocationState.selectedIds, s.schedule_id);
  });
}

// 全選択チェックボックスの対象。引き当て済みは全行、
// 出荷予定は引き当て結果OKの行（＝チェックボックスが有効な行）だけを対象にする
function allocationSelectableRowsOf(blockKey) {
  return allocationRowsOf(blockKey).filter(isAllocationSelectable);
}

// ヘッダーの全選択チェックボックス。対象がすべて選択済みなら全解除、そうでなければ全選択する
function toggleAllocationSelectAll(blockKey) {
  var rows = allocationSelectableRowsOf(blockKey);
  if (rows.length === 0) return;

  var allSelected = rows.every(function (s) {
    return allocationHasId(allocationState.selectedIds, s.schedule_id);
  });

  rows.forEach(function (s) {
    var i = allocationState.selectedIds.indexOf(s.schedule_id);
    if (allSelected) {
      if (i !== -1) allocationState.selectedIds.splice(i, 1);
    } else if (i === -1) {
      allocationState.selectedIds.push(s.schedule_id);
    }
  });

  renderAllocationSections();
}

// 棚ロケ単位の値をセル内に積んで表示する。
// 1つの明細が複数の棚ロケへ分割して引き当てられることがあるため、
// 棚ロケ・引当数・残在庫数の3列は行数を揃えて縦に並べる。
// 引き当てできなかった明細（allocated_stocks が空）は空欄記号を1行だけ出す
function allocationStockLinesHtml(stocks, render, className) {
  var cls = className || '';
  if (stocks.length === 0) {
    return '<span class="' + cls + '">' + ALLOCATION_EMPTY_MARK + '</span>';
  }
  var lines = stocks.map(function (stockLot) {
    return '<span>' + allocationEscape(render(stockLot)) + '</span>';
  }).join('');
  return '<span class="allocation-stock-lines ' + cls + '">' + lines + '</span>';
}

// 展開時に表示する明細（出荷予定明細 単位）の一覧。
// 先頭の空セルは、伝票行のチェックボックス列・開閉アイコン列・ステータス列ぶんのインデント
function allocationDetailHtml(schedule) {
  var html = '' +
    '<div class="allocation-detail-inner allocation-detail-inner--stock">' +
      '<div class="allocation-detail-header allocation-detail-header--stock">' +
        '<span></span>' +
        '<span>商品コード</span>' +
        '<span>商品名</span>' +
        '<span>ロット番号</span>' +
        '<span class="text-right">数量</span>' +
        '<span>棚ロケ</span>' +
        '<span class="text-right">引当数</span>' +
        '<span class="text-right">残在庫数</span>' +
        '<span class="text-center">結果</span>' +
      '</div>';

  schedule.items.forEach(function (item) {
    html += '<div class="allocation-detail-item allocation-detail-item--stock' +
      (item.result ? '' : ' allocation-detail-item--ng-boundary') + '">' +
      '<span></span>' +
      '<span>' + allocationEscape(item.item_code) + '</span>' +
      '<span>' + allocationEscape(item.item_name) + '</span>' +
      '<span>' + allocationEscape(item.lot_number || ALLOCATION_EMPTY_MARK) + '</span>' +
      '<span class="text-right">' + item.quantity + '</span>' +
      allocationStockLinesHtml(item.allocated_stocks, function (s) { return s.location_code; }) +
      allocationStockLinesHtml(item.allocated_stocks, function (s) { return s.allocated_quantity; }, 'text-right') +
      // 残在庫数は「その棚ロケで引き当てた直後の残数」。
      // 引当直前の在庫数（current_quantity）から引当数を引いて求める
      allocationStockLinesHtml(item.allocated_stocks, function (s) {
        return s.current_quantity - s.allocated_quantity;
      }, 'text-right') +
      '<span class="allocation-detail-result">' +
        allocationResultBadge(item.result) +
        (!item.result && item.shortage_quantity > 0
          ? '<span class="body-s text-subtle">不足 ' + item.shortage_quantity + '</span>'
          : '') +
      '</span>' +
      '</div>';
  });

  return html + '</div>';
}

function allocationBlockHtml(block) {
  var rows = allocationRowsOf(block.key);
  var selectedCount = allocationSelectedRowsOf(block.key).length;
  var selectableCount = allocationSelectableRowsOf(block.key).length;
  var headerButton = block.key === 'draft'
    ? '<button type="button" class="btn btn-primary" onclick="openAllocationChangeConfirm()"' +
      (selectedCount === 0 ? ' disabled' : '') + '>引き当て済みに変更</button>'
    : '<button type="button" class="btn btn-primary" onclick="bulkPrintAllocationSheets()"' +
      (selectedCount === 0 ? ' disabled' : '') + '>引き当て表のまとめて印刷</button>';

  var html = '' +
    '<section class="section-card schedule-section-half" aria-labelledby="sectionAllocation-' + block.key + '">' +
      '<div class="section-card-header">' +
        '<h2 class="heading-m" id="sectionAllocation-' + block.key + '">引き当て結果（' + block.label + '）</h2>' +
        headerButton +
      '</div>' +
      '<hr class="section-divider">' +
      '<div class="schedule-table-wrapper">' +
        '<table class="schedule-table allocation-table" aria-label="引き当て結果（' + block.label + '）">' +
          // 明細（展開行）の列幅を伝票行の列と揃えるため、colgroup で列幅を確定させる
          // （.allocation-table は table-layout:fixed）。幅を指定しない「出荷先」列が余白を吸収する
          '<colgroup>' +
            '<col class="allocation-col-check">' +
            '<col class="allocation-col-expand">' +
            '<col class="allocation-col-status">' +
            '<col class="allocation-col-date">' +
            '<col class="allocation-col-order">' +
            '<col class="allocation-col-ordered-at">' +
            '<col>' +
            '<col class="allocation-col-result">' +
            '<col class="allocation-col-print">' +
          '</colgroup>' +
          '<thead>' +
            '<tr>' +
              '<th scope="col" class="allocation-checkbox-cell">' +
                '<input type="checkbox" class="allocation-select-all"' +
                ' data-block="' + block.key + '"' +
                (selectableCount === 0 ? ' disabled' : '') +
                (selectableCount > 0 && selectedCount === selectableCount ? ' checked' : '') +
                ' aria-label="' + block.label + 'をすべて選択"' +
                ' onchange="toggleAllocationSelectAll(\'' + block.key + '\')">' +
              '</th>' +
              '<th scope="col"><span class="sr-only">明細の開閉</span></th>' +
              '<th scope="col" class="text-center">ステータス</th>' +
              '<th scope="col">出荷日</th>' +
              '<th scope="col">受注No</th>' +
              '<th scope="col">受注日時</th>' +
              '<th scope="col">出荷先</th>' +
              '<th scope="col" class="text-center">引き当て結果</th>' +
              '<th scope="col" class="text-center">操作</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>';

  if (rows.length === 0) {
    html += '<tr><td colspan="9">該当する出荷予定はありません</td></tr>';
  }

  rows.forEach(function (schedule) {
    var id = schedule.schedule_id;
    var expanded = allocationHasId(allocationState.expandedIds, id);
    var selectable = isAllocationSelectable(schedule);
    var checked = allocationHasId(allocationState.selectedIds, id);

    html += '<tr class="allocation-summary-row" aria-expanded="' + expanded + '"' +
      ' onclick="toggleAllocationDetail(' + id + ')">' +
      // 引き当て済みブロックは「引き当て表のまとめて印刷」、
      // 出荷予定ブロックは「引き当て済みに変更」の対象選択
      '<td class="allocation-checkbox-cell">' +
        '<input type="checkbox"' +
        // 引き当て結果NGの出荷予定は変更対象にできない
        (selectable ? '' : ' disabled') +
        (checked ? ' checked' : '') +
        ' aria-label="' + allocationEscape(schedule.order_number) + ' を選択"' +
        ' onclick="event.stopPropagation()"' +
        ' onchange="toggleAllocationSelect(' + id + ')">' +
      '</td>' +
      '<td class="allocation-expand-cell">' +
        '<span class="allocation-expand-icon' + (expanded ? ' allocation-expand-icon--open' : '') + '" aria-hidden="true">▶</span>' +
      '</td>' +
      '<td class="text-center"><span class="status-badge ' + block.badgeClass + '">' + block.label + '</span></td>' +
      '<td>' + allocationFormatDate(schedule.outbound_date) + '</td>' +
      '<td>' + allocationEscape(schedule.order_number) + '</td>' +
      '<td>' + allocationFormatDateTime(schedule.created_at) + '</td>' +
      '<td>' + allocationEscape(schedule.partner_name) + '</td>' +
      '<td class="text-center">' + allocationResultBadge(schedule.result) + '</td>' +
      // 出荷予定の段階では引き当て表を印刷できないため、ブロックごとに操作の中身を入れ替える
      '<td class="allocation-print-cell">' +
        (block.deletable
          ? '<button type="button" class="btn btn-danger" onclick="event.stopPropagation(); openAllocationDeleteConfirm(' + id + ')">削除</button>'
          : '<button type="button" class="btn btn-default" onclick="event.stopPropagation()">引き当て表印刷</button>') +
      '</td>' +
      '</tr>';

    if (expanded) {
      // 「引き当て結果」列の右端までを占め、その中のグリッドの最終列を「結果」にすることで、
      // 伝票行のOK/NGと縦に揃える
      html += '<tr class="allocation-detail-row">' +
        '<td colspan="8">' + allocationDetailHtml(schedule) + '</td>' +
        '<td></td>' +
        '</tr>';
    }
  });

  return html + '</tbody></table></div></section>';
}

function renderAllocationSections() {
  var container = document.getElementById('allocationSections');
  if (!container) return;

  // 引き当て実行前は、結果の代わりに操作を促す説明を出す
  if (!allocationState.executed) {
    container.innerHTML = '<section class="section-card">' +
      '<p class="body-m text-subtle">引き当て実行をクリックしてください。</p></section>';
    return;
  }

  if (allocationState.error) {
    container.innerHTML = '<section class="section-card">' +
      '<p class="body-m text-danger">' + allocationEscape(allocationState.error) + '</p></section>';
    return;
  }

  if (allocationState.loading) {
    container.innerHTML = '<section class="section-card">' +
      '<p class="body-m">引き当てチェックを実行中...</p></section>';
    return;
  }

  container.innerHTML = ALLOCATION_STATUS_BLOCKS.filter(function (block) {
    return allocationState.statusFilters[block.key];
  }).map(allocationBlockHtml).join('');

  // 一部だけ選択されている状態は indeterminate（HTML属性では表現できないため描画後に設定する）
  container.querySelectorAll('.allocation-select-all').forEach(function (el) {
    var blockKey = el.dataset.block;
    var selectableCount = allocationSelectableRowsOf(blockKey).length;
    var selectedCount = allocationSelectedRowsOf(blockKey).length;
    el.indeterminate = selectedCount > 0 && selectedCount < selectableCount;
  });
}

// --- 「引き当て済みに変更」「削除」の確認モーダル ---

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// React の confirm() 相当。items は { label, value } の配列
function openAllocationConfirm(config) {
  document.getElementById('allocationConfirmModalTitle').textContent = config.title;
  document.getElementById('allocationConfirmMessage').textContent = config.message;

  var table = document.getElementById('allocationConfirmItems');
  var items = config.items || [];
  table.innerHTML = items.map(function (item) {
    return '<tr><th>' + allocationEscape(item.label) + '</th>' +
      '<td>' + allocationEscape(item.value) + '</td></tr>';
  }).join('');
  table.style.display = items.length > 0 ? '' : 'none';

  var yesBtn = document.getElementById('allocationConfirmYes');
  yesBtn.textContent = config.yesText || 'OK';
  yesBtn.className = 'btn ' + (config.variant === 'danger' ? 'btn-danger' : 'btn-primary');

  allocationState.pendingConfirm = config.onConfirm;
  openModal('allocationConfirmModal');
}

function closeAllocationConfirm(ok) {
  closeModal('allocationConfirmModal');
  var handler = allocationState.pendingConfirm;
  allocationState.pendingConfirm = null;
  if (ok && handler) handler();
}

function openAllocationChangeConfirm() {
  var targets = allocationSelectedRowsOf('draft');
  if (targets.length === 0) return;

  openAllocationConfirm({
    title: '確認',
    message: '引き当て済みに変更しますか？',
    items: targets.map(function (s) {
      return { label: s.order_number, value: s.partner_name };
    }),
    yesText: '確定',
    onConfirm: function () {
      // ダミーデータのため、画面上のステータスだけを引き当て済みに変更する
      targets.forEach(function (target) {
        target.status = 'allocated';
        // 変更した行は引き当て済みブロックへ移るため、チェックを外す
        // （引き当て済みブロックで選択済みの行のチェックは残す）
        var i = allocationState.selectedIds.indexOf(target.schedule_id);
        if (i !== -1) allocationState.selectedIds.splice(i, 1);
      });
      renderAllocationSections();
      showToast('success', targets.length + '件を引き当て済みに変更しました', 3000);
    }
  });
}

function openAllocationDeleteConfirm(scheduleId) {
  var schedule = allocationState.results.filter(function (s) {
    return s.schedule_id === scheduleId;
  })[0];
  if (!schedule) return;

  openAllocationConfirm({
    title: '削除確認',
    variant: 'danger',
    message: 'この出荷予定を削除しますか？',
    items: [
      { label: '出荷日', value: allocationFormatDate(schedule.outbound_date) },
      { label: '受注No', value: schedule.order_number },
      { label: '出荷先', value: schedule.partner_name }
    ],
    yesText: '削除',
    onConfirm: function () {
      allocationState.results = allocationState.results.filter(function (s) {
        return s.schedule_id !== scheduleId;
      });
      renderAllocationSections();
      showToast('success', '削除しました', 3000);
    }
  });
}

function bulkPrintAllocationSheets() {
  var targets = allocationSelectedRowsOf('allocated');
  if (targets.length === 0) return;
  showToast('info', targets.length + '件の引き当て表を印刷します（未実装）', 3000);
}

// === トースト通知 ===
// React の notify.success / info / error 相当。
// duration(ms) が 0 以下のときは自動で消えない（× で閉じる）

function showToast(type, message, duration) {
  var container = document.getElementById('toastContainer');
  if (!container) return;

  var toast = document.createElement('div');
  toast.className = 'toast toast--' + type;
  toast.setAttribute('role', 'status');
  toast.innerHTML = '<span class="toast-message">' + allocationEscape(message) + '</span>' +
    '<button type="button" class="toast-close" aria-label="閉じる">×</button>';
  toast.querySelector('.toast-close').addEventListener('click', function () {
    toast.remove();
  });
  container.appendChild(toast);

  var ms = duration === undefined ? 4000 : duration;
  if (ms > 0) {
    setTimeout(function () { toast.remove(); }, ms);
  }
}

// === SCR-017 棚ロケ移動登録 ===
// 「移動元棚ロケ選択 → 移動元の在庫一覧 → 行クリックでフォームへ転記 → 確認モーダル」の流れ。
// 構造は 016（在庫調整）と同じ作りに合わせている。

// 棚ロケ別在庫のダミーデータ（shelfLocations の code に紐づく StockLot 相当）
var TRANSFER_STOCK_DATA = [
  { location: 'A-01-01-1', itemCode: 'P-001', itemName: '商品A', lotNo: 'LOT-001', expiryDate: '2026/12/31', receivedAt: '2026/05/10', qty: 100, unit: 'パレット', note: '' },
  { location: 'A-01-01-1', itemCode: 'P-001', itemName: '商品A', lotNo: 'LOT-002', expiryDate: '2027/01/31', receivedAt: '2026/06/02', qty: 80,  unit: 'パレット', note: '' },
  { location: 'A-01-01-1', itemCode: 'P-002', itemName: '商品B', lotNo: 'LOT-003', expiryDate: '',           receivedAt: '2026/06/15', qty: 60,  unit: 'ケース',   note: '外装に汚れあり' },
  { location: 'A-01-01-2', itemCode: 'P-003', itemName: '商品C', lotNo: 'LOT-004', expiryDate: '2026/09/30', receivedAt: '2026/04/20', qty: 300, unit: 'ピース',   note: '' },
  { location: 'A-01-01-2', itemCode: 'P-004', itemName: '商品D', lotNo: '',        expiryDate: '',           receivedAt: '2026/05/28', qty: 50,  unit: 'ボール',   note: '' },
  { location: 'A-01-02-1', itemCode: 'P-005', itemName: '商品E', lotNo: 'LOT-006', expiryDate: '2026/11/15', receivedAt: '2026/06/01', qty: 80,  unit: 'ケース',   note: '' },
  { location: 'A-02-01-1', itemCode: 'P-006', itemName: '商品F', lotNo: 'LOT-007', expiryDate: '2027/03/31', receivedAt: '2026/03/12', qty: 200, unit: 'パレット', note: '' },
  { location: 'A-02-01-1', itemCode: 'P-007', itemName: '商品G', lotNo: 'LOT-008', expiryDate: '2026/08/31', receivedAt: '2026/07/01', qty: 250, unit: 'ピース',   note: '要冷蔵' },
  { location: 'B-01-01-1', itemCode: 'P-008', itemName: '商品H', lotNo: 'LOT-009', expiryDate: '',           receivedAt: '2026/02/18', qty: 70,  unit: '‐',       note: '' },
  { location: 'B-01-02-1', itemCode: 'P-009', itemName: '商品I', lotNo: 'LOT-010', expiryDate: '2026/10/10', receivedAt: '2026/06/22', qty: 90,  unit: 'ボール',   note: '' },
  { location: 'B-01-02-1', itemCode: 'P-010', itemName: '商品J', lotNo: 'LOT-011', expiryDate: '2026/09/05', receivedAt: '2026/07/08', qty: 110, unit: 'ピース',   note: '要冷蔵' }
  // ※ C-01-01-1 は在庫なし（「在庫がありません」表示の確認用）
];

var transferSelectedRow = null;
var transferSelectedTr  = null;

function initTransferScreen() {
  populateTransferLocationSelect();
  populateTransferDestSelect('');
  renderTransferStockTable([]);
}

/** 移動元棚ロケ select を shelfLocations から生成する */
function populateTransferLocationSelect() {
  var sel = document.getElementById('transferLocationSelect');
  if (!sel) return;
  sel.innerHTML = '<option value="">棚ロケを選択</option>';
  shelfLocations.forEach(function (s) {
    var opt = document.createElement('option');
    opt.value = s.code;
    opt.textContent = s.code;
    sel.appendChild(opt);
  });
}

/** 移動先棚ロケ select を生成する（移動元に選んだ棚は選択肢から除外する） */
function populateTransferDestSelect(excludeCode) {
  var sel = document.getElementById('transferDestLocation');
  if (!sel) return;
  sel.innerHTML = '<option value="">棚ロケを選択</option>';
  shelfLocations.forEach(function (s) {
    if (s.code === excludeCode) return;
    var opt = document.createElement('option');
    opt.value = s.code;
    opt.textContent = s.code;
    sel.appendChild(opt);
  });
}

/** 現在の移動元棚ロケ + キーワードで絞り込んだ在庫行を返す */
function getTransferFilteredRows() {
  var sel  = document.getElementById('transferLocationSelect');
  var kwEl = document.getElementById('transferKeyword');
  var location = sel ? sel.value : '';
  if (!location) return [];
  var kw = kwEl ? kwEl.value.trim().toLowerCase() : '';
  return TRANSFER_STOCK_DATA.filter(function (row) {
    if (row.location !== location) return false;
    if (!kw) return true;
    return row.itemCode.toLowerCase().indexOf(kw) !== -1 ||
           row.itemName.toLowerCase().indexOf(kw) !== -1 ||
           row.lotNo.toLowerCase().indexOf(kw) !== -1;
  });
}

function onTransferLocationChange() {
  var sel = document.getElementById('transferLocationSelect');
  deselectTransferRow();
  populateTransferDestSelect(sel ? sel.value : '');
  renderTransferStockTable(getTransferFilteredRows());
}

function onTransferKeywordInput() {
  deselectTransferRow();
  renderTransferStockTable(getTransferFilteredRows());
}

function renderTransferStockTable(rows) {
  var tbody = document.getElementById('transferTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  var sel = document.getElementById('transferLocationSelect');
  var hasLocation = sel && sel.value;

  if (rows.length === 0) {
    var emptyRow = document.createElement('tr');
    var emptyCell = document.createElement('td');
    emptyCell.colSpan = 8;
    emptyCell.style.textAlign = 'center';
    emptyCell.style.padding = 'var(--ds-space-300)';
    emptyCell.textContent = hasLocation ? '在庫がありません' : '棚ロケを選択してください';
    emptyRow.appendChild(emptyCell);
    tbody.appendChild(emptyRow);
  } else {
    rows.forEach(function (row) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + row.itemCode + '</td>' +
        '<td>' + row.itemName + '</td>' +
        '<td>' + (row.lotNo || '‐') + '</td>' +
        '<td>' + (row.expiryDate || '‐') + '</td>' +
        '<td>' + row.receivedAt + '</td>' +
        '<td class="col-right">' + row.qty + '</td>' +
        '<td>' + row.unit + '</td>' +
        '<td>' + (row.note || '') + '</td>';
      tr.addEventListener('click', function () {
        if (transferSelectedTr === tr) {
          deselectTransferRow();
        } else {
          selectTransferRow(row, tr);
        }
      });
      tbody.appendChild(tr);
    });
  }

  var countEl = document.getElementById('transferTotalCount');
  if (countEl) countEl.textContent = hasLocation ? '全 ' + rows.length + ' 件' : '';
}

/** 行クリック: 移動フォームへ全項目を転記してフォームを有効化する */
function selectTransferRow(rowData, tr) {
  if (transferSelectedTr) transferSelectedTr.classList.remove('is-selected');
  transferSelectedRow = rowData;
  transferSelectedTr  = tr;
  tr.classList.add('is-selected');

  document.getElementById('transferSrcLocation').value = rowData.location;
  document.getElementById('transferItemCode').value    = rowData.itemCode;
  document.getElementById('transferItemName').value    = rowData.itemName;
  document.getElementById('transferUnitType').value    = rowData.unit;
  document.getElementById('transferLotNo').value       = rowData.lotNo || '';
  document.getElementById('transferExpiryDate').value  = rowData.expiryDate || '';
  document.getElementById('transferReceivedAt').value  = rowData.receivedAt;
  document.getElementById('transferCurrentQty').value  = rowData.qty;
  // 移動先は移動元の棚を除外して作り直す
  populateTransferDestSelect(rowData.location);
  document.getElementById('transferQty').value      = '';
  document.getElementById('transferAfterQty').value = '';
  document.getElementById('transferReason').value   = '';
  document.getElementById('transferForm').disabled  = false;
  validateTransferForm();
}

function deselectTransferRow() {
  if (transferSelectedTr) transferSelectedTr.classList.remove('is-selected');
  transferSelectedRow = null;
  transferSelectedTr  = null;
  var form = document.getElementById('transferForm');
  if (!form) return;
  ['transferSrcLocation', 'transferItemCode', 'transferItemName', 'transferUnitType',
   'transferLotNo', 'transferExpiryDate', 'transferReceivedAt', 'transferCurrentQty',
   'transferDestLocation', 'transferQty', 'transferAfterQty', 'transferReason'
  ].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  form.disabled = true;
  var btn = document.getElementById('transferRegisterBtn');
  if (btn) btn.disabled = true;
}

function onTransferQtyInput() {
  recalcTransferAfterQty();
  validateTransferForm();
}

/** 移動後の残数 = 現在庫数 − 移動数量 */
function recalcTransferAfterQty() {
  var afterEl = document.getElementById('transferAfterQty');
  if (!afterEl) return;
  if (!transferSelectedRow) { afterEl.value = ''; return; }
  var qty = parseInt(document.getElementById('transferQty').value, 10);
  afterEl.value = isNaN(qty) ? '' : String(transferSelectedRow.qty - qty);
}

function validateTransferForm() {
  var btn = document.getElementById('transferRegisterBtn');
  if (!btn) return;
  if (!transferSelectedRow) { btn.disabled = true; return; }
  var qty    = parseInt(document.getElementById('transferQty').value, 10);
  var dest   = document.getElementById('transferDestLocation').value;
  var reason = (document.getElementById('transferReason').value || '').trim();
  // 移動数量は 1 以上・現在庫数以下。移動先は必須（移動元は select から除外済みだが保険で検証）
  var valid = !isNaN(qty) && qty >= 1 && qty <= transferSelectedRow.qty &&
              dest !== '' && dest !== transferSelectedRow.location &&
              reason !== '';
  btn.disabled = !valid;
}

function showTransferConfirmDialog() {
  if (!transferSelectedRow) return;
  var qty    = parseInt(document.getElementById('transferQty').value, 10);
  if (isNaN(qty) || qty < 1) return;
  var dest   = document.getElementById('transferDestLocation').value;
  var reason = document.getElementById('transferReason').value.trim();
  var unit   = transferSelectedRow.unit;

  var rows = [
    ['移動元棚ロケ',   transferSelectedRow.location],
    ['商品コード',     transferSelectedRow.itemCode],
    ['商品名',         transferSelectedRow.itemName],
    ['単位区分',       unit],
    ['ロット番号',     transferSelectedRow.lotNo || '‐'],
    ['賞味期限',       transferSelectedRow.expiryDate || '‐'],
    ['入庫日',         transferSelectedRow.receivedAt],
    ['現在庫数',       transferSelectedRow.qty + ' ' + unit],
    ['移動先棚ロケ',   dest],
    ['移動数量',       qty + ' ' + unit],
    ['移動後の残数',   (transferSelectedRow.qty - qty) + ' ' + unit],
    ['移動理由',       reason]
  ];
  var html = '<dl class="transfer-confirm-dl">';
  rows.forEach(function (pair) {
    html += '<dt>' + pair[0] + '</dt><dd>' + pair[1] + '</dd>';
  });
  html += '</dl>';
  document.getElementById('transferConfirmBody').innerHTML = html;
  document.getElementById('transferConfirmModal').style.display = 'flex';
}

function executeTransfer() {
  document.getElementById('transferConfirmModal').style.display = 'none';
  showTransferFlash('棚ロケ移動を登録しました');
  deselectTransferRow();
}

function showTransferFlash(message) {
  var el = document.getElementById('transferFlash');
  if (!el) return;
  el.textContent = message;
  el.style.display = 'flex';
  setTimeout(function () { el.style.display = 'none'; }, 3000);
}

// === SCR-018 棚ロケ移動履歴 ===
// 020（在庫調整履歴）と同じ「日付範囲 + キーワード検索 → テーブル → ページネーション + 行クリックモーダル」構造。
// 020 との違い: 増減フィルタを持たず、キーワード検索の対象に reason（移動理由）を含めない。
// 017（棚ロケ移動登録）の transfer* 関数群とは名前空間を分けるため、すべて TransferHistory を含む名前にしている。

var TRANSFER_HISTORY_DATA = [
  { datetime: '2026/05/19 15:42', srcLocation: 'A-01-01', destLocation: 'C-01-01', itemCode: 'P-001', itemName: '商品A', lotNo: 'LOT-001', qty: 50,  unit: 'パレット', reason: '棚卸しのため',           operator: '山田 太郎', expiryDate: '2026/12/31', receivedAt: '2026/05/10' },
  { datetime: '2026/05/19 14:10', srcLocation: 'B-01-01', destLocation: 'D-02-01', itemCode: 'P-003', itemName: '商品C', lotNo: 'LOT-006', qty: 100, unit: 'ピース',   reason: '集約のため',             operator: '佐藤 花子', expiryDate: '2026/09/30', receivedAt: '2026/04/20' },
  { datetime: '2026/05/19 11:30', srcLocation: 'D-04-01', destLocation: 'A-02-01', itemCode: 'P-007', itemName: '商品G', lotNo: 'LOT-022', qty: 30,  unit: 'ピース',   reason: 'ピッキング効率化のため',   operator: '鈴木 一郎', expiryDate: '2026/08/31', receivedAt: '2026/07/01' },
  { datetime: '2026/05/18 16:55', srcLocation: 'C-02-01', destLocation: 'B-02-01', itemCode: 'P-005', itemName: '商品E', lotNo: 'LOT-012', qty: 20,  unit: 'ケース',   reason: '賞味期限管理のため',       operator: '高橋 二郎', expiryDate: '2026/11/15', receivedAt: '2026/06/01' },
  { datetime: '2026/05/18 14:00', srcLocation: 'A-01-02', destLocation: 'C-03-02', itemCode: 'P-002', itemName: '商品B', lotNo: '',        qty: 40,  unit: 'ケース',   reason: '集約のため',             operator: '山田 太郎', expiryDate: '',           receivedAt: '2026/06/15' },
  { datetime: '2026/05/17 17:20', srcLocation: 'D-01-02', destLocation: 'B-01-02', itemCode: 'P-010', itemName: '商品J', lotNo: 'LOT-017', qty: 60,  unit: 'ピース',   reason: '冷蔵エリアへの移設のため', operator: '佐藤 花子', expiryDate: '2026/08/31', receivedAt: '2026/05/02' },
  { datetime: '2026/05/17 10:45', srcLocation: 'B-02-01', destLocation: 'A-01-01', itemCode: 'P-003', itemName: '商品C', lotNo: 'LOT-008', qty: 80,  unit: 'ピース',   reason: 'ピッキング効率化のため',   operator: '鈴木 一郎', expiryDate: '2026/10/31', receivedAt: '2026/05/12' },
  { datetime: '2026/05/16 15:30', srcLocation: 'C-01-02', destLocation: 'D-04-02', itemCode: 'P-006', itemName: '商品F', lotNo: 'LOT-011', qty: 50,  unit: 'パレット', reason: '棚卸しのため',           operator: '高橋 二郎', expiryDate: '2027/03/31', receivedAt: '2026/03/12' },
  { datetime: '2026/05/16 09:15', srcLocation: 'A-02-02', destLocation: 'C-02-02', itemCode: 'P-002', itemName: '商品B', lotNo: 'LOT-005', qty: 25,  unit: 'ケース',   reason: '集約のため',             operator: '山田 太郎', expiryDate: '2026/12/15', receivedAt: '2026/04/28' },
  { datetime: '2026/05/15 16:40', srcLocation: 'D-03-01', destLocation: 'B-01-01', itemCode: 'P-009', itemName: '商品I', lotNo: 'LOT-020', qty: 30,  unit: 'ボール',   reason: '棚ロケ再編のため',         operator: '佐藤 花子', expiryDate: '',           receivedAt: '2026/05/01' },
  { datetime: '2026/05/15 13:00', srcLocation: 'C-03-01', destLocation: 'A-01-02', itemCode: 'P-005', itemName: '商品E', lotNo: 'LOT-014', qty: 40,  unit: 'ケース',   reason: '賞味期限管理のため',       operator: '鈴木 一郎', expiryDate: '2026/11/30', receivedAt: '2026/05/08' },
  { datetime: '2026/05/14 17:50', srcLocation: 'D-02-02', destLocation: 'C-03-01', itemCode: 'P-008', itemName: '商品H', lotNo: 'LOT-019', qty: 35,  unit: '‐',        reason: '出荷準備のため',           operator: '高橋 二郎', expiryDate: '2026/05/14', receivedAt: '2026/02/20' },
  { datetime: '2026/05/14 11:20', srcLocation: 'B-01-02', destLocation: 'D-03-02', itemCode: 'P-004', itemName: '商品D', lotNo: '',        qty: 20,  unit: 'ボール',   reason: '集約のため',             operator: '山田 太郎', expiryDate: '',           receivedAt: '2026/05/28' },
  { datetime: '2026/05/13 15:10', srcLocation: 'A-02-01', destLocation: 'D-04-03', itemCode: 'P-001', itemName: '商品A', lotNo: 'LOT-004', qty: 60,  unit: 'パレット', reason: '棚卸しのため',           operator: '佐藤 花子', expiryDate: '2027/01/31', receivedAt: '2026/06/02' },
  { datetime: '2026/05/13 10:30', srcLocation: 'C-02-02', destLocation: 'A-02-02', itemCode: 'P-006', itemName: '商品F', lotNo: 'LOT-013', qty: 90,  unit: 'パレット', reason: 'ピッキング効率化のため',   operator: '鈴木 一郎', expiryDate: '2027/02/28', receivedAt: '2026/05/06' },
  { datetime: '2026/05/12 16:00', srcLocation: 'D-04-02', destLocation: 'B-02-02', itemCode: 'P-008', itemName: '商品H', lotNo: 'LOT-024', qty: 15,  unit: '‐',        reason: '棚ロケ再編のため',         operator: '高橋 二郎', expiryDate: '2026/07/31', receivedAt: '2026/04/10' },
  { datetime: '2026/05/12 09:45', srcLocation: 'B-02-02', destLocation: 'C-01-01', itemCode: 'P-004', itemName: '商品D', lotNo: 'LOT-009', qty: 10,  unit: 'ボール',   reason: '集約のため',             operator: '山田 太郎', expiryDate: '',           receivedAt: '2026/03/30' },
  { datetime: '2026/05/11 14:30', srcLocation: 'D-01-01', destLocation: 'A-01-01', itemCode: 'P-009', itemName: '商品I', lotNo: '',        qty: 40,  unit: 'ボール',   reason: 'ピッキング効率化のため',   operator: '佐藤 花子', expiryDate: '',           receivedAt: '2026/04/18' },
  { datetime: '2026/05/11 10:00', srcLocation: 'C-01-01', destLocation: 'D-01-02', itemCode: 'P-005', itemName: '商品E', lotNo: 'LOT-010', qty: 30,  unit: 'ケース',   reason: '賞味期限管理のため',       operator: '鈴木 一郎', expiryDate: '2026/10/15', receivedAt: '2026/04/05' },
  { datetime: '2026/05/10 17:15', srcLocation: 'D-04-03', destLocation: 'C-02-01', itemCode: 'P-010', itemName: '商品J', lotNo: 'LOT-025', qty: 70,  unit: 'ピース',   reason: '冷蔵エリアへの移設のため', operator: '高橋 二郎', expiryDate: '2026/05/10', receivedAt: '2026/01/25' },
  { datetime: '2026/05/09 15:40', srcLocation: 'A-01-01', destLocation: 'B-01-01', itemCode: 'P-001', itemName: '商品A', lotNo: 'LOT-002', qty: 30,  unit: 'パレット', reason: '棚卸しのため',           operator: '山田 太郎', expiryDate: '2027/01/31', receivedAt: '2026/06/02' },
  { datetime: '2026/05/09 11:10', srcLocation: 'C-03-02', destLocation: 'D-02-01', itemCode: 'P-006', itemName: '商品F', lotNo: 'LOT-015', qty: 60,  unit: 'パレット', reason: '集約のため',             operator: '佐藤 花子', expiryDate: '2027/02/28', receivedAt: '2026/05/06' },
  { datetime: '2026/05/08 16:20', srcLocation: 'B-01-01', destLocation: 'A-02-01', itemCode: 'P-003', itemName: '商品C', lotNo: 'LOT-006', qty: 50,  unit: 'ピース',   reason: '出荷準備のため',           operator: '鈴木 一郎', expiryDate: '2026/09/30', receivedAt: '2026/04/20' },
  { datetime: '2026/05/08 09:30', srcLocation: 'D-03-02', destLocation: 'C-03-01', itemCode: 'P-010', itemName: '商品J', lotNo: '',        qty: 25,  unit: 'ピース',   reason: '冷蔵エリアへの移設のため', operator: '高橋 二郎', expiryDate: '2026/08/31', receivedAt: '2026/03/05' },
  { datetime: '2026/05/07 14:00', srcLocation: 'C-03-01', destLocation: 'B-02-01', itemCode: 'P-005', itemName: '商品E', lotNo: 'LOT-014', qty: 20,  unit: 'ケース',   reason: '賞味期限管理のため',       operator: '山田 太郎', expiryDate: '2026/11/30', receivedAt: '2026/05/08' },
];

var transferHistoryFiltered    = TRANSFER_HISTORY_DATA.slice();
var transferHistoryCurrentPage = 1;
var TRANSFER_HISTORY_PAGE_SIZE = 20;

function initTransferHistoryTable() {
  if (!document.getElementById('transferHistoryTableBody')) return;
  // 終了日のデフォルトは今日
  var dateTo = document.getElementById('transferHistoryDateTo');
  if (dateTo && !dateTo.value) {
    var now = new Date();
    var mm  = ('0' + (now.getMonth() + 1)).slice(-2);
    var dd  = ('0' + now.getDate()).slice(-2);
    dateTo.value = now.getFullYear() + '-' + mm + '-' + dd;
  }
  filterTransferHistory();
}

function filterTransferHistory() {
  var startDate = document.getElementById('transferHistoryDateFrom').value;
  var endDate   = document.getElementById('transferHistoryDateTo').value;
  var keyword   = document.getElementById('transferHistoryKeyword').value.toLowerCase();

  transferHistoryFiltered = TRANSFER_HISTORY_DATA.filter(function (row) {
    if (startDate || endDate) {
      var rowDate = row.datetime.substring(0, 10).replace(/\//g, '-');
      if (startDate && rowDate < startDate) return false;
      if (endDate   && rowDate > endDate)   return false;
    }
    if (keyword) {
      // 検索対象は 商品コード・商品名・ロット番号・棚ロケ（移動元/移動先）。
      // 在庫調整履歴と異なり、reason（移動理由）は検索対象に含めない。
      var target = [row.itemCode, row.itemName, row.lotNo, row.srcLocation, row.destLocation]
        .join('\t').toLowerCase();
      if (target.indexOf(keyword) === -1) return false;
    }
    return true;
  });

  renderTransferHistoryPage(1);
}

function renderTransferHistoryPage(page) {
  transferHistoryCurrentPage = page;
  var start    = (page - 1) * TRANSFER_HISTORY_PAGE_SIZE;
  var pageData = transferHistoryFiltered.slice(start, start + TRANSFER_HISTORY_PAGE_SIZE);

  var tbody = document.getElementById('transferHistoryTableBody');
  tbody.innerHTML = '';

  if (pageData.length === 0) {
    var emptyRow = document.createElement('tr');
    var emptyCell = document.createElement('td');
    emptyCell.colSpan = 9;
    emptyCell.style.textAlign = 'center';
    emptyCell.style.padding = 'var(--ds-space-300)';
    emptyCell.textContent = 'データがありません';
    emptyRow.appendChild(emptyCell);
    tbody.appendChild(emptyRow);
  } else {
    pageData.forEach(function (row) {
      var tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      // 移動者（operator）は一覧に出さず、モーダルで表示する（D_画面仕様.md 参照）
      tr.innerHTML =
        '<td>' + row.datetime     + '</td>' +
        '<td>' + row.srcLocation  + '</td>' +
        '<td>' + row.destLocation + '</td>' +
        '<td>' + row.itemCode     + '</td>' +
        '<td>' + row.itemName     + '</td>' +
        '<td>' + row.lotNo        + '</td>' +
        '<td style="text-align:right">' + row.qty + '</td>' +
        '<td>' + row.unit         + '</td>' +
        '<td>' + row.reason       + '</td>';
      tr.addEventListener('click', function () { openTransferHistoryModal(row); });
      tbody.appendChild(tr);
    });
  }

  updateTransferHistoryTotalCount(transferHistoryFiltered.length);
  renderTransferHistoryPagination(transferHistoryFiltered.length, page);
}

function updateTransferHistoryTotalCount(count) {
  var el = document.getElementById('transferHistoryTotalCount');
  if (el) el.textContent = '全 ' + count + ' 件';
}

function renderTransferHistoryPagination(totalCount, page) {
  var totalPages = Math.ceil(totalCount / TRANSFER_HISTORY_PAGE_SIZE);
  var container  = document.getElementById('transferHistoryPagination');
  if (!container) return;
  container.innerHTML = '';

  var prevBtn = document.createElement('button');
  prevBtn.className = 'history-pagination-btn';
  prevBtn.textContent = '< 前へ';
  prevBtn.disabled = (page === 1);
  prevBtn.setAttribute('aria-label', '前のページ');
  prevBtn.addEventListener('click', function () { renderTransferHistoryPage(page - 1); });
  container.appendChild(prevBtn);

  for (var i = 1; i <= totalPages; i++) {
    (function (p) {
      var btn = document.createElement('button');
      btn.className = 'history-pagination-btn' + (p === page ? ' is-active' : '');
      btn.textContent = p;
      btn.setAttribute('aria-label', p + 'ページ');
      if (p === page) btn.setAttribute('aria-current', 'page');
      btn.addEventListener('click', function () { renderTransferHistoryPage(p); });
      container.appendChild(btn);
    })(i);
  }

  var nextBtn = document.createElement('button');
  nextBtn.className = 'history-pagination-btn';
  nextBtn.textContent = '次へ >';
  nextBtn.disabled = (page >= totalPages || totalPages === 0);
  nextBtn.setAttribute('aria-label', '次のページ');
  nextBtn.addEventListener('click', function () { renderTransferHistoryPage(page + 1); });
  container.appendChild(nextBtn);
}

// 行クリックで開く明細モーダル（一覧に出していない 賞味期限・入庫日・移動者 を表示する）
function openTransferHistoryModal(rowData) {
  var head = document.getElementById('transferHistoryModalInfo');
  if (head) {
    head.innerHTML =
      '<span><strong>移動日時:</strong> '   + rowData.datetime + '</span>' +
      '<span><strong>商品コード:</strong> ' + rowData.itemCode + '</span>' +
      '<span><strong>商品名:</strong> '     + rowData.itemName + '</span>';
  }
  var body = document.getElementById('transferHistoryModalDl');
  if (body) {
    body.innerHTML =
      '<dt>賞味期限</dt><dd>' + (rowData.expiryDate || '‐') + '</dd>' +
      '<dt>入庫日</dt><dd>'   + (rowData.receivedAt || '‐') + '</dd>' +
      '<dt>移動者</dt><dd>'   + (rowData.operator   || '‐') + '</dd>';
  }
  openModal('transferHistoryModal');
}

function closeTransferHistoryModal() {
  closeModal('transferHistoryModal');
}

// === SCR-016 在庫調整 ===
// 「棚ロケ選択 → 棚ロケ別在庫一覧 → 行クリックでフォームへ転記 → 確認モーダル」の流れ。
// 構造は 017（棚ロケ移動登録）と同じ作りに合わせている。

// 棚ロケ別在庫のダミーデータ（shelfLocations の code に紐づく StockLot 相当）
var ADJUSTMENT_STOCK_DATA = [
  { location: 'A-01-01-1', itemCode: 'P-001', itemName: '商品A', lotNo: 'LOT-001', expiryDate: '2026/12/31', receivedAt: '2026/05/10', qty: 100, unit: 'パレット', note: '' },
  { location: 'A-01-01-1', itemCode: 'P-001', itemName: '商品A', lotNo: 'LOT-002', expiryDate: '2027/01/31', receivedAt: '2026/06/02', qty: 80,  unit: 'パレット', note: '' },
  { location: 'A-01-01-1', itemCode: 'P-002', itemName: '商品B', lotNo: 'LOT-003', expiryDate: '',           receivedAt: '2026/06/15', qty: 60,  unit: 'ケース',   note: '外装に汚れあり' },
  { location: 'A-01-01-2', itemCode: 'P-003', itemName: '商品C', lotNo: 'LOT-004', expiryDate: '2026/09/30', receivedAt: '2026/04/20', qty: 300, unit: 'ピース',   note: '' },
  { location: 'A-01-01-2', itemCode: 'P-004', itemName: '商品D', lotNo: '',        expiryDate: '',           receivedAt: '2026/05/28', qty: 50,  unit: 'ボール',   note: '' },
  { location: 'A-01-02-1', itemCode: 'P-005', itemName: '商品E', lotNo: 'LOT-006', expiryDate: '2026/11/15', receivedAt: '2026/06/01', qty: 80,  unit: 'ケース',   note: '' },
  { location: 'A-02-01-1', itemCode: 'P-006', itemName: '商品F', lotNo: 'LOT-007', expiryDate: '2027/03/31', receivedAt: '2026/03/12', qty: 200, unit: 'パレット', note: '' },
  { location: 'A-02-01-1', itemCode: 'P-007', itemName: '商品G', lotNo: 'LOT-008', expiryDate: '2026/08/31', receivedAt: '2026/07/01', qty: 250, unit: 'ピース',   note: '要冷蔵' },
  { location: 'B-01-01-1', itemCode: 'P-008', itemName: '商品H', lotNo: 'LOT-009', expiryDate: '',           receivedAt: '2026/02/18', qty: 70,  unit: '‐',       note: '' },
  { location: 'B-01-02-1', itemCode: 'P-009', itemName: '商品I', lotNo: 'LOT-010', expiryDate: '2026/10/10', receivedAt: '2026/06/22', qty: 90,  unit: 'ボール',   note: '' },
  { location: 'B-01-02-1', itemCode: 'P-010', itemName: '商品J', lotNo: 'LOT-011', expiryDate: '2026/09/05', receivedAt: '2026/07/08', qty: 110, unit: 'ピース',   note: '要冷蔵' }
  // ※ C-01-01-1 は在庫なし（「在庫がありません」表示の確認用）
];

var adjSelectedRow = null;
var adjSelectedTr  = null;

function initAdjustmentScreen() {
  populateAdjLocationSelect();
  renderAdjStockTable([]);
}

/** 棚ロケ select を shelfLocations から生成する */
function populateAdjLocationSelect() {
  var sel = document.getElementById('adjLocationSelect');
  if (!sel) return;
  sel.innerHTML = '<option value="">棚ロケを選択</option>';
  shelfLocations.forEach(function (s) {
    var opt = document.createElement('option');
    opt.value = s.code;
    opt.textContent = s.code;
    sel.appendChild(opt);
  });
}

/** 現在の棚ロケ + キーワードで絞り込んだ在庫行を返す */
function getAdjFilteredRows() {
  var sel = document.getElementById('adjLocationSelect');
  var kwEl = document.getElementById('adjKeyword');
  var location = sel ? sel.value : '';
  if (!location) return [];
  var kw = kwEl ? kwEl.value.trim().toLowerCase() : '';
  return ADJUSTMENT_STOCK_DATA.filter(function (row) {
    if (row.location !== location) return false;
    if (!kw) return true;
    return row.itemCode.toLowerCase().indexOf(kw) !== -1 ||
           row.itemName.toLowerCase().indexOf(kw) !== -1 ||
           row.lotNo.toLowerCase().indexOf(kw) !== -1;
  });
}

function onAdjLocationChange() {
  deselectAdjRow();
  renderAdjStockTable(getAdjFilteredRows());
}

function onAdjKeywordInput() {
  deselectAdjRow();
  renderAdjStockTable(getAdjFilteredRows());
}

function renderAdjStockTable(rows) {
  var tbody = document.getElementById('adjTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  var sel = document.getElementById('adjLocationSelect');
  var hasLocation = sel && sel.value;

  if (rows.length === 0) {
    var emptyRow = document.createElement('tr');
    var emptyCell = document.createElement('td');
    emptyCell.colSpan = 8;
    emptyCell.style.textAlign = 'center';
    emptyCell.style.padding = 'var(--ds-space-300)';
    emptyCell.textContent = hasLocation ? '在庫がありません' : '棚ロケを選択してください';
    emptyRow.appendChild(emptyCell);
    tbody.appendChild(emptyRow);
  } else {
    rows.forEach(function (row) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + row.itemCode + '</td>' +
        '<td>' + row.itemName + '</td>' +
        '<td>' + (row.lotNo || '‐') + '</td>' +
        '<td>' + (row.expiryDate || '‐') + '</td>' +
        '<td>' + row.receivedAt + '</td>' +
        '<td class="col-right">' + row.qty + '</td>' +
        '<td>' + row.unit + '</td>' +
        '<td>' + (row.note || '') + '</td>';
      tr.addEventListener('click', function () {
        if (adjSelectedTr === tr) {
          deselectAdjRow();
        } else {
          selectAdjRow(row, tr);
        }
      });
      tbody.appendChild(tr);
    });
  }

  var countEl = document.getElementById('adjTotalCount');
  if (countEl) countEl.textContent = hasLocation ? '全 ' + rows.length + ' 件' : '';
}

/** 行クリック: 調整フォームへ全項目を転記してフォームを有効化する */
function selectAdjRow(rowData, tr) {
  if (adjSelectedTr) adjSelectedTr.classList.remove('is-selected');
  adjSelectedRow = rowData;
  adjSelectedTr  = tr;
  tr.classList.add('is-selected');

  document.getElementById('adjLocation').value    = rowData.location;
  document.getElementById('adjItemCode').value    = rowData.itemCode;
  document.getElementById('adjItemName').value    = rowData.itemName;
  document.getElementById('adjUnitType').value    = rowData.unit;
  document.getElementById('adjLotNo').value       = rowData.lotNo || '';
  document.getElementById('adjExpiryDate').value  = rowData.expiryDate || '';
  document.getElementById('adjReceivedAt').value  = rowData.receivedAt;
  document.getElementById('adjCurrentQty').value  = rowData.qty;
  document.getElementById('adjQuantity').value    = '';
  document.getElementById('adjAfterQty').value    = '';
  document.getElementById('adjReason').value      = '';
  document.getElementById('adjSpecialNotes').value = '';
  document.getElementById('adjustmentForm').disabled = false;
  validateAdjustmentForm();
}

function deselectAdjRow() {
  if (adjSelectedTr) adjSelectedTr.classList.remove('is-selected');
  adjSelectedRow = null;
  adjSelectedTr  = null;
  var form = document.getElementById('adjustmentForm');
  if (!form) return;
  ['adjLocation', 'adjItemCode', 'adjItemName', 'adjUnitType', 'adjLotNo', 'adjExpiryDate',
   'adjReceivedAt', 'adjCurrentQty', 'adjQuantity', 'adjAfterQty', 'adjReason', 'adjSpecialNotes'
  ].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  form.disabled = true;
  var btn = document.getElementById('adjRegisterBtn');
  if (btn) btn.disabled = true;
}

function onAdjQuantityInput() {
  recalcAdjAfterQty();
  validateAdjustmentForm();
}

/** 調整後在庫数 = 現在庫数 + 調整数 */
function recalcAdjAfterQty() {
  var afterEl = document.getElementById('adjAfterQty');
  if (!afterEl) return;
  if (!adjSelectedRow) { afterEl.value = ''; return; }
  var delta = parseInt(document.getElementById('adjQuantity').value, 10);
  afterEl.value = isNaN(delta) ? '' : String(adjSelectedRow.qty + delta);
}

function validateAdjustmentForm() {
  var btn = document.getElementById('adjRegisterBtn');
  if (!btn) return;
  if (!adjSelectedRow) { btn.disabled = true; return; }
  var delta  = parseInt(document.getElementById('adjQuantity').value, 10);
  var reason = (document.getElementById('adjReason').value || '').trim();
  // 調整数は 0 不可・調整後在庫数は負不可
  var valid = !isNaN(delta) && delta !== 0 &&
              (adjSelectedRow.qty + delta) >= 0 &&
              reason !== '';
  btn.disabled = !valid;
}

function openAdjustmentModal() {
  if (!adjSelectedRow) return;
  var delta  = parseInt(document.getElementById('adjQuantity').value, 10);
  if (isNaN(delta) || delta === 0) return;
  var reason = document.getElementById('adjReason').value.trim();
  var notes  = document.getElementById('adjSpecialNotes').value.trim();

  var rows = [
    ['棚ロケ',       adjSelectedRow.location],
    ['商品コード',   adjSelectedRow.itemCode],
    ['商品名',       adjSelectedRow.itemName],
    ['単位区分',     adjSelectedRow.unit],
    ['ロット番号',   adjSelectedRow.lotNo || '‐'],
    ['賞味期限',     adjSelectedRow.expiryDate || '‐'],
    ['入庫日',       adjSelectedRow.receivedAt],
    ['現在庫数',     adjSelectedRow.qty + ' ' + adjSelectedRow.unit],
    ['調整数',       (delta > 0 ? '+' + delta : String(delta)) + ' ' + adjSelectedRow.unit],
    ['調整後在庫数', (adjSelectedRow.qty + delta) + ' ' + adjSelectedRow.unit],
    ['調整理由',     reason],
    ['特記事項',     notes || '‐']
  ];
  var html = '<dl class="transfer-confirm-dl">';
  rows.forEach(function (pair) {
    html += '<dt>' + pair[0] + '</dt><dd>' + pair[1] + '</dd>';
  });
  html += '</dl>';
  document.getElementById('adjustmentConfirmBody').innerHTML = html;
  document.getElementById('adjustmentModal').style.display = 'flex';
}

function confirmAdjustment() {
  document.getElementById('adjustmentModal').style.display = 'none';
  showAdjustmentFlash('在庫調整を登録しました');
  deselectAdjRow();
}

function showAdjustmentFlash(message) {
  var el = document.getElementById('adjustmentFlash');
  if (!el) return;
  el.textContent = message;
  el.style.display = 'flex';
  setTimeout(function () { el.style.display = 'none'; }, 3000);
}

// === 棚卸管理 (SCR-018) ===

var INVENTORY_DUMMY_DATA = [
  {
    location: 'A-01-01',
    items: [
      { itemCode: 'P-001', itemName: '商品A', lotNo: 'LOT-001', countQty: 98,  stockQty: 100, unit: 'パレット' },
      { itemCode: 'P-001', itemName: '商品A', lotNo: 'LOT-002', countQty: 80,  stockQty: 80,  unit: 'パレット' }
    ]
  },
  {
    location: 'A-01-02',
    items: [
      { itemCode: 'P-002', itemName: '商品B', lotNo: 'LOT-003', countQty: 60,  stockQty: 60,  unit: 'ケース' }
    ]
  },
  {
    location: 'A-02-01',
    items: [
      { itemCode: 'P-001', itemName: '商品A', lotNo: 'LOT-004', countQty: 125, stockQty: 120, unit: 'パレット' }
    ]
  },
  {
    location: 'A-02-02',
    items: [
      { itemCode: 'P-002', itemName: '商品B', lotNo: 'LOT-005', countQty: 45,  stockQty: 45,  unit: 'ケース' }
    ]
  },
  {
    location: 'B-01-01',
    items: [
      { itemCode: 'P-003', itemName: '商品C', lotNo: 'LOT-006', countQty: 290, stockQty: 300, unit: 'ピース' }
    ]
  },
  {
    location: 'B-01-02',
    items: [
      { itemCode: 'P-004', itemName: '商品D', lotNo: 'LOT-007', countQty: 50,  stockQty: 50,  unit: 'ボール' }
    ]
  },
  {
    location: 'B-02-01',
    items: [
      { itemCode: 'P-003', itemName: '商品C', lotNo: 'LOT-008', countQty: 153, stockQty: 150, unit: 'ピース' }
    ]
  },
  {
    location: 'B-02-02',
    items: [
      { itemCode: 'P-004', itemName: '商品D', lotNo: 'LOT-009', countQty: 30,  stockQty: 30,  unit: 'ボール' },
      { itemCode: 'P-005', itemName: '商品E', lotNo: 'LOT-010', countQty: 80,  stockQty: 80,  unit: 'ケース' }
    ]
  },
  {
    location: 'C-01-01',
    items: [
      { itemCode: 'P-006', itemName: '商品F', lotNo: 'LOT-011', countQty: 200, stockQty: 200, unit: 'パレット' }
    ]
  },
  {
    location: 'C-01-02',
    items: [
      { itemCode: 'P-005', itemName: '商品E', lotNo: 'LOT-012', countQty: 55,  stockQty: 60,  unit: 'ケース' }
    ]
  },
  {
    location: 'C-02-01',
    items: [
      { itemCode: 'P-006', itemName: '商品F', lotNo: 'LOT-013', countQty: 180, stockQty: 180, unit: 'パレット' }
    ]
  },
  {
    location: 'C-02-02',
    items: [
      { itemCode: 'P-005', itemName: '商品E', lotNo: 'LOT-014', countQty: 100, stockQty: 100, unit: 'ケース' }
    ]
  },
  {
    location: 'D-01-01',
    items: [
      { itemCode: 'P-009', itemName: '商品I', lotNo: 'LOT-016', countQty: 88,  stockQty: 90,  unit: 'ボール' }
    ]
  },
  {
    location: 'D-02-01',
    items: [
      { itemCode: 'P-007', itemName: '商品G', lotNo: 'LOT-018', countQty: 250, stockQty: 250, unit: 'ピース' }
    ]
  },
  {
    location: 'D-02-02',
    items: [
      { itemCode: 'P-008', itemName: '商品H', lotNo: 'LOT-019', countQty: 70,  stockQty: 70,  unit: String.fromCharCode(8212) }
    ]
  }
];

var inventoryLocations = [];
var inventoryExpanded = new Set();
var inventoryRefreshCount = 0;

function initInventory() {
  inventoryLocations = INVENTORY_DUMMY_DATA.map(function(d) {
    return { location: d.location, status: 'pending', checked: false, items: d.items };
  });
  inventoryExpanded = new Set();
  inventoryRefreshCount = 0;
}

function startInventory() {
  document.getElementById('inventoryGuide').style.display = 'none';
  document.getElementById('inventoryTableArea').style.display = '';
  document.getElementById('inventoryStartBtn').disabled = true;
  document.getElementById('inventoryRefreshBtn').disabled = false;
  document.getElementById('inventoryLastUpdated').textContent = inventoryFormatDatetime(new Date());
  renderInventoryTable();
}

function renderInventoryTable() {
  var tbody = document.getElementById('inventoryTableBody');
  if (!tbody) return;

  var html = '';
  inventoryLocations.forEach(function(loc) {
    var isExpanded   = inventoryExpanded.has(loc.location);
    var canCheck     = loc.status === 'done';
    var rowClass     = 'is-location-row' + (isExpanded ? ' is-expanded' : '');
    var cursor       = 'cursor: pointer;';

    html += '<tr class="' + rowClass + '" data-location="' + loc.location + '" style="' + cursor + '">';
    html += '<td style="text-align: center;" onclick="event.stopPropagation()">';
    html += '<input type="checkbox" class="inventory-checkbox"';
    html += (canCheck ? '' : ' disabled');
    html += (loc.checked ? ' checked' : '');
    html += ' data-location="' + loc.location + '">';
    html += '</td>';
    html += '<td>' + loc.location + '</td>';
    html += '<td>' + inventoryStatusBadge(loc.status) + '</td>';
    html += '<td>' + inventoryDiffBadge(loc) + '</td>';
    html += '</tr>';

    {
      var isPending = loc.status === 'pending';
      html += '<tr class="inventory-detail-row" data-detail-for="' + loc.location + '"';
      html += (isExpanded ? '' : ' style="display: none;"') + '>';
      html += '<td colspan="4"><div class="inventory-detail-inner">';
      html += '<table class="inventory-detail-table">';
      html += '<thead><tr>';
      html += '<th>商品コード</th><th>商品名</th><th>ロット番号</th>';
      html += '<th style="text-align: right;">棚卸数量</th>';
      html += '<th style="text-align: right;">現在在庫数</th>';
      html += '<th style="text-align: right;">差異</th>';
      html += '<th>単位区分</th>';
      html += '</tr></thead><tbody>';
      loc.items.forEach(function(item) {
        var dash = String.fromCharCode(8212);
        var countQtyCell, diffCell;
        if (isPending) {
          countQtyCell = dash;
          diffCell     = '<td style="text-align: right;">' + dash + '</td>';
        } else {
          var diff    = item.countQty - item.stockQty;
          var diffStr = diff > 0 ? '+' + diff : String(diff);
          var diffClass = diff !== 0 ? ' class="inventory-diff--warning"' : '';
          countQtyCell = item.countQty;
          diffCell     = '<td style="text-align: right;"' + diffClass + '>' + diffStr + '</td>';
        }
        html += '<tr>';
        html += '<td>' + item.itemCode + '</td>';
        html += '<td>' + item.itemName + '</td>';
        html += '<td>' + item.lotNo + '</td>';
        html += '<td style="text-align: right;">' + countQtyCell + '</td>';
        html += '<td style="text-align: right;">' + item.stockQty + '</td>';
        html += diffCell;
        html += '<td>' + item.unit + '</td>';
        html += '</tr>';
      });
      html += '</tbody></table></div></td></tr>';
    }
  });

  tbody.innerHTML = html;

  tbody.querySelectorAll('tr.is-location-row').forEach(function(tr) {
    tr.addEventListener('click', function(e) {
      if (e.target.type === 'checkbox') return;
      toggleInventoryDetail(tr.dataset.location);
    });
  });

  tbody.querySelectorAll('.inventory-checkbox').forEach(function(cb) {
    cb.addEventListener('change', function() {
      var loc = inventoryLocations.find(function(l) { return l.location === cb.dataset.location; });
      if (loc) loc.checked = cb.checked;
      validateInventoryApproveBtn();
    });
  });
}

function inventoryStatusBadge(status) {
  var map = {
    pending:     ['status-badge--subtle',      '未着手'],
    in_progress: ['status-badge--information', '進行中'],
    done:        ['status-badge--warning',     '完了'],
    approved:    ['status-badge--success',     '承認済み']
  };
  var entry = map[status] || map.pending;
  return '<span class="status-badge ' + entry[0] + '">' + entry[1] + '</span>';
}

function inventoryDiffBadge(loc) {
  if (loc.status !== 'done' && loc.status !== 'approved') return String.fromCharCode(8212);
  var hasDiff = loc.items.some(function(item) { return item.countQty !== item.stockQty; });
  if (hasDiff) return '<span class="status-badge status-badge--warning">⚠ 差異あり</span>';
  return '<span class="status-badge status-badge--subtle">差異なし</span>';
}

function toggleInventoryDetail(location) {
  var loc = inventoryLocations.find(function(l) { return l.location === location; });
  if (!loc) return;
  if (inventoryExpanded.has(location)) {
    inventoryExpanded.delete(location);
  } else {
    inventoryExpanded.add(location);
  }
  renderInventoryTable();
}

function refreshInventory() {
  inventoryRefreshCount++;
  inventoryAdvanceStatus();
  renderInventoryTable();
  validateInventoryApproveBtn();
  validateInventoryCompleteBtn();
  document.getElementById('inventoryLastUpdated').textContent = inventoryFormatDatetime(new Date());
}

function inventoryAdvanceStatus() {
  var groups = [
    { step: 1, locs: ['A-01-01', 'A-01-02', 'A-02-01', 'A-02-02'] },
    { step: 2, locs: ['B-01-01', 'B-01-02', 'B-02-01', 'B-02-02'] },
    { step: 3, locs: ['C-01-01', 'C-01-02', 'C-02-01', 'C-02-02'] },
    { step: 4, locs: ['D-01-01', 'D-02-01', 'D-02-02'] }
  ];
  groups.forEach(function(g) {
    g.locs.forEach(function(code) {
      var loc = inventoryLocations.find(function(l) { return l.location === code; });
      if (!loc || loc.status === 'approved') return;
      if (inventoryRefreshCount === g.step && loc.status === 'pending') {
        loc.status = 'in_progress';
      } else if (inventoryRefreshCount === g.step + 1 && loc.status === 'in_progress') {
        loc.status = 'done';
      } else if (inventoryRefreshCount > g.step + 1 && loc.status === 'pending') {
        loc.status = 'done';
      }
    });
  });
}

function approveSelected() {
  inventoryLocations.forEach(function(loc) {
    if (loc.checked) { loc.status = 'approved'; loc.checked = false; }
  });
  renderInventoryTable();
  validateInventoryApproveBtn();
  validateInventoryCompleteBtn();
}

function validateInventoryApproveBtn() {
  var has = inventoryLocations.some(function(loc) { return loc.checked; });
  document.getElementById('inventoryApproveBtn').disabled = !has;
}

function validateInventoryCompleteBtn() {
  var all = inventoryLocations.every(function(loc) { return loc.status === 'approved'; });
  document.getElementById('inventoryCompleteBtn').disabled = !all;
}

function completeInventory() {
  closeModal('inventoryCompleteModal');
  var flash = document.getElementById('inventoryFlash');
  flash.textContent = '棚卸が完了しました';
  flash.style.display = 'flex';
  setTimeout(function() { flash.style.display = 'none'; }, 3000);
  initInventory();
  document.getElementById('inventoryTableArea').style.display = 'none';
  document.getElementById('inventoryGuide').style.display = '';
  document.getElementById('inventoryStartBtn').disabled = false;
  document.getElementById('inventoryRefreshBtn').disabled = true;
  document.getElementById('inventoryApproveBtn').disabled = true;
  document.getElementById('inventoryCompleteBtn').disabled = true;
  document.getElementById('inventoryLastUpdated').textContent = String.fromCharCode(8212);
}

function inventoryFormatDatetime(date) {
  var pad = function(n) { return String(n).padStart(2, '0'); };
  return date.getFullYear() + '/' + pad(date.getMonth() + 1) + '/' + pad(date.getDate()) +
    ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
}

if (document.getElementById('inventoryTableBody')) {
  initInventory();
}

/* ============================================================
   SCR-003: 取引先定義
   ============================================================ */

var supplierData = [
  { company: '株式会社山田商事',   kana: 'やまだしょうじ',        zip: '100-0001', address: '東京都千代田区千代田1-1-1',       tel: '03-1234-5678',  contact: '山田 太郎', hasConversion: true  },
  { company: '田中物産株式会社',   kana: 'たなかぶっさん',        zip: '530-0001', address: '大阪府大阪市北区梅田2-2-2',       tel: '06-2345-6789',  contact: '田中 花子', hasConversion: false },
  { company: '合同会社鈴木倉庫',   kana: 'すずきそうこ',          zip: '460-0001', address: '愛知県名古屋市中村区3-3-3',       tel: '052-345-6789',  contact: '',          hasConversion: false },
  { company: '佐藤運輸株式会社',   kana: 'さとううんゆ',          zip: '810-0001', address: '福岡県福岡市博多区4-4-4',         tel: '092-456-7890',  contact: '佐藤 次郎', hasConversion: false },
  { company: '高橋商店',           kana: 'たかはししょうてん',     zip: '060-0001', address: '北海道札幌市中央区5-5-5',         tel: '011-567-8901',  contact: '',          hasConversion: false },
  { company: '株式会社伊藤製作所', kana: 'いとうせいさくしょ',     zip: '980-0001', address: '宮城県仙台市青葉区6-6-6',         tel: '022-678-9012',  contact: '伊藤 美穂', hasConversion: false },
  { company: '渡辺食品株式会社',   kana: 'わたなべしょくひん',     zip: '220-0001', address: '神奈川県横浜市西区7-7-7',         tel: '045-789-0123',  contact: '渡辺 誠',   hasConversion: false },
  { company: '中村流通合同会社',   kana: 'なかむらりゅうつう',     zip: '380-0001', address: '長野県長野市8-8-8',               tel: '026-890-1234',  contact: '',          hasConversion: false },
  { company: '小林産業株式会社',   kana: 'こばやしさんぎょう',     zip: '600-0001', address: '京都府京都市下京区9-9-9',         tel: '075-901-2345',  contact: '小林 隆',   hasConversion: true  },
  { company: '加藤物流株式会社',   kana: 'かとうぶつりゅう',       zip: '380-0002', address: '長野県松本市1-1-2',               tel: '0263-12-3456',  contact: '加藤 律子', hasConversion: false },
  { company: '吉田商事株式会社',   kana: 'よしだしょうじ',         zip: '100-0002', address: '東京都千代田区丸の内1-2-3',       tel: '03-2345-6789',  contact: '',          hasConversion: false },
  { company: '山本運輸株式会社',   kana: 'やまもとうんゆ',         zip: '530-0002', address: '大阪府大阪市中央区2-3-4',         tel: '06-3456-7890',  contact: '山本 健一', hasConversion: false },
  { company: '松本倉庫株式会社',   kana: 'まつもとそうこ',         zip: '460-0002', address: '愛知県名古屋市東区3-4-5',         tel: '052-456-7890',  contact: '',          hasConversion: false },
  { company: '井上商店',           kana: 'いのうえしょうてん',     zip: '810-0002', address: '福岡県福岡市中央区4-5-6',         tel: '092-567-8901',  contact: '井上 涼子', hasConversion: false },
  { company: '木村製作所',         kana: 'きむらせいさくしょ',     zip: '060-0002', address: '北海道札幌市北区5-6-7',           tel: '011-678-9012',  contact: '',          hasConversion: false },
  { company: '林物産株式会社',     kana: 'はやしぶっさん',         zip: '980-0002', address: '宮城県仙台市宮城野区6-7-8',       tel: '022-789-0123',  contact: '林 正樹',   hasConversion: false },
  { company: '清水食品株式会社',   kana: 'しみずしょくひん',       zip: '220-0002', address: '神奈川県横浜市港北区7-8-9',       tel: '045-890-1234',  contact: '',          hasConversion: false },
  { company: '斎藤流通株式会社',   kana: 'さいとうりゅうつう',     zip: '380-0003', address: '長野県上田市8-9-10',              tel: '0268-23-4567',  contact: '斎藤 博',   hasConversion: false },
  { company: '山口産業株式会社',   kana: 'やまぐちさんぎょう',     zip: '750-0001', address: '山口県山口市1-2-3',               tel: '083-123-4567',  contact: '',          hasConversion: false },
  { company: '前田物流株式会社',   kana: 'まえだぶつりゅう',       zip: '690-0001', address: '島根県松江市2-3-4',               tel: '0852-23-4567',  contact: '前田 由美', hasConversion: true  },
  { company: '後藤商事株式会社',   kana: 'ごとうしょうじ',         zip: '450-0001', address: '愛知県名古屋市西区3-4-5',         tel: '052-567-8901',  contact: '',          hasConversion: false },
  { company: '長谷川運輸株式会社', kana: 'はせがわうんゆ',          zip: '330-0001', address: '埼玉県さいたま市大宮区4-5-6',     tel: '048-678-9012',  contact: '長谷川 徹', hasConversion: false },
  { company: '石川倉庫株式会社',   kana: 'いしかわそうこ',          zip: '920-0001', address: '石川県金沢市5-6-7',               tel: '076-789-0123',  contact: '',          hasConversion: false },
  { company: '橋本商店',           kana: 'はしもとしょうてん',     zip: '630-0001', address: '奈良県奈良市6-7-8',               tel: '0742-12-3456',  contact: '橋本 典子', hasConversion: false },
  { company: '村上製作所',         kana: 'むらかみせいさくしょ',   zip: '950-0001', address: '新潟県新潟市中央区7-8-9',         tel: '025-890-1234',  contact: '',          hasConversion: false }
];

var supplierCurrentPage = 1;
var supplierPageSize = 20;
var supplierFilteredData = supplierData.slice();

function renderSupplierPage(page) {
  var tbody = document.getElementById('supplierTableBody');
  if (!tbody) return;
  supplierCurrentPage = page;
  var start = (page - 1) * supplierPageSize;
  var rows = supplierFilteredData.slice(start, start + supplierPageSize);
  tbody.innerHTML = rows.map(function(s) {
    var convCell = s.hasConversion
      ? '<span class="body-s" style="margin-right:var(--ds-space-100);">あり</span><button type="button" class="btn-edit" onclick="openConversionModal(\'' + s.company.replace(/'/g, "\\'") + '\')" aria-label="' + s.company + 'の変換定義を編集">編集</button>'
      : '<span class="body-s text-subtle" style="margin-right:var(--ds-space-100);">なし</span><button type="button" class="btn btn-primary" style="height:1.5rem;font-size:0.75rem;padding:0 var(--ds-space-100);" onclick="openConversionModal(\'' + s.company.replace(/'/g, "\\'") + '\')" aria-label="' + s.company + 'の変換定義を登録">登録</button>';
    return '<tr>' +
      '<td>' + s.company + '</td>' +
      '<td>' + s.kana + '</td>' +
      '<td>〒' + s.zip + '</td>' +
      '<td>' + s.address + '</td>' +
      '<td>' + s.tel + '</td>' +
      '<td>' + (s.contact || '<span class="text-subtle">—</span>') + '</td>' +
      '<td style="white-space:nowrap;">' + convCell + '</td>' +
      '</tr>';
  }).join('');
  renderSupplierPagination();
}

function renderSupplierPagination() {
  var container = document.getElementById('paginationRow');
  if (!container) return;
  var totalPages = Math.ceil(supplierFilteredData.length / supplierPageSize);
  container.innerHTML = '';
  if (totalPages <= 1) return;

  var prevBtn = document.createElement('button');
  prevBtn.className = 'history-pagination-btn';
  prevBtn.textContent = '< 前へ';
  prevBtn.disabled = (supplierCurrentPage === 1);
  prevBtn.setAttribute('aria-label', '前のページ');
  prevBtn.addEventListener('click', function() { renderSupplierPage(supplierCurrentPage - 1); });
  container.appendChild(prevBtn);

  for (var i = 1; i <= totalPages; i++) {
    (function(p) {
      var btn = document.createElement('button');
      btn.className = 'history-pagination-btn' + (p === supplierCurrentPage ? ' is-active' : '');
      btn.textContent = p;
      btn.setAttribute('aria-label', p + 'ページ');
      if (p === supplierCurrentPage) btn.setAttribute('aria-current', 'page');
      btn.addEventListener('click', function() { renderSupplierPage(p); });
      container.appendChild(btn);
    })(i);
  }

  var nextBtn = document.createElement('button');
  nextBtn.className = 'history-pagination-btn';
  nextBtn.textContent = '次へ >';
  nextBtn.disabled = (supplierCurrentPage >= totalPages);
  nextBtn.setAttribute('aria-label', '次のページ');
  nextBtn.addEventListener('click', function() { renderSupplierPage(supplierCurrentPage + 1); });
  container.appendChild(nextBtn);
}

function searchSuppliers() {
  var keyword = (document.getElementById('supplierSearchInput').value || '').trim().toLowerCase();
  supplierFilteredData = keyword
    ? supplierData.filter(function(s) {
        return s.company.toLowerCase().indexOf(keyword) !== -1 ||
               s.kana.indexOf(keyword) !== -1 ||
               s.contact.toLowerCase().indexOf(keyword) !== -1;
      })
    : supplierData.slice();
  renderSupplierPage(1);
}

function uploadSupplierCsv() {
  var fileInput = document.getElementById('csvFileInput');
  var errorDiv  = document.getElementById('csvErrorMessage');
  var successDiv = document.getElementById('csvSuccessMessage');
  errorDiv.style.display = 'none';
  successDiv.style.display = 'none';
  if (!fileInput || !fileInput.files || !fileInput.files.length) {
    errorDiv.textContent = 'ファイルを選択してください。';
    errorDiv.style.display = '';
    return;
  }
  successDiv.textContent = '25件登録しました。';
  successDiv.style.display = '';
  setTimeout(function() { successDiv.style.display = 'none'; }, 4000);
}

function openConversionModal(companyName) {
  var title = document.getElementById('conversionModalTitle');
  if (title) title.textContent = '変換定義 — ' + companyName;
  var nameSpan = document.getElementById('convCsvSelectedName');
  if (nameSpan) nameSpan.textContent = 'ファイルを選択してください (.csv)';
  var fileInput = document.getElementById('convCsvFileInput');
  if (fileInput) fileInput.value = '';
  var errDiv = document.getElementById('convCsvErrorMessage');
  if (errDiv) { errDiv.style.display = 'none'; errDiv.textContent = ''; }
  document.getElementById('conversionModalOverlay').style.display = 'flex';
  document.getElementById('conversionModalOverlay').dataset.company = companyName;
}

function closeConversionModal() {
  document.getElementById('conversionModalOverlay').style.display = 'none';
}

function uploadConversionCsv() {
  var fileInput = document.getElementById('convCsvFileInput');
  var errDiv = document.getElementById('convCsvErrorMessage');
  errDiv.style.display = 'none';
  if (!fileInput || !fileInput.files || !fileInput.files.length) {
    errDiv.textContent = 'ファイルを選択してください。';
    errDiv.style.display = '';
    return;
  }
  var companyName = document.getElementById('conversionModalOverlay').dataset.company;
  var item = supplierData.find(function(s) { return s.company === companyName; });
  if (item) item.hasConversion = true;
  supplierFilteredData = supplierData.slice();
  renderSupplierPage(supplierCurrentPage);
  closeConversionModal();
}

if (document.getElementById('supplierTableBody')) {
  renderSupplierPage(1);
}

// === SCR-020 在庫調整履歴 ===
// 018（棚ロケ移動履歴）と同じ「日付範囲 + キーワード検索 → テーブル → ページネーション」構造。
// 加えて増減フィルタ（増加のみ／減少のみ）と、行クリックで開く詳細モーダルを持つ。

var ADJUSTMENT_HISTORY_DATA = [
  { datetime: '2026/05/19 16:20', location: 'A-01-01-1', itemCode: 'P-001', itemName: '商品A', lotNo: 'LOT-001', before: 100, delta: -5,  unit: 'パレット', reason: '破損のため廃棄', operator: '山田 太郎', expiryDate: '2026/12/31', receivedAt: '2026/05/10', note: '外装破損 3 箱' },
  { datetime: '2026/05/19 13:05', location: 'B-01-01-1', itemCode: 'P-003', itemName: '商品C', lotNo: 'LOT-006', before: 280, delta: 20,  unit: 'ピース',   reason: '棚卸差異',       operator: '佐藤 花子', expiryDate: '2026/09/30', receivedAt: '2026/04/20', note: '棚卸で実数超過を確認' },
  { datetime: '2026/05/18 17:40', location: 'C-02-01-1', itemCode: 'P-005', itemName: '商品E', lotNo: 'LOT-012', before: 80,  delta: -12, unit: 'ケース',   reason: '紛失',           operator: '鈴木 一郎', expiryDate: '2026/11/15', receivedAt: '2026/06/01', note: '所在不明のため減算' },
  { datetime: '2026/05/18 11:15', location: 'A-01-02-1', itemCode: 'P-002', itemName: '商品B', lotNo: 'LOT-003', before: 60,  delta: 10,  unit: 'ケース',   reason: '棚卸差異',       operator: '山田 太郎', expiryDate: '',           receivedAt: '2026/06/15', note: '' },
  { datetime: '2026/05/17 15:50', location: 'D-01-02-1', itemCode: 'P-010', itemName: '商品J', lotNo: 'LOT-017', before: 150, delta: -30, unit: 'ピース',   reason: '品質不良',       operator: '高橋 二郎', expiryDate: '2026/08/31', receivedAt: '2026/05/02', note: '要冷蔵品の温度逸脱' },
  { datetime: '2026/05/17 09:30', location: 'B-02-01-1', itemCode: 'P-003', itemName: '商品C', lotNo: 'LOT-008', before: 200, delta: 15,  unit: 'ピース',   reason: '入荷登録漏れ',   operator: '佐藤 花子', expiryDate: '2026/10/31', receivedAt: '2026/05/12', note: '' },
  { datetime: '2026/05/16 16:10', location: 'C-01-02-1', itemCode: 'P-006', itemName: '商品F', lotNo: 'LOT-011', before: 200, delta: -8,  unit: 'パレット', reason: '破損のため廃棄', operator: '鈴木 一郎', expiryDate: '2027/03/31', receivedAt: '2026/03/12', note: 'フォーク接触による破損' },
  { datetime: '2026/05/16 10:25', location: 'A-02-02-1', itemCode: 'P-002', itemName: '商品B', lotNo: 'LOT-005', before: 45,  delta: 5,   unit: 'ケース',   reason: '棚卸差異',       operator: '山田 太郎', expiryDate: '2026/12/15', receivedAt: '2026/04/28', note: '' },
  { datetime: '2026/05/15 17:00', location: 'D-03-01-1', itemCode: 'P-009', itemName: '商品I', lotNo: 'LOT-020', before: 70,  delta: -20, unit: 'ボール',   reason: '紛失',           operator: '高橋 二郎', expiryDate: '',           receivedAt: '2026/05/01', note: '' },
  { datetime: '2026/05/15 12:40', location: 'C-03-01-1', itemCode: 'P-005', itemName: '商品E', lotNo: 'LOT-014', before: 60,  delta: 25,  unit: 'ケース',   reason: '返品受入',       operator: '佐藤 花子', expiryDate: '2026/11/30', receivedAt: '2026/05/08', note: '得意先からの返品分' },
  { datetime: '2026/05/14 16:35', location: 'D-02-02-1', itemCode: 'P-008', itemName: '商品H', lotNo: 'LOT-019', before: 35,  delta: -35, unit: '‐',        reason: '賞味期限切れ廃棄', operator: '鈴木 一郎', expiryDate: '2026/05/14', receivedAt: '2026/02/20', note: '全数廃棄' },
  { datetime: '2026/05/14 10:05', location: 'B-01-02-1', itemCode: 'P-004', itemName: '商品D', lotNo: 'LOT-007', before: 50,  delta: 8,   unit: 'ボール',   reason: '棚卸差異',       operator: '山田 太郎', expiryDate: '',           receivedAt: '2026/05/28', note: '' },
  { datetime: '2026/05/13 15:55', location: 'A-02-01-1', itemCode: 'P-001', itemName: '商品A', lotNo: 'LOT-004', before: 120, delta: -10, unit: 'パレット', reason: '破損のため廃棄', operator: '高橋 二郎', expiryDate: '2027/01/31', receivedAt: '2026/06/02', note: '' },
  { datetime: '2026/05/13 09:50', location: 'C-02-02-1', itemCode: 'P-006', itemName: '商品F', lotNo: 'LOT-013', before: 90,  delta: 30,  unit: 'パレット', reason: '入荷登録漏れ',   operator: '佐藤 花子', expiryDate: '2027/02/28', receivedAt: '2026/05/06', note: '伝票 IN-2026-0506-003 分' },
  { datetime: '2026/05/12 16:45', location: 'D-04-02-1', itemCode: 'P-008', itemName: '商品H', lotNo: 'LOT-024', before: 15,  delta: -3,  unit: '‐',        reason: '品質不良',       operator: '鈴木 一郎', expiryDate: '2026/07/31', receivedAt: '2026/04/10', note: '' },
  { datetime: '2026/05/12 11:20', location: 'B-02-02-1', itemCode: 'P-004', itemName: '商品D', lotNo: 'LOT-009', before: 22,  delta: 12,  unit: 'ボール',   reason: '棚卸差異',       operator: '山田 太郎', expiryDate: '',           receivedAt: '2026/03/30', note: '' },
  { datetime: '2026/05/11 15:30', location: 'D-01-01-1', itemCode: 'P-009', itemName: '商品I', lotNo: 'LOT-016', before: 65,  delta: -15, unit: 'ボール',   reason: '紛失',           operator: '高橋 二郎', expiryDate: '',           receivedAt: '2026/04/18', note: '棚卸後に再調査予定' },
  { datetime: '2026/05/11 09:10', location: 'C-01-01-1', itemCode: 'P-005', itemName: '商品E', lotNo: 'LOT-010', before: 40,  delta: 18,  unit: 'ケース',   reason: '返品受入',       operator: '佐藤 花子', expiryDate: '2026/10/15', receivedAt: '2026/04/05', note: '' },
  { datetime: '2026/05/10 17:25', location: 'D-04-03-1', itemCode: 'P-010', itemName: '商品J', lotNo: 'LOT-025', before: 210, delta: -40, unit: 'ピース',   reason: '賞味期限切れ廃棄', operator: '鈴木 一郎', expiryDate: '2026/05/10', receivedAt: '2026/01/25', note: '要冷蔵' },
  { datetime: '2026/05/09 14:15', location: 'A-01-01-2', itemCode: 'P-001', itemName: '商品A', lotNo: 'LOT-002', before: 80,  delta: 6,   unit: 'パレット', reason: '棚卸差異',       operator: '山田 太郎', expiryDate: '2027/01/31', receivedAt: '2026/06/02', note: '' },
  { datetime: '2026/05/08 16:00', location: 'B-01-01-2', itemCode: 'P-003', itemName: '商品C', lotNo: 'LOT-006', before: 300, delta: -25, unit: 'ピース',   reason: '破損のため廃棄', operator: '高橋 二郎', expiryDate: '2026/09/30', receivedAt: '2026/04/20', note: 'パレット倒壊' },
  { datetime: '2026/05/07 13:35', location: 'C-03-02-1', itemCode: 'P-007', itemName: '商品G', lotNo: 'LOT-022', before: 250, delta: 50,  unit: 'ピース',   reason: '入荷登録漏れ',   operator: '佐藤 花子', expiryDate: '2026/08/31', receivedAt: '2026/07/01', note: '' },
];

var adjustmentHistoryFiltered    = ADJUSTMENT_HISTORY_DATA.slice();
var adjustmentHistoryCurrentPage = 1;
var ADJUSTMENT_HISTORY_PAGE_SIZE = 20;

function initAdjustmentHistoryTable() {
  if (!document.getElementById('adjustmentHistoryTableBody')) return;
  // 終了日のデフォルトは今日
  var dateTo = document.getElementById('adjustmentHistoryDateTo');
  if (dateTo && !dateTo.value) {
    var now = new Date();
    var mm  = ('0' + (now.getMonth() + 1)).slice(-2);
    var dd  = ('0' + now.getDate()).slice(-2);
    dateTo.value = now.getFullYear() + '-' + mm + '-' + dd;
  }
  filterAdjustmentHistory();
}

function filterAdjustmentHistory() {
  var startDate    = document.getElementById('adjustmentHistoryDateFrom').value;
  var endDate      = document.getElementById('adjustmentHistoryDateTo').value;
  var keyword      = document.getElementById('adjustmentHistoryKeyword').value.toLowerCase();
  var showIncrease = document.getElementById('adjustmentHistoryIncrease').checked;
  var showDecrease = document.getElementById('adjustmentHistoryDecrease').checked;

  adjustmentHistoryFiltered = ADJUSTMENT_HISTORY_DATA.filter(function (row) {
    if (startDate || endDate) {
      var rowDate = row.datetime.substring(0, 10).replace(/\//g, '-');
      if (startDate && rowDate < startDate) return false;
      if (endDate   && rowDate > endDate)   return false;
    }
    if (keyword) {
      var target = [row.itemCode, row.itemName, row.lotNo, row.location, row.reason]
        .join('\t').toLowerCase();
      if (target.indexOf(keyword) === -1) return false;
    }
    if (row.delta >= 0 && !showIncrease) return false;
    if (row.delta <  0 && !showDecrease) return false;
    return true;
  });

  renderAdjustmentHistoryPage(1);
}

// 増減量を符号付き文字列に整形する（+10 / -5）
function formatAdjustmentDelta(delta) {
  return (delta > 0 ? '+' : '') + delta;
}

function renderAdjustmentHistoryPage(page) {
  adjustmentHistoryCurrentPage = page;
  var start    = (page - 1) * ADJUSTMENT_HISTORY_PAGE_SIZE;
  var pageData = adjustmentHistoryFiltered.slice(start, start + ADJUSTMENT_HISTORY_PAGE_SIZE);

  var tbody = document.getElementById('adjustmentHistoryTableBody');
  tbody.innerHTML = '';

  if (pageData.length === 0) {
    var emptyRow  = document.createElement('tr');
    var emptyCell = document.createElement('td');
    emptyCell.colSpan = 11;
    emptyCell.style.textAlign = 'center';
    emptyCell.style.padding = 'var(--ds-space-300)';
    emptyCell.textContent = 'データがありません';
    emptyRow.appendChild(emptyCell);
    tbody.appendChild(emptyRow);
  } else {
    pageData.forEach(function (row) {
      var tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      var deltaClass = row.delta >= 0 ? 'quantity-positive' : 'quantity-negative';
      tr.innerHTML =
        '<td>' + row.datetime + '</td>' +
        '<td>' + row.location + '</td>' +
        '<td>' + row.itemCode + '</td>' +
        '<td>' + row.itemName + '</td>' +
        '<td>' + row.lotNo    + '</td>' +
        '<td style="text-align:right">' + row.before + '</td>' +
        '<td style="text-align:right" class="' + deltaClass + '">' + formatAdjustmentDelta(row.delta) + '</td>' +
        '<td style="text-align:right">' + (row.before + row.delta) + '</td>' +
        '<td>' + row.unit     + '</td>' +
        '<td>' + row.reason   + '</td>' +
        '<td>' + row.operator + '</td>';
      tr.addEventListener('click', function () { openAdjustmentHistoryModal(row); });
      tbody.appendChild(tr);
    });
  }

  updateAdjustmentHistoryTotalCount(adjustmentHistoryFiltered.length);
  renderAdjustmentHistoryPagination(adjustmentHistoryFiltered.length, page);
}

function updateAdjustmentHistoryTotalCount(count) {
  var el = document.getElementById('adjustmentHistoryTotalCount');
  if (el) el.textContent = '全 ' + count + ' 件';
}

function renderAdjustmentHistoryPagination(totalCount, page) {
  var totalPages = Math.ceil(totalCount / ADJUSTMENT_HISTORY_PAGE_SIZE);
  var container  = document.getElementById('adjustmentHistoryPagination');
  if (!container) return;
  container.innerHTML = '';

  var prevBtn = document.createElement('button');
  prevBtn.className = 'history-pagination-btn';
  prevBtn.textContent = '< 前へ';
  prevBtn.disabled = (page === 1);
  prevBtn.setAttribute('aria-label', '前のページ');
  prevBtn.addEventListener('click', function () { renderAdjustmentHistoryPage(page - 1); });
  container.appendChild(prevBtn);

  for (var i = 1; i <= totalPages; i++) {
    (function (p) {
      var btn = document.createElement('button');
      btn.className = 'history-pagination-btn' + (p === page ? ' is-active' : '');
      btn.textContent = p;
      btn.setAttribute('aria-label', p + 'ページ');
      if (p === page) btn.setAttribute('aria-current', 'page');
      btn.addEventListener('click', function () { renderAdjustmentHistoryPage(p); });
      container.appendChild(btn);
    })(i);
  }

  var nextBtn = document.createElement('button');
  nextBtn.className = 'history-pagination-btn';
  nextBtn.textContent = '次へ >';
  nextBtn.disabled = (page >= totalPages || totalPages === 0);
  nextBtn.setAttribute('aria-label', '次のページ');
  nextBtn.addEventListener('click', function () { renderAdjustmentHistoryPage(page + 1); });
  container.appendChild(nextBtn);
}

function openAdjustmentHistoryModal(rowData) {
  var head = document.getElementById('adjustmentHistoryModalInfo');
  if (head) {
    head.innerHTML =
      '<span><strong>調整日時:</strong> '   + rowData.datetime + '</span>' +
      '<span><strong>商品コード:</strong> ' + rowData.itemCode + '</span>' +
      '<span><strong>商品名:</strong> '     + rowData.itemName + '</span>';
  }
  var body = document.getElementById('adjustmentHistoryModalDl');
  if (body) {
    body.innerHTML =
      '<dt>賞味期限</dt><dd>' + (rowData.expiryDate || '‐') + '</dd>' +
      '<dt>入庫日</dt><dd>'   + (rowData.receivedAt || '‐') + '</dd>' +
      '<dt>特記事項</dt><dd>' + (rowData.note || '‐')       + '</dd>';
  }
  openModal('adjustmentHistoryModal');
}

function closeAdjustmentHistoryModal() {
  closeModal('adjustmentHistoryModal');
}

// === SCR-004 入荷予定一覧 ===
// 1つの入荷予定に複数商品が含まれるため、明細セルは行内で縦積みにしている。
// 検索は「検索」ボタン押下でキーワード + ステータスの絞り込みを行う（実画面のサーバー検索に相当）。

function filterInboundScheduleList() {
  var table = document.getElementById('inboundScheduleListTable');
  if (!table) return;
  var keyword = (document.getElementById('scheduleSearch') || {}).value || '';
  var q = keyword.toLowerCase().trim();
  var statuses = Array.from(document.querySelectorAll('.schedule-status-checkbox'))
    .filter(function (cb) { return cb.checked; })
    .map(function (cb) { return cb.value; });

  // 商品コード・商品名・入荷元を検索対象にする
  var SEARCH_INDICES = [2, 3, 4];
  var visibleCount = 0;
  table.querySelectorAll('tbody tr').forEach(function (row) {
    var cells = row.querySelectorAll('td');
    var statusMatch = statuses.indexOf(row.dataset.status) !== -1;
    var keywordMatch = !q || SEARCH_INDICES.some(function (i) {
      return cells[i] && cells[i].textContent.toLowerCase().includes(q);
    });
    var show = statusMatch && keywordMatch;
    row.style.display = show ? '' : 'none';
    if (show) visibleCount++;
  });

  var empty = document.getElementById('inboundScheduleListEmpty');
  if (empty) empty.style.display = visibleCount === 0 ? 'block' : 'none';
}

// === SCR-006 入荷確定 ===
// 仕様: 各明細に棚ロケを割り当てて入荷済みにする / 伝票単位で商品を増減してから確定する / 明細を取消する。
// メイン画面で編集できるのは棚ロケーションのみ。数量・ロット番号・賞味期限の変更、商品の増減、
// 1商品を複数の棚に分ける「棚分割」は編集モーダルで行う。

var INBOUND_CONFIRM_LOCATIONS = [
  'A-01-01', 'A-01-02', 'A-01-03',
  'B-02-01', 'B-02-02', 'B-02-03',
  'C-03-01', 'C-03-02',
  'D-04-01', 'D-04-02'
];

// 編集モーダルの対象伝票No
var inboundEditDocNo = null;
// 伝票ごとの「データベース登録内容」。編集モーダルの「伝票の内容に戻す」で使う
var inboundOriginalItems = {};

function initInboundConfirm() {
  captureInboundOriginalItems();
  refreshAllInboundGroupCheckboxes();
}

// 画面表示時の明細を伝票の登録内容として退避する。
// 棚分割・伝票外の行は伝票に無い行なので登録内容には含めない。
function captureInboundOriginalItems() {
  inboundOriginalItems = {};
  getInboundRows().forEach(function (r) {
    var o = readInboundRow(r);
    if (o.split || o.extra) return;
    if (!inboundOriginalItems[o.docNo]) inboundOriginalItems[o.docNo] = [];
    inboundOriginalItems[o.docNo].push(o);
  });
}

// 伝票グループ行（1入荷予定に1行）を取得する
function getInboundGroupRows() {
  var table = getInboundTable();
  if (!table) return [];
  return Array.from(table.querySelectorAll('tbody tr.schedule-order-row'));
}

function getInboundGroupRow(docNo) {
  return getInboundGroupRows().filter(function (r) { return r.dataset.docNo === docNo; })[0] || null;
}

function getInboundItemRows(docNo) {
  return getInboundRows().filter(function (r) { return r.dataset.docNo === docNo; });
}

// 伝票内のすべての商品が取消されているか（＝伝票削除と同じ状態）
function isInboundGroupCancelled(docNo) {
  var rows = getInboundItemRows(docNo);
  if (rows.length === 0) return false;
  return rows.every(function (r) { return r.classList.contains('schedule-row--cancelled'); });
}

// 取消されていない商品すべてに棚ロケが設定されていれば確定対象にできる。
// 全商品が取消された伝票（伝票削除）は棚ロケが不要なため、そのまま選択できる。
function isInboundGroupSelectable(docNo) {
  return getInboundItemRows(docNo)
    .filter(function (r) { return !r.classList.contains('schedule-row--cancelled'); })
    .every(function (r) {
      var select = r.querySelector('.schedule-location-select');
      return select && select.value;
    });
}

// 伝票の表示状態を更新する。
// ON/OFF は利用者の操作に任せ、ここでは選択できるかどうかだけを制御する。
function refreshInboundGroupCheckbox(docNo) {
  var groupRow = getInboundGroupRow(docNo);
  if (!groupRow) return;
  var cb = groupRow.querySelector('.row-checkbox');
  if (cb) {
    cb.disabled = !isInboundGroupSelectable(docNo);
    cb.title = cb.disabled ? '棚ロケーションが未選択の商品があります' : '';
    if (cb.disabled) cb.checked = false;
  }
  applyInboundGroupSelection(groupRow, !!(cb && cb.checked));
  // 全商品が取消された伝票は伝票セルにも取消線を出す（編集ボタンは有効のまま）
  var cancelled = isInboundGroupCancelled(docNo);
  groupRow.querySelectorAll('.slip-cell').forEach(function (cell) {
    cell.classList.toggle('slip-cell--cancelled', cancelled);
    // 選択できない伝票はクリックでも切り替わらないため、ホバーの見た目も出さない
    cell.classList.toggle('slip-cell--locked', !!(cb && cb.disabled));
  });
  updateInboundSelectAllState();
  refreshInboundConfirmButton();
}

// 確定ボタンは伝票が1件も選択されていないと押せない
function refreshInboundConfirmButton() {
  var btn = document.getElementById('inboundConfirmBtn');
  if (!btn) return;
  btn.disabled = getCheckedInboundDocNos().length === 0;
}

function refreshAllInboundGroupCheckboxes() {
  getInboundGroupRows().forEach(function (r) { refreshInboundGroupCheckbox(r.dataset.docNo); });
}

// 伝票行と配下の明細行に選択状態のハイライトを反映する
function applyInboundGroupSelection(groupRow, selected) {
  groupRow.classList.toggle('schedule-row--selected', selected);
  getInboundItemRows(groupRow.dataset.docNo).forEach(function (r) {
    r.classList.toggle('schedule-row--selected', selected);
  });
}

function onInboundGroupCheckboxChange(cb) {
  applyInboundGroupSelection(cb.closest('tr'), cb.checked);
  updateInboundSelectAllState();
  refreshInboundConfirmButton();
}

function updateInboundSelectAllState() {
  var selectAll = document.getElementById('selectAllRows');
  if (!selectAll) return;
  var checkboxes = getInboundGroupRows()
    .map(function (r) { return r.querySelector('.row-checkbox'); })
    .filter(function (cb) { return cb && !cb.disabled; });
  var checkedCount = checkboxes.filter(function (cb) { return cb.checked; }).length;
  selectAll.disabled = checkboxes.length === 0;
  selectAll.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
  selectAll.checked = checkboxes.length > 0 && checkedCount === checkboxes.length;
}

// 全選択: 棚ロケが揃っている伝票（チェックできる伝票）だけを対象にする
function onInboundSelectAllChange() {
  var selectAll = document.getElementById('selectAllRows');
  if (!selectAll) return;
  getInboundGroupRows().forEach(function (groupRow) {
    var cb = groupRow.querySelector('.row-checkbox');
    if (!cb || cb.disabled) return;
    cb.checked = selectAll.checked;
    applyInboundGroupSelection(groupRow, cb.checked);
  });
  updateInboundSelectAllState();
  refreshInboundConfirmButton();
}

// 棚ロケを変更したら、その伝票のチェックボックスを再判定する。
// 編集モーダルの行は伝票Noを持たないため、そのまま何もしない。
function onInboundLocationChange(select) {
  var row = select.closest('tr');
  if (row && row.dataset.docNo) refreshInboundGroupCheckbox(row.dataset.docNo);
}

function buildInboundLocationSelect(selected) {
  return '<select class="form-input schedule-location-select" onchange="onInboundLocationChange(this)" aria-label="棚ロケーション">' +
    '<option value="">—</option>' +
    INBOUND_CONFIRM_LOCATIONS.map(function (loc) {
      return '<option value="' + loc + '"' + (loc === selected ? ' selected' : '') + '>' + loc + '</option>';
    }).join('') +
    '</select>';
}

function getInboundTable() {
  return document.getElementById('inboundScheduleTable');
}

function getInboundRows() {
  var table = getInboundTable();
  if (!table) return [];
  return Array.from(table.querySelectorAll('tbody tr.schedule-item-row'));
}

// 行の値をオブジェクトに読み出す（棚ロケ以外は data 属性が正）
function readInboundRow(row) {
  return {
    docNo: row.dataset.docNo || '',
    itemCode: row.dataset.itemCode || '',
    itemName: row.dataset.itemName || '',
    unit: row.dataset.unit || '',
    supplier: row.dataset.supplier || '',
    scheduleDate: row.dataset.scheduleDate || '',
    location: (row.querySelector('.schedule-location-select') || {}).value || '',
    qty: row.dataset.qty || '',
    lotNo: row.dataset.lotNo || '',
    expiryDate: row.dataset.expiryDate || '',
    remarks: row.dataset.remarks || '',
    cancelled: row.classList.contains('schedule-row--cancelled'),
    split: row.classList.contains('schedule-row--split')
  };
}

function inboundJpDate(iso) {
  return iso ? iso.replace(/-/g, '/') : '‐';
}

// 行の HTML を生成する（編集モーダルの反映で使用）
function buildInboundRowHTML(o) {
  return '<td class="schedule-cell-center"><input type="checkbox" class="row-checkbox" onchange="onRowCheckboxChange(this)" aria-label="行選択"></td>' +
    // 伝票No・入荷元はグループ行に表示するため明細行では空にする
    '<td></td><td></td>' +
    '<td>' + o.itemCode + '</td>' +
    '<td class="schedule-item-name-cell">' + o.itemName +
      (o.split ? ' <span class="schedule-split-badge">棚分割</span>' : '') + '</td>' +
    '<td>' + buildInboundLocationSelect(o.location) + '</td>' +
    '<td class="schedule-cell-qty-unit">' +
            '<span class="schedule-qty-value">' + o.qty + '</span>' +
            '<span class="schedule-qty-unit-text">' + (o.unit || '') + '</span></td>' +
    '<td>' + (o.lotNo || '-') + '</td>' +
    '<td>' + inboundJpDate(o.expiryDate) + '</td>' +
    '<td>' + (o.remarks || '') + '</td>';
}

function createInboundRow(o) {
  var tr = document.createElement('tr');
  tr.className = 'schedule-item-row' + (o.split ? ' schedule-row--split' : '') +
    (o.cancelled ? ' schedule-row--cancelled' : '');
  tr.dataset.docNo = o.docNo;
  tr.dataset.itemCode = o.itemCode;
  tr.dataset.itemName = o.itemName;
  tr.dataset.unit = o.unit;
  tr.dataset.supplier = o.supplier;
  tr.dataset.scheduleDate = o.scheduleDate;
  tr.dataset.qty = o.qty;
  tr.dataset.lotNo = o.lotNo;
  tr.dataset.expiryDate = o.expiryDate;
  tr.dataset.remarks = o.remarks || '';
  tr.innerHTML = buildInboundRowHTML(o);
  // 取消行は一覧でも入力できない
  if (o.cancelled) {
    tr.querySelectorAll('select, input:not([type="checkbox"])').forEach(function (el) {
      el.disabled = true;
    });
  }
  return tr;
}

// --- 伝票単位の編集モーダル（商品の増減・棚分割を含む） ---

// 伝票グループ行の「編集」ボタンから、その伝票の明細を編集する
function openInboundEditModal(btn) {
  var row = btn.closest('tr');
  if (!row) return;
  var o = readInboundRow(row);
  inboundEditDocNo = o.docNo;
  document.getElementById('inboundEditDocNo').textContent = o.docNo;
  document.getElementById('inboundEditSupplier').textContent = o.supplier;
  document.getElementById('inboundEditSchedule').textContent = inboundJpDate(o.scheduleDate);
  renderInboundEditItems(getInboundRows()
    .filter(function (r) { return r.dataset.docNo === inboundEditDocNo; })
    .map(readInboundRow));
  openModal('inboundEditModal');
}

// 商品マスタ（モックアップ用）。編集モーダルの商品 select に使う
var INBOUND_ITEM_MASTER = [
  { code: 'P-10001', name: '電動ドリル 18V', unit: '台' },
  { code: 'P-10002', name: '充電バッテリーパック', unit: '個' },
  { code: 'P-20031', name: 'スチールラック 180cm', unit: '台' },
  { code: 'P-30055', name: '作業用手袋 Lサイズ', unit: '双' },
  { code: 'P-40012', name: '安全ヘルメット 白', unit: '個' },
  { code: 'P-50023', name: '防塵マスク 10枚入', unit: '箱' },
  { code: 'P-60011', name: 'パレット 1100×1100', unit: '枚' },
  { code: 'P-60012', name: 'パレット 800×1200', unit: '枚' },
  { code: 'P-70034', name: '台車 折りたたみ式', unit: '台' },
  { code: 'P-80021', name: '結束バンド 100本入', unit: '袋' },
  { code: 'P-90005', name: '緩衝材 ロール', unit: '本' },
  { code: 'P-90010', name: '段ボール箱 Mサイズ', unit: '枚' },
  { code: 'P-A0001', name: '国産サバ缶', unit: 'ケース' },
  { code: 'P-A0002', name: '冷凍エビフライ', unit: 'ケース' }
];

function findInboundItem(code) {
  return INBOUND_ITEM_MASTER.filter(function (i) { return i.code === code; })[0] || null;
}

// 商品コード / 商品名 の形式で 1 つの select にまとめる（単位区分は数量列に表示するため含めない）
function buildInboundItemSelect(selectedCode) {
  return '<select class="form-input inbound-edit-item" onchange="onInboundEditItemChange(this)" aria-label="商品">' +
    '<option value="">選択</option>' +
    INBOUND_ITEM_MASTER.map(function (i) {
      return '<option value="' + i.code + '"' + (i.code === selectedCode ? ' selected' : '') + '>' +
        i.code + ' / ' + i.name + '</option>';
    }).join('') +
    '</select>';
}

// 商品を選び直したら単位区分の表示も追従させる
function onInboundEditItemChange(select) {
  var row = select.closest('tr');
  var item = findInboundItem(select.value);
  row.dataset.unit = item ? item.unit : '';
  var unitText = row.querySelector('.inbound-edit-unit-text');
  if (unitText) unitText.textContent = item ? item.unit : '';
  refreshInboundEditSplitFlags();
  refreshInboundEditRowStates();
}

/**
 * 明細行の操作ボタン。
 * 伝票に登録されている行は「取消」（記録を残す）、
 * 棚分割・商品を追加で足した行は「削除」（記録を残さない）。
 */
function buildInboundEditRowActions(o) {
  var splitBtn = '<button type="button" class="btn btn-default inbound-edit-split-btn"' +
    ' onclick="splitInboundEditItem(this)" aria-label="棚を分割して行を追加">棚分割</button>';
  if (o.split || o.extra) {
    return splitBtn +
      '<button type="button" class="btn btn-danger" onclick="deleteInboundEditItem(this)">削除</button>';
  }
  return splitBtn +
    '<button type="button" class="btn ' + (o.cancelled ? 'btn-default' : 'btn-danger') + ' inbound-edit-cancel-btn"' +
    ' onclick="toggleInboundEditCancel(this)">' + (o.cancelled ? '取消解除' : '取消') + '</button>';
}

function buildInboundEditRowHTML(o) {
  // メイン画面のテーブルと同じ項目を、編集可能な入力として並べる
  return '<td>' +
      '<div class="inbound-edit-item-cell">' +
        // 棚分割行はアイコンを商品 select の左に並べる（行の高さを増やさない）
        (o.split ? '<svg class="flag-icon flag-icon--split" viewBox="0 0 24 24" role="img" aria-label="棚分割で追加した行"><circle cx="12" cy="12" r="11"/><path d="M6.5 6.5V12H17.5" /><path d="M14.5 9L17.5 12L14.5 15" /></svg>' : '') +
        buildInboundItemSelect(o.itemCode) +
      '</div>' +
    '</td>' +
    '<td>' + buildInboundLocationSelect(o.location) + '</td>' +
    '<td>' +
      '<div class="inbound-edit-qty-cell">' +
        '<input type="number" class="form-input schedule-qty-input" value="' + o.qty + '" min="1" oninput="refreshInboundEditRowStates()" aria-label="数量">' +
        '<span class="inbound-edit-unit-text">' + (o.unit || '') + '</span>' +
      '</div>' +
    '</td>' +
    '<td><input type="text" class="form-input schedule-lot-input" value="' + o.lotNo + '" placeholder="ロット番号" aria-label="ロット番号"></td>' +
    '<td><input type="date" class="form-input schedule-expiry-input" value="' + o.expiryDate + '" aria-label="賞味期限"></td>' +
    '<td><input type="text" class="form-input inbound-edit-remarks" value="' + (o.remarks || '') + '" placeholder="特記事項" aria-label="特記事項"></td>' +
    '<td class="schedule-cell-actions">' + buildInboundEditRowActions(o) + '</td>';
}

function createInboundEditRow(o) {
  var tr = document.createElement('tr');
  tr.dataset.split = o.split ? '1' : '';
  tr.dataset.cancelled = o.cancelled ? '1' : '';
  // 単位区分は編集対象ではないため data 属性で持ち回す
  tr.dataset.unit = o.unit || '';
  tr.innerHTML = buildInboundEditRowHTML(o);
  if (o.cancelled) tr.classList.add('schedule-row--cancelled');
  applyInboundEditRowDisabled(tr);
  return tr;
}

// 取消行は入力させない（操作ボタンだけ残す）
function applyInboundEditRowDisabled(tr) {
  var cancelled = tr.dataset.cancelled === '1';
  tr.querySelectorAll('select, input').forEach(function (el) { el.disabled = cancelled; });
  var splitBtn = tr.querySelector('.inbound-edit-split-btn');
  if (splitBtn) splitBtn.disabled = cancelled;
}

// モーダル1行分の入力値を読み出す
function readInboundEditRow(tr) {
  var code = tr.querySelector('.inbound-edit-item').value;
  var item = findInboundItem(code);
  return {
    itemCode: code,
    itemName: item ? item.name : '',
    unit: item ? item.unit : (tr.dataset.unit || ''),
    location: tr.querySelector('.schedule-location-select').value,
    qty: tr.querySelector('.schedule-qty-input').value,
    lotNo: tr.querySelector('.schedule-lot-input').value,
    expiryDate: tr.querySelector('.schedule-expiry-input').value,
    remarks: tr.querySelector('.inbound-edit-remarks').value,
    split: tr.dataset.split === '1',
    cancelled: tr.dataset.cancelled === '1'
  };
}

function renderInboundEditItems(items) {
  var tbody = document.getElementById('inboundEditItemList');
  if (!tbody) return;
  tbody.innerHTML = '';
  items.forEach(function (o) { tbody.appendChild(createInboundEditRow(o)); });
  refreshInboundEditSplitFlags();
  refreshInboundEditRowStates();
}

function addInboundEditItem() {
  var tbody = document.getElementById('inboundEditItemList');
  if (!tbody) return;
  tbody.appendChild(createInboundEditRow({
    itemCode: '', itemName: '', unit: '', location: '', qty: '', lotNo: '', expiryDate: '', remarks: ''
  }));
  refreshInboundEditSplitFlags();
  refreshInboundEditRowStates();
}

// 1つの商品を2つ以上の棚に分ける: 同じ商品の行をモーダル内に追加する
function splitInboundEditItem(btn) {
  var row = btn.closest('tr');
  var base = readInboundEditRow(row);
  // 追加行は棚ロケーション・数量とも未入力にし、分け方は利用者に入力させる
  base.location = '';
  base.qty = '';
  base.split = true;
  base.cancelled = false;
  row.after(createInboundEditRow(base));
  refreshInboundEditSplitFlags();
  refreshInboundEditRowStates();
}

/**
 * 棚分割アイコンの整理。
 * アイコンは「棚分割」ボタンで追加した行にのみ付ける（付与は splitInboundEditItem が行う）。
 * ここでは「直前の行が同じ商品でなくなった」＝分割元を失った行の印だけを消す。
 * （行数で判定すると、「商品を追加」で同じ商品を別途足した場合に印が残ってしまう）
 */
function refreshInboundEditSplitFlags() {
  var rows = Array.from(document.querySelectorAll('#inboundEditItemList tr'));
  var codeOf = function (tr) {
    return tr ? ((tr.querySelector('.inbound-edit-item') || {}).value || '') : '';
  };
  rows.forEach(function (tr, i) {
    var icon = tr.querySelector('.flag-icon--split');
    if (!icon && tr.dataset.split !== '1') return;
    var code = codeOf(tr);
    var prevCode = i > 0 ? codeOf(rows[i - 1]) : '';
    if (code && code === prevCode) return;
    tr.dataset.split = '';
    if (icon) icon.remove();
  });
}

function deleteInboundEditItem(btn) {
  btn.closest('tr').remove();
  refreshInboundEditSplitFlags();
  refreshInboundEditRowStates();
}

function getInboundEditRows() {
  return Array.from(document.querySelectorAll('#inboundEditItemList tr'));
}

/**
 * 明細の取消／取消解除。
 * データベースへの反映は確定ボタン押下時にまとめて行うため、ここでは確認を挟まない。
 */
function toggleInboundEditCancel(btn) {
  var tr = btn.closest('tr');
  tr.dataset.cancelled = tr.dataset.cancelled === '1' ? '' : '1';
  var cancelled = tr.dataset.cancelled === '1';
  tr.classList.toggle('schedule-row--cancelled', cancelled);
  btn.textContent = cancelled ? '取消解除' : '取消';
  btn.classList.toggle('btn-danger', !cancelled);
  btn.classList.toggle('btn-default', cancelled);
  applyInboundEditRowDisabled(tr);
  refreshInboundEditRowStates();
}

/**
 * 伝票削除。伝票に登録されている行は取消状態にし、
 * 棚分割・商品を追加で足した行は削除する（登録されていないため記録が要らない）。
 */
function deleteInboundEditSlip() {
  getInboundEditRows().forEach(function (tr) {
    if (tr.dataset.split === '1' || tr.dataset.extra === '1') {
      tr.remove();
      return;
    }
    if (tr.dataset.cancelled !== '1') {
      var btn = tr.querySelector('.inbound-edit-cancel-btn');
      if (btn) toggleInboundEditCancel(btn);
    }
  });
  refreshInboundEditSplitFlags();
  refreshInboundEditRowStates();
}

// 編集内容を捨てて、伝票のデータベース登録内容（棚ロケーションを含む）に戻す
function restoreInboundEditSlip() {
  var items = inboundOriginalItems[inboundEditDocNo] || [];
  renderInboundEditItems(items.map(function (o) {
    var copy = {};
    Object.keys(o).forEach(function (k) { copy[k] = o[k]; });
    return copy;
  }));
}

/**
 * 行の状態をまとめて再評価する。
 * - 棚分割の元行は、分割行が残っている間は取消できない（元だけ取消すと分割行の扱いが決まらないため）
 * - 商品または数量が未入力の行があると「この内容で反映する」を押せない
 */
function refreshInboundEditRowStates() {
  var rows = getInboundEditRows();
  var codeOf = function (tr) {
    return tr ? ((tr.querySelector('.inbound-edit-item') || {}).value || '') : '';
  };

  rows.forEach(function (tr, i) {
    var cancelBtn = tr.querySelector('.inbound-edit-cancel-btn');
    if (!cancelBtn) return;
    var next = rows[i + 1];
    var hasSplitChild = !!next && next.dataset.split === '1' && codeOf(next) === codeOf(tr) && codeOf(tr) !== '';
    cancelBtn.disabled = hasSplitChild && tr.dataset.cancelled !== '1';
    cancelBtn.title = cancelBtn.disabled ? '棚分割した行を削除すると取消できます' : '';
  });

  var invalid = rows.some(function (tr) {
    if (tr.dataset.cancelled === '1') return false;
    var code = codeOf(tr);
    var qty = (tr.querySelector('.schedule-qty-input') || {}).value || '';
    return !code || !(Number(qty) > 0);
  });
  var applyBtn = document.getElementById('inboundEditApplyBtn');
  if (applyBtn) applyBtn.disabled = invalid;
  // 表示・非表示でモーダルの高さが変わらないよう、領域は確保したまま可視性だけ切り替える
  var hint = document.getElementById('inboundEditApplyHint');
  if (hint) hint.style.visibility = invalid ? 'visible' : 'hidden';
}

function applyInboundEditModal() {
  var table = getInboundTable();
  if (!table || !inboundEditDocNo) return;
  var targetRows = getInboundRows().filter(function (r) { return r.dataset.docNo === inboundEditDocNo; });
  if (targetRows.length === 0) return;

  var head = targetRows[0];
  // 直前の要素は伝票グループ行なので、その後ろに新しい明細行を挿入する
  var anchor = head.previousElementSibling;
  var tbody = head.parentNode;
  var meta = readInboundRow(head);

  var edited = Array.from(document.querySelectorAll('#inboundEditItemList tr')).map(function (tr) {
    var o = readInboundEditRow(tr);
    o.docNo = inboundEditDocNo;
    o.supplier = meta.supplier;
    o.scheduleDate = meta.scheduleDate;
    return o;
  });

  targetRows.forEach(function (r) { r.remove(); });
  var frag = document.createDocumentFragment();
  edited.forEach(function (o) { frag.appendChild(createInboundRow(o)); });
  if (anchor && anchor.parentNode === tbody) {
    anchor.after(frag);
  } else {
    tbody.insertBefore(frag, tbody.firstChild);
  }

  var editedDocNo = inboundEditDocNo;
  inboundEditDocNo = null;
  closeModal('inboundEditModal');
  refreshInboundGroupCheckbox(editedDocNo);
  showInboundConfirmFlash('編集内容を反映しました。内容を確認して「確定」してください。');
}

// --- 確定（確認モーダル） ---

function getCheckedInboundDocNos() {
  return getInboundGroupRows()
    .filter(function (r) {
      var cb = r.querySelector('.row-checkbox');
      return cb && cb.checked;
    })
    .map(function (r) { return r.dataset.docNo; });
}

// 全商品が取消された伝票は「伝票削除」として扱う（その明細は取消件数に数えない）
function getInboundDeletedDocNos(docNos) {
  return docNos.filter(isInboundGroupCancelled);
}

function openInboundConfirmModal() {
  var docNos = getCheckedInboundDocNos();
  var deletedDocNos = getInboundDeletedDocNos(docNos);
  var rows = getInboundRows()
    .map(readInboundRow)
    .filter(function (o) { return docNos.indexOf(o.docNo) !== -1; });
  // チェックされた伝票の明細のうち、取消されていないものが入荷済みの対象になる
  var targets = rows.filter(function (o) { return !o.cancelled; });
  // 削除する伝票の明細も「取消する明細」に並べる（件数には数えない）
  var cancelled = rows.filter(function (o) { return o.cancelled; });

  var dateInput = document.getElementById('scheduleDate');
  document.getElementById('inboundConfirmDate').textContent =
    dateInput && dateInput.value ? dateInput.value.replace(/-/g, '/') : '‐';
  document.getElementById('inboundConfirmTargetCount').textContent =
    (docNos.length - deletedDocNos.length) + ' 伝票';
  document.getElementById('inboundConfirmDeleteCount').textContent = deletedDocNos.length + ' 伝票';

  // 幅を節約するため 1 明細 1 行で並べる（例: 鈴木商店　冷凍エビフライ x 43箱　A-0-5）
  var itemCells = function (o) {
    return '<span>' + o.supplier + '</span>' +
      '<span>' + o.itemName + ' x ' + o.qty + (o.unit || '') + '</span>';
  };
  // 先頭の見出し行は残したまま明細を差し替える
  var setList = function (id, html) {
    var ul = document.getElementById(id);
    if (!ul) return;
    var head = ul.querySelector('.inbound-confirm-list-head');
    ul.innerHTML = (head ? head.outerHTML : '') + html;
  };
  setList('inboundConfirmItemList', targets.map(function (o) {
    return '<li class="modal-item-list-row">' + itemCells(o) +
      '<span>' + (o.location || '未選択') + '</span></li>';
  }).join(''));

  setList('inboundConfirmCancelList', cancelled.map(function (o) {
    return '<li class="modal-item-list-row">' + itemCells(o) + '</li>';
  }).join(''));
  // 取消が無いときは見出しごと隠す（通常はこちらの状態）
  var cancelSection = document.getElementById('inboundConfirmCancelSection');
  if (cancelSection) cancelSection.style.display = cancelled.length ? '' : 'none';

  var err = document.getElementById('inboundConfirmError');
  var submitBtn = document.querySelector('#inboundConfirmModal .ds-modal-footer .btn-primary');
  // 確定ボタンは未選択時に押せないため、ここに来るのは選択済みのときだけ（保険）
  var message = docNos.length === 0
    ? '確定する伝票が選択されていません。伝票のチェックボックスで選択してください。'
    : '';
  err.textContent = message;
  err.style.display = message ? 'block' : 'none';
  if (submitBtn) submitBtn.disabled = !!message;
  openModal('inboundConfirmModal');
}

function submitInboundConfirm() {
  var docNos = getCheckedInboundDocNos();
  var deletedDocNos = getInboundDeletedDocNos(docNos);
  var rows = getInboundRows().filter(function (r) { return docNos.indexOf(r.dataset.docNo) !== -1; });
  var targetCount = rows.filter(function (r) {
    return !r.classList.contains('schedule-row--cancelled');
  }).length;
  var cancelCount = rows.filter(function (r) {
    return r.classList.contains('schedule-row--cancelled') &&
      deletedDocNos.indexOf(r.dataset.docNo) === -1;
  }).length;
  closeModal('inboundConfirmModal');
  showInboundConfirmFlash(
    (docNos.length - deletedDocNos.length) + ' 伝票 / 入荷済み ' + targetCount + ' 件 / 取消 ' + cancelCount + ' 件' +
    (deletedDocNos.length ? ' / 伝票削除 ' + deletedDocNos.length + ' 伝票' : '') + 'を登録しました。'
  );
}

function showInboundConfirmFlash(message) {
  var el = document.getElementById('inboundConfirmFlash');
  if (!el) return;
  el.textContent = message;
  el.style.display = 'flex';
  setTimeout(function () { el.style.display = 'none'; }, 3000);
}
