import type { Metadata } from "next";
import { HuntBoard } from "@/components/hunt-board";

export const metadata: Metadata = { title: "Hunt" };

export default function HuntPage() {
  return <HuntBoard />;
}
