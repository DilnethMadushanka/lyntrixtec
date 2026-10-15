import React, { useEffect, useState } from 'react';

/** Pager dots for a `.m-carousel` scroller. Only rendered below 640px (hidden by CSS above). */
export default function SnapDots({ scrollerRef, count }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return undefined;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const first = el.children[0];
        if (!first) return;
        const step = first.getBoundingClientRect().width + parseFloat(getComputedStyle(el).columnGap || 0);
        setActive(Math.min(count - 1, Math.max(0, Math.round(el.scrollLeft / step))));
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [scrollerRef, count]);

  const go = (i) => {
    scrollerRef.current?.children[i]?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  };

  return (
    <div className="snap-dots" aria-label="Slides">
      {Array.from({ length: count }, (_, i) => (
        <button key={i} type="button" aria-label={`Slide ${i + 1}`} aria-current={i === active} onClick={() => go(i)} />
      ))}
    </div>
  );
}
