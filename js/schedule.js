// ===== スケジュール: 期日つきの予定を追加、近い順+残り日数バッジ（Supabaseに保存され、同じ匿名アカウントなら再訪問時も復元される） =====
// utils.js の読み込みが必要 (startOfDay, daysBetween, parseDateInput, supabaseClient, getSupabaseReady)
// 見た目は partials/schedule.html をfetchして #schedule-root に注入する

let schedules = []; // 各要素の date はSupabaseから返る 'YYYY-MM-DD' 文字列
let scheduleGoalId = null;

function renderSchedules() {
  const listEl = document.getElementById('schedule-list');
  listEl.innerHTML = '';
  const today0 = startOfDay(new Date());

  const sorted = [...schedules].sort((a, b) => {
    const aDate = parseDateInput(a.date);
    const bDate = parseDateInput(b.date);
    const aOverdue = aDate < today0;
    const bOverdue = bDate < today0;
    if (aOverdue !== bOverdue) return aOverdue ? 1 : -1; // 期限切れは末尾へ
    return aOverdue ? bDate - aDate : aDate - bDate; // 期限切れは新しい順、それ以外は近い順
  });

  sorted.forEach((item) => {
    const itemDate = parseDateInput(item.date);
    const daysUntil = daysBetween(today0, itemDate);
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
}

(async function initSchedule() {
  const root = document.getElementById('schedule-root');
  const res = await fetch('partials/schedule.html');
  root.innerHTML = await res.text();

  const { goalId } = await getSupabaseReady();
  scheduleGoalId = goalId;

  const { data, error } = await supabaseClient
    .from('schedules')
    .select('id, title, date')
    .eq('goal_id', scheduleGoalId);

  if (!error) {
    schedules = data;
    renderSchedules();
  }

  document.getElementById('schedule-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const titleInput = document.getElementById('schedule-title-input');
    const dateInput = document.getElementById('schedule-date-input');
    const title = titleInput.value.trim();
    const dateValue = dateInput.value;
    if (!title || !dateValue) return;
    titleInput.value = '';
    dateInput.value = '';

    const { data: inserted, error: insertError } = await supabaseClient
      .from('schedules')
      .insert({ title, date: dateValue, goal_id: scheduleGoalId })
      .select('id, title, date')
      .single();

    if (!insertError) {
      schedules.push(inserted);
      renderSchedules();
    }
  });
})();
