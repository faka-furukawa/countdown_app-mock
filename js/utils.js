// ===== 共通ユーティリティ: 日付計算とlocalStorage永続化 =====
// countdown.js / tasks.js / schedule.js から使われる共通処理。
// このファイルを一番最初に読み込むこと。

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(from, to) {
  return Math.round((startOfDay(to) - startOfDay(from)) / MS_PER_DAY);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function parseDateInput(value) {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDateInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// localStorage永続化: ブラウザ＋端末単位で状態を保存する
const STORAGE_KEYS = {
  grade: 'countdown-mock:grade',
  tasks: 'countdown-mock:tasks',
  schedules: 'countdown-mock:schedules',
};

function loadJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null; // プライベートモード等で使えない場合は保存なしにフォールバック
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // 保存できない環境では黙って諦める
  }
}
