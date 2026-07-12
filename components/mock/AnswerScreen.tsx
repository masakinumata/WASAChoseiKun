"use client";

import { useEffect, useRef, type CSSProperties, type Dispatch, type SetStateAction } from "react";
import {
  DAYS,
  TIMES,
  GLYPH,
  type Answers,
  type AnswerStatus,
  slotKey,
} from "./data";

/** 回答グリッドの3案(1a 記号グリッド / 1b ペイント式 / 1c 1日ずつ入力) */
export type Variant = "a" | "b" | "c";

const MODES: { key: AnswerStatus; glyph: string; label: string }[] = [
  { key: "ok", glyph: "◯", label: "参加できる" },
  { key: "maybe", glyph: "△", label: "調整すれば" },
  { key: "none", glyph: "×", label: "できない" },
];

/** 案a/bのセルスタイル(デザインの ansStyle 準拠) */
function cellStyle(status: AnswerStatus, variant: Variant): CSSProperties {
  const base: CSSProperties = {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    fontWeight: 700,
    cursor: "pointer",
  };
  const colors: Record<AnswerStatus, CSSProperties> = {
    ok: { background: "#2563eb", color: "#fff" },
    maybe: { background: "#dbeafe", color: "#1d4ed8" },
    none: { background: "#edf1f6", color: "#b3bdcc" },
  };
  if (variant === "b") {
    // 色のみのスリムセル(記号なし)
    colors.maybe = { background: "#93c5fd", color: "#93c5fd" };
    colors.none = { background: "#e6ebf2", color: "#e6ebf2" };
    colors.ok = { background: "#2563eb", color: "#2563eb" };
    return { ...base, height: 32, fontSize: 0, borderRadius: 5, ...colors[status] };
  }
  return { ...base, height: 44, fontSize: 17, ...colors[status] };
}

/** 案cの行スタイル(デザインの rowStyleC 準拠) */
function rowStyleC(status: AnswerStatus): CSSProperties {
  const colors: Record<AnswerStatus, CSSProperties> = {
    ok: { background: "#2563eb", color: "#fff" },
    maybe: { background: "#dbeafe", color: "#1d4ed8" },
    none: { background: "#fff", color: "#8b97ab", boxShadow: "inset 0 0 0 1px #dbe2ec" },
  };
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 18px",
    height: 54,
    borderRadius: 12,
    marginBottom: 8,
    fontWeight: 700,
    fontSize: 15.5,
    cursor: "pointer",
    ...colors[status],
  };
}

type Props = {
  variant: Variant;
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
 * 回答画面(spec §2.4)。モードを選んでタップ / なぞり(ドラッグ)で一括塗り。
 * 日付・時刻ヘッダーのタップで行・列一括。未入力は×扱い。
 */
export default function AnswerScreen({
  variant,
  mode,
  onModeChange,
  day,
  onDayChange,
  answers,
  setAnswers,
  onBack,
  onSubmit,
}: Props) {
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

  const status = (slot: string): AnswerStatus => answers[slot] ?? "none";

  const handleCellDown = (e: React.PointerEvent, slot: string) => {
    e.preventDefault();
    paintingRef.current = true;
    paint(slot);
  };

  // タッチはpointerdownしたセルに暗黙キャプチャされるため、座標からセルを特定する
  const handleGridMove = (e: React.PointerEvent) => {
    if (!paintingRef.current) return;
    const cell = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest<HTMLElement>("[data-slot]");
    if (cell?.dataset.slot) paint(cell.dataset.slot);
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto pb-40">
        {/* ヘッダー */}
        <div className="flex items-center gap-[6px] border-b border-[#e8edf4] bg-white px-3 pb-3 pt-[14px]">
          <button
            type="button"
            onClick={onBack}
            className="h-9 w-9 rounded-[10px] bg-[#f1f4f9] text-lg font-bold text-[#41506b]"
          >
            ‹
          </button>
          <div className="text-base font-bold">回答する</div>
        </div>

        {/* 名前・パスワード(モックのため送信では未使用) */}
        <div className="flex gap-2 px-[14px] pb-1 pt-[14px]">
          <label className="flex flex-1 flex-col gap-1 text-[11px] font-semibold text-[#5b6b85]">
            名前
            <input
              placeholder="やまだ"
              className="h-10 rounded-[10px] bg-white px-3 text-sm text-[#1a2333] shadow-[inset_0_0_0_1px_#dbe2ec] outline-[#2563eb]"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-[11px] font-semibold text-[#5b6b85]">
            回答用パスワード
            <input
              type="password"
              placeholder="編集に使います"
              className="h-10 rounded-[10px] bg-white px-3 text-sm text-[#1a2333] shadow-[inset_0_0_0_1px_#dbe2ec] outline-[#2563eb]"
            />
          </label>
        </div>

        <div className="px-[14px] pt-[10px]">
          <div className="mb-[10px] text-[11.5px] text-[#5b6b85]">
            下の◯△×モードを選んで、タップ / なぞって入力。日付・時刻をタップで一括。未入力は×扱い。
          </div>

          {variant !== "c" ? (
            <>
              {/* 列ヘッダー(日付):タップで列一括塗り */}
              <div className="mb-[3px] flex gap-[3px]">
                <div className="w-[46px] flex-none" />
                {DAYS.map((label, d) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => fill(TIMES.map((_, t) => slotKey(d, t)))}
                    className="h-[34px] flex-1 rounded-md bg-white p-0 text-[11px] font-semibold text-[#41506b] shadow-[inset_0_0_0_1px_#dbe2ec]"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div
                onPointerMove={handleGridMove}
                className="touch-none select-none"
                style={{ WebkitTouchCallout: "none" }}
              >
                {TIMES.map((time, t) => (
                  <div key={time} className="mb-[3px] flex gap-[3px]">
                    {/* 行ヘッダー(時刻):タップで行一括塗り */}
                    <button
                      type="button"
                      onClick={() => fill(DAYS.map((_, d) => slotKey(d, t)))}
                      className="w-[46px] flex-none rounded-md bg-white p-0 text-[11px] font-semibold text-[#41506b] shadow-[inset_0_0_0_1px_#dbe2ec]"
                    >
                      {time}
                    </button>
                    {DAYS.map((_, d) => {
                      const slot = slotKey(d, t);
                      const s = status(slot);
                      return (
                        <div
                          key={d}
                          data-slot={slot}
                          onPointerDown={(e) => handleCellDown(e, slot)}
                          style={cellStyle(s, variant)}
                        >
                          {variant === "b" ? "" : GLYPH[s]}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              {variant === "b" && (
                <div className="mt-2 flex items-center gap-[14px] text-[11px] text-[#5b6b85]">
                  <span className="flex items-center gap-[5px]">
                    <span className="h-[14px] w-[14px] rounded bg-[#2563eb]" />◯
                  </span>
                  <span className="flex items-center gap-[5px]">
                    <span className="h-[14px] w-[14px] rounded bg-[#93c5fd]" />△
                  </span>
                  <span className="flex items-center gap-[5px]">
                    <span className="h-[14px] w-[14px] rounded bg-[#e6ebf2]" />×
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              {/* 案c:日タブ+大型セルで1日ずつ入力 */}
              <div className="mb-3 flex gap-[6px]">
                {DAYS.map((label, i) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => onDayChange(i)}
                    className="h-[38px] flex-1 rounded-[9px] p-0 text-xs font-semibold"
                    style={
                      i === day
                        ? { background: "#2563eb", color: "#fff" }
                        : {
                            background: "#fff",
                            color: "#41506b",
                            boxShadow: "inset 0 0 0 1px #dbe2ec",
                          }
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div
                onPointerMove={handleGridMove}
                className="touch-none select-none"
                style={{ WebkitTouchCallout: "none" }}
              >
                {TIMES.map((time, t) => {
                  const slot = slotKey(day, t);
                  const s = status(slot);
                  return (
                    <div
                      key={time}
                      data-slot={slot}
                      onPointerDown={(e) => handleCellDown(e, slot)}
                      style={rowStyleC(s)}
                    >
                      <span>{time}</span>
                      <span className="text-[22px] leading-none">{GLYPH[s]}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* モード選択+送信(下部固定) */}
      <div className="border-t border-[#e3e8f0] bg-white px-[14px] pb-[max(1rem,env(safe-area-inset-bottom))] pt-[10px]">
        <div className="mb-[10px] flex gap-2">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => onModeChange(m.key)}
              aria-pressed={mode === m.key}
              className="flex flex-1 flex-col items-center gap-[3px] rounded-xl pb-[7px] pt-[9px] font-bold"
              style={
                mode === m.key
                  ? {
                      background: "#2563eb",
                      color: "#fff",
                      boxShadow: "0 2px 6px rgba(37,99,235,.35)",
                    }
                  : { background: "#f1f4f9", color: "#5b6b85" }
              }
            >
              <span className="text-[21px] leading-[1.1]">{m.glyph}</span>
              <span className="text-[10px]">{m.label}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onSubmit}
          className="h-12 w-full rounded-xl bg-[#2563eb] text-[15px] font-bold text-white shadow-[0_2px_8px_rgba(37,99,235,.3)]"
        >
          送信して集計を見る
        </button>
      </div>
    </>
  );
}
