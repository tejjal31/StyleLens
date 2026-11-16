import { useEffect } from "react";

/** Fading heart trail behind the cursor and heart bursts on click. */
export function HeartEffects() {
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let last = 0;
    const spawn = (x: number, y: number, cls = "", style: Record<string, string> = {}) => {
      const el = document.createElement("span");
      el.className = `heart-fx ${cls}`;
      el.textContent = "♥";
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      Object.entries(style).forEach(([k, v]) => el.style.setProperty(k, v));
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 900);
    };
    const move = (e: MouseEvent) => {
      const now = performance.now();
      if (now - last < 55) return;
      last = now;
      spawn(e.clientX + 10, e.clientY + 18);
    };
    const click = (e: MouseEvent) => {
      for (let i = 0; i < 7; i++) {
        const a = (Math.PI * 2 * i) / 7;
        spawn(e.clientX, e.clientY, "pop", { "--dx": `${Math.cos(a) * 34}px`, "--dy": `${Math.sin(a) * 34}px` });
      }
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("click", click);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("click", click);
    };
  }, []);
  return null;
}
