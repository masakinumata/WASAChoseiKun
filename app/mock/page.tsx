import type { Metadata } from "next";
import AnswerGrid from "@/components/AnswerGrid";

export const metadata: Metadata = {
  title: "グリッドUIモック | WASA調整君",
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

/** 開始日から days 日分の「7/20(月)」形式のラベルを生成する */
function makeDateLabels(start: Date, days: number): string[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS[d.getDay()]})`;
  });
}

/** 「9:00」〜「21:00」を stepMinutes 刻みで生成する(終端は含まない) */
function makeTimeLabels(
  startHour: number,
  endHour: number,
  stepMinutes: number,
): string[] {
  const labels: string[] = [];
  for (let m = startHour * 60; m < endHour * 60; m += stepMinutes) {
    labels.push(`${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`);
  }
  return labels;
}

// Phase 1 モック用のサンプル候補:7日 × 9:00〜21:00・30分刻み(24行×7列)
const dateLabels = makeDateLabels(new Date(2026, 6, 20), 7);
const timeLabels = makeTimeLabels(9, 21, 30);

export default function MockPage() {
  return (
    <main className="flex h-dvh flex-col">
      <header className="border-b border-gray-200 px-4 py-2">
        <h1 className="text-base font-bold">回答入力モック(Phase 1)</h1>
        <p className="text-xs text-gray-500">
          モードを選んでセルをタップ / ドラッグでなぞって入力。日付・時刻をタップで一括塗り。2本指でスクロール。
        </p>
      </header>
      <AnswerGrid dateLabels={dateLabels} timeLabels={timeLabels} />
    </main>
  );
}
