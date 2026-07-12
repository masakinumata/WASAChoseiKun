"use client";

import { useMemo, useRef, useState } from "react";

/** 回答状態。未入力(none)は集計時に×とみなす(spec §2.3) */
export type AnswerStatus = "none" | "ok" | "maybe" | "ng";
/** 入力モード(◯/△/×) */
export type Mode = Exclude<AnswerStatus, "none">;

const MODES: { mode: Mode; symbol: string; label: string; active: string }[] = [
  { mode: "ok", symbol: "◯", label: "参加できる", active: "bg-green-600 text-white" },
  { mode: "maybe", symbol: "△", label: "調整すれば", active: "bg-amber-500 text-white" },
  { mode: "ng", symbol: "×", label: "参加できない", active: "bg-gray-600 text-white" },
];

const CELL_CLASS: Record<AnswerStatus, string> = {
  none: "bg-white",
  ok: "bg-green-200 text-green-800",
  maybe: "bg-amber-100 text-amber-700",
  ng: "bg-gray-300 text-gray-600",
};

const CELL_SYMBOL: Record<AnswerStatus, string> = {
  none: "",
  ok: "◯",
  maybe: "△",
  ng: "×",
};

type Props = {
  /** 列ヘッダー(日付)ラベル */
  dateLabels: string[];
  /** 行ヘッダー(時刻)ラベル */
  timeLabels: string[];
};

/**
 * ◯△×回答グリッド(spec §2.4)。
 * - モード選択ボタンで◯/△/×を選び、セルをタップ or ドラッグでなぞって一括塗り
 * - 行ヘッダー(時刻)/列ヘッダー(日付)タップで行・列を一括塗り
 * - セル上は touch-action: none でドラッグ中のスクロールを抑制。
 *   ヘッダー上は pan を許可し、2本指ドラッグでもスクロールできる
 */
export default function AnswerGrid({ dateLabels, timeLabels }: Props) {
  const cols = dateLabels.length;
  const rows = timeLabels.length;

  const [mode, setMode] = useState<Mode>("ok");
  const [values, setValues] = useState<AnswerStatus[]>(() =>
    Array(rows * cols).fill("none"),
  );

  // ドラッグ状態はレンダリングに影響しないため ref で持つ
  const scrollRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const paintingRef = useRef(false);
  const lastPaintedRef = useRef(-1);

  const counts = useMemo(() => {
    let ok = 0;
    let maybe = 0;
    let ng = 0;
    for (const v of values) {
      if (v === "ok") ok++;
      else if (v === "maybe") maybe++;
      else if (v === "ng") ng++;
    }
    return { ok, maybe, ng };
  }, [values]);

  const paintCells = (indices: number[]) => {
    setValues((prev) => {
      const next = [...prev];
      for (const i of indices) next[i] = mode;
      return next;
    });
  };

  const paintCell = (index: number) => {
    if (index === lastPaintedRef.current) return;
    lastPaintedRef.current = index;
    paintCells([index]);
  };

  const cellIndexFromElement = (el: Element | null): number | null => {
    const cell = el?.closest<HTMLElement>("[data-cell]");
    return cell ? Number(cell.dataset.cell) : null;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    // 2本目の指が触れたら塗りを中断してスクロール操作に切り替える
    if (pointersRef.current.size >= 2) {
      paintingRef.current = false;
      return;
    }
    const index = cellIndexFromElement(e.target as Element);
    if (index === null) return; // ヘッダー等はタップ(click)で処理する
    e.currentTarget.setPointerCapture(e.pointerId);
    paintingRef.current = true;
    lastPaintedRef.current = -1;
    paintCell(index);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const prev = pointersRef.current.get(e.pointerId);
    if (!prev) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // 2本指:グリッドを手動スクロール(セルは touch-action: none のため)
    if (pointersRef.current.size >= 2) {
      const container = scrollRef.current;
      if (container) {
        const n = pointersRef.current.size;
        container.scrollLeft -= (e.clientX - prev.x) / n;
        container.scrollTop -= (e.clientY - prev.y) / n;
      }
      return;
    }

    if (!paintingRef.current) return;
    // タッチはpointerdownしたセルに暗黙キャプチャされるため、座標からセルを特定する
    const index = cellIndexFromElement(
      document.elementFromPoint(e.clientX, e.clientY),
    );
    if (index !== null) paintCell(index);
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size === 0) paintingRef.current = false;
  };

  const paintColumn = (col: number) =>
    paintCells(Array.from({ length: rows }, (_, r) => r * cols + col));
  const paintRow = (row: number) =>
    paintCells(Array.from({ length: cols }, (_, c) => row * cols + c));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* グリッド本体(縦横スクロール+stickyヘッダー) */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-auto overscroll-contain sm:order-2"
      >
        <div
          className="grid w-max select-none text-sm"
          style={{
            gridTemplateColumns: `auto repeat(${cols}, minmax(2.75rem, 1fr))`,
            WebkitTouchCallout: "none",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* 左上コーナー */}
          <div className="sticky left-0 top-0 z-30 border-b border-r border-gray-300 bg-gray-50 px-2 py-1 text-xs text-gray-400" />
          {/* 列ヘッダー(日付):タップで列一括塗り。pan許可でスクロールハンドルを兼ねる */}
          {dateLabels.map((label, c) => (
            <button
              key={c}
              type="button"
              onClick={() => paintColumn(c)}
              className="sticky top-0 z-20 touch-pan-x touch-pan-y border-b border-r border-gray-300 bg-gray-50 px-1 py-2 text-center text-xs font-semibold text-gray-700 active:bg-gray-200"
            >
              {label}
            </button>
          ))}
          {timeLabels.map((time, r) => (
            <div key={r} className="contents">
              {/* 行ヘッダー(時刻):タップで行一括塗り */}
              <button
                type="button"
                onClick={() => paintRow(r)}
                className="sticky left-0 z-10 touch-pan-x touch-pan-y border-b border-r border-gray-300 bg-gray-50 px-2 py-1 text-right text-xs font-semibold text-gray-700 active:bg-gray-200"
              >
                {time}
              </button>
              {dateLabels.map((_, c) => {
                const index = r * cols + c;
                const status = values[index];
                return (
                  <div
                    key={c}
                    data-cell={index}
                    className={`flex h-11 items-center justify-center border-b border-r border-gray-300 text-base font-bold touch-none ${CELL_CLASS[status]}`}
                  >
                    {CELL_SYMBOL[status]}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* モード選択バー:スマホは画面下部、PC(sm以上)は上部に固定(spec §2.4) */}
      <div className="z-40 border-t border-gray-200 bg-white p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-2px_8px_rgba(0,0,0,0.08)] sm:order-1 sm:border-b sm:border-t-0 sm:shadow-none">
        <div className="mx-auto flex max-w-md gap-2">
          {MODES.map(({ mode: m, symbol, label, active }) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={`flex h-14 flex-1 flex-col items-center justify-center rounded-lg border border-gray-300 transition-colors ${
                mode === m ? active : "bg-white text-gray-700 active:bg-gray-100"
              }`}
            >
              <span className="text-xl font-bold leading-none">{symbol}</span>
              <span className="mt-1 text-[10px] leading-none">{label}</span>
            </button>
          ))}
        </div>
        <p className="mt-1 text-center text-[11px] text-gray-500">
          ◯{counts.ok} / △{counts.maybe} / ×{counts.ng}(未入力
          {rows * cols - counts.ok - counts.maybe - counts.ng}は×扱い)
        </p>
      </div>
    </div>
  );
}
