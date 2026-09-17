"use client";

import { CSSProperties, PointerEvent, ReactNode, useState } from "react";

/** Lightweight React Bits-inspired aurora and spotlight effects, implemented
 * locally to preserve the current app's dependency footprint. */
export function AuroraBackground() {
  return <div className="vault-aurora" aria-hidden="true"><span /><span /><span /></div>;
}

export function SpotlightCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const [spotlight, setSpotlight] = useState<CSSProperties>({ "--spotlight-x": "50%", "--spotlight-y": "50%", "--spotlight-opacity": 0 } as CSSProperties);
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setSpotlight({ "--spotlight-x": `${event.clientX - rect.left}px`, "--spotlight-y": `${event.clientY - rect.top}px`, "--spotlight-opacity": 1 } as CSSProperties);
  };
  return <div className={`reactbits-spotlight ${className}`} style={spotlight} onPointerMove={onPointerMove} onPointerLeave={() => setSpotlight((current) => ({ ...current, "--spotlight-opacity": 0 }))}>{children}</div>;
}
