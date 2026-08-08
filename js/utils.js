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

// localStorage永続化: 学年選択（端末ごとの表示上の好み）はここに保存する
const STORAGE_KEYS = {
  grade: 'countdown-mock:grade',
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

// ===== Supabase: タスク・スケジュールの永続化先。匿名認証で自動的にユーザーを識別する =====
const SUPABASE_URL = 'https://wwgunlkpfhsnxhsykvie.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_S-fB1DyI95SP87BdhFmMng_X4wKq4m-';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 匿名ログイン＋「卒業」ゴールの用意を一度だけ行い、以後は同じPromiseを使い回す
let supabaseReadyPromise = null;
function getSupabaseReady() {
  if (!supabaseReadyPromise) {
    supabaseReadyPromise = (async () => {
      let { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        const { data, error } = await supabaseClient.auth.signInAnonymously();
        if (error) throw error;
        session = data.session;
      }

      let { data: goal } = await supabaseClient
        .from('goals')
        .select('id')
        .eq('title', '卒業')
        .maybeSingle();

      if (!goal) {
        // computeProgress/academicYearStart/formatDateInputはcountdown.js側で定義済み（読み込み順が先のため参照可能）
        // computeProgressの第1引数は「学年」ではなく「入学年度」。今の学年度に入学したもの(1年生)として初期値を作る
        const fallbackEndDate = computeProgress(academicYearStart(new Date()), new Date()).graduationDate;
        const { data: inserted, error: insertError } = await supabaseClient
          .from('goals')
          .insert({ title: '卒業', end_date: formatDateInput(fallbackEndDate) })
          .select('id')
          .single();
        if (insertError) throw insertError;
        goal = inserted;
      }

      return { userId: session.user.id, goalId: goal.id };
    })();
  }
  return supabaseReadyPromise;
}
