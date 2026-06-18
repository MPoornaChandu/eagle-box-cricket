"use client";

import { useEffect, useRef, useState } from "react";

const videoSrc = "/videos/eagle-box-cricket-hero.mp4";

export function EagleBoxVideoHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReducedMotion(mediaQuery.matches);

    syncPreference();
    mediaQuery.addEventListener("change", syncPreference);
    return () => mediaQuery.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.defaultMuted = true;
    video.muted = true;

    if (reducedMotion) {
      video.pause();
      return;
    }

    void video.play().catch(() => {
      // Browser autoplay policy can still block in unusual contexts; muted+playsInline keeps normal demos working.
    });
  }, [reducedMotion]);

  return (
    <div className="relative w-full max-w-full overflow-hidden rounded-lg border border-emerald-300/24 bg-black shadow-glass">
      <div className="absolute left-3 top-3 z-10 rounded-lg border border-amber-300/25 bg-black/62 px-3 py-2 text-[0.64rem] font-black uppercase tracking-[0.14em] text-amber-100 backdrop-blur-sm">
        Eagle Box Cricket Intro
      </div>

      <div className="relative aspect-video min-h-[220px] w-full overflow-hidden bg-black sm:min-h-[260px] md:min-h-[320px]">
        {videoError ? (
          <div className="grid h-full min-h-[inherit] place-items-center bg-black px-6 text-center">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-100">
              Eagle Box Cricket animation
            </p>
          </div>
        ) : (
          <video
            ref={videoRef}
            aria-label="Eagle Box Cricket animation"
            className="h-full w-full bg-black object-contain"
            src={videoSrc}
            autoPlay={!reducedMotion}
            muted
            loop
            playsInline
            preload="metadata"
            onError={() => setVideoError(true)}
          >
            Eagle Box Cricket animation
          </video>
        )}
      </div>
    </div>
  );
}
