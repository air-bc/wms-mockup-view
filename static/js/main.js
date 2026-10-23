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

// === SCR-007 入荷登録 ===
// 入荷予定登録の React 版（ScheduleCreateView）と同じ構成に、明細の「棚ロケーション」列を加えたもの

// INBOUND_ITEM_MASTER は後方（入荷確定）で別データに再定義されるため、専用の名前で持つ
var INBOUND_REGISTER_ITEM_MASTER = [
  { code: 'P-001', name: '商品A', unit: 'パレット' },
  { code: 'P-002', name: '商品B', unit: 'ケース' },
  { code: 'P-003', name: '商品C', unit: 'ボール' },
  { code: 'P-004', name: '商品D', unit: 'ピース' },
  { code: 'P-005', name: '商品E', unit: 'パレット' },
];

function inboundRegisterItemLabel(item) {
  return item.code + ' / ' + item.name + '（' + item.unit + '）';
}

function createInboundRegisterRowHTML() {
  var itemOptions = INBOUND_REGISTER_ITEM_MASTER.map(function (item) {
    return '<option value="' + item.code + '">' + inboundRegisterItemLabel(item) + '</option>';
  }).join('');
  var locationOptions = shelfLocations.map(function (s) {
    return '<option value="' + s.code + '">' + s.code + '</option>';
  }).join('');
  return '<div class="item-row">' +
    '<select name="item[]" class="form-input" aria-label="商品" required>' +
      '<option value="">選択</option>' + itemOptions +
    '</select>' +
    '<input type="number" name="quantity[]" class="form-input" min="1" aria-label="数量" required>' +
    '<input type="text" name="lotNo[]" class="form-input" aria-label="ロット番号">' +
    '<input type="date" name="expiryDate[]" class="form-input" aria-label="賞味期限">' +
    '<select name="location[]" class="form-input" aria-label="棚ロケーション" required>' +
      '<option value="">選択</option>' + locationOptions +
    '</select>' +
    '<input type="text" name="itemNote[]" class="form-input" aria-label="特記事項">' +
    '<button type="button" class="btn btn-icon-subtle" onclick="deleteInboundRegisterRow(this)" aria-label="この行を削除">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>' +
    '</button>' +
  '</div>';
}

function addInboundRegisterRow() {
  var container = document.getElementById('inboundRegisterItemRows');
  if (!container) return;
  var div = document.createElement('div');
  div.innerHTML = createInboundRegisterRowHTML();
  container.appendChild(div.firstChild);
  var btn = document.getElementById('addInboundRegisterRowBtn');
  if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// 最後の1行は削除せず入力内容をクリアする（React 版の handleRemoveRow と同じ挙動）
function deleteInboundRegisterRow(btn) {
  var container = document.getElementById('inboundRegisterItemRows');
  var row = btn.closest('.item-row');
  if (container.querySelectorAll('.item-row').length <= 1) {
    row.querySelectorAll('input, select').forEach(function (el) { el.value = ''; });
    return;
  }
  row.remove();
}

function initInboundRegister() {
  var dateEl = document.getElementById('inboundDate');
  if (dateEl) {
    dateEl.value = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date());
  }
  var sel = document.getElementById('supplier');
  if (sel && typeof supplierData !== 'undefined') {
    supplierData.forEach(function (s) {
      var opt = document.createElement('option');
      opt.value = s.company;
      opt.textContent = s.company;
      sel.appendChild(opt);
    });
  }
  addInboundRegisterRow();
}

function openInboundRegisterConfirmModal() {
  var valueOf = function (id) {
    var el = document.getElementById(id);
    return el && el.value ? el.value : '-';
  };
  document.getElementById('inboundRegisterConfirmDate').textContent = valueOf('inboundDate');
  document.getElementById('inboundRegisterConfirmSlipNo').textContent = valueOf('slipNo');
  document.getElementById('inboundRegisterConfirmSupplier').textContent = valueOf('supplier');

  var rows = document.querySelectorAll('#inboundRegisterItemRows .item-row');
  var html = Array.prototype.map.call(rows, function (row) {
    var code = row.querySelector('[name="item[]"]').value;
    var item = INBOUND_REGISTER_ITEM_MASTER.filter(function (i) { return i.code === code; })[0];
    var qty = row.querySelector('[name="quantity[]"]').value || '-';
    var location = row.querySelector('[name="location[]"]').value || '未選択';
    return '<li class="modal-item-list-row">' +
      '<span>' + (item ? item.code + ' / ' + item.name : '商品') + '</span>' +
      '<span>' + qty + (item ? item.unit : '') + '</span>' +
      '<span>' + location + '</span>' +
    '</li>';
  }).join('');

  // 先頭の見出し行は残したまま明細を差し替える
  var ul = document.getElementById('inboundRegisterConfirmItemList');
  var head = ul.querySelector('.inbound-confirm-list-head');
  ul.innerHTML = (head ? head.outerHTML : '') + html;
  openModal('inboundRegisterConfirmModal');
}

// 登録後は自分自身へ戻る（React 版では入力内容を初期状態に戻す）
function submitInboundRegister() {
  window.location.href = '007_inbound_register.html';
}

// supplierData は後方で定義されるため、読み込み完了後に初期化する
if (document.getElementById('inboundRegisterForm')) {
  document.addEventListener('DOMContentLoaded', initInboundRegister);
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
// currentQuantity は「その引き当ての直前の在庫数」。画面の残在庫数はここから引当数を引いて求める。
// expiryOffsetDays は賞味期限（表示日からの日数）。明細でロット番号・賞味期限を指定しているときは、それと揃える
function allocationStock(locationCode, allocatedQuantity, currentQuantity, lotNumber, expiryOffsetDays) {
  return {
    location_code: locationCode,
    lot_number: lotNumber || 'LOT-00001',
    expiry_date: allocationDateString(expiryOffsetDays === undefined ? 120 : expiryOffsetDays),
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
    // 1つの明細が3つの棚ロケに分割して引き当てられたケース。
    // 開始日を翌日にしたときだけ、在庫不足（NG）に差し替える（applyAllocatedShortageDummy を参照）
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
            allocationStock('B-02-01-1', 50, 50, 'LOT-00012', 200),
            allocationStock('B-02-01-2', 40, 40, 'LOT-00012', 200),
            allocationStock('B-02-03-1', 30, 90, 'LOT-00012', 200)
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
          allocated_stocks: [allocationStock('C-02-01-1', 15, 45, 'LOT-00030', 60)]
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

// モックアップの裏仕様: 開始日を翌日にして「引き当て実行」すると、引き当て済みの ORD-20260901-002 を
// 在庫不足（NG）にする。引き当て後に在庫が減り、シミュレーションで不足が判明したケースの確認用。
// 120 のうち、2つの棚ロケから 90 しか確保できない（不足 30）
function applyAllocatedShortageDummy(results, startDate) {
  if (startDate !== allocationDateString(1)) return results;
  results.forEach(function (schedule) {
    if (schedule.schedule_id !== 102) return;
    var item = schedule.items[0];
    item.allocated_stocks = item.allocated_stocks.slice(0, 2);
    item.result = false;
    item.shortage_quantity = 30;
    schedule.result = false;
  });
  return results;
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
  // 引き当て済みの伝票がシミュレーションで NG になったことを知らせるトースト。
  // 「引き当て実行」を押し直したときに前回の分を消すため、要素を持っておく
  allocatedFailureToast: null,
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
    allocationState.results = applyAllocatedShortageDummy(buildAllocationDummyResults(), startDate);
    updateAllocationUpdatedAt();
    // 絞り込みを切り替えることがあるため、描画より先に呼ぶ
    notifyAllocatedFailures();
    renderAllocationSections();
  }, 300);
}

// 引き当て済みの伝票がシミュレーションで NG になっていたら、トーストで知らせる。
// 伝票が複数あっても1つのトーストにまとめ、× で閉じるまで消さない（対処が必要なため）。
// 前回の「引き当て実行」で出したトーストは、結果が古くなるため消してから出し直す。
// NG の伝票をすぐ確認できるよう、ステータスの絞り込みを「引き当て済み」だけに切り替える
function notifyAllocatedFailures() {
  if (allocationState.allocatedFailureToast) {
    allocationState.allocatedFailureToast.remove();
    allocationState.allocatedFailureToast = null;
  }

  var failedOrderNumbers = allocationState.results
    .filter(function (s) { return s.status === 'allocated' && !s.result; })
    .map(function (s) { return s.order_number; });
  if (failedOrderNumbers.length === 0) return;

  allocationState.allocatedFailureToast = showToast(
    'error',
    '引き当て済みの受注No. ' + failedOrderNumbers.join('、') + ' の在庫不足が判明しました。' +
      '出荷確定画面で数量を調整するか、伝票を削除して出荷予定登録からやり直してください。',
    0
  );
  setAllocationStatusFilters({ allocated: true, draft: false });
}

// ステータスの絞り込みを、画面のチェックボックスとあわせて切り替える
function setAllocationStatusFilters(filters) {
  allocationState.statusFilters = filters;
  Object.keys(filters).forEach(function (key) {
    var checkbox = document.querySelector('[data-allocation-status="' + key + '"]');
    if (checkbox) checkbox.checked = filters[key];
  });
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
// 列はすべて右に寄せ、左端の空き列（.allocation-detail-spacer）で余った幅を吸収する。
// 列は「出荷予定の登録時の情報（元の要求）」と「引き当て結果」の2グループに分ける。
// 引き当て済みの伝票も、引き当て結果はシミュレーション結果を表示するため、元の要求と並べて比べられるようにする
function allocationDetailHtml(schedule) {
  var html = '' +
    '<div class="allocation-detail-inner allocation-detail-inner--stock">' +
      '<div class="allocation-detail-header allocation-detail-header--stock allocation-detail-header--group">' +
        '<span class="allocation-detail-spacer" aria-hidden="true"></span>' +
        // 元の要求の列は見出しを付けず、引き当て結果の列だけにグループ名を付ける（列位置を揃えるため空のセルは残す）
        '<span class="allocation-detail-group allocation-detail-group--request"></span>' +
        '<span class="allocation-detail-group allocation-detail-group--result">引き当て結果</span>' +
      '</div>' +
      '<div class="allocation-detail-header allocation-detail-header--stock">' +
        '<span class="allocation-detail-spacer" aria-hidden="true"></span>' +
        '<span>商品コード</span>' +
        '<span>商品名</span>' +
        '<span>ロット番号</span>' +
        '<span>賞味期限</span>' +
        '<span class="text-right">数量</span>' +
        '<span class="allocation-detail-group-start">棚ロケ</span>' +
        '<span>ロット番号</span>' +
        '<span>賞味期限</span>' +
        '<span class="text-right">引当数</span>' +
        '<span class="text-right">残在庫数</span>' +
        '<span class="text-center">結果</span>' +
      '</div>';

  schedule.items.forEach(function (item) {
    html += '<div class="allocation-detail-item allocation-detail-item--stock' +
      (item.result ? '' : ' allocation-detail-item--ng-boundary') + '">' +
      '<span class="allocation-detail-spacer" aria-hidden="true"></span>' +
      '<span>' + allocationEscape(item.item_code) + '</span>' +
      '<span>' + allocationEscape(item.item_name) + '</span>' +
      '<span>' + allocationEscape(item.lot_number || ALLOCATION_EMPTY_MARK) + '</span>' +
      '<span>' + (item.expiry_date ? allocationFormatDate(item.expiry_date) : ALLOCATION_EMPTY_MARK) + '</span>' +
      '<span class="text-right">' + item.quantity + '</span>' +
      allocationStockLinesHtml(item.allocated_stocks, function (s) { return s.location_code; }, 'allocation-detail-group-start') +
      allocationStockLinesHtml(item.allocated_stocks, function (s) { return s.lot_number || ALLOCATION_EMPTY_MARK; }) +
      allocationStockLinesHtml(item.allocated_stocks, function (s) {
        return s.expiry_date ? allocationFormatDate(s.expiry_date) : ALLOCATION_EMPTY_MARK;
      }) +
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
            // 出荷予定ブロックの「操作」は削除ボタンだけなので、引き当て表印刷ボタンより狭くする
            '<col class="allocation-col-print' + (block.deletable ? ' allocation-col-print--narrow' : '') + '">' +
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
          : '<button type="button" class="btn btn-default" onclick="event.stopPropagation(); printAllocationSheet()">引き当て表印刷</button>') +
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

// 引き当て表の印刷は未実装。本実装までは押したことだけをトーストで知らせる
function printAllocationSheet() {
  showToast('info', '引き当て表印刷は未実装です', 3000);
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
  // 呼び出し元があとから消せるよう、トーストの要素を返す
  return toast;
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
// 調整の種類をラジオで切り替える。
//   既存在庫の数量変更: 棚ロケ選択 → 「既存在庫選択」モーダルで在庫を選ぶ → 商品・入荷情報を補完して変更不可にする
//   新規在庫の追加    : 棚ロケ・商品・入荷情報を手入力する（現在在庫数は 0。入庫日の初期値は今日）
// 調整数を入れると調整後在庫数を自動計算し、確認モーダルを経て登録する。
// 新規在庫の追加で同じ在庫が既にあるときは、確認モーダルの代わりに重複警告モーダルを出し、既存在庫の数量変更へ切り替えさせる。

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
  // ※ C-01-01-1 は在庫なし（「既存在庫選択」が押せないことの確認用）
  // ※ 新規在庫の追加で A-01-01-1 / P-002 / LOT-003 / 賞味期限なし / 2026-06-15 を入力すると重複警告になる
];

// 商品プルダウン用の商品マスタ（ダミー）。P-011・P-012 は在庫なし（新規在庫の追加の確認用）
var ADJUSTMENT_ITEM_MASTER = [
  { itemCode: 'P-001', itemName: '商品A', unit: 'パレット' },
  { itemCode: 'P-002', itemName: '商品B', unit: 'ケース' },
  { itemCode: 'P-003', itemName: '商品C', unit: 'ピース' },
  { itemCode: 'P-004', itemName: '商品D', unit: 'ボール' },
  { itemCode: 'P-005', itemName: '商品E', unit: 'ケース' },
  { itemCode: 'P-006', itemName: '商品F', unit: 'パレット' },
  { itemCode: 'P-007', itemName: '商品G', unit: 'ピース' },
  { itemCode: 'P-008', itemName: '商品H', unit: '‐' },
  { itemCode: 'P-009', itemName: '商品I', unit: 'ボール' },
  { itemCode: 'P-010', itemName: '商品J', unit: 'ピース' },
  { itemCode: 'P-011', itemName: '商品K', unit: 'ケース' },
  { itemCode: 'P-012', itemName: '商品L', unit: 'ピース' }
];

// 既存在庫の数量変更では、選んだ在庫の値を表示するだけで変更させない項目
var ADJ_STOCK_KEY_FIELD_IDS = ['adjItem', 'adjLotNo', 'adjExpiryDate', 'adjReceivedAt'];
// 既存在庫の数量変更では、在庫を選ぶまで入力させない項目
var ADJ_INPUT_FIELD_IDS = ['adjQuantity', 'adjReason', 'adjSpecialNotes'];

var adjMode = 'existing';     // 'existing' | 'new'
var adjSelectedRow = null;    // 既存在庫の数量変更で選んだ在庫（ADJUSTMENT_STOCK_DATA の要素）
var adjDuplicateRow = null;   // 新規在庫の追加で重複した在庫（重複警告モーダルの表示中のみ）

function initAdjustmentScreen() {
  populateAdjLocationSelect();
  populateAdjItemSelect();

  document.querySelectorAll('input[name="adjMode"]').forEach(function (radio) {
    radio.addEventListener('change', onAdjModeChange);
  });
  document.getElementById('adjLocation').addEventListener('change', renderAdjFormState);
  document.getElementById('adjItem').addEventListener('change', renderAdjFormState);
  ['adjLotNo', 'adjExpiryDate', 'adjReceivedAt', 'adjReason'].forEach(function (id) {
    document.getElementById(id).addEventListener('input', validateAdjustmentForm);
  });
  document.getElementById('adjQuantity').addEventListener('input', function () {
    refreshAdjQty();
    validateAdjustmentForm();
  });
  document.getElementById('adjStockPickBtn').addEventListener('click', openAdjStockPickModal);
  // 「クリア」は棚ロケも含めて入力内容をすべて消し、初期状態に戻す
  document.getElementById('adjStockClearBtn').addEventListener('click', resetAdjForm);
  document.getElementById('adjStockPickCancel').addEventListener('click', function () {
    closeModal('adjStockPickModal');
  });
  document.getElementById('adjRegisterBtn').addEventListener('click', onAdjRegisterClick);
  document.getElementById('adjDuplicateCancel').addEventListener('click', function () {
    adjDuplicateRow = null;
    closeModal('adjDuplicateModal');
  });
  document.getElementById('adjDuplicateSwitch').addEventListener('click', switchAdjToExistingFromDuplicate);
  document.getElementById('adjustmentConfirmOk').addEventListener('click', confirmAdjustment);
  document.getElementById('adjustmentConfirmCancel').addEventListener('click', function () {
    closeModal('adjustmentModal');
  });

  resetAdjForm();
}

/** 棚ロケ select を shelfLocations から生成する */
function populateAdjLocationSelect() {
  var sel = document.getElementById('adjLocation');
  sel.innerHTML = '<option value="">棚ロケを選択</option>';
  shelfLocations.forEach(function (s) {
    var opt = document.createElement('option');
    opt.value = s.code;
    opt.textContent = s.code;
    sel.appendChild(opt);
  });
}

/** 商品 select を「商品コード / 商品名（単位区分）」の形式で生成する（入荷予定登録と同じ表示） */
function populateAdjItemSelect() {
  var sel = document.getElementById('adjItem');
  sel.innerHTML = '<option value="">商品を選択</option>';
  ADJUSTMENT_ITEM_MASTER.forEach(function (item) {
    var opt = document.createElement('option');
    opt.value = item.itemCode;
    opt.textContent = formatAdjItem(item);
    sel.appendChild(opt);
  });
}

function formatAdjItem(item) {
  return item.itemCode + ' / ' + item.itemName + '（' + item.unit + '）';
}

function findAdjItem(itemCode) {
  return ADJUSTMENT_ITEM_MASTER.find(function (item) { return item.itemCode === itemCode; }) || null;
}

function getAdjLocationStocks(location) {
  if (!location) return [];
  return ADJUSTMENT_STOCK_DATA.filter(function (row) { return row.location === location; });
}

/** ダミーデータの「2026/05/10」を date input の「2026-05-10」に変換する */
function toAdjInputDate(value) {
  return value ? value.replace(/\//g, '-') : '';
}

/** date input の値を画面表示用の「2026/05/10」に変換する */
function formatAdjDate(value) {
  return value ? value.replace(/-/g, '/') : '‐';
}

function todayAdjInputDate() {
  var d = new Date();
  var mm = String(d.getMonth() + 1).padStart(2, '0');
  var dd = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + mm + '-' + dd;
}

function onAdjModeChange(e) {
  adjMode = e.target.value;
  resetAdjForm();
}

/** 入力内容をすべてクリアする。新規在庫の追加では入庫日に今日を入れる */
function resetAdjForm() {
  adjSelectedRow = null;
  ['adjLocation', 'adjItem', 'adjLotNo', 'adjExpiryDate', 'adjReceivedAt',
   'adjQuantity', 'adjReason', 'adjSpecialNotes'
  ].forEach(function (id) {
    document.getElementById(id).value = '';
  });
  if (adjMode === 'new') {
    document.getElementById('adjReceivedAt').value = todayAdjInputDate();
  }
  renderAdjFormState();
}

/** 調整の種類・在庫の選択状況に合わせて、入力可否・ボタン・数量表示を更新する */
function renderAdjFormState() {
  var isExisting = adjMode === 'existing';
  var hasSelection = adjSelectedRow !== null;
  var location = document.getElementById('adjLocation').value;
  var stocks = getAdjLocationStocks(location);

  // 棚ロケは、既存在庫を選んでいる間だけ変更不可（変えるには「クリア」する）
  document.getElementById('adjLocation').disabled = isExisting && hasSelection;
  ADJ_STOCK_KEY_FIELD_IDS.forEach(function (id) {
    document.getElementById(id).disabled = isExisting;
  });
  ADJ_INPUT_FIELD_IDS.forEach(function (id) {
    document.getElementById(id).disabled = isExisting && !hasSelection;
  });

  // 「既存在庫選択」は棚ロケに在庫があるときだけ押せる
  var pickBtn = document.getElementById('adjStockPickBtn');
  pickBtn.hidden = !isExisting;
  pickBtn.disabled = stocks.length === 0;
  document.getElementById('adjStockClearBtn').hidden = !(isExisting && hasSelection);

  refreshAdjQty();
  validateAdjustmentForm();
}

/** 現在在庫数。既存在庫の数量変更で在庫を選んでいなければ null */
function getAdjCurrentQty() {
  if (adjMode === 'new') return 0;
  return adjSelectedRow ? adjSelectedRow.qty : null;
}

function getAdjUnit() {
  if (adjMode === 'existing') return adjSelectedRow ? adjSelectedRow.unit : '';
  var item = findAdjItem(document.getElementById('adjItem').value);
  return item ? item.unit : '';
}

/** 調整後在庫数 = 現在在庫数 + 調整数 を計算して表示する */
function refreshAdjQty() {
  var current = getAdjCurrentQty();
  var delta = parseInt(document.getElementById('adjQuantity').value, 10);
  var after = (current === null || isNaN(delta)) ? null : current + delta;
  var isNegative = after !== null && after < 0;

  document.getElementById('adjCurrentQty').textContent = current === null ? '‐' : String(current);
  document.getElementById('adjAfterQty').textContent = after === null ? '‐' : String(after);
  document.getElementById('adjAfterBox').classList.toggle('is-invalid', isNegative);
  document.getElementById('adjQtyError').hidden = !isNegative;

  // 単位区分が未確定（在庫・商品が未選択）のときは空にし、数値が中央からずれないよう要素ごと隠す
  var unit = getAdjUnit();
  document.querySelectorAll('.adj-qty-unit').forEach(function (el) {
    el.textContent = unit;
    el.hidden = unit === '';
  });
}

function validateAdjustmentForm() {
  var current = getAdjCurrentQty();
  var delta = parseInt(document.getElementById('adjQuantity').value, 10);
  var location = document.getElementById('adjLocation').value;
  var itemCode = document.getElementById('adjItem').value;
  var receivedAt = document.getElementById('adjReceivedAt').value;
  var reason = document.getElementById('adjReason').value.trim();
  // 調整数は 0 不可・調整後在庫数は負不可（新規在庫の追加は現在在庫数が 0 のため、正の数のみになる）
  var valid = current !== null && location !== '' && itemCode !== '' && receivedAt !== '' &&
              !isNaN(delta) && delta !== 0 && current + delta >= 0 &&
              reason !== '';
  document.getElementById('adjRegisterBtn').disabled = !valid;
}

/** 既存在庫選択モーダル: 選んだ棚ロケの在庫一覧を表示する */
function openAdjStockPickModal() {
  var location = document.getElementById('adjLocation').value;
  var stocks = getAdjLocationStocks(location);
  if (stocks.length === 0) return;

  document.getElementById('adjStockPickSummary').textContent = '棚ロケ ' + location + '：全 ' + stocks.length + ' 件';
  var tbody = document.getElementById('adjStockPickBody');
  tbody.innerHTML = '';
  stocks.forEach(function (row) {
    var tr = document.createElement('tr');
    if (row === adjSelectedRow) tr.classList.add('is-selected');
    [
      row.itemCode,
      row.itemName,
      row.lotNo || '‐',
      row.expiryDate || '‐',
      row.receivedAt,
      String(row.qty),
      row.unit,
      row.note || ''
    ].forEach(function (value, i) {
      var td = document.createElement('td');
      if (i === 5) td.className = 'col-right';
      td.textContent = value;
      tr.appendChild(td);
    });
    tr.addEventListener('click', function () {
      selectAdjStock(row);
      closeModal('adjStockPickModal');
    });
    tbody.appendChild(tr);
  });
  openModal('adjStockPickModal');
}

/** 選んだ在庫で商品・入荷情報を補完する。調整数・調整理由・特記事項はクリアする */
function selectAdjStock(row) {
  adjSelectedRow = row;
  document.getElementById('adjItem').value       = row.itemCode;
  document.getElementById('adjLotNo').value      = row.lotNo || '';
  document.getElementById('adjExpiryDate').value = toAdjInputDate(row.expiryDate);
  document.getElementById('adjReceivedAt').value = toAdjInputDate(row.receivedAt);
  ADJ_INPUT_FIELD_IDS.forEach(function (id) {
    document.getElementById(id).value = '';
  });
  renderAdjFormState();
}

/** 「登録する」: 新規在庫の追加で同じ在庫が既にあれば重複警告、なければ確認モーダルを出す */
function onAdjRegisterClick() {
  if (adjMode === 'new') {
    var duplicate = findAdjDuplicateStock();
    if (duplicate) {
      openAdjDuplicateModal(duplicate);
      return;
    }
  }
  openAdjustmentModal();
}

/** 棚ロケ・商品・ロット番号・賞味期限・入庫日がすべて一致する在庫を返す。
 *  ロット番号の空文字・賞味期限の未入力も「指定なし」ではなく値として比較する */
function findAdjDuplicateStock() {
  var location   = document.getElementById('adjLocation').value;
  var itemCode   = document.getElementById('adjItem').value;
  var lotNo      = document.getElementById('adjLotNo').value.trim();
  var expiryDate = document.getElementById('adjExpiryDate').value;
  var receivedAt = document.getElementById('adjReceivedAt').value;
  return ADJUSTMENT_STOCK_DATA.find(function (row) {
    return row.location === location &&
           row.itemCode === itemCode &&
           (row.lotNo || '') === lotNo &&
           toAdjInputDate(row.expiryDate) === expiryDate &&
           toAdjInputDate(row.receivedAt) === receivedAt;
  }) || null;
}

/** 重複警告モーダル: 重複した在庫の内容を表示する */
function openAdjDuplicateModal(row) {
  adjDuplicateRow = row;
  var item = findAdjItem(row.itemCode);
  var rows = [
    ['棚ロケ',     row.location],
    ['商品',       item ? formatAdjItem(item) : row.itemCode + ' / ' + row.itemName],
    ['ロット番号', row.lotNo || '‐'],
    ['賞味期限',   row.expiryDate || '‐'],
    ['入庫日',     row.receivedAt],
    ['現在在庫数', row.qty + ' ' + row.unit]
  ];
  renderAdjConfirmRows('adjDuplicateBody', rows);
  openModal('adjDuplicateModal');
}

/** 重複した在庫を選んだ状態で既存在庫の数量変更に切り替える。調整数・調整理由・特記事項は引き継ぐ
 *  （新規の調整数は正の数のため、既存在庫ではそのまま加算になる） */
function switchAdjToExistingFromDuplicate() {
  var row = adjDuplicateRow;
  if (!row) return;
  var kept = {};
  ADJ_INPUT_FIELD_IDS.forEach(function (id) {
    kept[id] = document.getElementById(id).value;
  });

  // radio の checked を直接変えても change イベントは発火しないため、resetAdjForm() は走らない
  adjMode = 'existing';
  document.querySelector('input[name="adjMode"][value="existing"]').checked = true;
  document.getElementById('adjLocation').value = row.location;
  selectAdjStock(row);
  ADJ_INPUT_FIELD_IDS.forEach(function (id) {
    document.getElementById(id).value = kept[id];
  });
  renderAdjFormState();

  adjDuplicateRow = null;
  closeModal('adjDuplicateModal');
}

/** 確認項目の表（.modal-confirm-table）の行として、ラベル・値の組を並べる */
function renderAdjConfirmRows(tbodyId, rows) {
  var tbody = document.getElementById(tbodyId);
  tbody.innerHTML = '';
  rows.forEach(function (pair) {
    var tr = document.createElement('tr');
    var th = document.createElement('th');
    th.scope = 'row';
    th.textContent = pair[0];
    var td = document.createElement('td');
    td.textContent = pair[1];
    tr.appendChild(th);
    tr.appendChild(td);
    tbody.appendChild(tr);
  });
}

function openAdjustmentModal() {
  var current = getAdjCurrentQty();
  var delta = parseInt(document.getElementById('adjQuantity').value, 10);
  if (current === null || isNaN(delta) || delta === 0) return;
  var item = findAdjItem(document.getElementById('adjItem').value);
  var unit = getAdjUnit();
  var notes = document.getElementById('adjSpecialNotes').value.trim();

  var rows = [
    ['調整の種類',   adjMode === 'existing' ? '既存在庫の数量変更' : '新規在庫の追加'],
    ['棚ロケ',       document.getElementById('adjLocation').value],
    ['商品',         item ? formatAdjItem(item) : '‐'],
    ['ロット番号',   document.getElementById('adjLotNo').value.trim() || '‐'],
    ['賞味期限',     formatAdjDate(document.getElementById('adjExpiryDate').value)],
    ['入庫日',       formatAdjDate(document.getElementById('adjReceivedAt').value)],
    ['現在在庫数',   current + ' ' + unit],
    // 確認では増減を見誤らないよう符号を付ける
    ['調整数',       (delta > 0 ? '+' + delta : String(delta)) + ' ' + unit],
    ['調整後在庫数', (current + delta) + ' ' + unit],
    ['調整理由',     document.getElementById('adjReason').value.trim()],
    ['特記事項',     notes || '‐']
  ];
  renderAdjConfirmRows('adjustmentConfirmBody', rows);
  openModal('adjustmentModal');
}

function confirmAdjustment() {
  closeModal('adjustmentModal');
  showAdjustmentFlash('在庫調整を登録しました');
  resetAdjForm();
}

function showAdjustmentFlash(message) {
  var el = document.getElementById('adjustmentFlash');
  if (!el) return;
  el.textContent = message;
  el.style.display = 'flex';
  setTimeout(function () { el.style.display = 'none'; }, 3000);
}

/* ============================================================
   SCR-002 / SCR-003: 商品マスタ・取引先マスタ（一覧・登録・登録の確認）
   React 版（frontend/src/views/masters/）の画面を再現する
   ============================================================ */

// 取引先マスタのサンプルデータ。入荷予定登録・入荷登録の取引先の選択肢にも使う。
// inUse は入荷予定・出荷予定から参照されている取引先（削除不可）
var supplierData = [
  { company: '株式会社山田商事',   kana: 'やまだしょうじ',        zip: '1000001', address: '東京都千代田区千代田1-1-1',       tel: '0312345678',  contact: '山田 太郎', inUse: true  },
  { company: '田中物産株式会社',   kana: 'たなかぶっさん',        zip: '5300001', address: '大阪府大阪市北区梅田2-2-2',       tel: '0623456789',  contact: '田中 花子', inUse: true  },
  { company: '合同会社鈴木倉庫',   kana: 'すずきそうこ',          zip: '4600001', address: '愛知県名古屋市中村区3-3-3',       tel: '0523456789',  contact: '',          inUse: false },
  { company: '佐藤運輸株式会社',   kana: 'さとううんゆ',          zip: '8100001', address: '福岡県福岡市博多区4-4-4',         tel: '0924567890',  contact: '佐藤 次郎', inUse: false },
  { company: '高橋商店',           kana: 'たかはししょうてん',     zip: '0600001', address: '北海道札幌市中央区5-5-5',         tel: '0115678901',  contact: '',          inUse: false },
  { company: '株式会社伊藤製作所', kana: 'いとうせいさくしょ',     zip: '9800001', address: '宮城県仙台市青葉区6-6-6',         tel: '0226789012',  contact: '伊藤 美穂', inUse: false },
  { company: '渡辺食品株式会社',   kana: 'わたなべしょくひん',     zip: '2200001', address: '神奈川県横浜市西区7-7-7',         tel: '0457890123',  contact: '渡辺 誠',   inUse: false },
  { company: '中村流通合同会社',   kana: 'なかむらりゅうつう',     zip: '3800001', address: '長野県長野市8-8-8',               tel: '0268901234',  contact: '',          inUse: false },
  { company: '小林産業株式会社',   kana: 'こばやしさんぎょう',     zip: '6000001', address: '京都府京都市下京区9-9-9',         tel: '0759012345',  contact: '小林 隆',   inUse: true  },
  { company: '加藤物流株式会社',   kana: 'かとうぶつりゅう',       zip: '3800002', address: '長野県松本市1-1-2',               tel: '0263123456',  contact: '加藤 律子', inUse: false },
  { company: '吉田商事株式会社',   kana: 'よしだしょうじ',         zip: '1000002', address: '東京都千代田区丸の内1-2-3',       tel: '0323456789',  contact: '',          inUse: false },
  { company: '山本運輸株式会社',   kana: 'やまもとうんゆ',         zip: '5300002', address: '大阪府大阪市中央区2-3-4',         tel: '0634567890',  contact: '山本 健一', inUse: false },
  { company: '松本倉庫株式会社',   kana: 'まつもとそうこ',         zip: '4600002', address: '愛知県名古屋市東区3-4-5',         tel: '0524567890',  contact: '',          inUse: false },
  { company: '井上商店',           kana: 'いのうえしょうてん',     zip: '8100002', address: '福岡県福岡市中央区4-5-6',         tel: '0925678901',  contact: '井上 涼子', inUse: false },
  { company: '木村製作所',         kana: 'きむらせいさくしょ',     zip: '0600002', address: '北海道札幌市北区5-6-7',           tel: '0116789012',  contact: '',          inUse: false },
  { company: '林物産株式会社',     kana: 'はやしぶっさん',         zip: '9800002', address: '宮城県仙台市宮城野区6-7-8',       tel: '0227890123',  contact: '林 正樹',   inUse: false },
  { company: '清水食品株式会社',   kana: 'しみずしょくひん',       zip: '2200002', address: '神奈川県横浜市港北区7-8-9',       tel: '0458901234',  contact: '',          inUse: false },
  { company: '斎藤流通株式会社',   kana: 'さいとうりゅうつう',     zip: '3800003', address: '長野県上田市8-9-10',              tel: '0268234567',  contact: '斎藤 博',   inUse: false },
  { company: '山口産業株式会社',   kana: 'やまぐちさんぎょう',     zip: '7500001', address: '山口県山口市1-2-3',               tel: '0831234567',  contact: '',          inUse: false },
  { company: '前田物流株式会社',   kana: 'まえだぶつりゅう',       zip: '6900001', address: '島根県松江市2-3-4',               tel: '0852234567',  contact: '前田 由美', inUse: false },
  { company: '後藤商事株式会社',   kana: 'ごとうしょうじ',         zip: '4500001', address: '愛知県名古屋市西区3-4-5',         tel: '0525678901',  contact: '',          inUse: false },
  { company: '長谷川運輸株式会社', kana: 'はせがわうんゆ',          zip: '3300001', address: '埼玉県さいたま市大宮区4-5-6',     tel: '0486789012',  contact: '長谷川 徹', inUse: false },
  { company: '石川倉庫株式会社',   kana: 'いしかわそうこ',          zip: '9200001', address: '石川県金沢市5-6-7',               tel: '0767890123',  contact: '',          inUse: false },
  { company: '橋本商店',           kana: 'はしもとしょうてん',     zip: '6300001', address: '奈良県奈良市6-7-8',               tel: '0742123456',  contact: '橋本 典子', inUse: false },
  { company: '村上製作所',         kana: 'むらかみせいさくしょ',   zip: '9500001', address: '新潟県新潟市中央区7-8-9',         tel: '0258901234',  contact: '',          inUse: false }
];

// 商品マスタのサンプルデータ。inUse は在庫・入荷予定・出荷予定から参照されている商品（削除不可・単位区分変更不可）
var itemMasterData = [
  { code: 'ITEM001', name: 'ミネラルウォーター 500ml', unit: '本',     inUse: true  },
  { code: 'ITEM001', name: 'ミネラルウォーター 500ml', unit: 'ケース', inUse: false },
  { code: 'ITEM002', name: '緑茶 500ml',               unit: '本',     inUse: true  },
  { code: 'ITEM003', name: 'ボールペン 黒',            unit: '本',     inUse: false },
  { code: 'ITEM004', name: 'コピー用紙 A4',            unit: '枚',     inUse: false },
  { code: 'ITEM004', name: 'コピー用紙 A4',            unit: '箱',     inUse: true  },
  { code: 'ITEM005', name: '紙コップ 205ml',           unit: '袋',     inUse: false },
  { code: 'ITEM006', name: 'ゴミ袋 45L',               unit: '袋',     inUse: false },
  { code: 'ITEM007', name: '単三電池',                 unit: 'セット', inUse: true  },
  { code: 'ITEM008', name: 'ガムテープ',               unit: '個',     inUse: false },
  { code: 'ITEM009', name: 'ダンボール 100サイズ',     unit: '枚',     inUse: false },
  { code: 'ITEM010', name: '緩衝材 エアキャップ',      unit: '個',     inUse: false },
  { code: 'ITEM011', name: 'ハンドソープ 詰替',        unit: '個',     inUse: true  },
  { code: 'ITEM012', name: 'ペーパータオル',           unit: 'ケース', inUse: false },
  { code: 'ITEM013', name: '軍手',                     unit: 'セット', inUse: false },
  { code: 'ITEM014', name: '養生テープ',               unit: '個',     inUse: false },
  { code: 'ITEM015', name: 'ストレッチフィルム',       unit: '本',     inUse: false },
  { code: 'ITEM016', name: 'PPバンド',                 unit: '個',     inUse: false },
  { code: 'ITEM017', name: '結束バンド',               unit: '袋',     inUse: false },
  { code: 'ITEM018', name: '油性マーカー 黒',          unit: '本',     inUse: false },
  { code: 'ITEM019', name: 'クラフト封筒 角2',         unit: '枚',     inUse: false },
  { code: 'ITEM020', name: 'ラベルシール',             unit: '枚',     inUse: false },
  { code: 'ITEM021', name: 'カッターナイフ',           unit: '個',     inUse: false },
  { code: 'ITEM022', name: 'マスク',                   unit: '箱',     inUse: false },
  { code: 'ITEM023', name: 'アルコール除菌スプレー',   unit: '本',     inUse: false }
];

// 一覧・登録・確認の 3 画面で使う、マスタごとの差分（列・文言・遷移先）
var MASTER_CONFIGS = {
  item: {
    listPage: '002_item_definition.html',
    newPage: '002-2_item_register.html',
    confirmPage: '002-3_item_register_confirm.html',
    data: itemMasterData,
    fields: [
      { key: 'code', label: '商品コード', required: true,
        pattern: /^[A-Za-z0-9_-]+$/, patternMessage: '商品コードは半角英数字・ハイフン・アンダースコアのみ使用できます' },
      { key: 'name', label: '商品名', required: true },
      { key: 'unit', label: '単位区分', required: true }
    ],
    searchKeys: ['code', 'name'],
    emptyMessage: '該当する商品はありません',
    inUseReason: '在庫・入荷予定・出荷予定から参照されているため削除できません',
    // 参照されている商品は単位区分を変更できない（編集モーダルで読み取り専用にする）
    lockedWhenInUse: 'unit',
    lockedReason: '在庫・入荷予定・出荷予定から参照されているため変更できません',
    deleteMessage: function (r) { return '商品「' + r.code + ' ' + r.name + '」を削除します。よろしいですか？'; },
    deletedMessage: '商品を削除しました',
    updatedMessage: '商品を更新しました',
    // 確認画面のサンプル行。line は CSV 上の行番号（手入力の行は null）
    confirmSamples: [
      { line: null, code: 'ITEM024', name: 'クリアファイル A4', unit: '枚', error: '' },
      { line: null, code: 'ITEM025', name: 'ホチキス針',        unit: '箱', error: '' },
      { line: 2,    code: 'ITEM026', name: 'ガムテープ 布',     unit: '個', error: '' },
      { line: 3,    code: 'ITEM001', name: 'ミネラルウォーター 500ml', unit: '本', error: '既に登録されています' },
      { line: 4,    code: 'ITEM 027', name: '付箋',            unit: '個', error: '商品コードは半角英数字・ハイフン・アンダースコアのみ使用できます' },
      { line: 5,    code: 'ITEM026', name: 'ガムテープ 布',     unit: '個', error: 'この画面に同じ内容の行があります' }
    ]
  },
  supplier: {
    listPage: '003_supplier_definition.html',
    newPage: '003-2_supplier_register.html',
    confirmPage: '003-3_supplier_register_confirm.html',
    data: supplierData,
    fields: [
      { key: 'company', label: '会社名', required: true },
      { key: 'kana', label: '会社名（かな）', required: true,
        pattern: /^[ぁ-ゔー\s]+$/, patternMessage: '会社名（かな）はひらがなと「ー」で入力してください' },
      { key: 'zip', label: '郵便番号', required: true,
        pattern: /^\d{7}$/, patternMessage: '郵便番号はハイフンなしの半角数字7桁で入力してください（例: 1000001）' },
      { key: 'address', label: '住所', required: true },
      { key: 'tel', label: '電話番号', required: true,
        pattern: /^\d+$/, patternMessage: '電話番号はハイフンなしの半角数字のみで入力してください（例: 0312345678）' },
      { key: 'contact', label: '担当者名', required: false }
    ],
    searchKeys: ['company', 'kana'],
    emptyMessage: '該当する取引先はありません',
    inUseReason: '入荷予定・出荷予定から参照されているため削除できません',
    lockedWhenInUse: null,
    deleteMessage: function (r) { return '取引先「' + r.company + '」を削除します。よろしいですか？'; },
    deletedMessage: '取引先を削除しました',
    updatedMessage: '取引先を更新しました',
    confirmSamples: [
      { line: null, company: '株式会社青木商会', kana: 'あおきしょうかい', zip: '1500001', address: '東京都渋谷区神宮前1-1-1', tel: '0331234567', contact: '青木 一郎', error: '' },
      { line: 2,    company: '森田物流株式会社', kana: 'もりたぶつりゅう', zip: '4600003', address: '愛知県名古屋市中区1-2-3', tel: '0521234567', contact: '',          error: '' },
      { line: 3,    company: '株式会社山田商事', kana: 'やまだしょうじ',   zip: '1000001', address: '東京都千代田区千代田1-1-1', tel: '0312345678', contact: '山田 太郎', error: '既に登録されています' },
      { line: 4,    company: '岡本産業株式会社', kana: 'オカモトサンギョウ', zip: '6500001', address: '兵庫県神戸市中央区1-1-1', tel: '0781234567', contact: '',        error: '会社名（かな）はひらがなと「ー」で入力してください' }
    ]
  }
};

// 空欄の任意項目は React 版と同じく「-」で表示する
function masterCellText(value) {
  return value ? allocationEscape(value) : '-';
}

// 入力欄の値を集める（data-field 属性で項目を対応づける）
function masterReadForm(form, config) {
  var values = {};
  config.fields.forEach(function (f) {
    var input = form.querySelector('[data-field="' + f.key + '"]');
    values[f.key] = input ? input.value.trim() : '';
  });
  return values;
}

// 必須・形式のチェック。エラーは各入力欄の下（data-error-for）に出す。問題なければ true
function masterValidateForm(form, config) {
  var values = masterReadForm(form, config);
  var ok = true;
  config.fields.forEach(function (f) {
    var message = '';
    if (f.required && values[f.key] === '') {
      message = f.label + 'を入力してください';
    } else if (values[f.key] !== '' && f.pattern && !f.pattern.test(values[f.key])) {
      message = f.patternMessage;
    }
    var input = form.querySelector('[data-field="' + f.key + '"]');
    var errorEl = form.querySelector('[data-error-for="' + f.key + '"]');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.hidden = !message;
    }
    if (input) {
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
    if (message) ok = false;
  });
  return ok;
}

function masterClearForm(form) {
  form.querySelectorAll('[data-field]').forEach(function (input) {
    input.value = '';
    input.removeAttribute('aria-invalid');
  });
  form.querySelectorAll('[data-error-for]').forEach(function (el) {
    el.textContent = '';
    el.hidden = true;
  });
}

// --- 確認ダイアログ（React 版の confirm() ＝ ConfirmRoot 相当） ---
// 一覧の更新・削除と、登録画面の破棄で共用する。マークアップは初回に生成する

var MASTER_CONFIRM_ICONS = {
  primary: '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>',
  danger: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>'
};

var masterConfirmCallback = null;

function openMasterConfirm(options) {
  var overlay = document.getElementById('masterConfirmModal');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'masterConfirmModal';
    overlay.className = 'ds-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'masterConfirmTitle');
    overlay.innerHTML =
      '<div class="ds-modal ds-modal--fit">' +
        '<div class="ds-modal-header">' +
          '<h2 class="heading-s ds-modal-title" id="masterConfirmTitle">' +
            '<svg class="ds-modal-title-icon ds-modal-title-icon--lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"' +
            ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"></svg>' +
            '<span></span>' +
          '</h2>' +
        '</div>' +
        '<div class="ds-modal-body">' +
          '<p class="body-m" id="masterConfirmMessage"></p>' +
          '<table class="modal-confirm-table" id="masterConfirmItems"><tbody></tbody></table>' +
        '</div>' +
        '<div class="ds-modal-footer">' +
          '<button type="button" class="btn btn-default" id="masterConfirmNo">キャンセル</button>' +
          '<button type="button" class="btn" id="masterConfirmYes"></button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    document.getElementById('masterConfirmNo').addEventListener('click', function () { closeMasterConfirm(false); });
    document.getElementById('masterConfirmYes').addEventListener('click', function () { closeMasterConfirm(true); });
  }

  var variant = options.variant || 'primary';
  var title = overlay.querySelector('.ds-modal-title');
  title.classList.toggle('ds-modal-title--danger', variant === 'danger');
  title.querySelector('svg').innerHTML = MASTER_CONFIRM_ICONS[variant];
  title.querySelector('span').textContent = options.title;
  document.getElementById('masterConfirmMessage').textContent = options.message;

  var items = options.items || [];
  var table = document.getElementById('masterConfirmItems');
  table.hidden = items.length === 0;
  table.querySelector('tbody').innerHTML = items.map(function (item) {
    return '<tr><th scope="row">' + allocationEscape(item.label) + '</th><td>' + allocationEscape(item.value) + '</td></tr>';
  }).join('');

  var yes = document.getElementById('masterConfirmYes');
  yes.className = 'btn ' + (variant === 'danger' ? 'btn-danger' : 'btn-primary');
  yes.textContent = options.yesText || 'OK';

  masterConfirmCallback = options.onYes;
  overlay.style.display = 'flex';
}

function closeMasterConfirm(ok) {
  document.getElementById('masterConfirmModal').style.display = 'none';
  var callback = masterConfirmCallback;
  masterConfirmCallback = null;
  if (ok && callback) callback();
}

// --- 一覧（002 / 003） ---

var MASTER_PAGE_SIZE = 20;
var masterListState = null;

function initMasterList(kind) {
  var config = MASTER_CONFIGS[kind];
  masterListState = { kind: kind, config: config, keyword: '', page: 1, editing: null };

  document.getElementById('masterSearchForm').addEventListener('submit', function (e) {
    e.preventDefault();
    masterListState.keyword = document.getElementById('masterSearchInput').value.trim().toLowerCase();
    masterListState.page = 1;
    renderMasterList();
  });
  document.getElementById('masterEditForm').addEventListener('submit', function (e) {
    e.preventDefault();
    saveMasterEdit();
  });

  renderMasterList();

  // 確認画面の「登録する」から戻ってきたとき、登録結果のトーストを出す
  // （React 版は確認画面で notify.success してから一覧へ移る。モックアップは別ファイルのため一覧側で出す）
  var params = new URLSearchParams(location.search);
  if (params.has('registered')) {
    var skipped = Number(params.get('skipped') || 0);
    showToast('success', skipped > 0
      ? params.get('registered') + '件登録しました（' + skipped + '件スキップ）'
      : params.get('registered') + '件登録しました');
    history.replaceState(null, '', location.pathname);
  }
}

function masterFilteredRows() {
  var s = masterListState;
  if (!s.keyword) return s.config.data.slice();
  return s.config.data.filter(function (row) {
    return s.config.searchKeys.some(function (key) {
      return (row[key] || '').toLowerCase().indexOf(s.keyword) !== -1;
    });
  });
}

function renderMasterList() {
  var s = masterListState;
  var rows = masterFilteredRows();
  var totalPages = Math.ceil(rows.length / MASTER_PAGE_SIZE);
  // 最終ページの最後の1件を削除したときなどは、範囲内のページに丸める（React 版はサーバーが丸める）
  s.page = Math.min(Math.max(s.page, 1), Math.max(totalPages, 1));

  var tbody = document.getElementById('masterTableBody');
  var colCount = s.config.fields.length + 1;
  var start = (s.page - 1) * MASTER_PAGE_SIZE;
  var pageRows = rows.slice(start, start + MASTER_PAGE_SIZE);

  if (pageRows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="' + colCount + '" class="text-subtle text-center">' + s.config.emptyMessage + '</td></tr>';
  } else {
    tbody.innerHTML = pageRows.map(function (row) {
      var index = s.config.data.indexOf(row);
      var cells = s.config.fields.map(function (f) {
        return '<td>' + masterCellText(row[f.key]) + '</td>';
      }).join('');
      var deleteBtn = row.inUse
        ? '<button type="button" class="btn-delete" disabled title="' + s.config.inUseReason + '">削除</button>'
        : '<button type="button" class="btn-delete" onclick="deleteMasterRow(' + index + ')">削除</button>';
      return '<tr>' + cells +
        '<td><div class="master-row-actions">' +
          '<button type="button" class="btn-edit" onclick="openMasterEdit(' + index + ')">編集</button>' +
          deleteBtn +
        '</div></td></tr>';
    }).join('');
  }

  renderMasterPagination(totalPages);
}

function renderMasterPagination(totalPages) {
  var s = masterListState;
  var container = document.getElementById('masterPagination');
  container.innerHTML = '';
  if (totalPages <= 1) return;

  function addButton(label, page, options) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'history-pagination-btn' + (options.active ? ' is-active' : '');
    btn.textContent = label;
    btn.disabled = !!options.disabled;
    if (options.ariaLabel) btn.setAttribute('aria-label', options.ariaLabel);
    if (options.active) btn.setAttribute('aria-current', 'page');
    btn.addEventListener('click', function () {
      s.page = page;
      renderMasterList();
    });
    container.appendChild(btn);
  }

  addButton('< 前へ', s.page - 1, { disabled: s.page === 1, ariaLabel: '前のページ' });
  for (var p = 1; p <= totalPages; p++) {
    addButton(String(p), p, { active: p === s.page, ariaLabel: p + 'ページ' });
  }
  addButton('次へ >', s.page + 1, { disabled: s.page >= totalPages, ariaLabel: '次のページ' });
}

function openMasterEdit(index) {
  var s = masterListState;
  var row = s.config.data[index];
  var form = document.getElementById('masterEditForm');
  s.editing = index;
  masterClearForm(form);
  s.config.fields.forEach(function (f) {
    form.querySelector('[data-field="' + f.key + '"]').value = row[f.key] || '';
  });

  // 参照されている商品は単位区分を読み取り専用にし、理由を欄の下に出す
  var lockedKey = s.config.lockedWhenInUse;
  if (lockedKey) {
    var lockedInput = form.querySelector('[data-field="' + lockedKey + '"]');
    var locked = !!row.inUse;
    lockedInput.readOnly = locked;
    lockedInput.classList.toggle('is-readonly', locked);
    var hint = form.querySelector('[data-hint-for="' + lockedKey + '"]');
    hint.textContent = locked ? s.config.lockedReason : '';
    hint.hidden = !locked;
  }

  document.getElementById('masterEditModal').style.display = 'flex';
}

function closeMasterEdit() {
  document.getElementById('masterEditModal').style.display = 'none';
  masterListState.editing = null;
}

// 「保存」→ 更新確認 → 反映してトースト（React 版の ItemFormModal / PartnerFormModal と同じ流れ）
function saveMasterEdit() {
  var s = masterListState;
  var form = document.getElementById('masterEditForm');
  if (!masterValidateForm(form, s.config)) return;
  var values = masterReadForm(form, s.config);

  openMasterConfirm({
    title: '更新確認',
    message: '以下の内容で更新します。よろしいですか？',
    items: s.config.fields.map(function (f) {
      return { label: f.label, value: values[f.key] || '-' };
    }),
    onYes: function () {
      var row = s.config.data[s.editing];
      s.config.fields.forEach(function (f) { row[f.key] = values[f.key]; });
      closeMasterEdit();
      showToast('success', s.config.updatedMessage);
      renderMasterList();
    }
  });
}

function deleteMasterRow(index) {
  var s = masterListState;
  var row = s.config.data[index];
  openMasterConfirm({
    title: '削除確認',
    variant: 'danger',
    message: s.config.deleteMessage(row),
    yesText: '削除',
    onYes: function () {
      s.config.data.splice(index, 1);
      showToast('success', s.config.deletedMessage);
      renderMasterList();
    }
  });
}

// --- 登録（002-2 / 003-2） ---
// 追加した行（登録前データ）はモックアップでは件数だけを数える。確認画面はサンプル行を表示する

var masterRegisterState = null;

function initMasterRegister(kind) {
  var config = MASTER_CONFIGS[kind];
  var form = document.getElementById('masterRegisterForm');
  masterRegisterState = { config: config, count: 0 };

  // onSubmit は「追加して続ける」。Enter キーでの送信もこちらに寄せる
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    addMasterDraft(false);
  });
  form.addEventListener('input', updateMasterRegisterBar);

  var fileInput = document.getElementById('csvFileInput');
  fileInput.addEventListener('change', function () {
    handleFileChange('csvFileInput', 'csvSelectedName');
    document.getElementById('csvUploadBtn').disabled = fileInput.files.length === 0;
  });
  // 取り込んだ行は確認画面に合流する（ヘッダ不一致などファイル全体の問題はトーストで知らせる）
  document.getElementById('csvUploadBtn').addEventListener('click', function () {
    location.href = config.confirmPage;
  });

  updateMasterRegisterBar();
}

function masterRegisterHasInput() {
  var form = document.getElementById('masterRegisterForm');
  var values = masterReadForm(form, masterRegisterState.config);
  return Object.keys(values).some(function (key) { return values[key] !== ''; });
}

// 「確認画面へ（N件）」は、0 件で入力欄も空のときは押せない
function updateMasterRegisterBar() {
  var btn = document.getElementById('masterGoConfirmBtn');
  btn.textContent = '確認画面へ（' + masterRegisterState.count + '件）';
  btn.disabled = masterRegisterState.count === 0 && !masterRegisterHasInput();
}

function addMasterDraft(goConfirm) {
  var s = masterRegisterState;
  var form = document.getElementById('masterRegisterForm');
  if (!masterValidateForm(form, s.config)) return;
  s.count += 1;
  masterClearForm(form);
  updateMasterRegisterBar();
  if (goConfirm) location.href = s.config.confirmPage;
}

// 下部バーの「確認画面へ」。入力途中の値を捨てないよう、値があれば追加してから移動する
function goMasterConfirm() {
  if (masterRegisterHasInput()) {
    addMasterDraft(true);
    return;
  }
  location.href = masterRegisterState.config.confirmPage;
}

function cancelMasterRegister() {
  var s = masterRegisterState;
  if (s.count === 0) {
    location.href = s.config.listPage;
    return;
  }
  openMasterConfirm({
    title: '破棄確認',
    variant: 'danger',
    message: '追加した' + s.count + '件を破棄して一覧に戻ります。よろしいですか？',
    yesText: '破棄',
    onYes: function () { location.href = s.config.listPage; }
  });
}

// --- 登録の確認（002-3 / 003-3） ---

var masterConfirmState = null;

function initMasterConfirm(kind) {
  var config = MASTER_CONFIGS[kind];
  masterConfirmState = { config: config, rows: config.confirmSamples.slice() };
  renderMasterConfirm();
}

function renderMasterConfirm() {
  var s = masterConfirmState;
  var registrable = s.rows.filter(function (row) { return !row.error; }).length;

  document.getElementById('masterConfirmHeading').textContent =
    '登録内容の確認（全' + s.rows.length + '件 / 登録対象' + registrable + '件）';

  document.getElementById('masterConfirmBody').innerHTML = s.rows.map(function (row, i) {
    var cells = s.config.fields.map(function (f) {
      return '<td>' + masterCellText(row[f.key]) + '</td>';
    }).join('');
    var judge = row.error
      ? '<span class="text-danger"><span aria-hidden="true">× </span>' + allocationEscape(row.error) + '</span>'
      : '<span class="text-success"><span aria-hidden="true">○</span><span class="sr-only">登録対象</span></span>';
    return '<tr>' +
      // CSV 取り込み行はファイル上の行番号を出す。手入力行は番号を持たない
      '<td>' + (row.line === null ? '-' : row.line) + '</td>' +
      cells +
      '<td>' + judge + '</td>' +
      '<td><button type="button" class="btn-delete" onclick="removeMasterConfirmRow(' + i + ')">削除</button></td>' +
      '</tr>';
  }).join('');

  var btn = document.getElementById('masterRegisterBtn');
  btn.textContent = '登録する（' + registrable + '件）';
  btn.disabled = registrable === 0;
}

function removeMasterConfirmRow(index) {
  var s = masterConfirmState;
  s.rows.splice(index, 1);
  // 行が 0 件になったら見せるものがないので登録画面へ戻す（履歴に確認画面を残さない）
  if (s.rows.length === 0) {
    location.replace(s.config.newPage);
    return;
  }
  renderMasterConfirm();
}

// エラーの行は自動的に除外して登録する。結果のトーストは一覧で出す
function registerMasterRows() {
  var s = masterConfirmState;
  var registrable = s.rows.filter(function (row) { return !row.error; }).length;
  var skipped = s.rows.length - registrable;
  location.href = s.config.listPage + '?registered=' + registrable + '&skipped=' + skipped;
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
