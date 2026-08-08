// ===== 週次目標・振り返り: 土曜日起点の週ごとに目標設定と自己評価を行う =====
// utils.js の読み込みが必要 (getWeekStartSaturday, addDays, formatDateInput, supabaseClient, getSupabaseReady)
// 見た目は partials/weeklyReview.html をfetchして #task-slot-weekly-panel に注入する（タスク枠内のタブの1つ）
// goalへの紐付けはしない。週次の目標は特定の目標(卒業など)に属さず、ユーザー単位の習慣のため

let weeklyGoals = { current: null, previous: null };
let editingCurrentGoal = false;

function renderWeeklyReview() {
  const prev = weeklyGoals.previous;
  const showReflection = !!(prev && prev.achieved === null);
  document.getElementById('weekly-reflection-block').classList.toggle('hidden', !showReflection);
  if (showReflection) {
    document.getElementById('weekly-reflection-goal-text').textContent = prev.goal_text;
  }

  const current = weeklyGoals.current;
  const showDisplay = !!current && !editingCurrentGoal;
  document.getElementById('weekly-goal-display-block').classList.toggle('hidden', !showDisplay);
  document.getElementById('weekly-goal-form-block').classList.toggle('hidden', showDisplay);

  if (showDisplay) {
    document.getElementById('weekly-goal-display-text').textContent = current.goal_text;
  } else {
    document.getElementById('weekly-goal-input').value = current ? current.goal_text : '';
  }
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
        reflectionInput.value = '';
        renderWeeklyReview();
      }
    });
  });

  document.getElementById('edit-current-goal').addEventListener('click', () => {
    editingCurrentGoal = true;
    renderWeeklyReview();
  });

  document.getElementById('weekly-goal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('weekly-goal-input');
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

(async function initWeeklyReview() {
  const root = document.getElementById('task-slot-weekly-panel');
  const res = await fetch('partials/weeklyReview.html');
  root.innerHTML = await res.text();

  attachWeeklyReviewHandlers();

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
