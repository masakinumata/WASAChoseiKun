# 開発進捗ログ (docs/progress.md)

新しいセッション・開発者が現状を把握するためのドキュメント。フェーズ完了ごとに更新する。
仕様は [spec.md](spec.md)、開発ルールは [../CLAUDE.md](../CLAUDE.md) を参照。

## 現在の状態

- **完了フェーズ**: Phase 0(リポジトリ整備)
- **Phase 1(グリッドUIモック)**: **実装作業はすべて完了**。残りは実機検証のみ(下記「Phase 1 残タスク」)
- 検証が済んだら Phase 2(DB接続)へ。Supabase・nanoid・bcryptjs はまだ未セットアップ(意図的)

### Phase 1 残タスク(コードではなく検証。ユーザーが行う)

1. **スクロール対策の実機検証** — 上部バーで「30分」に切り替えて縦長グリッド(13行)にし、
   右端スクロールバー / 時刻列なぞり / 2本指スクロールの使い勝手を確認
2. **LINE内ブラウザでの確認** — 本番URLの `/mock` をLINEで自分に送って開く。
   ドラッグ塗りが動くかが最重要リスク(spec §10)。ダメならタップ+行列一括のみにフォールバック
3. **WASAメンバー数人に触ってもらう**(spec §9 の完了条件)

---

## Phase 1 引継書(実装完了 2026-07-13)

### 何を作ったか

DBなしの `/mock` プロトタイプ(トップページからリンクあり)。イベントページ ⇄ 回答画面を
行き来でき、送信すると集計ヒートマップに自分の回答が反映される(状態はメモリのみ)。

- **回答UIは 1a「記号グリッド」案を採用済み**(1b ペイント式 / 1c 1日ずつ入力 は比較用に残置。
  モバイル表示時のみ上部の黒バーで切替可能)
- モバイル(lg未満): 4日×10:00〜16:00、下部固定の◯△×モードバー
- PC(lg以上): 7日×同時刻の2カラムレイアウト。モード選択はグリッド上部(spec §2.4)、
  回答画面の右カラムに「集計プレビュー」を常時表示。セル・ヘッダーはホバーで青枠
- 上部の黒バーはプロトタイプ専用UI(本実装では削除): 案切替+刻み60分/30分切替(スクロール検証用)

### ファイル構成([components/mock/](../components/mock/))

| ファイル | 役割 |
|---|---|
| [Prototype.tsx](../components/mock/Prototype.tsx) | 全体の状態管理。lg境界でPC/モバイルをCSS出し分け(両者の回答状態は独立) |
| [EventScreen.tsx](../components/mock/EventScreen.tsx) | モバイル版イベントページ(ヒートマップ+回答者一覧) |
| [AnswerScreen.tsx](../components/mock/AnswerScreen.tsx) | モバイル版回答画面(3案+スクロール対策の本体) |
| [PCFlow.tsx](../components/mock/PCFlow.tsx) | PC版のイベントページ+回答画面(2a/2b) |
| [data.ts](../components/mock/data.ts) | サンプルデータ・seed関数・集計 `countAnswers()`・`MODES` 定義 |
| [ui.tsx](../components/mock/ui.tsx) | 共通部品(HeatCell / HeatLegend / Chip / PrimaryButton) |

配色・シャドウは [app/globals.css](../app/globals.css) の `@theme` トークン
(`bg-brand` `text-sub` `inset-line` `glow-brand` 等)に集約。生HEXをJSXに書かない。

### 実装上の要点(Phase 2 で本実装に移植するときの注意)

- **ドラッグ塗りの仕組み**: セルの `pointerdown` で塗り開始 → グリッドの `pointermove` で
  `document.elementFromPoint()` からセルを特定して塗る。タッチは pointerdown したセルに
  暗黙キャプチャされるため、`e.target` ではなく座標からセルを取るのが必須
- 塗り終了は `window` の `pointerup`/`pointercancel` で検知(グリッド外で指を離しても止まる)
- **セルは `touch-action: none`**(ドラッグ中の画面スクロール抑制)。その代償のスクロール手段:
  1. グリッド右端のスクロールバー(`touch-action: pan-y` でネイティブスクロール、マウスはJSドラッグ)
  2. 時刻ヘッダー列(タップ=行一括塗り、なぞる=スクロール。`touch-action: pan-y`)
  3. 2本指スクロール(2本目の指を検知したら塗り中断、手動で scrollTop を動かす)
- 未入力(none)は×扱い。◯/△のみ保持し `none` はキー削除(spec §2.3・DB設計と同じ形)
- 日付ヘッダーは sticky。長押しメニュー対策に `-webkit-touch-callout: none`、`select-none`

### デザインの出どころ

claude.ai/design プロジェクト「スケジュール調整アプリのモバイルUI」
(projectId: `73e068a9-2073-4b41-ba5e-07553e43b8ef`、`スケジュール調整プロトタイプ.dc.html`)。
セクション1=モバイル3案、セクション2=PC版2a/2b。PC改善の依頼ブリーフは `uploads/pc-ui-brief.md`。
取得・更新は DesignSync ツール(認証は /design-login)で行う。

### 既知の割り切り(モックのため意図的)

- 名前・パスワード欄は送信で未使用/「↻ 更新」ボタンは見た目のみ/PC版「主催者メニュー」はダミー
- モバイル=4日・PC=7日でサンプルデータが異なり、回答状態も別管理(比較検証のため)
- 初代モック(7日+stickyヘッダー横スクロール版 AnswerGrid.tsx)は削除済み。git履歴 `5b74d8d` にあり。
  Phase 2 で7日超のグリッドを作るとき横スクロール実装の参考になる

### Phase 2 に向けて

- Supabase セットアップ(Freeプラン)、nanoid / bcryptjs 導入、API Route(spec §7)
- 本実装は `/new` `/e/[id]` `/e/[id]/answer` を作り、mock の部品(ui.tsx・グリッドの
  Pointer ロジック・トークン)を流用する。黒バー(案切替・刻み切替)は持ち込まない
- 回答UIは 1a で確定。1b/1c のコードはメンバー検証が終わったら削除してよい

---

## Phase 0 完了記録 (2026-07-12)

### やったこと

1. **Next.js 雛形作成** — create-next-app で生成
   - App Router + TypeScript + Tailwind CSS v4 + ESLint
   - `src/` ディレクトリなし(`app/` 直下)、importエイリアス `@/*`
2. **CLAUDE.md 作成** — 開発ルールを明文化
   - 最重要ルール:「spec.md が唯一の仕様源」「スコープ外機能は実装しない」
3. **初期設定**
   - [app/layout.tsx](../app/layout.tsx): `lang="ja"`、タイトル「WASA調整君」、全ページ `noindex`(spec §4.2)
   - [app/page.tsx](../app/page.tsx): 最小限の日本語トップページ(プレースホルダ)
   - create-next-app が生成した汎用 AGENTS.md は削除(CLAUDE.md と重複のため)
4. **Vercel デプロイ疎通** — 完了
   - GitHub リポジトリ: `masakinumata/WASAChoseiKun`(これが唯一のリポジトリ)
   - Vercel プロジェクト名は小文字制約のため小文字表記(Vercel内部の名前であり問題なし)
   - main への git push で自動デプロイされる

### ハマったこと・注意点

- **Vercel のインポートは必ず「Import Git Repository」から行う**。
  「Cloning from GitHub」と表示されるフロー(テンプレート/クローン系)に入ると
  リポジトリの複製が新規作成されてしまう。一度誤って `wasa-chosei-kun` という
  プライベートリポジトリが作られた(→ 削除済みのはず。もし残っていたら削除する)
- `npm run build` はローカルで成功確認済み(全ルート静的生成)

### 未着手(意図的)

- Supabase のセットアップ(Phase 2 で行う)
- nanoid / bcryptjs / Playwright のインストール(必要になるフェーズで追加)

