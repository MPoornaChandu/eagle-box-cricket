"use client";

import { useState } from "react";

export function HeroBackgroundVideo() {
  const [showVideo, setShowVideo] = useState(true);

  return (
    <div className="hero-background-video" aria-hidden="true">
      <style>{`
        .hero-background-video {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .hero-background-video__media {
          position: absolute;
          inset: 0;
          z-index: 1;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.58;
          filter: saturate(1.18) contrast(1.08) brightness(1.05);
          transform: scale(1.03);
        }

        .hero-background-video__fallback {
          position: absolute;
          inset: 0;
          z-index: 0;
          background:
            radial-gradient(circle at 72% 35%, rgba(16, 185, 129, 0.18), transparent 34%),
            radial-gradient(circle at 14% 24%, rgba(250, 204, 21, 0.1), transparent 32%),
            linear-gradient(135deg, rgba(236, 253, 245, 0.82), rgba(255, 255, 255, 0.72));
        }

        .hero-background-video__field,
        .hero-background-video__pitch {
          z-index: 2;
        }

        .hero-background-video__overlay {
          position: absolute;
          inset: 0;
          z-index: 3;
          background:
            linear-gradient(90deg, rgba(255, 255, 255, 0.64) 0%, rgba(255, 255, 255, 0.34) 48%, rgba(255, 255, 255, 0.58) 100%),
            radial-gradient(circle at 68% 50%, rgba(16, 185, 129, 0.08), transparent 44%);
        }

        html[data-theme="dark"] .hero-background-video__media,
        :root:not([data-theme="light"]) .hero-background-video__media,
        .dark .hero-background-video__media {
          opacity: 0.5;
          filter: saturate(1.15) contrast(1.12) brightness(0.78);
        }

        html[data-theme="dark"] .hero-background-video__fallback,
        :root:not([data-theme="light"]) .hero-background-video__fallback,
        .dark .hero-background-video__fallback {
          background:
            radial-gradient(circle at 72% 35%, rgba(16, 185, 129, 0.14), transparent 34%),
            radial-gradient(circle at 14% 24%, rgba(250, 204, 21, 0.08), transparent 32%),
            linear-gradient(135deg, rgba(2, 6, 23, 0.88), rgba(15, 23, 42, 0.78));
        }

        html[data-theme="dark"] .hero-background-video__overlay,
        :root:not([data-theme="light"]) .hero-background-video__overlay,
        .dark .hero-background-video__overlay {
          background:
            linear-gradient(90deg, rgba(2, 6, 23, 0.62) 0%, rgba(2, 6, 23, 0.36) 48%, rgba(2, 6, 23, 0.66) 100%),
            radial-gradient(circle at 68% 50%, rgba(16, 185, 129, 0.12), transparent 44%);
        }
      `}</style>
      {showVideo ? (
        <video
          className="hero-background-video__media"
          src="/videos/hero-cricket-bg.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setShowVideo(false)}
        />
      ) : null}
      <span className="hero-background-video__fallback" />
      <span className="hero-background-video__field" />
      <span className="hero-background-video__pitch" />
      <span className="hero-background-video__overlay" />
    </div>
  );
}
