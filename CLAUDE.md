# WASA調整君 — 開発ルール (CLAUDE.md)

WASA(早稲田大学宇宙航空研究会)の班ミーティング用日程調整Webアプリ。

## 最重要ルール

1. **[docs/spec.md](docs/spec.md) が唯一の仕様源(Single Source of Truth)である。**
   実装・設計の判断はすべて spec.md に従うこと。spec.md と矛盾する実装をしない。
   仕様変更が必要な場合は、まず spec.md を更新してから実装する。
2. **スコープ外機能は実装しない。**
   spec.md「3. スコープ外」に列挙された機能(アカウント登録・ログイン、通知・リマインド、
   締切・決定日時の確定、未回答者の可視化、カレンダー連携、コメント機能、多言語対応、
   独自ドメイン)は、提案・下準備を含めて一切実装しない。

## 技術スタック(spec.md §5 参照)

- Next.js (App Router, TypeScript) + Tailwind CSS
- DB: Supabase (PostgreSQL, Freeプラン) — Realtimeは使わない
- ホスティング: Vercel (Hobbyプラン)
- nanoid / bcryptjs / Playwright (E2E) / GitHub Actions (CI + 定期ジョブ)

## 開発ルール

- **モバイルファースト**: 回答の大半はスマホ(特にLINE内ブラウザ)から。UIはまずスマホで成立させる
- **セキュリティ**(spec.md §4.2):
  - パスワードは必ずbcryptでハッシュ化。平文保存禁止
  - DB書き込みはすべてAPI Route(サーバー側)経由。Supabaseのservice roleキーをクライアントに露出させない
  - 全ページに `noindex` メタタグを付与
  - Reactのデフォルトエスケープを崩さない(`dangerouslySetInnerHTML` 禁止)
- **無料枠のみで運用**: 有料プラン・有料サービスを前提とした実装をしない
- 開発は spec.md §9 のフェーズ順に進める。現在のフェーズより先の機能を先取り実装しない
- 言語: UI・コメント・ドキュメントは日本語

## コマンド

```bash
npm run dev     # 開発サーバー (http://localhost:3000)
npm run build   # 本番ビルド
npm run lint    # ESLint
```
