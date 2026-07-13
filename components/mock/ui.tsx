"use client";

import type { ReactNode } from "react";
import { heatColor } from "./data";

/** ヒートマップの1セル。◯=2点/△=1点のスコア比率で白→青に着色し、満点は濃紺枠で強調 */
export function HeatCell({
  ok,
  maybe,
  n,
  height,
  fontSize,
}: {
  ok: number;
  maybe: number;
  /** 回答者数(満点判定の分母) */
  n: number;
  height: number;
  fontSize: number;
}) {
  const score = ok * 2 + maybe;
  const max = n * 2;
  const ratio = max ? score / max : 0;
  const full = score === max && max > 0;
  return (
    <div
      className="flex flex-1 items-center justify-center rounded-md font-semibold"
      style={{
        height,
        fontSize,
        background: heatColor(ratio),
        color: ratio > 0.55 ? "#fff" : "var(--color-head)",
        boxShadow: full
          ? "inset 0 0 0 2px var(--color-brand-deep)"
          : "inset 0 0 0 1px rgb(30 58 138 / 0.08)",
      }}
    >
      {ok}
    </div>
  );
}

/** ヒートマップの凡例(少 → 多 のグラデーションバー) */
export function HeatLegend({
  small = false,
  className = "",
  children,
}: {
  small?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const text = small ? "text-[10px] text-sub" : "text-[10.5px] text-sub";
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={text}>少</span>
      <div
        className={`flex-1 rounded bg-gradient-to-r from-white to-brand inset-line ${
          small ? "h-[6px]" : "h-2"
        }`}
      />
      <span className={text}>多</span>
      {children}
    </div>
  );
}

/** 回答者名のチップ */
export function Chip({
  children,
  className = "bg-white",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-full px-[11px] py-[6px] text-xs font-semibold text-head inset-line ${className}`}
    >
      {children}
    </div>
  );
}

/** 青のプライマリボタン(回答する・送信 等)。高さ/文字サイズは className で指定 */
export function PrimaryButton({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex cursor-pointer items-center justify-center rounded-[14px] bg-brand font-bold text-white glow-brand ${className}`}
    >
      {children}
    </button>
  );
}
