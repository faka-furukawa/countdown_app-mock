// ===== 週次目標・振り返り: 土曜日起点の週ごとに目標設定と自己評価を行う =====
// utils.js の読み込みが必要 (getWeekStartSaturday, addDays, formatDateInput, escapeHtml, supabaseClient, getSupabaseReady)
// 見た目は partials/weeklyReview.html をfetchして #task-slot-weekly-panel に注入する（タスク枠内のタブの1つ）
// goalへの紐付けはしない。週次の目標は特定の目標(卒業など)に属さず、ユーザー単位の習慣のため

let weeklyGoals = { current: null, previous: null };
let editingCurrentGoal = false;

function renderWeeklyReview() {
  const el = document.getElementById('weekly-review-content');
  if (!el) return;

  const parts = [];
  const prev = weeklyGoals.previous;

  if (prev && prev.achieved === null) {
    parts.push(`
      <div class="border border-zinc-800 rounded p-3">
        <p class="text-zinc-500 text-xs mb-1">先週の振り返り</p>
        <p class="text-zinc-200 mb-2">${escapeHtml(prev.goal_text)}</p>
        <div class="flex gap-2 mb-2">
          <button type="button" data-achieved="true" class="reflection-btn flex-1 px-2 py-1 text-xs border border-zinc-700 rounded hover:border-orange-500 hover:text-orange-500">達成できた</button>
          <button type="button" data-achieved="false" class="reflection-btn flex-1 px-2 py-1 text-xs border border-zinc-700 rounded hover:border-orange-500 hover:text-orange-500">できなかった</button>
        </div>
        <textarea id="reflection-text" rows="2" placeholder="振り返りメモ（任意）"
          class="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"></textarea>
      </div>
    `);
  }

  const current = weeklyGoals.current;
  if (current && !editingCurrentGoal) {
    parts.push(`
      <div class="border border-zinc-800 rounded p-3">
        <p class="text-zinc-500 text-xs mb-1">今週の目標</p>
        <p class="text-zinc-200 mb-2">${escapeHtml(current.goal_text)}</p>
        <button type="button" id="edit-current-goal" class="text-xs text-zinc-600 hover:text-orange-500">変更する</button>
      </div>
    `);
  } else {
    parts.push(`
      <div class="border border-zinc-800 rounded p-3">
        <p class="text-zinc-500 text-xs mb-2">今週の目標</p>
        <form id="weekly-goal-form" class="flex flex-col gap-2">
          <input id="weekly-goal-input" type="text" placeholder="今週の目標を入力" autocomplete="off"
            class="bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600">
          <button type="submit" class="px-3 py-1.5 text-sm border border-zinc-700 rounded text-zinc-300 hover:border-orange-500 hover:text-orange-500">設定</button>
        </form>
      </div>
    `);
  }

  el.innerHTML = parts.join('');
  attachWeeklyReviewHandlers();
}

function attachWeeklyReviewHandlers() {
  document.querySelectorAll('.reflection-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const achieved = btn.dataset.achieved === 'true';
      const reflectionInput = document.getElementById('reflection-text');
      const reflectionText = reflectionInput.value.trim() || null;

      const { error } = await supabaseClient
        .from('weekly_goals')
        .update({ achieved, reflection_text: reflectionText })
        .eq('id', weeklyGoals.previous.id);

      if (!error) {
        weeklyGoals.previous = { ...weeklyGoals.previous, achieved, reflection_text: reflectionText };
        renderWeeklyReview();
      }
    });
  });

  const editBtn = document.getElementById('edit-current-goal');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      editingCurrentGoal = true;
      renderWeeklyReview();
    });
  }

  const form = document.getElementById('weekly-goal-form');
  if (form) {
    const input = document.getElementById('weekly-goal-input');
    if (weeklyGoals.current) {
      input.value = weeklyGoals.current.goal_text;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const goalText = input.value.trim();
      if (!goalText) return;

      const weekStart = formatDateInput(getWeekStartSaturday(new Date()));
      const { data, error } = await supabaseClient
        .from('weekly_goals')
        .upsert({ week_start: weekStart, goal_text: goalText }, { onConflict: 'user_id,week_start' })
        .select('id, week_start, goal_text, achieved, reflection_text')
        .single();

      if (!error) {
        weeklyGoals.current = data;
        editingCurrentGoal = false;
        renderWeeklyReview();
      }
    });
  }
}

(async function initWeeklyReview() {
  const root = document.getElementById('task-slot-weekly-panel');
  const res = await fetch('partials/weeklyReview.html');
  root.innerHTML = await res.text();

  await getSupabaseReady();

  const today = new Date();
  const currentWeekStart = formatDateInput(getWeekStartSaturday(today));
  const previousWeekStart = formatDateInput(addDays(getWeekStartSaturday(today), -7));

  const { data, error } = await supabaseClient
    .from('weekly_goals')
    .select('id, week_start, goal_text, achieved, reflection_text')
    .in('week_start', [currentWeekStart, previousWeekStart]);

  if (!error && data) {
    weeklyGoals.current = data.find((row) => row.week_start === currentWeekStart) || null;
    weeklyGoals.previous = data.find((row) => row.week_start === previousWeekStart) || null;
  }

  renderWeeklyReview();
})();
