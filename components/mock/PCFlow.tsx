"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  PC_DAYS,
  PEOPLE,
  SHARE_URL,
  GLYPH,
  type Answers,
  type AnswerStatus,
  seed,
  heatColor,
  slotKey,
} from "./data";

const MODES: { key: AnswerStatus; glyph: string; label: string }[] = [
  { key: "ok", glyph: "◯", label: "参加できる" },
  { key: "maybe", glyph: "△", label: "調整すれば" },
  { key: "none", glyph: "×", label: "できない" },
];

/** PC回答グリッドのセルスタイル(1a記号グリッド・h38/fs15) */
function pcCellStyle(status: AnswerStatus): CSSProperties {
  const colors: Record<AnswerStatus, CSSProperties> = {
    ok: { background: "#2563eb", color: "#fff" },
    maybe: { background: "#dbeafe", color: "#1d4ed8" },
    none: { background: "#edf1f6", color: "#b3bdcc" },
  };
  return {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    fontWeight: 700,
    cursor: "pointer",
    height: 38,
    fontSize: 15,
    ...colors[status],
  };
}

/** ◯=2点/△=1点のヒートマップセル(イベントページ・集計プレビュー共用) */
function HeatCell({
  ok,
  my,
  n,
  height,
  fontSize,
}: {
  ok: number;
  my: number;
  n: number;
  height: number;
  fontSize: number;
}) {
  const score = ok * 2 + my;
  const max = n * 2;
  const r = max ? score / max : 0;
  const full = score === max && max > 0;
  return (
    <div
      className="flex flex-1 items-center justify-center rounded-md font-semibold"
      style={{
        height,
        fontSize,
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
}

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

  /** 既存回答者+extra(自分の回答)を合算した (◯数, △数) */
  const countFor = (d: number, t: number, extra: Answers | null) => {
    let ok = 0;
    let my = 0;
    PEOPLE.forEach((_, i) => {
      const s = seed(i, d, t);
      if (s === "ok") ok++;
      else if (s === "maybe") my++;
    });
    const s = extra?.[slotKey(d, t)];
    if (s === "ok") ok++;
    else if (s === "maybe") my++;
    return { ok, my };
  };

  const copyUrl = () => {
    try {
      navigator.clipboard.writeText(SHARE_URL);
    } catch {
      // クリップボード非対応環境では黙って無視
    }
  };

  const respondents = submitted ? [...PEOPLE, "やまだ(あなた)"] : PEOPLE;

  if (screen === "event") {
    const n = PEOPLE.length + (submitted ? 1 : 0);
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1280px]">
          {/* ヘッダー:タイトル+共有URL */}
          <div className="flex items-center gap-5 border-b border-[#e8edf4] bg-white px-7 py-5">
            <div className="min-w-0 flex-1">
              <div className="mb-1 text-[10.5px] font-bold tracking-[.08em] text-[#2563eb]">
                WASA調整くん
              </div>
              <div className="text-[22px] font-bold leading-[1.3]">
                推進班 7月定例ミーティング
              </div>
              <div className="mt-[3px] text-[13px] text-[#5b6b85]">
                来週の定例の日程を決めます。60分想定。
              </div>
            </div>
            <div className="flex flex-none items-center gap-2">
              <div className="w-[300px] overflow-hidden text-ellipsis whitespace-nowrap rounded-lg bg-[#f1f4f9] px-3 py-[10px] font-mono text-[11.5px] text-[#5b6b85]">
                wasa-chosei.app/e/Kx7PbQ2wNz4RtY8mLdC3f
              </div>
              <button
                type="button"
                onClick={copyUrl}
                className="h-[38px] flex-none cursor-pointer rounded-lg bg-[#e4ecfb] px-[14px] text-[12.5px] font-bold text-[#2563eb]"
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
                  <span className="text-xs font-semibold text-[#5b6b85]">
                    ◯=2点 △=1点・枠付き=全員◯
                  </span>
                </div>
                <button
                  type="button"
                  className="h-8 cursor-pointer rounded-lg bg-white px-[14px] text-xs font-semibold text-[#41506b] shadow-[inset_0_0_0_1px_#dbe2ec]"
                >
                  ↻ 更新
                </button>
              </div>
              <div className="mb-[3px] flex gap-[3px]">
                <div className="w-14 flex-none" />
                {PC_DAYS.map((label) => (
                  <div
                    key={label}
                    className="flex h-[30px] flex-1 items-center justify-center text-[11.5px] font-semibold text-[#41506b]"
                  >
                    {label}
                  </div>
                ))}
              </div>
              {times.map((time, t) => (
                <div key={time} className="mb-[3px] flex gap-[3px]">
                  <div className="flex w-14 flex-none items-center justify-center text-[11.5px] font-semibold text-[#41506b]">
                    {time}
                  </div>
                  {PC_DAYS.map((_, d) => {
                    const c = countFor(d, t, submitted ? saved : null);
                    return (
                      <HeatCell key={d} ok={c.ok} my={c.my} n={n} height={34} fontSize={12} />
                    );
                  })}
                </div>
              ))}
              <div className="mt-[10px] flex max-w-[340px] items-center gap-2">
                <span className="text-[10.5px] text-[#5b6b85]">少</span>
                <div className="h-2 flex-1 rounded bg-gradient-to-r from-white to-[#2563eb] shadow-[inset_0_0_0_1px_#dbe2ec]" />
                <span className="text-[10.5px] text-[#5b6b85]">多</span>
              </div>
            </div>

            {/* 右サイドバー */}
            <div className="flex w-[300px] flex-none flex-col gap-[14px]">
              <button
                type="button"
                onClick={() => {
                  setAnswers({ ...saved });
                  setScreen("answer");
                }}
                className="flex h-[52px] cursor-pointer items-center justify-center rounded-[14px] bg-[#2563eb] text-base font-bold text-white shadow-[0_2px_8px_rgba(37,99,235,.3)]"
              >
                {submitted ? "回答を編集する" : "回答する"}
              </button>
              <div className="rounded-[14px] bg-white px-[18px] py-4 shadow-[inset_0_0_0_1px_#e3e8f0]">
                <div className="mb-[10px] text-[13.5px] font-bold">
                  回答者 <span className="text-[#2563eb]">{respondents.length}名</span>
                </div>
                <div className="flex flex-wrap gap-[6px]">
                  {respondents.map((name) => (
                    <div
                      key={name}
                      className="rounded-full bg-[#f6f8fb] px-[11px] py-[6px] text-xs font-semibold text-[#41506b] shadow-[inset_0_0_0_1px_#dbe2ec]"
                    >
                      {name}
                    </div>
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="h-10 cursor-pointer rounded-[10px] bg-white text-[12.5px] font-semibold text-[#5b6b85] shadow-[inset_0_0_0_1px_#dbe2ec]"
              >
                主催者メニュー(スロット追加・回答削除)
              </button>
              <div className="text-[11px] leading-[1.6] text-[#8b97ab]">
                このイベントは最終更新から6ヶ月で自動削除されます。
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 回答画面(2b)
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[1280px]">
        {/* ヘッダー:戻る+名前・パスワード */}
        <div className="flex items-center gap-[14px] border-b border-[#e8edf4] bg-white px-7 py-[14px]">
          <button
            type="button"
            onClick={() => setScreen("event")}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[10px] bg-[#f1f4f9] text-lg font-bold text-[#41506b]"
          >
            ‹
          </button>
          <div className="text-[17px] font-bold">回答する</div>
          <div className="flex-1" />
          <label className="flex items-center gap-2 text-[11.5px] font-semibold text-[#5b6b85]">
            名前
            <input
              placeholder="やまだ"
              className="h-[38px] w-[180px] rounded-[10px] bg-[#f6f8fb] px-3 text-[13.5px] text-[#1a2333] shadow-[inset_0_0_0_1px_#dbe2ec] outline-[#2563eb]"
            />
          </label>
          <label className="flex items-center gap-2 text-[11.5px] font-semibold text-[#5b6b85]">
            回答用パスワード
            <input
              type="password"
              placeholder="編集に使います"
              className="h-[38px] w-[180px] rounded-[10px] bg-[#f6f8fb] px-3 text-[13.5px] text-[#1a2333] shadow-[inset_0_0_0_1px_#dbe2ec] outline-[#2563eb]"
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
                  className="flex cursor-pointer items-center gap-2 rounded-[10px] px-[18px] py-[9px] text-[13px] font-bold"
                  style={
                    mode === m.key
                      ? {
                          background: "#2563eb",
                          color: "#fff",
                          boxShadow: "0 2px 6px rgba(37,99,235,.35)",
                        }
                      : {
                          background: "#fff",
                          color: "#5b6b85",
                          boxShadow: "inset 0 0 0 1px #dbe2ec",
                        }
                  }
                >
                  <span className="text-[17px] leading-none">{m.glyph}</span>
                  {m.label}
                </button>
              ))}
              <div className="flex-1 text-right text-[11.5px] text-[#5b6b85]">
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
                  className="h-8 flex-1 cursor-pointer rounded-md bg-white p-0 text-[11.5px] font-semibold text-[#41506b] shadow-[inset_0_0_0_1px_#dbe2ec] hover:shadow-[inset_0_0_0_2px_#2563eb]"
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
              {times.map((time, t) => (
                <div key={time} className="mb-[3px] flex gap-[3px]">
                  <button
                    type="button"
                    onClick={() => fill(PC_DAYS.map((_, d) => slotKey(d, t)))}
                    className="w-14 flex-none cursor-pointer rounded-md bg-white p-0 text-[11.5px] font-semibold text-[#41506b] shadow-[inset_0_0_0_1px_#dbe2ec] hover:shadow-[inset_0_0_0_2px_#2563eb]"
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
                        className="hover:shadow-[inset_0_0_0_2px_#2563eb]"
                        style={pcCellStyle(s)}
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
            <div className="rounded-[14px] bg-white px-[18px] py-4 shadow-[inset_0_0_0_1px_#e3e8f0]">
              <div className="mb-[2px] text-[13.5px] font-bold">集計プレビュー</div>
              <div className="mb-3 text-[11px] text-[#8b97ab]">
                入力中のあなたの回答を含む(送信前・手元のみ)
              </div>
              <div className="mb-[2px] flex gap-[2px]">
                <div className="w-10 flex-none" />
                {PC_DAYS.map((label) => (
                  <div
                    key={label}
                    className="flex h-[22px] flex-1 items-center justify-center text-[9.5px] font-semibold text-[#41506b]"
                  >
                    {label.slice(2)}
                  </div>
                ))}
              </div>
              {times.map((time, t) => (
                <div key={time} className="mb-[2px] flex gap-[2px]">
                  <div className="flex w-10 flex-none items-center justify-center text-[9.5px] font-semibold text-[#41506b]">
                    {time}
                  </div>
                  {PC_DAYS.map((_, d) => {
                    const c = countFor(d, t, answers);
                    return (
                      <HeatCell
                        key={d}
                        ok={c.ok}
                        my={c.my}
                        n={PEOPLE.length + 1}
                        height={26}
                        fontSize={10.5}
                      />
                    );
                  })}
                </div>
              ))}
              <div className="mt-[10px] flex items-center gap-2">
                <span className="text-[10px] text-[#5b6b85]">少</span>
                <div className="h-[6px] flex-1 rounded-[3px] bg-gradient-to-r from-white to-[#2563eb] shadow-[inset_0_0_0_1px_#dbe2ec]" />
                <span className="text-[10px] text-[#5b6b85]">多</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSaved({ ...answers });
                setSubmitted(true);
                setScreen("event");
              }}
              className="h-[52px] cursor-pointer rounded-[14px] bg-[#2563eb] text-base font-bold text-white shadow-[0_2px_8px_rgba(37,99,235,.3)]"
            >
              {submitted ? "更新して送信" : "送信する"}
            </button>
            <div className="text-[11px] leading-[1.6] text-[#8b97ab]">
              未入力のスロットは×として扱われます。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
