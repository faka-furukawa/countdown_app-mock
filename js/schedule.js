// ===== スケジュール: 期日つきの予定を追加、近い順+残り日数バッジ（localStorageに保存され、再訪問時も復元される） =====
// utils.js の読み込みが必要 (startOfDay, daysBetween, parseDateInput, formatDateInput, loadJSON, saveJSON, STORAGE_KEYS)

const storedSchedules = loadJSON(STORAGE_KEYS.schedules);
let schedules = storedSchedules
  ? storedSchedules.map((s) => ({ ...s, date: parseDateInput(s.date) }))
  : (() => {
      const scheduleToday0 = startOfDay(new Date());
      return [
        { id: 's1', title: 'TOEIC受験', date: addDays(scheduleToday0, 14) },
        { id: 's2', title: '長期インターン選考', date: addDays(scheduleToday0, 45) },
        { id: 's3', title: 'ゼミ中間発表', date: addDays(scheduleToday0, -3) },
      ];
    })();

function renderSchedules() {
  const listEl = document.getElementById('schedule-list');
  listEl.innerHTML = '';
  const today0 = startOfDay(new Date());
  const sorted = [...schedules].sort((a, b) => {
    const aOverdue = a.date < today0;
    const bOverdue = b.date < today0;
    if (aOverdue !== bOverdue) return aOverdue ? 1 : -1; // 期限切れは末尾へ
    return aOverdue ? b.date - a.date : a.date - b.date; // 期限切れは新しい順、それ以外は近い順
  });

  sorted.forEach((item) => {
    const daysUntil = daysBetween(today0, item.date);
    const li = document.createElement('li');
    li.className = 'flex items-center justify-between gap-2 text-sm px-2 py-1.5 rounded';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'truncate';
    titleSpan.textContent = item.title;

    const badge = document.createElement('span');
    badge.className = 'text-xs shrink-0 tabular-nums';

    if (daysUntil < 0) {
      li.classList.add('text-zinc-600');
      badge.textContent = '期限切れ';
      badge.classList.add('text-zinc-600');
    } else if (daysUntil === 0) {
      li.classList.add('text-zinc-200');
      badge.textContent = '今日';
      badge.classList.add('text-orange-500', 'font-bold');
    } else {
      li.classList.add('text-zinc-200');
      badge.textContent = `あと${daysUntil}日`;
      badge.classList.add('text-orange-500');
    }

    li.appendChild(titleSpan);
    li.appendChild(badge);
    listEl.appendChild(li);
  });

  document.getElementById('schedule-count').textContent = `${schedules.length}件`;
  saveJSON(STORAGE_KEYS.schedules, schedules.map((s) => ({ ...s, date: formatDateInput(s.date) })));
}

document.getElementById('schedule-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const titleInput = document.getElementById('schedule-title-input');
  const dateInput = document.getElementById('schedule-date-input');
  const title = titleInput.value.trim();
  const dateValue = dateInput.value;
  if (!title || !dateValue) return;
  schedules.push({ id: 's' + Date.now(), title, date: parseDateInput(dateValue) });
  titleInput.value = '';
  dateInput.value = '';
  renderSchedules();
});

renderSchedules();
