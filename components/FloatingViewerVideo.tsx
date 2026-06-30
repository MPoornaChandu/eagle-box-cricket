"use client";

import { useState } from "react";

export function FloatingViewerVideo() {
  const [showVideo, setShowVideo] = useState(true);

  if (!showVideo) return null;

  return (
    <div className="viewer-floating-video pointer-events-none fixed bottom-5 right-5 z-30 hidden h-20 w-20 overflow-hidden rounded-full border-4 border-white/70 shadow-2xl ring-1 ring-emerald-200 animate-[floatBubble_4s_ease-in-out_infinite] dark:border-slate-900/80 dark:ring-emerald-800 sm:block md:h-24 md:w-24 xl:h-[112px] xl:w-[112px]">
      <video
        className="h-full w-full object-cover"
        src="/videos/viewer-floating-video.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onError={() => setShowVideo(false)}
      />
    </div>
  );
}
