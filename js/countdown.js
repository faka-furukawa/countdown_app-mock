// ===== カウントダウン: 学年選択と卒業までの残り日数計算 =====
// utils.js の読み込みが必要 (startOfDay, daysBetween, loadJSON, saveJSON, STORAGE_KEYS)
// 中央の「残り日数」表示は partials/countdown.html をfetchして #countdown-root に注入する

const TOTAL_GRADES = 4;

// 日本の学年暦（4/1始まり）における「今の学年度が始まった年」を返す
function academicYearStart(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  return m >= 4 ? y : y - 1;
}

// 引数を「学年(grade)」から「入学年度(entryYear)」に変更
function computeProgress(entryYear, today) {
  const entryDate = new Date(entryYear, 3, 1); // 入学年度の4月1日
  const graduationDate = new Date(entryYear + TOTAL_GRADES, 2, 31); // 4年目の3月31日

  const remainingDays = Math.max(0, daysBetween(today, graduationDate));
  const elapsedDaysTotal = Math.max(0, daysBetween(entryDate, today));
  const totalDaysTotal = Math.max(1, daysBetween(entryDate, graduationDate));

  const totalWeeks = Math.round(totalDaysTotal / 7);
  const elapsedWeeks = Math.min(totalWeeks, Math.floor(elapsedDaysTotal / 7));
  const remainingWeeks = Math.max(0, totalWeeks - elapsedWeeks - 1); // 「今週」を除いた残り
  const elapsedRatio = Math.min(1, elapsedDaysTotal / totalDaysTotal);

  // 残りの長期休暇（夏休み・春休み、それぞれ年2回想定）を卒業までの範囲で数える
  let remainingBreaks = 0;
  // 入学年度から4年間分をループして判定
  for (let i = 0; i < TOTAL_GRADES; i++) {
    const summerBreak = new Date(entryYear + i, 7, 1);      // 8月1日を想定
    const springBreak = new Date(entryYear + i + 1, 1, 1);  // 翌年の2月1日を想定
    [summerBreak, springBreak].forEach((breakDate) => {
      if (breakDate > startOfDay(today) && breakDate <= graduationDate) {
        remainingBreaks++;
      }
    });
  }

  return {
    entryDate, graduationDate,
    totalWeeks, elapsedWeeks, remainingWeeks,
    remainingDays, remainingBreaks, elapsedRatio,
  };
}

// 秒刻みの表示（残り日数の下のHH:MM:SS）。1日の中の残り時間を24時間ループで表示する
let tickerIntervalId = null;

function updateRemainingTime(graduationDeadline) {
  const el = document.getElementById('remaining-time');
  if (!el) return;

  const diffMs = Math.max(0, graduationDeadline - new Date());
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600) % 24;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const seconds = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, '0');
  el.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function startTicker(entryYear) {
  // 卒業の締切ちょうど（4年目の4/1 0:00）を秒単位の基準にする
  const graduationDeadline = new Date(entryYear + TOTAL_GRADES, 3, 1);

  if (tickerIntervalId) {
    clearInterval(tickerIntervalId);
  }
  updateRemainingTime(graduationDeadline);
  tickerIntervalId = setInterval(() => updateRemainingTime(graduationDeadline), 1000);
}

function renderGrid(progress) {
  const gridEl = document.getElementById('week-grid');
  gridEl.innerHTML = '';
  for (let i = 0; i < progress.totalWeeks; i++) {
    const cell = document.createElement('div');
    cell.className = 'aspect-square';
    if (i < progress.elapsedWeeks) {
      cell.classList.add('bg-zinc-800');
    } else if (i === progress.elapsedWeeks) {
      cell.classList.add('bg-orange-500');
    } else {
      cell.classList.add('bg-orange-500/20');
    }
    gridEl.appendChild(cell);
  }
}

// 引数を「学年(grade)」から「入学年度(entryYear)」に変更
function render(entryYear) {
  const today = new Date();
  const progress = computeProgress(entryYear, today);
  const ratioPct = Math.round(progress.elapsedRatio * 100) + '%';

  document.getElementById('remaining-days').textContent = progress.remainingDays;
  document.getElementById('remaining-days-sticky').textContent = progress.remainingDays;
  document.getElementById('remaining-weeks').textContent = progress.remainingWeeks;
  document.getElementById('elapsed-ratio').textContent = ratioPct;

  document.getElementById('card-remaining-weeks').textContent = progress.remainingWeeks;
  document.getElementById('card-remaining-days').textContent = progress.remainingDays;
  document.getElementById('card-remaining-breaks').textContent = progress.remainingBreaks;
  document.getElementById('card-elapsed-ratio').textContent = ratioPct;

  renderGrid(progress);
  startTicker(entryYear);

  // 現在の学年度から「現在の学年」を計算し、ボタンのアクティブ状態を制御する
  const currentAy = academicYearStart(today);
  const currentGrade = currentAy - entryYear + 1;

  document.querySelectorAll('.grade-btn').forEach((btn) => {
    const isActive = Number(btn.dataset.grade) === currentGrade;
    btn.classList.toggle('border-orange-500', isActive);
    btn.classList.toggle('text-orange-500', isActive);
    btn.classList.toggle('border-zinc-800', !isActive);
    btn.classList.toggle('text-zinc-500', !isActive);
  });
}

(async function initCountdown() {
  const root = document.getElementById('countdown-root');
  const res = await fetch('partials/countdown.html');
  root.innerHTML = await res.text();

  document.querySelectorAll('.grade-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const selectedGrade = Number(btn.dataset.grade);
      const currentAy = academicYearStart(new Date());
      // クリックされた「学年」から「入学年度」を逆算して保存
      const entryYear = currentAy - (selectedGrade - 1);
      
      // STORAGE_KEYS.entryYear を utils.js 側で新設推奨（ここでは既存キーの互換利用も想定）
      saveJSON(STORAGE_KEYS.entryYear || STORAGE_KEYS.grade, entryYear);
      render(entryYear);
    });
  });

  const today = new Date();
  const currentAy = academicYearStart(today);
  
  // 保存されているデータの取得 (古い「学年(1~4)」が入っている場合の対策付き)
  let storedData = loadJSON(STORAGE_KEYS.entryYear || STORAGE_KEYS.grade);
  let entryYear;

  if (storedData >= 1 && storedData <= 4) {
    // 古い仕様(学年)で保存されていた場合、自動的に入学年度に変換する
    entryYear = currentAy - (storedData - 1);
    saveJSON(STORAGE_KEYS.entryYear || STORAGE_KEYS.grade, entryYear);
  } else if (storedData > 2000) {
    // 正しく入学年度(例: 2023)で保存されている場合
    entryYear = storedData;
  } else {
    // 初回アクセス時は今の年度を「1年生(入学年度)」として扱う
    entryYear = currentAy;
  }

  render(entryYear);
})();