import React from "react";
import { cn } from "@/lib/utils";

/** Logo internal berbasis SVG agar tidak bergantung pada berkas PNG yang rusak. */
export function BrandLogo({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("inline-flex items-center justify-center", className)} aria-label="SIKANDA">
      <svg viewBox="0 0 96 96" role="img" aria-hidden="true" className="h-full w-full drop-shadow-sm">
        <defs>
          <linearGradient id="sikanda-blue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2563eb" />
            <stop offset="1" stopColor="#4f46e5" />
          </linearGradient>
        </defs>
        <rect x="7" y="7" width="82" height="82" rx="24" fill="url(#sikanda-blue)" />
        <path d="M31 28h34a7 7 0 0 1 7 7v26a7 7 0 0 1-7 7H31a7 7 0 0 1-7-7V35a7 7 0 0 1 7-7Z" fill="white" opacity=".96" />
        <circle cx="48" cy="43" r="8" fill="#2563eb" />
        <path d="M34 61c2-8 7-12 14-12s12 4 14 12" fill="none" stroke="#2563eb" strokeWidth="6" strokeLinecap="round" />
        <path d="M29 24h38" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round" />
      </svg>
      {!compact && <span className="sr-only">SIKANDA</span>}
    </div>
  );
}
