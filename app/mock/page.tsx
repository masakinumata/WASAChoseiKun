import type { Metadata } from "next";
import Prototype from "@/components/mock/Prototype";

export const metadata: Metadata = {
  title: "スケジュール調整プロトタイプ | WASA調整君",
};

export default function MockPage() {
  return <Prototype />;
}
