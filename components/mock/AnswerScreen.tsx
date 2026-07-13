"use client";

import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import {
  DAYS,
  GLYPH,
  MODES,
  type Answers,
  type AnswerStatus,
  slotKey,
} from "./data";

/** 回答グリッドの3案(1a 記号グリッド / 1b ペイント式 / 1c 1日ずつ入力) */
export type Variant = "a" | "b" | "c";

/** 案a(記号グリッド)のセル */
const CELL_A = {
  base: "flex h-11 flex-1 cursor-pointer items-center justify-center rounded-lg text-[17px] font-bold",
  ok: "bg-brand text-white",
  maybe: "bg-maybe-bg text-brand-strong",
  none: "bg-none-bg text-none-text",
} as const;

/** 案b(ペイント式)のセル:色のみ・記号なし */
const CELL_B = {
  base: "h-8 flex-1 cursor-pointer rounded-[5px]",
  ok: "bg-brand",
  maybe: "bg-maybe-solid",
  none: "bg-none-solid",
} as const;

/** 案c(1日ずつ)の行 */
const ROW_C = {
  base: "mb-2 flex h-[54px] cursor-pointer items-center justify-between rounded-xl px-[18px] text-[15.5px] font-bold",
  ok: "bg-brand text-white",
  maybe: "bg-maybe-bg text-brand-strong",
  none: "bg-white text-faint inset-line",
} as const;

/** 行・列ヘッダー(白ボタン)の共通クラス */
const HEAD_BTN = "rounded-md bg-white p-0 text-[11px] font-semibold text-head inset-line";

type Props = {
  variant: Variant;
  times: string[];
  mode: AnswerStatus;
  onModeChange: (mode: AnswerStatus) => void;
  day: number;
  onDayChange: (day: number) => void;
  answers: Answers;
  setAnswers: Dispatch<SetStateAction<Answers>>;
  onBack: () => void;
  onSubmit: () => void;
};

/**
 * 回答画面(モバイル・spec §2.4)。モードを選んでタップ / なぞり(ドラッグ)で一括塗り。
 * 日付・時刻ヘッダーのタップで行・列一括。未入力は×扱い。
 *
 * セル上は touch-action: none のためドラッグ中に画面がスクロールしない。
 * 行数が増えた場合のスクロール手段として以下を用意する(spec §2.4):
 * - グリッド右端のスクロールバー(なぞると通常スクロール)
 * - 時刻ヘッダー列(タップ=行一括塗り、なぞる=スクロール)
 * - 2本指スクロール(セル上でも可)
 */
export default function AnswerScreen({
  variant,
  times,
  mode,
  onModeChange,
  day,
  onDayChange,
  answers,
  setAnswers,
  onBack,
  onSubmit,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const paintingRef = useRef(false);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const railDragRef = useRef<number | null>(null); // マウスでスクロールバーを掴んだ位置

  useEffect(() => {
    const up = () => {
      paintingRef.current = false;
      pointersRef.current.clear();
      railDragRef.current = null;
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

  const status = (slot: string): AnswerStatus => answers[slot] ?? "none";

  const handleCellDown = (e: React.PointerEvent, slot: string) => {
    // 2本目以降の指はスクロール用なので塗らない
    if (pointersRef.current.size >= 1) return;
    e.preventDefault();
    paintingRef.current = true;
    paint(slot);
  };

  const handleWrapperDown = (e: React.PointerEvent) => {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size >= 2) paintingRef.current = false;
  };

  const handleWrapperEnd = (e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size === 0) paintingRef.current = false;
  };

  const handleGridMove = (e: React.PointerEvent) => {
    const prev = pointersRef.current.get(e.pointerId);
    if (prev) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      // 2本指:セル上(touch-action: none)でも手動でスクロールさせる
      if (pointersRef.current.size >= 2) {
        const c = scrollRef.current;
        if (c) c.scrollTop -= (e.clientY - prev.y) / pointersRef.current.size;
        return;
      }
    }
    if (!paintingRef.current) return;
    // タッチはpointerdownしたセルに暗黙キャプチャされるため、座標からセルを特定する
    const cell = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest<HTMLElement>("[data-slot]");
    if (cell?.dataset.slot) paint(cell.dataset.slot);
  };

  // グリッド用の共通Pointerハンドラ(塗り+2本指スクロール)
  const gridHandlers = {
    onPointerDown: handleWrapperDown,
    onPointerMove: handleGridMove,
    onPointerUp: handleWrapperEnd,
    onPointerCancel: handleWrapperEnd,
  };

  // スクロールバー:タッチは touch-action: pan-y による通常スクロール、
  // マウスはドラッグで直接スクロールさせる
  const rail = (
    <div
      className="flex w-8 flex-none touch-pan-y flex-col items-center justify-center gap-2 self-stretch rounded-lg bg-white text-faint inset-line"
      onPointerDown={(e) => {
        if (e.pointerType === "mouse") {
          railDragRef.current = e.clientY;
          e.currentTarget.setPointerCapture(e.pointerId);
        }
      }}
      onPointerMove={(e) => {
        if (railDragRef.current !== null && scrollRef.current) {
          scrollRef.current.scrollTop -= e.clientY - railDragRef.current;
          railDragRef.current = e.clientY;
        }
      }}
      onPointerUp={() => {
        railDragRef.current = null;
      }}
    >
      <span className="text-sm leading-none">⇅</span>
      <span className="text-[9px] font-semibold [writing-mode:vertical-rl]">
        スクロール
      </span>
      <span className="text-sm leading-none">⇅</span>
    </div>
  );

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-40">
        {/* ヘッダー */}
        <div className="flex items-center gap-[6px] border-b border-hairline bg-white px-3 pb-3 pt-[14px]">
          <button
            type="button"
            onClick={onBack}
            className="h-9 w-9 rounded-[10px] bg-field text-lg font-bold text-head"
          >
            ‹
          </button>
          <div className="text-base font-bold">回答する</div>
        </div>

        {/* 名前・パスワード(モックのため送信では未使用) */}
        <div className="flex gap-2 px-[14px] pb-1 pt-[14px]">
          <label className="flex flex-1 flex-col gap-1 text-[11px] font-semibold text-sub">
            名前
            <input
              placeholder="やまだ"
              className="h-10 rounded-[10px] bg-white px-3 text-sm text-ink inset-line outline-brand"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-[11px] font-semibold text-sub">
            回答用パスワード
            <input
              type="password"
              placeholder="編集に使います"
              className="h-10 rounded-[10px] bg-white px-3 text-sm text-ink inset-line outline-brand"
            />
          </label>
        </div>

        <div className="px-[14px] pt-[10px]">
          <div className="mb-[10px] text-[11.5px] text-sub">
            下の◯△×モードを選んで、タップ / なぞって入力。日付・時刻をタップで一括。
            {variant !== "c" && "右端のバーか時刻の列をなぞる(または2本指)でスクロール。"}
            未入力は×扱い。
          </div>

          {variant !== "c" ? (
            <div className="flex gap-[6px]">
              <div className="min-w-0 flex-1">
                {/* 列ヘッダー(日付):タップで列一括塗り。スクロールしても上に固定 */}
                <div className="sticky top-0 z-10 mb-[3px] flex gap-[3px] bg-page py-[2px]">
                  <div className="w-[46px] flex-none" />
                  {DAYS.map((label, d) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => fill(times.map((_, t) => slotKey(d, t)))}
                      className={`h-[34px] flex-1 ${HEAD_BTN}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div
                  {...gridHandlers}
                  className="touch-none select-none [-webkit-touch-callout:none]"
                >
                  {times.map((time, t) => (
                    <div key={time} className="mb-[3px] flex gap-[3px]">
                      {/* 行ヘッダー(時刻):タップで行一括塗り、なぞるとスクロール */}
                      <button
                        type="button"
                        onClick={() => fill(DAYS.map((_, d) => slotKey(d, t)))}
                        className={`w-[46px] flex-none touch-pan-y ${HEAD_BTN}`}
                      >
                        {time}
                      </button>
                      {DAYS.map((_, d) => {
                        const slot = slotKey(d, t);
                        const s = status(slot);
                        const cell = variant === "b" ? CELL_B : CELL_A;
                        return (
                          <div
                            key={d}
                            data-slot={slot}
                            onPointerDown={(e) => handleCellDown(e, slot)}
                            className={`${cell.base} ${cell[s]}`}
                          >
                            {variant === "b" ? "" : GLYPH[s]}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
                {variant === "b" && (
                  <div className="mt-2 flex items-center gap-[14px] text-[11px] text-sub">
                    <span className="flex items-center gap-[5px]">
                      <span className="h-[14px] w-[14px] rounded bg-brand" />◯
                    </span>
                    <span className="flex items-center gap-[5px]">
                      <span className="h-[14px] w-[14px] rounded bg-maybe-solid" />△
                    </span>
                    <span className="flex items-center gap-[5px]">
                      <span className="h-[14px] w-[14px] rounded bg-none-solid" />×
                    </span>
                  </div>
                )}
              </div>
              {rail}
            </div>
          ) : (
            <>
              {/* 案c:日タブ+大型セルで1日ずつ入力 */}
              <div className="mb-3 flex gap-[6px]">
                {DAYS.map((label, i) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => onDayChange(i)}
                    className={`h-[38px] flex-1 rounded-[9px] p-0 text-xs font-semibold ${
                      i === day ? "bg-brand text-white" : "bg-white text-head inset-line"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex gap-[6px]">
                <div
                  {...gridHandlers}
                  className="min-w-0 flex-1 touch-none select-none [-webkit-touch-callout:none]"
                >
                  {times.map((time, t) => {
                    const slot = slotKey(day, t);
                    const s = status(slot);
                    return (
                      <div
                        key={time}
                        data-slot={slot}
                        onPointerDown={(e) => handleCellDown(e, slot)}
                        className={`${ROW_C.base} ${ROW_C[s]}`}
                      >
                        <span>{time}</span>
                        <span className="text-[22px] leading-none">{GLYPH[s]}</span>
                      </div>
                    );
                  })}
                </div>
                {rail}
              </div>
            </>
          )}
        </div>
      </div>

      {/* モード選択+送信(下部固定) */}
      <div className="border-t border-edge bg-white px-[14px] pb-[max(1rem,env(safe-area-inset-bottom))] pt-[10px]">
        <div className="mb-[10px] flex gap-2">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => onModeChange(m.key)}
              aria-pressed={mode === m.key}
              className={`flex flex-1 flex-col items-center gap-[3px] rounded-xl pb-[7px] pt-[9px] font-bold ${
                mode === m.key ? "bg-brand text-white glow-brand" : "bg-field text-sub"
              }`}
            >
              <span className="text-[21px] leading-[1.1]">{m.glyph}</span>
              <span className="text-[10px]">{m.label}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onSubmit}
          className="h-12 w-full rounded-xl bg-brand text-[15px] font-bold text-white glow-brand"
        >
          送信して集計を見る
        </button>
      </div>
    </>
  );
}
