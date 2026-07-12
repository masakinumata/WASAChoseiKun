// Phase 1 プロトタイプ用のサンプルデータ(デザイン「スケジュール調整プロトタイプ.dc.html」準拠)
// 4日 × 10:00〜16:00・60分刻み(28スロット)+ 既存回答者5名

export const DAYS = ["7/20(月)", "7/21(火)", "7/22(水)", "7/23(木)"];

/** PC(lg以上)レイアウト用:7日分に拡大(60分刻みで49スロット) */
export const PC_DAYS = [
  "7/20(月)",
  "7/21(火)",
  "7/22(水)",
  "7/23(木)",
  "7/24(金)",
  "7/25(土)",
  "7/26(日)",
];

/** 10:00〜16:00 を stepMinutes 刻みで生成する(16:00を含む)。60分→7行、30分→13行 */
export function makeTimes(stepMinutes: number): string[] {
  const out: string[] = [];
  for (let m = 10 * 60; m <= 16 * 60; m += stepMinutes) {
    out.push(`${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
}
export const PEOPLE = ["さとう", "たなか", "すずき", "いのうえ", "かとう"];
export const SHARE_URL = "https://wasa-chosei.app/e/Kx7PbQ2wNz4RtY8mLdC3f";

/** 回答状態。none(未入力)は集計時に×扱い(spec §2.3) */
export type AnswerStatus = "ok" | "maybe" | "none";
/** スロットキー("日-時刻" 形式)→ ◯/△ のみ保持。キーなし=× */
export type Answers = Record<string, "ok" | "maybe">;

export const GLYPH: Record<AnswerStatus, string> = { ok: "◯", maybe: "△", none: "×" };

export const slotKey = (d: number, t: number) => `${d}-${t}`;

/** 既存回答者iの (日d, 時刻t) に対するサンプル回答を決定的に生成する */
export function seed(i: number, d: number, t: number): AnswerStatus {
  if (d === 1 && t === 4) return "ok"; // 7/21 14:00 は全員◯(満点強調の確認用)
  const x = (i * 5 + d * 3 + t * 2 + (((i + 1) * (t + 2) * (d + 1)) % 5)) % 7;
  return x < 3 ? "ok" : x < 4 ? "maybe" : "none";
}

/** スコア比率 r(0〜1)を 白→#2563eb のグラデーション色に変換する */
export function heatColor(r: number): string {
  const f = (a: number, b: number) => Math.round(a + (b - a) * r);
  return `rgb(${f(255, 37)},${f(255, 99)},${f(255, 235)})`;
}
