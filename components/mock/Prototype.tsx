"use client";

import { useMemo, useState } from "react";
import EventScreen from "./EventScreen";
import AnswerScreen, { type Variant } from "./AnswerScreen";
import PCFlow from "./PCFlow";
import { makeTimes, type Answers, type AnswerStatus } from "./data";

const VARIANTS: { key: Variant; id: string; name: string }[] = [
  { key: "a", id: "1a", name: "記号グリッド" },
  { key: "b", id: "1b", name: "ペイント式" },
  { key: "c", id: "1c", name: "1日ずつ" },
];

/**
 * Phase 1 プロトタイプ本体。
 * イベントページ(ヒートマップ)⇄ 回答画面を行き来でき、送信すると集計に反映される。
 * 回答グリッドUIは上部のタブで3案(1a/1b/1c)を切り替えて比較できる。
 */
export default function Prototype() {
  const [screen, setScreen] = useState<"event" | "answer">("event");
  const [variant, setVariant] = useState<Variant>("a");
  const [step, setStep] = useState<60 | 30>(60);
  const times = useMemo(() => makeTimes(step), [step]);
  const [mode, setMode] = useState<AnswerStatus>("ok");
  const [day, setDay] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [savedAnswers, setSavedAnswers] = useState<Answers>({});
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="flex h-dvh flex-col bg-[#f6f8fb] text-[#1a2333]">
      {/* プロトタイプ用:回答UIの案切り替え(本実装では削除する) */}
      <div className="flex items-center gap-1 border-b border-[#e3e8f0] bg-[#1a2333] px-3 py-2">
        {/* 回答UI比較タブはモバイルのみ(PCは1a採用のPCレイアウト固定) */}
        <div className="flex items-center gap-1 lg:hidden">
          <span className="mr-1 text-[10px] font-semibold text-white/60">
            回答UI比較
          </span>
          {VARIANTS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setVariant(v.key)}
              className="rounded-md px-2 py-1 text-[11px] font-semibold"
              style={
                variant === v.key
                  ? { background: "#2563eb", color: "#fff" }
                  : { background: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.7)" }
              }
            >
              {v.id} {v.name}
            </button>
          ))}
        </div>
        <span className="hidden text-[10px] font-semibold text-white/60 lg:inline">
          PC版レイアウト(2a/2b・7日×{times.length}時刻)— ウィンドウを狭めるとモバイル版
        </span>
        {/* スクロール検証用:刻み幅を変えて行数を切り替える(切替時は回答リセット) */}
        <div className="ml-auto flex items-center gap-1">
          {([60, 30] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                if (s === step) return;
                setStep(s);
                setAnswers({});
                setSavedAnswers({});
                setSubmitted(false);
                setDay(0);
              }}
              className="rounded-md px-2 py-1 text-[11px] font-semibold"
              style={
                step === s
                  ? { background: "#2563eb", color: "#fff" }
                  : { background: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.7)" }
              }
            >
              {s}分
            </button>
          ))}
        </div>
      </div>

      {/* モバイル版(lg未満):4日グリッド・回答UI3案 */}
      <div className="flex min-h-0 flex-1 flex-col lg:hidden">
        {screen === "event" ? (
          <EventScreen
            times={times}
            submitted={submitted}
            savedAnswers={savedAnswers}
            onGoAnswer={() => {
              setAnswers({ ...savedAnswers });
              setScreen("answer");
            }}
          />
        ) : (
          <AnswerScreen
            variant={variant}
            times={times}
            mode={mode}
            onModeChange={setMode}
            day={day}
            onDayChange={setDay}
            answers={answers}
            setAnswers={setAnswers}
            onBack={() => setScreen("event")}
            onSubmit={() => {
              setSavedAnswers({ ...answers });
              setSubmitted(true);
              setScreen("event");
            }}
          />
        )}
      </div>

      {/* PC版(lg以上):7日グリッド・2カラムレイアウト(状態はモバイルと独立) */}
      <div className="hidden min-h-0 flex-1 flex-col lg:flex">
        <PCFlow times={times} />
      </div>
    </div>
  );
}
