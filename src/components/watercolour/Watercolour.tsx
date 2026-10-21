import { useId } from "react";

// Pigment blob: a blurred, displaced shape with a wet edge copy stroked on top.
// Place it behind content only. It is decorative and hidden from assistive tech.
export function Wash({
  className,
  style,
  tone = 200,
  seed = 3,
}: {
  className?: string;
  style?: React.CSSProperties;
  tone?: 100 | 200 | 300;
  seed?: number;
}) {
  const id = useId().replace(/:/g, "");
  const fill = `var(--wash-${tone})`;
  const path = "M60 140 C20 90 70 20 150 30 C230 40 280 90 250 150 C220 210 120 230 60 140Z";
  return (
    <svg
      aria-hidden
      viewBox="0 0 300 260"
      className={className}
      style={{ position: "absolute", pointerEvents: "none", ...style }}
    >
      <defs>
        <filter id={`bleed-${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="4" seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="34" />
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <g filter={`url(#bleed-${id})`}>
        <path d={path} fill={fill} opacity={0.7} />
        <path d={path} fill="none" stroke="var(--wash-400)" strokeWidth="1.5" opacity={0.35} />
      </g>
    </svg>
  );
}

export function PaperGrain() {
  return (
    <svg aria-hidden className="paper-grain" width="100%" height="100%">
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  );
}

export function Drop({ size = 22 }: { size?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24">
      <path
        d="M12 2.5C12 2.5 5 10 5 15a7 7 0 0 0 14 0c0-5-7-12.5-7-12.5Z"
        fill="var(--wash-200)"
        stroke="var(--water-ink)"
        strokeWidth="1.5"
      />
    </svg>
  );
}
