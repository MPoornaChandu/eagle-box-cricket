"use client";
import { useState } from "react";

export default function LampAnimation() {
  const [on, setOn] = useState(false);
  const openingFill = `hsl(50,${on ? 90 : 10}%,${on ? 90 : 20}%)`;
  const cordColor = `hsl(210,0%,${on ? 90 : 40}%)`;
  const baseSide = `hsl(210,0%,${on ? 60 : 20}%)`;
  const baseTop = `hsl(210,0%,${on ? 80 : 40}%)`;
  const post = `hsl(210,0%,${on ? 60 : 20}%)`;
  const topBody = `hsl(210,0%,${on ? 30 : 10}%)`;
  const glow = on ? 'drop-shadow(0 0 30px hsl(50,80%,70%))' : 'none';
  return (
    <div style={{ cursor: 'pointer', userSelect: 'none', filter: glow, transition: 'filter 0.5s ease' }} onClick={() => setOn(v => !v)}>
      <svg style={{ height: '280px', overflow: 'visible' }} viewBox="0 0 333 484" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse fill={openingFill} style={{ transition: 'fill 0.5s' }} cx="165" cy="220" rx="130" ry="20"/>
        <path fill={baseSide} style={{ transition: 'fill 0.3s' }} d="M165 464c44.183 0 80-8.954 80-20v-14h-22.869c-14.519-3.703-34.752-6-57.131-6-22.379 0-42.612 2.297-57.131 6H85v14c0 11.046 35.817 20 80 20z"/>
        <ellipse fill={baseTop} style={{ transition: 'fill 0.3s' }} cx="165" cy="430" rx="80" ry="20"/>
        <path fill={post} style={{ transition: 'fill 0.3s' }} d="M180 142h-30v286c0 3.866 6.716 7 15 7 8.284 0 15-3.134 15-7V142z"/>
        <line stroke={cordColor} style={{ transition: 'stroke 0.3s' }} x1="124" y2="348" x2="124" y1="190" strokeWidth="6" strokeLinecap="round"/>
        <path style={{ opacity: on ? 0.25 : 0, transition: 'opacity 0.5s' }} d="M290.5 193H39L0 463.5c0 11.046 75.478 20 165.5 20s167-11.954 167-23l-42-267.5z" fill="url(#lp-light)"/>
        <path fill={topBody} style={{ transition: 'fill 0.3s' }} fillRule="evenodd" clipRule="evenodd" d="M164.859 0c55.229 0 100 8.954 100 20l29.859 199.06C291.529 208.451 234.609 200 164.859 200S38.189 208.451 35 219.06L64.859 20c0-11.046 44.772-20 100-20z"/>
        <g style={{ opacity: on ? 1 : 0, transition: 'opacity 0.3s' }}>
          <path d="M165 178c19.882 0 36-16.118 36-36h-72c0 19.882 16.118 36 36 36z" fill="#141414"/>
          <circle cx="179.4" cy="172.6" r="18" fill="#e06952"/>
        </g>
        <path d="M115 135c0-5.523-5.82-10-13-10s-13 4.477-13 10" stroke="#0a0a0a" strokeWidth="4" strokeLinecap="round" style={{ transformOrigin: '102px 135px', transform: on ? 'none' : 'rotate(180deg)', transition: 'transform 0.3s' }}/>
        <path d="M241 135c0-5.523-5.82-10-13-10s-13 4.477-13 10" stroke="#0a0a0a" strokeWidth="4" strokeLinecap="round" style={{ transformOrigin: '228px 135px', transform: on ? 'none' : 'rotate(180deg)', transition: 'transform 0.3s' }}/>
        <defs>
          <linearGradient id="lp-light" x1="165.5" y1="218.5" x2="165.5" y2="483.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="hsl(50,80%,80%)" stopOpacity=".4"/>
            <stop offset="1" stopOpacity="0"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
