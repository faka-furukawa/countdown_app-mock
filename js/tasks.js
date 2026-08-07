// ===== タスク: 追加・完了トグル（Supabaseに保存され、同じ匿名アカウントなら再訪問時も復元される） =====
// utils.js の読み込みが必要 (supabaseClient, getSupabaseReady)
// 見た目は partials/task.html をfetchして #task-root に注入する

let tasks = [];
let taskGoalId = null;

function renderTasks() {
  const listEl = document.getElementById('task-list');
  listEl.innerHTML = '';
  tasks.forEach((task) => {
    const li = document.createElement('li');
    li.className = 'text-sm px-2 py-1.5 rounded cursor-pointer hover:bg-zinc-900 transition-colors '
      + (task.done ? 'text-zinc-600 line-through' : 'text-zinc-200');
    li.textContent = task.title;
    li.addEventListener('click', () => toggleTask(task));
    listEl.appendChild(li);
  });

  const doneCount = tasks.filter((t) => t.done).length;
  document.getElementById('task-count').textContent = `${tasks.length}件中${doneCount}件達成`;
}

async function toggleTask(task) {
  const nextDone = !task.done;
  task.done = nextDone;
  renderTasks();

  const { error } = await supabaseClient.from('tasks').update({ done: nextDone }).eq('id', task.id);
  if (error) {
    task.done = !nextDone; // 保存失敗時は表示を元に戻す
    renderTasks();
  }
}

(async function initTasks() {
  const root = document.getElementById('task-root');
  const res = await fetch('partials/task.html');
  root.innerHTML = await res.text();

  const { goalId } = await getSupabaseReady();
  taskGoalId = goalId;

  const { data, error } = await supabaseClient
    .from('tasks')
    .select('id, title, done')
    .eq('goal_id', taskGoalId)
    .order('created_at', { ascending: false });

  if (!error) {
    tasks = data;
    renderTasks();
  }

  document.getElementById('task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('task-input');
    const title = input.value.trim();
    if (!title) return;
    input.value = '';

    const { data: inserted, error: insertError } = await supabaseClient
      .from('tasks')
      .insert({ title, goal_id: taskGoalId })
      .select('id, title, done')
      .single();

    if (!insertError) {
      tasks.unshift(inserted);
      renderTasks();
    }
  });
})();
