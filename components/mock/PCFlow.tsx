"use client";

import { useEffect, useRef, useState } from "react";
import {
  PC_DAYS,
  PEOPLE,
  SHARE_URL,
  GLYPH,
  MODES,
  type Answers,
  type AnswerStatus,
  countAnswers,
  slotKey,
} from "./data";
import { Chip, HeatCell, HeatLegend, PrimaryButton } from "./ui";

/** PC回答グリッド(1a記号グリッド)のセル */
const CELL = {
  base: "flex h-[38px] flex-1 cursor-pointer items-center justify-center rounded-lg text-[15px] font-bold hover:inset-brand",
  ok: "bg-brand text-white",
  maybe: "bg-maybe-bg text-brand-strong",
  none: "bg-none-bg text-none-text",
} as const;

/** 行・列ヘッダー(白ボタン)の共通クラス */
const HEAD_BTN =
  "cursor-pointer rounded-md bg-white p-0 text-[11.5px] font-semibold text-head inset-line hover:inset-brand";

/**
 * PC(lg以上)レイアウト(デザイン 2a/2b)。
 * 2a: イベントページ — ヒートマップ+右サイドバー(回答ボタン・回答者・主催者メニュー)の2カラム。
 * 2b: 回答画面 — モード選択はグリッド上部固定(spec §2.4)、右カラムに集計プレビューを
 *     常時表示して見ながら回答できる。クリック+ドラッグで一括塗り、ホバーで青枠。
 */
export default function PCFlow({ times }: { times: string[] }) {
  const [screen, setScreen] = useState<"event" | "answer">("event");
  const [mode, setMode] = useState<AnswerStatus>("ok");
  const [answers, setAnswers] = useState<Answers>({});
  const [saved, setSaved] = useState<Answers>({});
  const [submitted, setSubmitted] = useState(false);

  const paintingRef = useRef(false);

  useEffect(() => {
    const up = () => {
      paintingRef.current = false;
    };
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);

  const fill = (slots: string[]) => {
    setAnswers((prev) => {
      const next = { ...prev };
      for (const slot of slots) {
        if (mode === "none") delete next[slot];
        else next[slot] = mode;
      }
      return next;
    });
  };

  const paint = (slot: string) => {
    if ((answers[slot] ?? "none") === mode) return;
    fill([slot]);
  };

  const handleCellDown = (e: React.PointerEvent, slot: string) => {
    e.preventDefault();
    paintingRef.current = true;
    paint(slot);
  };

  const handleGridMove = (e: React.PointerEvent) => {
    if (!paintingRef.current) return;
    const cell = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest<HTMLElement>("[data-slot]");
    if (cell?.dataset.slot) paint(cell.dataset.slot);
  };

  const copyUrl = () => {
    try {
      navigator.clipboard.writeText(SHARE_URL);
    } catch {
      // クリップボード非対応環境では黙って無視
    }
  };

  const respondents = submitted ? [...PEOPLE, "やまだ(あなた)"] : PEOPLE;

  // ---- 2a: イベントページ ----
  if (screen === "event") {
    const n = PEOPLE.length + (submitted ? 1 : 0);
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1280px]">
          {/* ヘッダー:タイトル+共有URL */}
          <div className="flex items-center gap-5 border-b border-hairline bg-white px-7 py-5">
            <div className="min-w-0 flex-1">
              <div className="mb-1 text-[10.5px] font-bold tracking-[.08em] text-brand">
                WASA調整くん
              </div>
              <div className="text-[22px] font-bold leading-[1.3]">
                推進班 7月定例ミーティング
              </div>
              <div className="mt-[3px] text-[13px] text-sub">
                来週の定例の日程を決めます。60分想定。
              </div>
            </div>
            <div className="flex flex-none items-center gap-2">
              <div className="w-[300px] truncate rounded-lg bg-field px-3 py-[10px] font-mono text-[11.5px] text-sub">
                wasa-chosei.app/e/Kx7PbQ2wNz4RtY8mLdC3f
              </div>
              <button
                type="button"
                onClick={copyUrl}
                className="h-[38px] flex-none cursor-pointer rounded-lg bg-brand-tint px-[14px] text-[12.5px] font-bold text-brand"
              >
                コピー
              </button>
            </div>
          </div>

          <div className="flex gap-6 px-7 pb-7 pt-[22px]">
            {/* 左:ヒートマップ */}
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[15px] font-bold">
                  空き状況{" "}
                  <span className="text-xs font-semibold text-sub">
                    ◯=2点 △=1点・枠付き=全員◯
                  </span>
                </div>
                <button
                  type="button"
                  className="h-8 cursor-pointer rounded-lg bg-white px-[14px] text-xs font-semibold text-head inset-line"
                >
                  ↻ 更新
                </button>
              </div>
              <div className="mb-[3px] flex gap-[3px]">
                <div className="w-14 flex-none" />
                {PC_DAYS.map((label) => (
                  <div
                    key={label}
                    className="flex h-[30px] flex-1 items-center justify-center text-[11.5px] font-semibold text-head"
                  >
                    {label}
                  </div>
                ))}
              </div>
              {times.map((time, t) => (
                <div key={time} className="mb-[3px] flex gap-[3px]">
                  <div className="flex w-14 flex-none items-center justify-center text-[11.5px] font-semibold text-head">
                    {time}
                  </div>
                  {PC_DAYS.map((_, d) => {
                    const c = countAnswers(d, t, submitted ? saved : null);
                    return (
                      <HeatCell key={d} ok={c.ok} maybe={c.maybe} n={n} height={34} fontSize={12} />
                    );
                  })}
                </div>
              ))}
              <HeatLegend className="mt-[10px] max-w-[340px]" />
            </div>

            {/* 右サイドバー */}
            <div className="flex w-[300px] flex-none flex-col gap-[14px]">
              <PrimaryButton
                onClick={() => {
                  setAnswers({ ...saved });
                  setScreen("answer");
                }}
                className="h-[52px] text-base"
              >
                {submitted ? "回答を編集する" : "回答する"}
              </PrimaryButton>
              <div className="rounded-[14px] bg-white px-[18px] py-4 inset-edge">
                <div className="mb-[10px] text-[13.5px] font-bold">
                  回答者 <span className="text-brand">{respondents.length}名</span>
                </div>
                <div className="flex flex-wrap gap-[6px]">
                  {respondents.map((name) => (
                    <Chip key={name} className="bg-page">
                      {name}
                    </Chip>
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="h-10 cursor-pointer rounded-[10px] bg-white text-[12.5px] font-semibold text-sub inset-line"
              >
                主催者メニュー(スロット追加・回答削除)
              </button>
              <div className="text-[11px] leading-[1.6] text-faint">
                このイベントは最終更新から6ヶ月で自動削除されます。
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- 2b: 回答画面 ----
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[1280px]">
        {/* ヘッダー:戻る+名前・パスワード */}
        <div className="flex items-center gap-[14px] border-b border-hairline bg-white px-7 py-[14px]">
          <button
            type="button"
            onClick={() => setScreen("event")}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[10px] bg-field text-lg font-bold text-head"
          >
            ‹
          </button>
          <div className="text-[17px] font-bold">回答する</div>
          <div className="flex-1" />
          <label className="flex items-center gap-2 text-[11.5px] font-semibold text-sub">
            名前
            <input
              placeholder="やまだ"
              className="h-[38px] w-[180px] rounded-[10px] bg-page px-3 text-[13.5px] text-ink inset-line outline-brand"
            />
          </label>
          <label className="flex items-center gap-2 text-[11.5px] font-semibold text-sub">
            回答用パスワード
            <input
              type="password"
              placeholder="編集に使います"
              className="h-[38px] w-[180px] rounded-[10px] bg-page px-3 text-[13.5px] text-ink inset-line outline-brand"
            />
          </label>
        </div>

        <div className="flex gap-6 px-7 pb-7 pt-[18px]">
          {/* 左:モード選択+回答グリッド */}
          <div className="min-w-0 flex-1">
            <div className="mb-[14px] flex items-center gap-2">
              {MODES.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMode(m.key)}
                  aria-pressed={mode === m.key}
                  className={`flex cursor-pointer items-center gap-2 rounded-[10px] px-[18px] py-[9px] text-[13px] font-bold ${
                    mode === m.key
                      ? "bg-brand text-white glow-brand"
                      : "bg-white text-sub inset-line"
                  }`}
                >
                  <span className="text-[17px] leading-none">{m.glyph}</span>
                  {m.label}
                </button>
              ))}
              <div className="flex-1 text-right text-[11.5px] text-sub">
                クリック / ドラッグでなぞって一括塗り・日付=列一括・時刻=行一括
              </div>
            </div>
            <div className="mb-[3px] flex gap-[3px]">
              <div className="w-14 flex-none" />
              {PC_DAYS.map((label, d) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => fill(times.map((_, t) => slotKey(d, t)))}
                  className={`h-8 flex-1 ${HEAD_BTN}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div
              onPointerMove={handleGridMove}
              className="touch-none select-none [-webkit-touch-callout:none]"
            >
              {times.map((time, t) => (
                <div key={time} className="mb-[3px] flex gap-[3px]">
                  <button
                    type="button"
                    onClick={() => fill(PC_DAYS.map((_, d) => slotKey(d, t)))}
                    className={`w-14 flex-none ${HEAD_BTN}`}
                  >
                    {time}
                  </button>
                  {PC_DAYS.map((_, d) => {
                    const slot = slotKey(d, t);
                    const s = answers[slot] ?? "none";
                    return (
                      <div
                        key={d}
                        data-slot={slot}
                        onPointerDown={(e) => handleCellDown(e, slot)}
                        className={`${CELL.base} ${CELL[s]}`}
                      >
                        {GLYPH[s]}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* 右:集計プレビュー+送信 */}
          <div className="flex w-[340px] flex-none flex-col gap-[14px]">
            <div className="rounded-[14px] bg-white px-[18px] py-4 inset-edge">
              <div className="mb-[2px] text-[13.5px] font-bold">集計プレビュー</div>
              <div className="mb-3 text-[11px] text-faint">
                入力中のあなたの回答を含む(送信前・手元のみ)
              </div>
              <div className="mb-[2px] flex gap-[2px]">
                <div className="w-10 flex-none" />
                {PC_DAYS.map((label) => (
                  <div
                    key={label}
                    className="flex h-[22px] flex-1 items-center justify-center text-[9.5px] font-semibold text-head"
                  >
                    {label.slice(2)}
                  </div>
                ))}
              </div>
              {times.map((time, t) => (
                <div key={time} className="mb-[2px] flex gap-[2px]">
                  <div className="flex w-10 flex-none items-center justify-center text-[9.5px] font-semibold text-head">
                    {time}
                  </div>
                  {PC_DAYS.map((_, d) => {
                    const c = countAnswers(d, t, answers);
                    return (
                      <HeatCell
                        key={d}
                        ok={c.ok}
                        maybe={c.maybe}
                        n={PEOPLE.length + 1}
                        height={26}
                        fontSize={10.5}
                      />
                    );
                  })}
                </div>
              ))}
              <HeatLegend small className="mt-[10px]" />
            </div>
            <PrimaryButton
              onClick={() => {
                setSaved({ ...answers });
                setSubmitted(true);
                setScreen("event");
              }}
              className="h-[52px] text-base"
            >
              {submitted ? "更新して送信" : "送信する"}
            </PrimaryButton>
            <div className="text-[11px] leading-[1.6] text-faint">
              未入力のスロットは×として扱われます。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
