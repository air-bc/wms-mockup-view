(function () {
  'use strict';

  const STORAGE_KEY = 'wms_sticky_notes';
  const DEFAULT_W = 200;
  const DEFAULT_H = 150;
  const MIN_W = 160;
  const MIN_H = 96;

  function getPageKey() {
    return location.pathname.split('/').pop() || 'index.html';
  }

  function loadAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  function saveAll(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function loadPage() {
    return loadAll()[getPageKey()] || [];
  }

  function collectCurrentNotes() {
    return Array.from(document.querySelectorAll('.sticky-note')).map(el => ({
      id: el.dataset.id,
      x: parseInt(el.style.left, 10),
      y: parseInt(el.style.top, 10),
      w: parseInt(el.style.width, 10),
      h: parseInt(el.style.height, 10),
      text: el.querySelector('.sticky-note__body').value,
      minimized: el.classList.contains('sticky-note--minimized'),
    }));
  }

  function savePage() {
    const all = loadAll();
    all[getPageKey()] = collectCurrentNotes();
    saveAll(all);
  }

  let saveTimer = null;
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(savePage, 300);
  }

  function toggleMinimize(el) {
    el.classList.toggle('sticky-note--minimized');
    savePage();
  }

  function makeDraggable(el) {
    const header = el.querySelector('.sticky-note__header');
    header.addEventListener('mousedown', e => {
      if (e.target.closest('.sticky-note__close')) return;
      if (e.target.closest('.sticky-note__minimize')) return;
      const rect = el.getBoundingClientRect();
      const ox = e.clientX - rect.left;
      const oy = e.clientY - rect.top;
      el.classList.add('sticky-note--dragging');

      function onMove(e) {
        el.style.left = (e.clientX - ox) + 'px';
        el.style.top  = (e.clientY - oy) + 'px';
      }
      function onUp() {
        el.classList.remove('sticky-note--dragging');
        savePage();
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  function makeResizable(el) {
    const handle = el.querySelector('.sticky-note__resize-handle');
    handle.addEventListener('mousedown', e => {
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = el.offsetWidth;
      const startH = el.offsetHeight;

      function onMove(e) {
        el.style.width  = Math.max(MIN_W, startW + e.clientX - startX) + 'px';
        el.style.height = Math.max(MIN_H, startH + e.clientY - startY) + 'px';
      }
      function onUp() {
        savePage();
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  function createNoteEl(note) {
    const el = document.createElement('div');
    el.className = 'sticky-note';
    el.dataset.id = note.id;
    el.style.left   = note.x + 'px';
    el.style.top    = note.y + 'px';
    el.style.width  = note.w + 'px';
    el.style.height = note.h + 'px';

    el.innerHTML = `
      <div class="sticky-note__header">
        <button class="sticky-note__minimize" aria-label="付箋を最小化" title="最小化">−</button>
        <button class="sticky-note__close" aria-label="付箋を削除" title="削除">×</button>
      </div>
      <textarea class="sticky-note__body" placeholder="メモを入力..."></textarea>
      <div class="sticky-note__resize-handle" title="リサイズ"></div>
    `;

    if (note.minimized) el.classList.add('sticky-note--minimized');

    el.querySelector('.sticky-note__body').value = note.text || '';
    el.querySelector('.sticky-note__minimize').addEventListener('click', () => toggleMinimize(el));
    el.querySelector('.sticky-note__close').addEventListener('click', () => {
      el.remove();
      savePage();
    });
    el.querySelector('.sticky-note__body').addEventListener('input', scheduleSave);

    makeDraggable(el);
    makeResizable(el);
    return el;
  }

  function addNote() {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const note = {
      id,
      x: Math.round(window.innerWidth  / 2 - DEFAULT_W / 2),
      y: Math.round(window.innerHeight / 2 - DEFAULT_H / 2),
      w: DEFAULT_W,
      h: DEFAULT_H,
      text: '',
    };
    const el = createNoteEl(note);
    document.body.appendChild(el);
    savePage();
    el.querySelector('.sticky-note__body').focus();
  }

  function renderAll() {
    document.querySelectorAll('.sticky-note').forEach(el => el.remove());
    loadPage().forEach(note => document.body.appendChild(createNoteEl(note)));
  }

  function exportJSON() {
    const json = JSON.stringify(loadAll(), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'sticky-notes-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON() {
    const input  = document.createElement('input');
    input.type   = 'file';
    input.accept = '.json';
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = JSON.parse(e.target.result);
          saveAll(data);
          renderAll();
        } catch {
          alert('JSONファイルの読み込みに失敗しました。');
        }
      };
      reader.readAsText(file);
    });
    input.click();
  }

  function createControls() {
    const bar = document.createElement('div');
    bar.className = 'sticky-controls';
    bar.innerHTML = `
      <button class="sticky-controls__btn" id="stickyAdd"    title="付箋を追加">＋</button>
      <button class="sticky-controls__btn" id="stickyExport" title="エクスポート（JSON保存）">↓</button>
      <button class="sticky-controls__btn" id="stickyImport" title="インポート（JSON読込）">↑</button>
    `;
    document.body.appendChild(bar);
    document.getElementById('stickyAdd').addEventListener('click', addNote);
    document.getElementById('stickyExport').addEventListener('click', exportJSON);
    document.getElementById('stickyImport').addEventListener('click', importJSON);
  }

  document.addEventListener('DOMContentLoaded', () => {
    createControls();
    renderAll();
  });
})();
