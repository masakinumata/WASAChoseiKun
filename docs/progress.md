# 開発進捗ログ (docs/progress.md)

新しいセッション・開発者が現状を把握するためのドキュメント。フェーズ完了ごとに更新する。
仕様は [spec.md](spec.md)、開発ルールは [../CLAUDE.md](../CLAUDE.md) を参照。

## 現在の状態

- **完了フェーズ**: Phase 0(リポジトリ整備)
- **次のフェーズ**: Phase 1(グリッドUIモック)

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

---

## 次にやること: Phase 1 — グリッドUIモック(spec §9)

**完了条件**: DBなしで ◯△× のモード切替+ドラッグ入力が実機(スマホ)で快適に動く

spec の該当箇所: §2.4(入力UX — 本アプリの核心)

- モード選択ボタン(◯/△/×)を画面下部(スマホ)/上部(PC)に固定表示
- 選択中モードでセルをタップ or ドラッグでなぞって一括塗り
- Pointer Events(`pointerdown`/`pointermove`/`pointerup`)でマウス・タッチ両対応
- グリッド上は `touch-action: none` でスクロール抑制、グリッド外のスクロールは妨げない
- 行ヘッダー(日付)/列ヘッダー(時刻)タップで行・列を一括塗り
- 縦軸=時刻、横軸=日付。スマホは横スクロール+stickyヘッダー
- **Phase 1 完了時に WASA メンバー数人に実機で触ってもらう**(spec §9 注記)
- リスク: LINE内ブラウザでドラッグが動かない可能性 → 最優先で実機検証。
  ダメならタップ+行列一括のみにフォールバック(spec §10)
