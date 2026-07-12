"use client";

import {
  DAYS,
  TIMES,
  PEOPLE,
  SHARE_URL,
  type Answers,
  seed,
  heatColor,
  slotKey,
} from "./data";

type Props = {
  submitted: boolean;
  savedAnswers: Answers;
  onGoAnswer: () => void;
};

/**
 * イベントページ(3案共通)。
 * ヒートマップ:◯=2点/△=1点で集計し、白→青のグラデーション表示。
 * 満点(全員◯)のスロットは濃い枠で強調。セルには◯人数を併記。
 */
export default function EventScreen({ submitted, savedAnswers, onGoAnswer }: Props) {
  const n = PEOPLE.length + (submitted ? 1 : 0);
  const max = n * 2;

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
        <div className="border-b border-[#e8edf4] bg-white px-[18px] pb-[14px] pt-[22px]">
          <div className="mb-[6px] text-[10.5px] font-bold tracking-[.08em] text-[#2563eb]">
            WASA調整くん
          </div>
          <div className="text-[20px] font-bold leading-[1.3]">
            推進班 7月定例ミーティング
          </div>
          <div className="mt-1 text-[12.5px] text-[#5b6b85]">
            来週の定例の日程を決めます。60分想定。
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-lg bg-[#f1f4f9] px-[10px] py-[9px] font-mono text-[11px] text-[#5b6b85]">
              wasa-chosei.app/e/Kx7PbQ2wNz…
            </div>
            <button
              type="button"
              onClick={copyUrl}
              className="h-[34px] flex-none rounded-lg bg-[#e4ecfb] px-3 text-xs font-bold text-[#2563eb]"
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
              <span className="text-[11.5px] font-semibold text-[#5b6b85]">
                ◯=2点 △=1点
              </span>
            </div>
            <button
              type="button"
              className="h-[30px] rounded-lg bg-white px-3 text-[11.5px] font-semibold text-[#41506b] shadow-[inset_0_0_0_1px_#dbe2ec]"
            >
              ↻ 更新
            </button>
          </div>
          <div className="mb-[3px] flex gap-[3px]">
            <div className="w-[46px] flex-none" />
            {DAYS.map((label) => (
              <div
                key={label}
                className="flex h-[30px] flex-1 items-center justify-center text-[11px] font-semibold text-[#41506b]"
              >
                {label}
              </div>
            ))}
          </div>
          {TIMES.map((time, t) => (
            <div key={time} className="mb-[3px] flex gap-[3px]">
              <div className="flex w-[46px] flex-none items-center justify-center text-[11px] font-semibold text-[#41506b]">
                {time}
              </div>
              {DAYS.map((_, d) => {
                let ok = 0;
                let my = 0;
                PEOPLE.forEach((_, i) => {
                  const s = seed(i, d, t);
                  if (s === "ok") ok++;
                  else if (s === "maybe") my++;
                });
                if (submitted) {
                  const s = savedAnswers[slotKey(d, t)];
                  if (s === "ok") ok++;
                  else if (s === "maybe") my++;
                }
                const score = ok * 2 + my;
                const r = max ? score / max : 0;
                const full = score === max && max > 0;
                return (
                  <div
                    key={d}
                    className="flex h-[38px] flex-1 items-center justify-center rounded-md text-[11.5px] font-semibold"
                    style={{
                      background: heatColor(r),
                      color: r > 0.55 ? "#fff" : "#41506b",
                      boxShadow: full
                        ? "inset 0 0 0 2px #1e3a8a"
                        : "inset 0 0 0 1px rgba(30,58,138,.08)",
                    }}
                  >
                    {ok}
                  </div>
                );
              })}
            </div>
          ))}
          <div className="mt-[10px] flex items-center gap-2">
            <span className="text-[10.5px] text-[#5b6b85]">少</span>
            <div className="h-2 flex-1 rounded bg-gradient-to-r from-white to-[#2563eb] shadow-[inset_0_0_0_1px_#dbe2ec]" />
            <span className="text-[10.5px] text-[#5b6b85]">多</span>
            <span className="ml-[6px] text-[10.5px] text-[#5b6b85]">枠付き=全員◯</span>
          </div>
        </div>

        {/* 回答者一覧 */}
        <div className="px-[18px] pt-[18px]">
          <div className="mb-2 text-sm font-bold">
            回答者 <span className="text-[#2563eb]">{respondents.length}名</span>
          </div>
          <div className="flex flex-wrap gap-[6px]">
            {respondents.map((name) => (
              <div
                key={name}
                className="rounded-full bg-white px-[11px] py-[6px] text-xs font-semibold text-[#41506b] shadow-[inset_0_0_0_1px_#dbe2ec]"
              >
                {name}
              </div>
            ))}
          </div>
          <div className="mt-4 text-[11px] leading-[1.6] text-[#8b97ab]">
            このイベントは最終更新から6ヶ月で自動削除されます。
            <br />
            主催者メニュー(スロット追加・回答削除)はページ下部から。
          </div>
        </div>
      </div>

      {/* 回答するボタン(下部固定) */}
      <div className="border-t border-[#e3e8f0] bg-white px-4 pb-[max(1.125rem,env(safe-area-inset-bottom))] pt-3">
        <button
          type="button"
          onClick={onGoAnswer}
          className="h-[52px] w-full rounded-[14px] bg-[#2563eb] text-base font-bold text-white shadow-[0_2px_8px_rgba(37,99,235,.3)]"
        >
          {submitted ? "回答を編集する" : "回答する"}
        </button>
      </div>
    </>
  );
}
