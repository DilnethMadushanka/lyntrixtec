import React, { useEffect, useRef } from 'react';

/**
 * Ambient page backdrop, CSS-only apart from a pointer-following light:
 *  - an aurora "horizon" in the logo gradient above the fold
 *  - a faint grid fading out from the top
 *  - film grain so the dark gradients never band
 * The pointer light writes CSS vars on rAF and is skipped on touch devices.
 */
export default function AmbientBackground({ intensity = 1 }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia('(hover: hover)').matches) return undefined;
    let raf = 0;
    const onMove = (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        el.style.setProperty('--px', `${e.clientX}px`);
        el.style.setProperty('--py', `${e.clientY}px`);
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="ambient" style={{ '--aurora': intensity }} aria-hidden="true">
      <span className="ambient-aurora" />
      <span className="ambient-grid" />
      <span className="ambient-spot" />
      <span className="ambient-grain" />
    </div>
  );
}
