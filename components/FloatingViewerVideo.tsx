"use client";

import { useState } from "react";

export function FloatingViewerVideo() {
  const [showVideo, setShowVideo] = useState(true);

  if (!showVideo) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 h-[82px] w-[82px] overflow-hidden rounded-full border-4 border-white/80 shadow-2xl ring-1 ring-emerald-200 animate-[floatBubble_4s_ease-in-out_infinite] dark:border-slate-900/80 dark:ring-emerald-800 sm:bottom-6 sm:right-6 sm:h-[120px] sm:w-[120px]">
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
