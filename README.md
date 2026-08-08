# Countdown

特定の日付までのカウントダウンを可視化することで、焦燥感を原動力に行動を後押しする目標管理アプリです。「締め切りがないと動けない」大学生をターゲットに、卒業までの残り時間を毎回突きつけます。

**デモ**: https://countdown-app-mock.vercel.app/

## 主な機能

- 学年を選ぶと、実際の日付から卒業（4月始まりの学年暦・4年間）までの残り日数・週数・経過率をリアルタイムに計算
- 残り週数を可視化する週グリッド表示
- タスク（挑戦）の追加・完了管理
- 期日つきスケジュールの追加、近い順ソート＋残り日数バッジ表示
- 匿名認証によるアカウント登録不要のデータ永続化（同じ端末・ブラウザなら再訪問時も復元）
- 初回訪問時（1日1回）の時間帯別あいさつ付きローディング画面

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | HTML / CSS / JavaScript（ビルドなし）、[Tailwind CSS](https://tailwindcss.com/)（CDN） |
| バックエンド | [Supabase](https://supabase.com/)（PostgreSQL＋匿名認証＋自動生成API、Row Level Securityで保護） |
| ホスティング | [Vercel](https://vercel.com/)（GitHub連携、pushで自動デプロイ） |

## ローカルでの動かし方

`fetch()`でHTML断片を読み込む構成のため、`file://`で直接開くことはできません。簡易サーバー経由で起動してください。

```bash
python -m http.server 8000
```

ブラウザで `http://localhost:8000/index.html` を開いてください（起動時のローディング画面 → 本体の順に遷移します。本体に直接アクセスする場合は `app.html` を開いてください）。

## ディレクトリ構成

```
index.html          起動時のローディング画面（サイトのトップページ）
app.html             アプリ本体
js/
  utils.js           共通の日付計算・Supabaseクライアント初期化
  countdown.js        カウントダウン（学年選択・残り日数計算）
  tasks.js             タスク機能
  schedule.js          スケジュール機能
partials/
  countdown.html      カウントダウン表示のマークアップ
  task.html            タスク枠のマークアップ
  schedule.html        スケジュール枠のマークアップ
```

各機能はJS・HTMLともにファイルが分かれているため、他の機能に影響を与えずに個別に編集できます。
