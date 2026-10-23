/* ============================================================
   棚卸モックアップ
   - SCR-018 棚卸管理（PC・事務員）       019_inventory_count.html
   - SCR-021 棚卸数更新履歴（PC）          021_inventory_count_history.html
   - SCR-022 棚卸入力（スマホ・作業員）    022_inventory_count_mobile.html

   開発資料/A4_棚卸業務検討.md の決定事項（括弧内の #番号）を画面で確かめるためのモックアップ。
   3画面は localStorage の同じキーを読み書きし、5 秒おきに読み直して連動する（#11）。
   main.js の後に読み込み、showToast / openModal / closeModal を使う。
   main.js には入れず、棚卸の3画面だけが読み込む。画面の判定は main.js と同じく要素 ID の有無で行う（ファイル末尾）。
   ============================================================ */
(function () {
  'use strict';

  var STORE_KEY = 'wms-mock-stocktake';
  var WORKER_KEY = 'wms-mock-stocktake-worker'; // sessionStorage: タブごとに作業員を変えられるようにする
  var ROLE_KEY = 'wms-mock-stocktake-role';     // sessionStorage
  var TALLY_KEY = 'wms-mock-stocktake-tally';   // sessionStorage: 「1つずつ数える」モード
  var POLL_MS = 5000;

  // 棚ロケの状態（#14）
  var STATUS_LABEL = {
    pending: '未着手',
    counting: 'カウント中',
    recount: '数え直し',
    counted: 'カウント済',
    confirmed: '確認済'
  };
  var STATUS_BADGE = {
    pending: 'status-badge--subtle',
    counting: 'status-badge--information',
    recount: 'stk-badge--danger',
    counted: 'status-badge--warning',
    confirmed: 'status-badge--success'
  };
  var EDITABLE_STATUSES = ['pending', 'counting', 'recount']; // 作業員が入力できる状態（#8）

  // ---- ダミーデータ ----

  var LOCATIONS = [
    'A-01-01-1', 'A-01-01-2', 'A-01-02-1', 'A-02-01-1', 'B-01-01-1',
    'B-01-02-1', 'B-02-01-1', 'C-01-01-1', 'C-01-02-1', 'C-02-01-1'
  ];

  // 商品マスタは「商品コード × 単位区分」で1件（masters/models.py の unique_item_company_code_unit）。
  // 同じ商品コードでもケースとピースは別の商品として扱う。
  var ITEMS = [
    { id: 'P-001-CS', code: 'P-001', name: '商品A', unit: 'ケース' },
    { id: 'P-001-PC', code: 'P-001', name: '商品A', unit: 'ピース' },
    { id: 'P-002-CS', code: 'P-002', name: '商品B', unit: 'ケース' },
    { id: 'P-003-PC', code: 'P-003', name: '商品C', unit: 'ピース' },
    { id: 'P-004-BL', code: 'P-004', name: '商品D', unit: 'ボール' },
    { id: 'P-005-CS', code: 'P-005', name: '商品E', unit: 'ケース' },
    { id: 'P-006-PL', code: 'P-006', name: '商品F', unit: 'パレット' },
    { id: 'P-007-PC', code: 'P-007', name: '商品G', unit: 'ピース' },
    { id: 'P-008-CS', code: 'P-008', name: '商品H', unit: 'ケース' },
    { id: 'P-009-BL', code: 'P-009', name: '商品I', unit: 'ボール' },
    { id: 'P-010-PC', code: 'P-010', name: '商品J', unit: 'ピース' }
  ];

  // 帳簿在庫（StockLot 相当）。入庫日だけが違うものは画面で1行にまとめる（#3）
  var INITIAL_STOCK = [
    { location: 'A-01-01-1', itemId: 'P-001-CS', lotNo: 'LOT-001', expiry: '2026/12/31', receivedAt: '2026/05/10', qty: 10 },
    { location: 'A-01-01-1', itemId: 'P-001-PC', lotNo: 'LOT-001', expiry: '2026/12/31', receivedAt: '2026/05/10', qty: 24 },
    { location: 'A-01-01-1', itemId: 'P-002-CS', lotNo: '',        expiry: '',           receivedAt: '2026/04/01', qty: 10 },
    { location: 'A-01-01-1', itemId: 'P-002-CS', lotNo: '',        expiry: '',           receivedAt: '2026/05/01', qty: 20 },
    { location: 'A-01-01-2', itemId: 'P-003-PC', lotNo: 'LOT-004', expiry: '2026/09/30', receivedAt: '2026/04/20', qty: 300 },
    { location: 'A-01-02-1', itemId: 'P-005-CS', lotNo: 'LOT-006', expiry: '2026/11/15', receivedAt: '2026/06/01', qty: 80 },
    { location: 'A-01-02-1', itemId: 'P-005-CS', lotNo: 'LOT-007', expiry: '2027/02/28', receivedAt: '2026/07/01', qty: 40 },
    { location: 'A-02-01-1', itemId: 'P-006-PL', lotNo: 'LOT-008', expiry: '2027/03/31', receivedAt: '2026/03/12', qty: 20 },
    { location: 'A-02-01-1', itemId: 'P-007-PC', lotNo: 'LOT-009', expiry: '2026/08/31', receivedAt: '2026/07/01', qty: 250 },
    { location: 'B-01-01-1', itemId: 'P-008-CS', lotNo: '',        expiry: '',           receivedAt: '2026/02/18', qty: 70 },
    { location: 'B-01-01-1', itemId: 'P-008-CS', lotNo: '',        expiry: '',           receivedAt: '2026/03/18', qty: 30 },
    { location: 'B-01-01-1', itemId: 'P-008-CS', lotNo: '',        expiry: '',           receivedAt: '2026/06/18', qty: 15 },
    { location: 'B-01-02-1', itemId: 'P-009-BL', lotNo: 'LOT-010', expiry: '2026/10/10', receivedAt: '2026/06/22', qty: 90 },
    { location: 'B-02-01-1', itemId: 'P-010-PC', lotNo: 'LOT-011', expiry: '2026/09/05', receivedAt: '2026/07/08', qty: 110 },
    { location: 'C-01-01-1', itemId: 'P-004-BL', lotNo: '',        expiry: '',           receivedAt: '2026/05/28', qty: 50 },
    { location: 'C-01-02-1', itemId: 'P-001-CS', lotNo: 'LOT-012', expiry: '2027/01/31', receivedAt: '2026/06/02', qty: 12 }
    // C-02-01-1 は帳簿在庫の無い棚ロケ（#30）
  ];

  // 過去に完了した棚卸の記録（#26）。差異の無い行も記録には残る
  var INITIAL_HISTORY = [
    {
      id: 0,
      startedOn: '2026/04/01',
      completedAt: '2026/04/01 17:30:00',
      completedBy: '管理者',
      rows: [
        { location: 'A-01-01-1', itemCode: 'P-002', itemName: '商品B', unit: 'ケース', lotNo: '',        expiry: '',           book: 32,  actual: 30,  diff: -2, lastBy: '作業員A' },
        { location: 'A-01-01-2', itemCode: 'P-003', itemName: '商品C', unit: 'ピース', lotNo: 'LOT-004', expiry: '2026/09/30', book: 300, actual: 300, diff: 0,  lastBy: '作業員B' },
        { location: 'B-01-01-1', itemCode: 'P-008', itemName: '商品H', unit: 'ケース', lotNo: '',        expiry: '',           book: 95,  actual: 100, diff: 5,  lastBy: '作業員A' },
        { location: 'B-02-01-1', itemCode: 'P-010', itemName: '商品J', unit: 'ピース', lotNo: 'LOT-011', expiry: '2026/09/05', book: 110, actual: 110, diff: 0,  lastBy: '作業員B' }
      ]
    }
  ];

  // ---- 汎用 ----

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function todayText() {
    var d = new Date();
    return d.getFullYear() + '/' + pad(d.getMonth() + 1) + '/' + pad(d.getDate());
  }

  function nowText() {
    var d = new Date();
    return todayText() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  // <input type="date"> の値（YYYY-MM-DD）と画面表示（YYYY/MM/DD）の相互変換
  function fromDateInput(value) { return value ? value.replace(/-/g, '/') : ''; }
  function toDateInput(value) { return value ? value.replace(/\//g, '-') : ''; }

  function dash(value) { return value === '' || value == null ? '‐' : value; }

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function findItem(itemId) {
    for (var i = 0; i < ITEMS.length; i++) {
      if (ITEMS[i].id === itemId) return ITEMS[i];
    }
    return { id: itemId, code: itemId, name: '（不明な商品）', unit: '' };
  }

  function rowKey(location, itemId, lotNo, expiry) {
    return [location, itemId, lotNo || '', expiry || ''].join('|');
  }

  function formatDiff(diff) {
    if (diff == null) return '‐';
    return diff > 0 ? '+' + diff : String(diff);
  }

  function badgeHtml(status) {
    return '<span class="status-badge ' + STATUS_BADGE[status] + '">' + STATUS_LABEL[status] + '</span>';
  }

  function sessionGet(key, fallback) {
    try { return sessionStorage.getItem(key) || fallback; } catch (e) { return fallback; }
  }

  function sessionSet(key, value) {
    try { sessionStorage.setItem(key, value); } catch (e) { /* 保存できなくても画面は動く */ }
  }

  // ---- 共有状態（localStorage） ----

  function initialState() {
    return {
      seq: 1,
      session: null,      // 実施中の棚卸（1テナントにつき1つまで: #31）
      stock: clone(INITIAL_STOCK),
      shelves: {},        // 棚ロケごとの状態: { status, lastBy }
      counts: {},         // 行ごとの入力: rowKey -> { location, itemId, lotNo, expiry, qty, lastBy, at, added, receivedAt }
      memos: [],          // { id, location, text, by, at, done, doneBy, doneAt }（#9-3）
      history: clone(INITIAL_HISTORY)
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* 壊れていれば初期化する */ }
    var state = initialState();
    save(state);
    return state;
  }

  function save(state) {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }

  // 書き込みは「最新を読み込む → 変更を適用 → 書き戻す」で行う。
  // 画面が持っている古い状態を書き戻すと、別タブ（別の作業員・事務員）の変更を消してしまうため。
  // fn がエラーメッセージを返したら書き戻さない。
  function update(fn) {
    var state = load();
    var error = fn(state);
    if (error) return error;
    save(state);
    return null;
  }

  // 棚ロケの行を組み立てる。帳簿は表示のたびに在庫から集計する（#18・#24）
  function shelfRows(state, location) {
    var map = {};
    var list = [];
    state.stock.forEach(function (lot) {
      if (lot.location !== location) return;
      var key = rowKey(location, lot.itemId, lot.lotNo, lot.expiry);
      if (!map[key]) {
        map[key] = { key: key, location: location, itemId: lot.itemId, lotNo: lot.lotNo, expiry: lot.expiry, book: 0, lots: [] };
        list.push(map[key]);
      }
      map[key].book += lot.qty;
      map[key].lots.push({ receivedAt: lot.receivedAt, qty: lot.qty });
    });
    // 事務員が追加した行（帳簿に無い組み合わせ: #9-1）
    Object.keys(state.counts).forEach(function (key) {
      var c = state.counts[key];
      if (c.location !== location || map[key]) return;
      map[key] = { key: key, location: location, itemId: c.itemId, lotNo: c.lotNo, expiry: c.expiry, book: 0, lots: [] };
      list.push(map[key]);
    });
    list.forEach(function (row) {
      var c = state.counts[row.key];
      row.item = findItem(row.itemId);
      row.count = c && c.qty != null ? c.qty : null;
      row.lastBy = c ? c.lastBy || '' : '';
      row.at = c ? c.at || '' : '';
      row.added = !!(c && c.added);
      row.addedReceivedAt = c ? c.receivedAt || '' : '';
      row.lots.sort(function (a, b) { return a.receivedAt < b.receivedAt ? -1 : 1; });
      row.merged = row.lots.length > 1;
      row.diff = row.count == null ? null : row.count - row.book;
    });
    list.sort(function (a, b) {
      var ka = a.item.code + a.item.unit + a.lotNo + a.expiry;
      var kb = b.item.code + b.item.unit + b.lotNo + b.expiry;
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    });
    return list;
  }

  function shelfInfo(state, location) {
    var shelf = state.shelves[location] || { status: 'pending', lastBy: '' };
    var rows = shelfRows(state, location);
    var filled = rows.filter(function (r) { return r.count != null; }).length;
    var unresolved = state.memos.filter(function (m) { return m.location === location && !m.done; }).length;
    return {
      location: location,
      status: shelf.status,
      lastBy: shelf.lastBy || '',
      rows: rows,
      total: rows.length,
      filled: filled,
      hasDiff: rows.some(function (r) { return r.diff != null && r.diff !== 0; }),
      unresolved: unresolved
    };
  }

  // 一括確認・チェックボックスの対象: 差異も未対応メモも無いカウント済（#13-1・#9-4）
  function isBulkConfirmable(info) {
    return info.status === 'counted' && !info.hasDiff && info.unresolved === 0;
  }

  // ---- 操作（状態遷移は A4「2. 業務フロー > 目標 > 状態」の図どおり） ----

  var Actions = {

    start: function (by) {
      return update(function (s) {
        if (s.session) return '実施中の棚卸があります（1荷主につき1つまで）';
        s.session = { id: s.seq++, startedOn: todayText(), startedBy: by };
        s.shelves = {};
        LOCATIONS.forEach(function (loc) { s.shelves[loc] = { status: 'pending', lastBy: '' }; });
        s.counts = {};
        s.memos = [];
      });
    },

    // 中止（#32）: 入力を破棄し、在庫・履歴は変えない
    cancel: function () {
      return update(function (s) {
        if (!s.session) return '実施中の棚卸がありません';
        s.session = null;
        s.shelves = {};
        s.counts = {};
        s.memos = [];
      });
    },

    // 作業員の入力（#5・#5-1・#5-2・#8）。qty が null なら入力を取り消す
    saveCount: function (location, key, qty, worker) {
      return update(function (s) {
        if (!s.session) return '実施中の棚卸がありません';
        var shelf = s.shelves[location];
        if (EDITABLE_STATUSES.indexOf(shelf.status) < 0) return 'この棚ロケは完了済みのため入力できません';
        var row = shelfRows(s, location).filter(function (r) { return r.key === key; })[0];
        if (!row) return '行が見つかりません（事務所で削除された可能性があります）';
        var c = s.counts[key] || { location: location, itemId: row.itemId, lotNo: row.lotNo, expiry: row.expiry, added: false };
        c.qty = qty;
        c.lastBy = worker;
        c.at = nowText();
        s.counts[key] = c;
        if (shelf.status === 'pending') shelf.status = 'counting';
        shelf.lastBy = worker;
      });
    },

    // 「この棚を完了」（#29・#30）
    completeShelf: function (location) {
      return update(function (s) {
        if (!s.session) return '実施中の棚卸がありません';
        var shelf = s.shelves[location];
        if (EDITABLE_STATUSES.indexOf(shelf.status) < 0) return 'この棚ロケは既に完了しています';
        var rows = shelfRows(s, location);
        if (rows.some(function (r) { return r.count == null; })) return '未入力の行があります。現物が無い行は 0 を入力してください';
        shelf.status = 'counted';
      });
    },

    // 数え直しの指示（#8-1）: 選んだ行の値を消して数え直しにする
    recount: function (location, keys) {
      return update(function (s) {
        if (!s.session) return '実施中の棚卸がありません';
        var shelf = s.shelves[location];
        if (shelf.status !== 'counted' && shelf.status !== 'confirmed') return '数え直しは「カウント済」「確認済」の棚ロケで指示できます';
        if (shelfRows(s, location).length > 0 && keys.length === 0) return '数え直す行を選んでください';
        keys.forEach(function (key) {
          if (s.counts[key]) s.counts[key].qty = null;
        });
        shelf.status = 'recount';
      });
    },

    // 行の追加（#9-1・#9-2）: 実数は入れない。作業員が入力する
    addRow: function (location, itemId, lotNo, expiry, receivedAt) {
      return update(function (s) {
        if (!s.session) return '実施中の棚卸がありません';
        if (!itemId) return '商品を選んでください';
        if (!receivedAt) return '入庫日を入力してください';
        var key = rowKey(location, itemId, lotNo, expiry);
        if (shelfRows(s, location).some(function (r) { return r.key === key; })) {
          return '同じ商品・ロット番号・賞味期限の行が既にあります';
        }
        s.counts[key] = { location: location, itemId: itemId, lotNo: lotNo, expiry: expiry, qty: null, lastBy: '', at: '', added: true, receivedAt: receivedAt };
        var shelf = s.shelves[location];
        if (shelf.status === 'counted' || shelf.status === 'confirmed') shelf.status = 'recount';
      });
    },

    deleteRow: function (location, key) {
      return update(function (s) {
        if (!s.session) return '実施中の棚卸がありません';
        var c = s.counts[key];
        if (!c || !c.added) return '事務所で追加した行だけ削除できます';
        delete s.counts[key];
        var shelf = s.shelves[location];
        if (shelf.status === 'counted' || shelf.status === 'confirmed') shelf.status = 'recount';
      });
    },

    // メモ（#9-3）: 棚ロケの状態に関係なく、実施中ならいつでも書ける
    addMemo: function (location, text, worker) {
      return update(function (s) {
        if (!s.session) return '実施中の棚卸がありません';
        if (!text) return 'メモを入力してください';
        s.memos.push({ id: s.seq++, location: location, text: text, by: worker, at: nowText(), done: false, doneBy: '', doneAt: '' });
        // 未対応のメモがある棚ロケは確認済にできない（#9-4）
        if (s.shelves[location].status === 'confirmed') s.shelves[location].status = 'counted';
      });
    },

    editMemo: function (id, text, worker) {
      return update(function (s) {
        var memo = s.memos.filter(function (m) { return m.id === id; })[0];
        if (!memo || memo.by !== worker || memo.done) return '自分が書いた未対応のメモだけ修正できます';
        if (!text) return 'メモを入力してください';
        memo.text = text;
        memo.at = nowText();
      });
    },

    deleteMemo: function (id, worker) {
      return update(function (s) {
        var memo = s.memos.filter(function (m) { return m.id === id; })[0];
        if (!memo || memo.by !== worker || memo.done) return '自分が書いた未対応のメモだけ削除できます';
        s.memos = s.memos.filter(function (m) { return m.id !== id; });
      });
    },

    resolveMemo: function (id, by) {
      return update(function (s) {
        var memo = s.memos.filter(function (m) { return m.id === id; })[0];
        if (!memo) return 'メモが見つかりません';
        memo.done = true;
        memo.doneBy = by;
        memo.doneAt = nowText();
      });
    },

    // 確認済にする（#13-1・#9-4）
    confirm: function (locations) {
      return update(function (s) {
        if (!s.session) return '実施中の棚卸がありません';
        for (var i = 0; i < locations.length; i++) {
          var info = shelfInfo(s, locations[i]);
          if (info.status !== 'counted') return locations[i] + ' は「カウント済」ではないため確認済にできません';
          if (info.unresolved > 0) return locations[i] + ' に未対応のメモがあるため確認済にできません';
        }
        locations.forEach(function (loc) { s.shelves[loc].status = 'confirmed'; });
      });
    },

    // 棚卸の完了（#15・#16・#26・#27）
    complete: function (by) {
      return update(function (s) {
        if (!s.session) return '実施中の棚卸がありません';
        var notConfirmed = LOCATIONS.filter(function (loc) { return s.shelves[loc].status !== 'confirmed'; });
        if (notConfirmed.length > 0) return '確認済でない棚ロケがあります（' + notConfirmed.length + ' 件）';

        var record = { id: s.session.id, startedOn: s.session.startedOn, completedAt: nowText(), completedBy: by, rows: [] };
        LOCATIONS.forEach(function (loc) {
          shelfRows(s, loc).forEach(function (row) {
            record.rows.push({
              location: loc, itemCode: row.item.code, itemName: row.item.name, unit: row.item.unit,
              lotNo: row.lotNo, expiry: row.expiry, book: row.book, actual: row.count, diff: row.diff, lastBy: row.lastBy
            });
            applyToStock(s, row);
          });
        });
        // 実数 0 になった在庫行の扱い（削除か 0 のまま残すか）は E7 で決める。モックでは削除する
        s.stock = s.stock.filter(function (lot) { return lot.qty > 0; });
        s.history.unshift(record);
        s.session = null;
        s.shelves = {};
        s.counts = {};
        s.memos = [];
      });
    }
  };

  // 実数を帳簿へ反映する（#3-1・#9-1）
  function applyToStock(state, row) {
    if (row.added) {
      if (row.count > 0) {
        state.stock.push({ location: row.location, itemId: row.itemId, lotNo: row.lotNo, expiry: row.expiry, receivedAt: row.addedReceivedAt, qty: row.count });
      }
      return;
    }
    var lots = state.stock.filter(function (lot) {
      return rowKey(lot.location, lot.itemId, lot.lotNo, lot.expiry) === row.key;
    }).sort(function (a, b) { return a.receivedAt < b.receivedAt ? -1 : 1; });
    var diff = row.count - row.book;
    if (diff < 0) {
      // 不足は入庫日の古い在庫行から減らす（出荷引き当ての FIFO と同じ）
      var remaining = -diff;
      lots.forEach(function (lot) {
        var take = Math.min(lot.qty, remaining);
        lot.qty -= take;
        remaining -= take;
      });
    } else if (diff > 0) {
      // 過剰は入庫日の新しい在庫行に足す
      lots[lots.length - 1].qty += diff;
    }
  }

  // ---- 定期取り込み（#11） ----

  function startPolling(onTick) {
    var timer = null;
    function startTimer() { if (!timer) timer = setInterval(onTick, POLL_MS); }
    function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
    // 画面が見えていない間は止め、戻ったらすぐ取り込む
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        stopTimer();
      } else {
        onTick();
        startTimer();
      }
    });
    startTimer();
  }

  function notifyResult(error, successMessage) {
    if (error) {
      showToast('error', error);
      return false;
    }
    if (successMessage) showToast('success', successMessage);
    return true;
  }

  // ============================================================
  // SCR-018 棚卸管理（PC・事務員）
  // ============================================================

  function initPc() {
    var el = function (id) { return document.getElementById(id); };
    var selectedLocation = null;
    var checkedShelves = {};      // 一覧のチェック（取り込みで外れないよう画面側で保持: #13-1）
    var recountSelection = {};    // 明細の「数え直す行」の選択
    var expandedRows = {};        // まとめた行の内訳を開いているか
    var pendingConfirm = null;

    // 確認モーダル
    function openConfirm(title, body, okLabel, onOk) {
      el('stkConfirmTitle').textContent = title;
      el('stkConfirmBody').textContent = body;
      el('stkConfirmOk').textContent = okLabel;
      pendingConfirm = onOk;
      openModal('stkConfirmModal');
    }
    el('stkConfirmCancel').addEventListener('click', function () {
      pendingConfirm = null;
      closeModal('stkConfirmModal');
    });
    el('stkConfirmOk').addEventListener('click', function () {
      var fn = pendingConfirm;
      pendingConfirm = null;
      closeModal('stkConfirmModal');
      if (fn) fn();
    });

    function role() { return el('stkRoleSelect').value; }

    // 行の追加フォームの商品の選択肢
    el('stkAddItem').innerHTML = '<option value="">選択してください</option>' + ITEMS.map(function (item) {
      return '<option value="' + esc(item.id) + '">' + esc(item.code + ' ' + item.name + '（' + item.unit + '）') + '</option>';
    }).join('');

    el('stkDiffOnly').addEventListener('change', function () { render(); });

    el('stkRoleSelect').value = sessionGet(ROLE_KEY, '事務員');
    el('stkRoleSelect').addEventListener('change', function () {
      sessionSet(ROLE_KEY, role());
      render();
    });

    el('stkStartBtn').addEventListener('click', function () {
      openConfirm('棚卸開始の確認', 'この荷主の棚卸を開始します。開始前に入出荷を止めてください（運用で行う）。', '開始', function () {
        if (notifyResult(Actions.start(role()), '棚卸を開始しました')) {
          selectedLocation = null;
          checkedShelves = {};
          render();
        }
      });
    });

    el('stkCancelBtn').addEventListener('click', function () {
      openConfirm('棚卸中止の確認', '棚卸を中止します。入力された実数とメモはすべて破棄され、在庫数は変わりません。履歴にも残りません。', '中止する', function () {
        if (notifyResult(Actions.cancel(), '棚卸を中止しました')) {
          selectedLocation = null;
          render();
        }
      });
    });

    el('stkCompleteBtn').addEventListener('click', function () {
      openConfirm('棚卸完了の確認', '棚卸を完了します。在庫数を実数で更新し、記録を棚卸数更新履歴に残します。', '完了する', function () {
        if (notifyResult(Actions.complete(role()), '棚卸を完了しました。棚卸数更新履歴に記録しました')) {
          selectedLocation = null;
          render();
        }
      });
    });

    el('stkResetBtn').addEventListener('click', function () {
      openConfirm('デモデータの初期化', '棚卸の状態・在庫・履歴をすべて初期状態に戻します。', '初期化する', function () {
        localStorage.removeItem(STORE_KEY);
        load();
        selectedLocation = null;
        checkedShelves = {};
        showToast('success', 'デモデータを初期化しました');
        render();
      });
    });

    el('stkBulkConfirmBtn').addEventListener('click', function () {
      var state = load();
      var targets = LOCATIONS.filter(function (loc) { return isBulkConfirmable(shelfInfo(state, loc)); });
      openConfirm('確認済にする', targets.length + ' 件の棚ロケ（差異も未対応のメモも無い「カウント済」）を確認済にします。', '確認済にする', function () {
        if (notifyResult(Actions.confirm(targets), targets.length + ' 件を確認済にしました')) render();
      });
    });

    el('stkSelectedConfirmBtn').addEventListener('click', function () {
      var targets = Object.keys(checkedShelves);
      if (notifyResult(Actions.confirm(targets), targets.length + ' 件を確認済にしました')) {
        checkedShelves = {};
        render();
      }
    });

    el('stkConfirmShelfBtn').addEventListener('click', function () {
      if (notifyResult(Actions.confirm([selectedLocation]), selectedLocation + ' を確認済にしました')) render();
    });

    el('stkRecountBtn').addEventListener('click', function () {
      var keys = Object.keys(recountSelection[selectedLocation] || {});
      if (notifyResult(Actions.recount(selectedLocation, keys), selectedLocation + ' を数え直しにしました')) {
        delete recountSelection[selectedLocation];
        render();
      }
    });

    el('stkAddRowBtn').addEventListener('click', function () {
      var error = Actions.addRow(
        selectedLocation,
        el('stkAddItem').value,
        el('stkAddLot').value.trim(),
        fromDateInput(el('stkAddExpiry').value),
        fromDateInput(el('stkAddReceived').value)
      );
      if (notifyResult(error, '行を追加しました。作業員が実数を入力します')) {
        el('stkAddItem').value = '';
        el('stkAddLot').value = '';
        el('stkAddExpiry').value = '';
        render();
      }
    });

    // チェックボックスが小さいため、チェックボックスのあるセル（td.stk-col-check）のどこを押しても切り替えられるようにする。
    // チェックボックス自体を押した場合はブラウザが切り替え済みなので、そのまま返す
    function checkboxFromClick(e) {
      var td = e.target.closest('td.stk-col-check');
      var cb = td ? td.querySelector('input[type="checkbox"]') : null;
      if (cb && e.target !== cb) cb.checked = !cb.checked;
      return cb;
    }

    // 一覧: チェックボックスと行の選択
    el('stkShelfTableBody').addEventListener('click', function (e) {
      var tr = e.target.closest('tr[data-location]');
      if (!tr) return;
      var cb = checkboxFromClick(e);
      if (cb) {
        if (cb.checked) checkedShelves[tr.dataset.location] = true;
        else delete checkedShelves[tr.dataset.location];
        render();
        return;
      }
      selectShelf(tr.dataset.location);
    });

    // 明細: 数え直しの行選択・内訳の開閉・追加行の削除
    el('stkRowTableBody').addEventListener('click', function (e) {
      var target = e.target;
      var tr = target.closest('tr[data-key]');
      if (!tr) return;
      var key = tr.dataset.key;
      var cb = checkboxFromClick(e);
      if (cb) {
        var sel = recountSelection[selectedLocation] = recountSelection[selectedLocation] || {};
        if (cb.checked) sel[key] = true;
        else delete sel[key];
        return;
      }
      if (target.closest('.stk-merged-toggle')) {
        expandedRows[key] = !expandedRows[key];
        render();
        return;
      }
      if (target.closest('.stk-delete-row')) {
        if (notifyResult(Actions.deleteRow(selectedLocation, key), '追加した行を削除しました')) render();
      }
    });

    el('stkMemoList').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-resolve-memo]');
      if (!btn) return;
      if (notifyResult(Actions.resolveMemo(Number(btn.dataset.resolveMemo), role()), 'メモを対応済みにしました')) render();
    });

    function selectShelf(location) {
      selectedLocation = location;
      // 数え直す行の初期選択は差異のある行（#8-1）
      var info = shelfInfo(load(), location);
      var sel = {};
      info.rows.forEach(function (r) { if (r.diff != null && r.diff !== 0) sel[r.key] = true; });
      recountSelection[location] = sel;
      render();
    }

    function render() {
      var state = load();
      var session = state.session;
      el('stkLastPolled').textContent = nowText();

      var infos = session ? LOCATIONS.map(function (loc) { return shelfInfo(state, loc); }) : [];
      var allConfirmed = infos.length > 0 && infos.every(function (i) { return i.status === 'confirmed'; });

      el('stkStartBtn').disabled = !!session;
      el('stkCancelBtn').disabled = !session;
      el('stkCompleteBtn').disabled = !session || !allConfirmed || role() !== '管理者';
      el('stkCompleteHint').textContent = !session ? ''
        : role() !== '管理者' ? '完了は管理者のみ（仮置き: #27）'
        : !allConfirmed ? '全棚ロケが確認済になると完了できます'
        : '';
      el('stkSessionText').textContent = session
        ? '実施中（実施日 ' + session.startedOn + '、開始: ' + session.startedBy + '）'
        : '実施中の棚卸はありません';
      el('stkNoSession').hidden = !!session;
      el('stkPcLayout').hidden = !session;

      if (!session) {
        el('stkSummary').innerHTML = '';
        return;
      }

      // 状態ごとの件数
      el('stkSummary').innerHTML = Object.keys(STATUS_LABEL).map(function (status) {
        var n = infos.filter(function (i) { return i.status === status; }).length;
        return '<span class="stk-summary-item">' + badgeHtml(status) + ' ' + n + '</span>';
      }).join('');

      // 一覧。「差異ありのみ」がオンなら差異のある棚ロケだけを出す（未着手は差異を判定できないため出ない）
      var diffOnly = el('stkDiffOnly').checked;
      var visible = diffOnly ? infos.filter(function (i) { return i.hasDiff; }) : infos;
      // 見えない棚ロケを「選択した棚を確認済にする」の対象にしないよう、隠れたもののチェックは外す
      infos.forEach(function (info) {
        if (!isBulkConfirmable(info) || visible.indexOf(info) < 0) delete checkedShelves[info.location];
      });
      el('stkListCount').textContent = visible.length + ' / ' + infos.length + ' 件を表示';
      el('stkShelfTableBody').innerHTML = visible.length === 0
        ? '<tr><td colspan="7" class="stk-empty-cell">差異のある棚ロケはありません。</td></tr>'
        : visible.map(function (info) {
        var checkable = isBulkConfirmable(info);
        var cls = info.location === selectedLocation ? ' class="is-selected stk-clickable"' : ' class="stk-clickable"';
        return '<tr data-location="' + esc(info.location) + '"' + cls + '>' +
          '<td class="stk-col-check">' + (checkable
            ? '<input type="checkbox" aria-label="' + esc(info.location) + ' を選択"' + (checkedShelves[info.location] ? ' checked' : '') + '>'
            : '') + '</td>' +
          '<td>' + esc(info.location) + '</td>' +
          '<td>' + badgeHtml(info.status) + '</td>' +
          '<td>' + info.filled + ' / ' + info.total + ' 行</td>' +
          // 差異は入力済みの行だけで判定する。未着手の棚ロケは判定しない
          '<td>' + (info.hasDiff ? '<span class="stk-diff">あり</span>' : (info.status === 'pending' ? '‐' : 'なし')) + '</td>' +
          '<td>' + (info.unresolved > 0 ? '<span class="stk-memo-count">' + info.unresolved + ' 件</span>' : '‐') + '</td>' +
          '<td>' + esc(dash(info.lastBy)) + '</td>' +
          '</tr>';
      }).join('');

      var bulkTargets = infos.filter(isBulkConfirmable).length;
      el('stkBulkConfirmBtn').disabled = bulkTargets === 0;
      el('stkBulkConfirmBtn').textContent = '差異なしの棚をすべて確認済にする（' + bulkTargets + ' 件）';
      var checkedCount = Object.keys(checkedShelves).length;
      el('stkSelectedConfirmBtn').disabled = checkedCount === 0;
      el('stkSelectedConfirmBtn').textContent = '選択した棚を確認済にする（' + checkedCount + ' 件）';

      renderDetail(state, session);
    }

    function renderDetail(state, session) {
      var hasSelection = !!selectedLocation;
      el('stkDetailEmpty').hidden = hasSelection;
      el('stkDetailBody').hidden = !hasSelection;
      if (!hasSelection) return;

      var info = shelfInfo(state, selectedLocation);
      var canRecount = info.status === 'counted' || info.status === 'confirmed';
      var sel = recountSelection[selectedLocation] || {};
      // 行が無くなった選択は外す
      Object.keys(sel).forEach(function (key) {
        if (!info.rows.some(function (r) { return r.key === key; })) delete sel[key];
      });

      el('stkDetailTitle').textContent = info.location;
      el('stkDetailBadge').innerHTML = badgeHtml(info.status);
      el('stkConfirmShelfBtn').disabled = !(info.status === 'counted' && info.unresolved === 0);
      el('stkRecountBtn').disabled = !canRecount;
      el('stkDetailHint').textContent =
        info.status === 'counted' && info.unresolved > 0 ? '未対応のメモがあるため確認済にできません（#9-4）。'
        : EDITABLE_STATUSES.indexOf(info.status) >= 0 ? '作業員が数えています。「カウント済」になると確認済・数え直しができます。'
        : info.status === 'confirmed' ? '確認済です。数え直しを指示すると「数え直し」に戻ります。'
        : '差異のある行は初期状態で数え直しの対象に選ばれています。';

      el('stkRowTableBody').innerHTML = info.rows.length === 0
        ? '<tr><td colspan="9" class="stk-empty-cell">帳簿在庫も追加した行もありません。</td></tr>'
        : info.rows.map(function (row) { return rowHtml(row, canRecount, !!sel[row.key]); }).join('');

      if (!el('stkAddReceived').value) el('stkAddReceived').value = toDateInput(session.startedOn);

      var memos = state.memos.filter(function (m) { return m.location === info.location; });
      el('stkMemoList').innerHTML = memos.length === 0
        ? '<li class="stk-memo-empty">メモはありません。</li>'
        : memos.map(function (m) {
          return '<li class="stk-memo-item' + (m.done ? ' is-done' : '') + '">' +
            '<div class="stk-memo-meta">' + esc(m.by) + '・' + esc(m.at) + ' ' +
            (m.done
              ? '<span class="status-badge status-badge--success">対応済み</span> <span class="stk-hint">' + esc(m.doneBy) + '・' + esc(m.doneAt) + '</span>'
              : '<span class="status-badge status-badge--warning">未対応</span>') +
            '</div>' +
            '<p class="stk-memo-text">' + esc(m.text) + '</p>' +
            (m.done ? '' : '<button type="button" class="btn btn-default" data-resolve-memo="' + m.id + '">対応済みにする</button>') +
            '</li>';
        }).join('');
    }

    function rowHtml(row, canRecount, selected) {
      var itemText = esc(row.item.name) + '<span class="stk-item-code">' + esc(row.item.code) + '・' + esc(row.item.unit) + '</span>';
      var tags = '';
      if (row.added) tags += '<span class="stk-tag">事務所で追加（入庫日 ' + esc(row.addedReceivedAt) + '）</span>';
      if (row.merged) {
        tags += '<button type="button" class="stk-tag stk-merged-toggle" aria-expanded="' + (expandedRows[row.key] ? 'true' : 'false') + '">' +
          '入庫日違い ' + row.lots.length + ' 件をまとめた行 ' + (expandedRows[row.key] ? '▲' : '▼') + '</button>';
      }
      var diffCls = row.diff ? ' stk-diff' : '';
      // 差異のある行は行全体を強調する
      var html = '<tr data-key="' + esc(row.key) + '"' + (row.diff ? ' class="stk-row--diff"' : '') + '>' +
        '<td class="stk-col-check">' + (canRecount
          ? '<input type="checkbox" aria-label="この行を数え直す"' + (selected ? ' checked' : '') + '>'
          : '') + '</td>' +
        '<td>' + itemText + (tags ? '<div class="stk-tags">' + tags + '</div>' : '') + '</td>' +
        '<td>' + esc(dash(row.lotNo)) + '</td>' +
        '<td>' + esc(dash(row.expiry)) + '</td>' +
        '<td class="stk-num">' + row.book + '</td>' +
        '<td class="stk-num">' + (row.count == null ? '<span class="stk-hint">未入力</span>' : row.count) + '</td>' +
        '<td class="stk-num' + diffCls + '">' + formatDiff(row.diff) + '</td>' +
        '<td>' + esc(dash(row.lastBy)) + (row.at ? '<span class="stk-item-code">' + esc(row.at) + '</span>' : '') + '</td>' +
        '<td>' + (row.added ? '<button type="button" class="btn btn-default stk-delete-row">削除</button>' : '') + '</td>' +
        '</tr>';
      if (row.merged && expandedRows[row.key]) {
        html += row.lots.map(function (lot) {
          return '<tr class="stk-lot-row"><td></td><td colspan="3">入庫日 ' + esc(lot.receivedAt) + '</td>' +
            '<td class="stk-num">' + lot.qty + '</td><td colspan="4"></td></tr>';
        }).join('');
      }
      return html;
    }

    render();
    startPolling(render);
  }

  // ============================================================
  // SCR-021 棚卸数更新履歴（PC）
  // ============================================================

  function initHistory() {
    var select = document.getElementById('stkHistorySession');
    var tbody = document.getElementById('stkHistoryTableBody');
    var count = document.getElementById('stkHistoryCount');
    var pagination = document.getElementById('stkHistoryPagination');
    var PAGE_SIZE = 20; // 020 在庫調整履歴と同じ件数
    var currentPage = 1;

    // 絞り込みを変えたら1ページ目に戻す
    select.addEventListener('change', function () {
      currentPage = 1;
      render();
    });

    function render() {
      var history = load().history;
      var current = select.value;
      select.innerHTML = '<option value="">すべての棚卸</option>' + history.map(function (h) {
        return '<option value="' + h.id + '">' + esc(h.startedOn + ' 実施（' + h.completedAt + ' 完了）') + '</option>';
      }).join('');
      select.value = history.some(function (h) { return String(h.id) === current; }) ? current : '';

      var rows = [];
      history.forEach(function (h) {
        if (select.value && String(h.id) !== select.value) return;
        h.rows.forEach(function (r) {
          // 差異のある行だけを表示する（#26）
          if (r.diff) rows.push({ h: h, r: r });
        });
      });
      count.textContent = '全 ' + rows.length + ' 件';

      // 取り込みでページを保つ。行が減って今のページが無くなったら最後のページに寄せる
      var totalPages = Math.ceil(rows.length / PAGE_SIZE);
      currentPage = Math.max(1, Math.min(currentPage, totalPages));
      var pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

      tbody.innerHTML = pageRows.length === 0
        ? '<tr><td colspan="11" class="stk-empty-cell">表示する行はありません。</td></tr>'
        : pageRows.map(function (x) {
          return '<tr>' +
            '<td>' + esc(x.h.startedOn) + '</td>' +
            '<td>' + esc(x.h.completedAt) + '</td>' +
            '<td>' + esc(x.h.completedBy) + '</td>' +
            '<td>' + esc(x.r.location) + '</td>' +
            '<td>' + esc(x.r.itemName) + '<span class="stk-item-code">' + esc(x.r.itemCode) + '・' + esc(x.r.unit) + '</span></td>' +
            '<td>' + esc(dash(x.r.lotNo)) + '</td>' +
            '<td>' + esc(dash(x.r.expiry)) + '</td>' +
            '<td class="stk-num">' + x.r.book + '</td>' +
            '<td class="stk-num">' + x.r.actual + '</td>' +
            '<td class="stk-num stk-diff">' + formatDiff(x.r.diff) + '</td>' +
            '<td>' + esc(dash(x.r.lastBy)) + '</td>' +
            '</tr>';
        }).join('');

      renderPagination(totalPages);
    }

    // 020 在庫調整履歴（main.js の renderAdjustmentHistoryPagination）と同じ構成のページネーション
    function renderPagination(totalPages) {
      var html = '<button type="button" class="history-pagination-btn" data-page="' + (currentPage - 1) + '" aria-label="前のページ"' +
        (currentPage === 1 ? ' disabled' : '') + '>&lt; 前へ</button>';
      for (var p = 1; p <= totalPages; p++) {
        html += '<button type="button" class="history-pagination-btn' + (p === currentPage ? ' is-active' : '') + '" data-page="' + p + '"' +
          ' aria-label="' + p + 'ページ"' + (p === currentPage ? ' aria-current="page"' : '') + '>' + p + '</button>';
      }
      html += '<button type="button" class="history-pagination-btn" data-page="' + (currentPage + 1) + '" aria-label="次のページ"' +
        (currentPage >= totalPages ? ' disabled' : '') + '>次へ &gt;</button>';
      pagination.innerHTML = html;
    }

    pagination.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-page]');
      if (!btn || btn.disabled) return;
      currentPage = Number(btn.dataset.page);
      render();
    });

    render();
    startPolling(render);
  }

  // ============================================================
  // SCR-022 棚卸入力（スマホ・作業員）
  // ============================================================

  function initMobile() {
    var el = function (id) { return document.getElementById(id); };
    var currentLocation = null;   // null なら棚ロケ一覧を表示
    var listMode = 'all';         // 一覧の種類: all = 全棚ロケ / recount = 数え直しの棚ロケだけ
    var showScan = false;         // 「QR 読取」タブを表示中か
    var editingMemoId = null;
    var knownRecount = null;      // 前回の取り込みで「数え直し」だった棚ロケ（トースト判定用: #12）

    function worker() { return el('stkWorkerSelect').value; }

    el('stkWorkerSelect').value = sessionGet(WORKER_KEY, '作業員A');
    el('stkWorkerSelect').addEventListener('change', function () {
      sessionSet(WORKER_KEY, worker());
      render(true);
    });

    // 画面下のタブバー（A4 #35）
    document.querySelector('.stk-m-tab-bar').addEventListener('click', function (e) {
      var tab = e.target.closest('[data-tab]');
      if (!tab) return;
      editingMemoId = null;
      if (tab.dataset.tab === 'scan') {
        showScan = true;
      } else {
        showScan = false;
        listMode = tab.dataset.tab === 'recount' ? 'recount' : 'all';
        currentLocation = null;
      }
      render(true);
      window.scrollTo(0, 0);
    });

    // QR 読取（未実装）。モックアップでは「読み取ったことにする棚ロケ」を選んで開く
    el('stkMScanLocation').innerHTML = LOCATIONS.map(function (loc) {
      return '<option value="' + esc(loc) + '">' + esc(loc) + '</option>';
    }).join('');
    el('stkMScanOpenBtn').addEventListener('click', function () {
      listMode = 'all';
      openShelf(el('stkMScanLocation').value);
    });

    el('stkMSearch').addEventListener('input', function () { renderList(load()); });

    el('stkMShelfList').addEventListener('click', function (e) {
      var item = e.target.closest('[data-location]');
      if (!item) return;
      openShelf(item.dataset.location);
    });

    el('stkMBackBtn').addEventListener('click', function () {
      currentLocation = null;
      editingMemoId = null;
      render(true);
      window.scrollTo(0, 0);
    });

    function openShelf(location) {
      currentLocation = location;
      showScan = false;
      editingMemoId = null;
      el('stkMMemoText').value = '';
      render(true);
      window.scrollTo(0, 0);
    }

    // 入力欄から離れた時点で1行ずつ保存する（#5-1）
    el('stkMRowList').addEventListener('change', function (e) {
      var input = e.target.closest('input[data-key]');
      if (!input) return;
      saveInput(input);
      refreshShelfHeader(load());
    });

    // 「1つずつ数える」モード: オンのときだけ「＋1」を出す（誤タップ防止）。タブごとに覚えておく
    el('stkMTallyMode').checked = sessionGet(TALLY_KEY, '') === 'on';
    applyTallyMode();
    el('stkMTallyMode').addEventListener('change', function () {
      sessionSet(TALLY_KEY, el('stkMTallyMode').checked ? 'on' : '');
      applyTallyMode();
    });

    function applyTallyMode() {
      el('stkMRowList').classList.toggle('stk-m-tally-on', el('stkMTallyMode').checked);
    }

    // 「＋1」: その行の数を 1 増やしてすぐ保存する。空欄なら 1 から。入力欄にはフォーカスを移さない（キーボードを出さない）
    // 押した直後は数字を光らせ、増えたことを分かるようにする
    el('stkMRowList').addEventListener('click', function (e) {
      var plus = e.target.closest('.stk-m-plus');
      if (!plus || plus.disabled) return;
      var input = plus.closest('li').querySelector('input[data-key]');
      var raw = input.value.trim();
      if (raw !== '' && !/^\d+$/.test(raw)) {
        showToast('error', '実数は 0 以上の整数で入力してください');
        return;
      }
      var before = input.value;
      input.value = String((raw === '' ? 0 : Number(raw)) + 1);
      if (!saveInput(input)) {
        input.value = before;
        return;
      }
      input.classList.remove('stk-m-qty-flash');
      void input.offsetWidth; // 連打でもアニメーションをやり直す
      input.classList.add('stk-m-qty-flash');
      refreshShelfHeader(load());
    });

    // 「この棚を完了」の可否は入力欄の現在の値で判定する（保存前の最後の入力も数える）
    el('stkMRowList').addEventListener('input', function () {
      updateCompleteButton();
    });

    // 「この棚を完了」: 完了後は作業員から修正できない（#8）ため、確認モーダルで入力した数を見直してもらう
    el('stkMCompleteBtn').addEventListener('click', function () {
      // 未保存の値を先に保存してから確認に進む
      var inputs = el('stkMRowList').querySelectorAll('input[data-key]');
      for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].value !== inputs[i].dataset.saved && !saveInput(inputs[i])) return;
      }
      openCompleteConfirm();
    });

    el('stkMCompleteCancel').addEventListener('click', function () {
      closeModal('stkMCompleteModal');
    });

    el('stkMCompleteOk').addEventListener('click', function () {
      closeModal('stkMCompleteModal');
      completeCurrentShelf();
    });

    function openCompleteConfirm() {
      var info = shelfInfo(load(), currentLocation);
      el('stkMCompleteTitle').textContent = info.location + ' を完了しますか？';
      // 保存済みの数を見直してもらう。帳簿数は出さない（#7）
      el('stkMCompleteList').innerHTML = info.rows.length === 0
        ? '<li class="stk-m-confirm-empty">入力する行はありません（棚に何も無い）。</li>'
        : info.rows.map(function (row) {
          return '<li class="stk-m-confirm-row">' +
            '<div class="stk-m-confirm-item">' + esc(row.item.name) +
            '<dl class="stk-m-row-attrs">' + attrHtml('ロット', row.lotNo) + attrHtml('賞味期限', row.expiry) + '</dl></div>' +
            '<span class="stk-m-confirm-qty">' + esc(row.count) + ' ' + esc(row.item.unit) + '</span>' +
            '</li>';
        }).join('');
      var memoText = el('stkMMemoText').value.trim();
      el('stkMCompleteMemo').hidden = !memoText;
      el('stkMCompleteMemoText').textContent = memoText;
      openModal('stkMCompleteModal');
    }

    function completeCurrentShelf() {
      var location = currentLocation;
      // メモ欄に書きかけの文字があれば、メモとして追加してから完了する
      // （メモ欄に書いただけで完了すると起票されると誤解しやすいため）
      var memoText = el('stkMMemoText').value.trim();
      if (memoText) {
        if (!notifyResult(Actions.addMemo(location, memoText, worker()))) return;
        el('stkMMemoText').value = '';
      }
      var message = location + ' を完了しました' + (memoText ? '。メモも追加しました' : '');
      if (notifyResult(Actions.completeShelf(location), message)) {
        currentLocation = null;
        render(true);
        window.scrollTo(0, 0);
      } else {
        render(true);
      }
    }

    el('stkMMemoAddBtn').addEventListener('click', function () {
      var text = el('stkMMemoText').value.trim();
      if (notifyResult(Actions.addMemo(currentLocation, text, worker()), 'メモを追加しました')) {
        el('stkMMemoText').value = '';
        render(true);
      }
    });

    el('stkMMemoList').addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-action]');
      if (!btn) return;
      var id = Number(btn.dataset.id);
      var action = btn.dataset.action;
      if (action === 'edit') {
        editingMemoId = id;
        render(true);
      } else if (action === 'cancel-edit') {
        editingMemoId = null;
        render(true);
      } else if (action === 'save-edit') {
        var text = el('stkMMemoEditText').value.trim();
        if (notifyResult(Actions.editMemo(id, text, worker()), 'メモを修正しました')) {
          editingMemoId = null;
          render(true);
        }
      } else if (action === 'delete') {
        if (notifyResult(Actions.deleteMemo(id, worker()), 'メモを削除しました')) render(true);
      }
    });

    // 行の属性（見出し＋値）。値が無ければ「‐」を薄く出す
    function attrHtml(label, value) {
      return '<div class="stk-m-attr"><dt>' + esc(label) + '</dt>' +
        '<dd' + (value ? '' : ' class="is-empty"') + '>' + esc(dash(value)) + '</dd></div>';
    }

    function saveInput(input) {
      var raw = input.value.trim();
      var qty = null;
      if (raw !== '') {
        if (!/^\d+$/.test(raw)) {
          showToast('error', '実数は 0 以上の整数で入力してください');
          return false;
        }
        qty = Number(raw);
      }
      var error = Actions.saveCount(currentLocation, input.dataset.key, qty, worker());
      if (!notifyResult(error)) return false;
      input.dataset.saved = raw;
      input.closest('li').classList.toggle('stk-m-row--empty', raw === '');
      return true;
    }

    function updateCompleteButton() {
      var btn = el('stkMCompleteBtn');
      var inputs = el('stkMRowList').querySelectorAll('input[data-key]');
      var editable = inputs.length === 0 ? btn.dataset.editable === 'true' : !inputs[0].disabled;
      var allFilled = Array.prototype.every.call(inputs, function (i) { return i.value.trim() !== ''; });
      btn.disabled = !(editable && allFilled);
    }

    // 入力中（フォーカスのある欄・編集中のメモ）は取り込みで描き替えない（#11）
    function isUserEditing() {
      var active = document.activeElement;
      if (!active) return false;
      if (el('stkMRowList').contains(active) && active.tagName === 'INPUT') return true;
      if (editingMemoId != null) return true;
      return false;
    }

    function notifyNewRecount(state) {
      var now = {};
      if (state.session) {
        LOCATIONS.forEach(function (loc) {
          if (state.shelves[loc] && state.shelves[loc].status === 'recount') now[loc] = true;
        });
      }
      // ページを開いた直後は通知しない（一覧の先頭表示で分かるため）
      if (knownRecount) {
        Object.keys(now).forEach(function (loc) {
          if (!knownRecount[loc]) showToast('info', loc + ' が数え直しになりました。空欄の行を数えてください', 8000);
        });
      }
      knownRecount = now;
    }

    function render(force) {
      var state = load();
      notifyNewRecount(state);
      var session = state.session;
      var sessionText = session ? '実施日 ' + session.startedOn : '';
      el('stkMSessionText').textContent = sessionText;
      renderTabBar(state);

      if (!session) currentLocation = null;
      el('stkMScanView').hidden = !showScan;
      el('stkMScanOpenBtn').disabled = !session;
      el('stkMNoSession').hidden = !!session;
      el('stkMListView').hidden = showScan || !session || !!currentLocation;
      el('stkMShelfView').hidden = showScan || !session || !currentLocation;
      el('stkMActionBar').hidden = true; // 入力画面で入力できるときだけ refreshShelfHeader で出す
      if (showScan || !session) return;
      if (currentLocation) {
        renderShelf(state, force);
      } else {
        renderList(state);
      }
    }

    // タブの選択状態と、数え直しの件数バッジ
    function renderTabBar(state) {
      var recountCount = state.session
        ? LOCATIONS.filter(function (loc) { return state.shelves[loc] && state.shelves[loc].status === 'recount'; }).length
        : 0;
      var badge = el('stkMRecountBadge');
      badge.hidden = recountCount === 0;
      badge.textContent = recountCount;
      var active = showScan ? 'scan' : listMode === 'recount' ? 'recount' : 'list';
      document.querySelectorAll('.stk-m-tab').forEach(function (tab) {
        var isActive = tab.dataset.tab === active;
        tab.classList.toggle('is-active', isActive);
        if (isActive) tab.setAttribute('aria-current', 'page');
        else tab.removeAttribute('aria-current');
      });
    }

    function renderList(state) {
      var keyword = el('stkMSearch').value.trim().toLowerCase();
      el('stkMListTitle').textContent = listMode === 'recount' ? '数え直しの棚ロケ' : '棚ロケ一覧';
      var infos = LOCATIONS.map(function (loc) { return shelfInfo(state, loc); }).filter(function (info) {
        if (listMode === 'recount' && info.status !== 'recount') return false;
        if (!keyword) return true;
        if (info.location.toLowerCase().indexOf(keyword) >= 0) return true;
        return info.rows.some(function (r) {
          return (r.item.name + r.item.code).toLowerCase().indexOf(keyword) >= 0;
        });
      });
      // 数え直しの棚ロケを先頭に表示する（#12）
      infos.sort(function (a, b) {
        var ra = a.status === 'recount' ? 0 : 1;
        var rb = b.status === 'recount' ? 0 : 1;
        return ra - rb || LOCATIONS.indexOf(a.location) - LOCATIONS.indexOf(b.location);
      });
      el('stkMShelfList').innerHTML = infos.length === 0
        ? '<li class="stk-m-empty">' + (listMode === 'recount' ? '数え直しの棚ロケはありません。' : '該当する棚ロケはありません。') + '</li>'
        : infos.map(function (info) {
          return '<li>' +
            '<button type="button" class="stk-m-shelf-card' + (info.status === 'recount' ? ' stk-m-shelf-card--recount' : '') + '" data-location="' + esc(info.location) + '">' +
            '<span class="stk-m-shelf-card-row"><span class="stk-m-shelf-code">' + esc(info.location) + '</span>' + badgeHtml(info.status) + '</span>' +
            '<span class="stk-m-shelf-card-row stk-m-shelf-meta">' +
            '<span>入力 ' + info.filled + ' / ' + info.total + ' 行</span>' +
            '<span>' + (info.lastBy ? '最終入力: ' + esc(info.lastBy) : '') + '</span>' +
            '</span>' +
            '</button></li>';
        }).join('');
    }

    function refreshShelfHeader(state) {
      var info = shelfInfo(state, currentLocation);
      el('stkMShelfCode').textContent = info.location;
      el('stkMShelfBadge').innerHTML = badgeHtml(info.status);
      var editable = EDITABLE_STATUSES.indexOf(info.status) >= 0;
      el('stkMShelfNotice').textContent =
        info.status === 'recount' ? '事務所から数え直しの指示がありました。空欄の行を数えて入力し、「この棚を完了」を押してください。'
        : info.status === 'counted' ? 'この棚は完了済みです（事務所で確認中）。修正が必要なら事務所に連絡してください。'
        : info.status === 'confirmed' ? 'この棚は事務所で確認済みです。'
        : info.total === 0 ? '帳簿上は在庫がありません。棚に何も無ければ「この棚を完了」を押してください。何かあればメモに書いてください。'
        : 'すべての行に数を入力してください（現物が無い行は 0）。入力欄から離れると保存されます。書きかけのメモは「この棚を完了」でも追加されます。';
      el('stkMShelfNotice').className = 'stk-m-notice' + (info.status === 'recount' ? ' stk-m-notice--recount' : '');
      // 「この棚を完了」は画面下の操作バーに固定表示する。入力できない状態では出さない
      el('stkMActionBar').hidden = !editable;
      // 「1つずつ数える」の切り替えは、数える行があって入力できるときだけ出す
      el('stkMTallyMode').closest('label').hidden = !editable || info.total === 0;
      el('stkMCompleteBtn').dataset.editable = editable ? 'true' : 'false';
      updateCompleteButton();
    }

    function renderShelf(state, force) {
      var info = shelfInfo(state, currentLocation);
      var editable = EDITABLE_STATUSES.indexOf(info.status) >= 0;

      if (force || !isUserEditing()) {
        // 帳簿数は表示しない（#7）
        el('stkMRowList').innerHTML = info.rows.length === 0
          ? '<li class="stk-m-empty">行はありません。</li>'
          : info.rows.map(function (row) {
            var value = row.count == null ? '' : String(row.count);
            var inputId = 'stkMQty-' + row.key.replace(/[^A-Za-z0-9]/g, '_');
            return '<li class="stk-m-row' + (value === '' ? ' stk-m-row--empty' : '') + '">' +
              '<div class="stk-m-row-item">' + esc(row.item.name) + ' <span class="stk-item-code">' + esc(row.item.code) + '</span></div>' +
              // ロット番号・賞味期限は現物と照らし合わせる値なので、見出しは薄く小さく、値は濃く見せる
              '<dl class="stk-m-row-attrs">' +
              attrHtml('ロット', row.lotNo) +
              attrHtml('賞味期限', row.expiry) +
              '</dl>' +
              (row.merged ? '<div class="stk-tag">入庫日違い ' + row.lots.length + ' 件をまとめて表示（まとめて数える）</div>' : '') +
              (row.added ? '<div class="stk-tag">事務所で追加した行</div>' : '') +
              '<div class="stk-m-qty">' +
              '<label class="sr-only" for="' + inputId + '">' + esc(row.item.name) + ' の実数</label>' +
              '<input id="' + inputId + '" class="form-input stk-m-qty-input" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off"' +
              ' data-key="' + esc(row.key) + '" data-saved="' + esc(value) + '" value="' + esc(value) + '"' + (editable ? '' : ' disabled') + '>' +
              '<span class="stk-m-unit">' + esc(row.item.unit) + '</span>' +
              // 1つずつ数えながら増やすためのボタン（減らすときは入力欄を直接書き換える）
              '<button type="button" class="btn btn-primary stk-m-plus" aria-label="' + esc(row.item.name) + ' を 1 増やす"' +
              (editable ? '' : ' disabled') + '>＋1</button>' +
              '</div>' +
              '</li>';
          }).join('');
      }

      if (force || editingMemoId == null) {
        var me = worker();
        var memos = state.memos.filter(function (m) { return m.location === currentLocation; });
        el('stkMMemoList').innerHTML = memos.map(function (m) {
          var mine = m.by === me && !m.done;
          if (mine && m.id === editingMemoId) {
            return '<li class="stk-m-memo-item">' +
              '<textarea id="stkMMemoEditText" class="form-input form-textarea">' + esc(m.text) + '</textarea>' +
              '<div class="stk-m-memo-actions">' +
              '<button type="button" class="btn btn-primary" data-action="save-edit" data-id="' + m.id + '">保存</button>' +
              '<button type="button" class="btn btn-default" data-action="cancel-edit" data-id="' + m.id + '">やめる</button>' +
              '</div></li>';
          }
          return '<li class="stk-m-memo-item' + (m.done ? ' is-done' : '') + '">' +
            '<div class="stk-memo-meta">' + esc(m.by) + '・' + esc(m.at) + ' ' +
            (m.done ? '<span class="status-badge status-badge--success">対応済み</span>' : '<span class="status-badge status-badge--warning">未対応</span>') +
            '</div>' +
            '<p class="stk-memo-text">' + esc(m.text) + '</p>' +
            (mine
              ? '<div class="stk-m-memo-actions">' +
                '<button type="button" class="btn btn-default" data-action="edit" data-id="' + m.id + '">修正</button>' +
                '<button type="button" class="btn btn-default" data-action="delete" data-id="' + m.id + '">削除</button>' +
                '</div>'
              : '') +
            '</li>';
        }).join('');
      }

      refreshShelfHeader(state);
    }

    render(true);
    startPolling(function () { render(false); });
  }

  // ---- 画面ごとの起動 ----

  if (document.getElementById('stkShelfTableBody')) initPc();
  if (document.getElementById('stkHistoryTableBody')) initHistory();
  if (document.getElementById('stkMShelfList')) initMobile();
})();
