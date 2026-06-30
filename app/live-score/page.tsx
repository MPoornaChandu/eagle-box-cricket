import { redirect } from "next/navigation";

// /live-score redirects to /live (the correct live scorecard page)
export default function LiveScorePage() {
  redirect("/live");
}
