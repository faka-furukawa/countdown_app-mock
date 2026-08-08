// ===== タスク枠のタブ切り替え: 「タスク」「週次目標」のどちらか片方だけを表示する =====
// utils.js の読み込みが必要 (loadJSON, saveJSON)
// tasks.js/weeklyReview.jsが#task-slot-tasks-panel/#task-slot-weekly-panelに中身を注入した後も、
// このスクリプトは表示/非表示の切り替えだけを担当する（各パネルの中身には関与しない）

const TASK_SLOT_VIEW_KEY = 'countdown-mock:task-slot-view';

function setTaskSlotView(view) {
  const isTasks = view !== 'weekly';

  document.getElementById('task-slot-tasks-panel').classList.toggle('hidden', !isTasks);
  document.getElementById('task-slot-weekly-panel').classList.toggle('hidden', isTasks);

  const tabTasks = document.getElementById('task-slot-tab-tasks');
  const tabWeekly = document.getElementById('task-slot-tab-weekly');
  [[tabTasks, isTasks], [tabWeekly, !isTasks]].forEach(([btn, active]) => {
    btn.classList.toggle('border-orange-500', active);
    btn.classList.toggle('text-orange-500', active);
    btn.classList.toggle('border-zinc-800', !active);
    btn.classList.toggle('text-zinc-500', !active);
  });

  saveJSON(TASK_SLOT_VIEW_KEY, view);
}

document.getElementById('task-slot-tab-tasks').addEventListener('click', () => setTaskSlotView('tasks'));
document.getElementById('task-slot-tab-weekly').addEventListener('click', () => setTaskSlotView('weekly'));

setTaskSlotView(loadJSON(TASK_SLOT_VIEW_KEY) === 'weekly' ? 'weekly' : 'tasks');
