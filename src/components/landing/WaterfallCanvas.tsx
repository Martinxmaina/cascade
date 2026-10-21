"use client";
import { useEffect, useRef } from "react";

const TIERS = [
  { name: "QuickEnrich", chip: "#dff3ea", ink: "#2f7d5b", hit: 0.34, cents: 0.48 },
  { name: "Kitt", chip: "#dcebfa", ink: "#2f6aa8", hit: 0.3, cents: 0.5 },
  { name: "AI Ark", chip: "#ece5f7", ink: "#6a4fa3", hit: 0.26, cents: 0.53 },
  { name: "Tomba", chip: "#fbe8dc", ink: "#a65a2e", hit: 0.22, cents: 0.89 },
  { name: "LeadsForge", chip: "#f8f0d2", ink: "#8a6d16", hit: 0.18, cents: 2.45 },
];

type Drop = { x: number; y: number; vy: number; vx: number; tier: number; state: "fall" | "hit" | "pool"; life: number };

export function WaterfallCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const font = getComputedStyle(document.body).fontFamily;
    let w = 0, h = 0, raf = 0, last = 0, spawn = 0;
    let cents = 0, found = 0;
    const drops: Drop[] = [];

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const tierY = (i: number) => 70 + i * ((h - 150) / 5);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      TIERS.forEach((t, i) => {
        const y = tierY(i), inset = 24 + i * 6;
        ctx.fillStyle = t.chip;
        ctx.fillRect(inset, y, w - inset * 2, 26);
        ctx.fillStyle = t.ink;
        ctx.font = `500 12.5px ${font}`;
        ctx.textBaseline = "middle";
        ctx.fillText(t.name, inset + 12, y + 13);
      });
      // pool
      const poolH = Math.min(found * 1.2, 46);
      ctx.fillStyle = "#e3f2e9";
      ctx.fillRect(24, h - 24 - poolH, w - 48, poolH);
      ctx.fillStyle = "#1a7f4b";
      ctx.fillRect(24, h - 24, w - 48, 1);
      for (const d of drops) {
        ctx.globalAlpha = d.state === "pool" ? Math.max(0, d.life) : 1;
        ctx.fillStyle = d.state === "fall" ? "#2f6aa8" : "#1a7f4b";
        ctx.beginPath();
        ctx.arc(d.x, d.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // cost meter
      ctx.fillStyle = "#141414";
      ctx.font = `500 22px ${font}`;
      ctx.textAlign = "right";
      ctx.fillText(`${cents.toFixed(1)} cents`, w - 28, 28);
      ctx.fillStyle = "#8f8f89";
      ctx.font = `500 12.5px ${font}`;
      ctx.fillText(`${found} verified`, w - 28, 48);
      ctx.textAlign = "left";
    };

    const step = (t: number) => {
      const dt = Math.min((t - last) / 16.7, 3) || 1;
      last = t;
      spawn -= dt;
      if (spawn <= 0 && drops.length < 40) {
        drops.push({ x: 60 + Math.random() * (w - 120), y: 8, vy: 1.6, vx: 0, tier: 0, state: "fall", life: 1 });
        spawn = 22 + Math.random() * 22;
      }
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        if (d.state === "pool") {
          d.life -= 0.02 * dt;
          if (d.life <= 0) drops.splice(i, 1);
          continue;
        }
        d.y += d.vy * dt;
        d.x += d.vx * dt;
        d.vy = Math.min(d.vy + 0.05 * dt, 4);
        if (d.state === "fall" && d.tier < TIERS.length && d.y >= tierY(d.tier)) {
          const tier = TIERS[d.tier];
          if (Math.random() < tier.hit) {
            d.state = "hit";
            cents += tier.cents;
            found++;
            d.x = Math.min(Math.max(d.x, 40), w - 40);
            d.vx = 0;
          } else {
            d.tier++;
            d.vx = (Math.random() - 0.5) * 1.2;
          }
        }
        if (d.state === "hit" && d.y >= h - 30) d.state = "pool";
        if (d.y > h) drops.splice(i, 1);
      }
      draw();
      raf = requestAnimationFrame(step);
    };

    resize();
    addEventListener("resize", resize);
    if (reduce) {
      // Static frame: a few droplets resting at fixed spots, no motion.
      found = 12; cents = 9.6;
      drops.push({ x: w * 0.3, y: tierY(1) - 14, vy: 0, vx: 0, tier: 1, state: "fall", life: 1 });
      drops.push({ x: w * 0.6, y: tierY(3) - 14, vy: 0, vx: 0, tier: 3, state: "fall", life: 1 });
      draw();
    } else {
      raf = requestAnimationFrame(step);
    }
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="wf-canvas" role="img" aria-label="Droplets falling through five provider tiers. A droplet that finds an email turns green." />;
}
