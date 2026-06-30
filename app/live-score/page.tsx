import type { Metadata } from "next";
import LiveScorePageClient from "./LiveScorePageClient";

export const metadata: Metadata = {
  title: "Live Score | EBC League"
};

export default function LiveScorePage() {
  return <LiveScorePageClient />;
}
