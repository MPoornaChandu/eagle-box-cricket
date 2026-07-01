"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface EbLogoVideoProps {
  size?: "md" | "lg";
}

export function EbLogoVideo({ size = "md" }: EbLogoVideoProps) {
  const [showVideo, setShowVideo] = useState(true);

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden border border-emerald-200 bg-emerald-50 font-black text-emerald-900 shadow-sm ring-1 ring-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100",
        size === "lg" ? "h-12 w-12 rounded-lg text-lg" : "h-11 w-11 rounded-xl text-xs"
      )}
      aria-label="Eagle Box logo"
    >
      {showVideo ? (
        <>
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src="/videos/eb-logo-video.mp4?v=2"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onError={() => setShowVideo(false)}
          />
          <span className="absolute inset-0 bg-emerald-950/5 dark:bg-black/20" />
        </>
      ) : (
        <span className="relative z-10">EB</span>
      )}
    </div>
  );
}
