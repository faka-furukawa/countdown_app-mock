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

function computeProgress(grade, today) {
  const ay = academicYearStart(today);
  const entryDate = new Date(ay - (grade - 1), 3, 1); // 現学年度からgrade-1年遡った4/1
  const graduationDate = new Date(ay + (TOTAL_GRADES - grade) + 1, 2, 31); // 4年目終了年の3/31

  const remainingDays = Math.max(0, daysBetween(today, graduationDate));
  const elapsedDaysTotal = Math.max(0, daysBetween(entryDate, today));
  const totalDaysTotal = Math.max(1, daysBetween(entryDate, graduationDate));

  const totalWeeks = Math.round(totalDaysTotal / 7);
  const elapsedWeeks = Math.min(totalWeeks, Math.floor(elapsedDaysTotal / 7));
  const remainingWeeks = Math.max(0, totalWeeks - elapsedWeeks - 1); // 「今週」を除いた残り
  const elapsedRatio = Math.min(1, elapsedDaysTotal / totalDaysTotal);

  // 残りの長期休暇（夏休み・春休み、それぞれ年2回想定）を卒業までの範囲で数える
  let remainingBreaks = 0;
  for (let i = 0; ay + i <= ay + (TOTAL_GRADES - grade); i++) {
    const summerBreak = new Date(ay + i, 7, 1);
    const springBreak = new Date(ay + i + 1, 1, 1);
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

function render(grade) {
  const today = new Date();
  const progress = computeProgress(grade, today);
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

  document.querySelectorAll('.grade-btn').forEach((btn) => {
    const isActive = Number(btn.dataset.grade) === grade;
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
      const grade = Number(btn.dataset.grade);
      saveJSON(STORAGE_KEYS.grade, grade);
      render(grade);
    });
  });

  const storedGrade = loadJSON(STORAGE_KEYS.grade);
  render(storedGrade >= 1 && storedGrade <= 4 ? storedGrade : 1);
})();
