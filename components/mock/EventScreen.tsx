"use client";

import { DAYS, PEOPLE, SHARE_URL, type Answers, countAnswers } from "./data";
import { Chip, HeatCell, HeatLegend, PrimaryButton } from "./ui";

type Props = {
  times: string[];
  submitted: boolean;
  savedAnswers: Answers;
  onGoAnswer: () => void;
};

/**
 * イベントページ(モバイル・3案共通)。
 * ヒートマップ:◯=2点/△=1点で集計し、白→青のグラデーション表示。
 * 満点(全員◯)のスロットは濃い枠で強調。セルには◯人数を併記。
 */
export default function EventScreen({ times, submitted, savedAnswers, onGoAnswer }: Props) {
  const n = PEOPLE.length + (submitted ? 1 : 0);

  const copyUrl = () => {
    try {
      navigator.clipboard.writeText(SHARE_URL);
    } catch {
      // クリップボード非対応環境(LINE内ブラウザ等)では黙って無視
    }
  };

  const respondents = submitted ? [...PEOPLE, "やまだ(あなた)"] : PEOPLE;

  return (
    <>
      <div className="flex-1 overflow-y-auto pb-24">
        {/* イベント情報 */}
        <div className="border-b border-hairline bg-white px-[18px] pb-[14px] pt-[22px]">
          <div className="mb-[6px] text-[10.5px] font-bold tracking-[.08em] text-brand">
            WASA調整くん
          </div>
          <div className="text-[20px] font-bold leading-[1.3]">
            推進班 7月定例ミーティング
          </div>
          <div className="mt-1 text-[12.5px] text-sub">
            来週の定例の日程を決めます。60分想定。
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="min-w-0 flex-1 truncate rounded-lg bg-field px-[10px] py-[9px] font-mono text-[11px] text-sub">
              wasa-chosei.app/e/Kx7PbQ2wNz…
            </div>
            <button
              type="button"
              onClick={copyUrl}
              className="h-[34px] flex-none rounded-lg bg-brand-tint px-3 text-xs font-bold text-brand"
            >
              コピー
            </button>
          </div>
        </div>

        {/* ヒートマップ */}
        <div className="px-[14px] pt-4">
          <div className="mb-[10px] flex items-center justify-between">
            <div className="text-sm font-bold">
              空き状況{" "}
              <span className="text-[11.5px] font-semibold text-sub">◯=2点 △=1点</span>
            </div>
            <button
              type="button"
              className="h-[30px] rounded-lg bg-white px-3 text-[11.5px] font-semibold text-head inset-line"
            >
              ↻ 更新
            </button>
          </div>
          <div className="mb-[3px] flex gap-[3px]">
            <div className="w-[46px] flex-none" />
            {DAYS.map((label) => (
              <div
                key={label}
                className="flex h-[30px] flex-1 items-center justify-center text-[11px] font-semibold text-head"
              >
                {label}
              </div>
            ))}
          </div>
          {times.map((time, t) => (
            <div key={time} className="mb-[3px] flex gap-[3px]">
              <div className="flex w-[46px] flex-none items-center justify-center text-[11px] font-semibold text-head">
                {time}
              </div>
              {DAYS.map((_, d) => {
                const c = countAnswers(d, t, submitted ? savedAnswers : null);
                return (
                  <HeatCell key={d} ok={c.ok} maybe={c.maybe} n={n} height={38} fontSize={11.5} />
                );
              })}
            </div>
          ))}
          <HeatLegend className="mt-[10px]">
            <span className="ml-[6px] text-[10.5px] text-sub">枠付き=全員◯</span>
          </HeatLegend>
        </div>

        {/* 回答者一覧 */}
        <div className="px-[18px] pt-[18px]">
          <div className="mb-2 text-sm font-bold">
            回答者 <span className="text-brand">{respondents.length}名</span>
          </div>
          <div className="flex flex-wrap gap-[6px]">
            {respondents.map((name) => (
              <Chip key={name}>{name}</Chip>
            ))}
          </div>
          <div className="mt-4 text-[11px] leading-[1.6] text-faint">
            このイベントは最終更新から6ヶ月で自動削除されます。
            <br />
            主催者メニュー(スロット追加・回答削除)はページ下部から。
          </div>
        </div>
      </div>

      {/* 回答するボタン(下部固定) */}
      <div className="border-t border-edge bg-white px-4 pb-[max(1.125rem,env(safe-area-inset-bottom))] pt-3">
        <PrimaryButton onClick={onGoAnswer} className="h-[52px] w-full text-base">
          {submitted ? "回答を編集する" : "回答する"}
        </PrimaryButton>
      </div>
    </>
  );
}
