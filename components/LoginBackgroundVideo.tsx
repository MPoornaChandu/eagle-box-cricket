"use client";

import { useState } from "react";

export function LoginBackgroundVideo() {
  const [showVideo, setShowVideo] = useState(true);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {showVideo ? (
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-80"
          src="/videos/login-bg.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setShowVideo(false)}
        />
      ) : null}
      <div className="absolute inset-0 bg-slate-950/38" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(16,185,129,0.18),transparent_34rem)]" />
    </div>
  );
}
