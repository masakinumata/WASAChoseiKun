"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
} from "react";
import { DAYS, GLYPH, type Answers, type AnswerStatus, slotKey } from "./data";

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
 * 回答画面(spec §2.4)。モードを選んでタップ / なぞり(ドラッグ)で一括塗り。
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

  // スクロールバー:タッチは touch-action: pan-y による通常スクロール、
  // マウスはドラッグで直接スクロールさせる
  const rail = (
    <div
      className="flex w-8 flex-none flex-col items-center justify-center gap-2 self-stretch rounded-lg bg-white text-[#8b97ab] shadow-[inset_0_0_0_1px_#dbe2ec]"
      style={{ touchAction: "pan-y" }}
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
      <span className="text-[9px] font-semibold" style={{ writingMode: "vertical-rl" }}>
        スクロール
      </span>
      <span className="text-sm leading-none">⇅</span>
    </div>
  );

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-40">
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
            下の◯△×モードを選んで、タップ / なぞって入力。日付・時刻をタップで一括。
            {variant !== "c" && "右端のバーか時刻の列をなぞる(または2本指)でスクロール。"}
            未入力は×扱い。
          </div>

          {variant !== "c" ? (
            <div className="flex gap-[6px]">
              <div className="min-w-0 flex-1">
                {/* 列ヘッダー(日付):タップで列一括塗り。スクロールしても上に固定 */}
                <div className="sticky top-0 z-10 mb-[3px] flex gap-[3px] bg-[#f6f8fb] py-[2px]">
                  <div className="w-[46px] flex-none" />
                  {DAYS.map((label, d) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => fill(times.map((_, t) => slotKey(d, t)))}
                      className="h-[34px] flex-1 rounded-md bg-white p-0 text-[11px] font-semibold text-[#41506b] shadow-[inset_0_0_0_1px_#dbe2ec]"
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div
                  onPointerDown={handleWrapperDown}
                  onPointerMove={handleGridMove}
                  onPointerUp={handleWrapperEnd}
                  onPointerCancel={handleWrapperEnd}
                  className="touch-none select-none"
                  style={{ WebkitTouchCallout: "none" }}
                >
                  {times.map((time, t) => (
                    <div key={time} className="mb-[3px] flex gap-[3px]">
                      {/* 行ヘッダー(時刻):タップで行一括塗り、なぞるとスクロール */}
                      <button
                        type="button"
                        onClick={() => fill(DAYS.map((_, d) => slotKey(d, t)))}
                        className="w-[46px] flex-none rounded-md bg-white p-0 text-[11px] font-semibold text-[#41506b] shadow-[inset_0_0_0_1px_#dbe2ec]"
                        style={{ touchAction: "pan-y" }}
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
              <div className="flex gap-[6px]">
                <div
                  onPointerDown={handleWrapperDown}
                  onPointerMove={handleGridMove}
                  onPointerUp={handleWrapperEnd}
                  onPointerCancel={handleWrapperEnd}
                  className="min-w-0 flex-1 touch-none select-none"
                  style={{ WebkitTouchCallout: "none" }}
                >
                  {times.map((time, t) => {
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
                {rail}
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
