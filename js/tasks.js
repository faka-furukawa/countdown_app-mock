// ===== タスク: 追加・完了トグル（localStorageに保存され、再訪問時も復元される） =====
// utils.js の読み込みが必要 (loadJSON, saveJSON, STORAGE_KEYS)
// 見た目は partials/task.html をfetchして #task-root に注入する

let tasks = loadJSON(STORAGE_KEYS.tasks) || [
  { id: 'c1', title: 'TOEIC 800点', done: false },
  { id: 'c2', title: '個人開発を1本公開', done: false },
  { id: 'c3', title: '長期インターン', done: true },
];

function renderTasks() {
  const listEl = document.getElementById('task-list');
  listEl.innerHTML = '';
  tasks.forEach((task) => {
    const li = document.createElement('li');
    li.className = 'text-sm px-2 py-1.5 rounded cursor-pointer hover:bg-zinc-900 transition-colors '
      + (task.done ? 'text-zinc-600 line-through' : 'text-zinc-200');
    li.textContent = task.title;
    li.addEventListener('click', () => {
      task.done = !task.done;
      renderTasks();
    });
    listEl.appendChild(li);
  });

  const doneCount = tasks.filter((t) => t.done).length;
  document.getElementById('task-count').textContent = `${tasks.length}件中${doneCount}件達成`;
  saveJSON(STORAGE_KEYS.tasks, tasks);
}

(async function initTasks() {
  const root = document.getElementById('task-root');
  const res = await fetch('partials/task.html');
  root.innerHTML = await res.text();

  document.getElementById('task-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('task-input');
    const title = input.value.trim();
    if (!title) return;
    tasks.unshift({ id: 'c' + Date.now(), title, done: false });
    input.value = '';
    renderTasks();
  });

  renderTasks();
})();
