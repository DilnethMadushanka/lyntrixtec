import React, { useEffect, useState } from 'react';

const DURATION = 2200; // ms of the loading sequence
const EXIT = 900; // ms of the exit transition

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Intro plays on every page load (skipped only for reduced-motion). Evaluated at import so the hero can time its entrance. */
const shouldPlay = !reduced();

if (typeof document !== 'undefined') {
  document.documentElement.style.setProperty('--intro', shouldPlay ? `${(DURATION + 250) / 1000}s` : '0s');
}

const WORD = 'LYNTRIX';
const GLYPHS = '01<>/\\#$%&*+=?ABCDEFGHJKLMNPQRSTUVWXYZ';

// The logo mark's three strokes (same geometry as /logo-icon.svg)
const MARK_PATHS = [
  'M589 540H777L606 838H417Z',
  'M957 540H1145L610 1470H422Z',
  'M1322 540H1509L1068 1307H1248L1325 1173H1513L1342 1470H787Z',
];

// Boot log: each line prints once progress passes its threshold
const BOOT = [
  [6, 'init', 'secure_channel', 'OK'],
  [24, 'mount', 'edge.cmb-01', 'OK'],
  [44, 'verify', 'tls1.3 / aes-256', 'OK'],
  [64, 'sync', 'zero_trust.policy', 'OK'],
  [86, 'load', 'interface.vector', 'READY'],
];

const RING_R = 92;
const RING_C = 2 * Math.PI * RING_R;

// Each letter shows random glyphs until progress passes its threshold, then locks in
function decode(progress) {
  return WORD.split('').map((ch, i) =>
    progress >= 18 + i * 9 ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
  );
}

export default function IntroLoader() {
  const [phase, setPhase] = useState(shouldPlay ? 'loading' : 'done'); // loading -> exiting -> done
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (phase === 'done') return undefined;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    let raf = 0;
    let exitTimer;
    const start = performance.now();
    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    let fontsDone = false;
    fontsReady.then(() => { fontsDone = true; });

    const tick = (now) => {
      const t = Math.min((now - start) / DURATION, 1);
      // ease-in-out so the counter lingers a beat near the end
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      // hold at 99 until webfonts are ready so the hero never swaps fonts under the reveal
      setProgress(Math.round(eased * (t >= 1 && !fontsDone ? 99 : 100)));

      if (t < 1 || !fontsDone) {
        raf = requestAnimationFrame(tick);
      } else {
        setPhase('exiting');
        exitTimer = setTimeout(() => setPhase('done'), EXIT);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(exitTimer);
      document.body.style.overflow = prevOverflow;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase === 'done') document.body.style.overflow = '';
  }, [phase]);

  if (phase === 'done') return null;

  const letters = decode(progress);

  return (
    <div className={`intro ${phase === 'exiting' ? 'intro-exit' : ''}`} role="status" aria-label="Loading Lyntrix">
      <span className="intro-glow" aria-hidden="true" />
      <span className="intro-grid" aria-hidden="true" />
      <span className="intro-scan" aria-hidden="true" />
      <span className="intro-corner tl" aria-hidden="true" />
      <span className="intro-corner tr" aria-hidden="true" />
      <span className="intro-corner bl" aria-hidden="true" />
      <span className="intro-corner br" aria-hidden="true" />

      <div className="intro-top" aria-hidden="true">
        <span><b>LYNTRIX</b>//BOOT</span>
        <span className="intro-live"><i />SECURE LINK</span>
      </div>

      <div className="intro-center">
        <div className="intro-core" aria-hidden="true">
          <svg className="intro-hud" viewBox="0 0 220 220">
            <defs>
              <linearGradient id="introRing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#19c3ff" />
                <stop offset="0.5" stopColor="#4f86f7" />
                <stop offset="1" stopColor="#9050f0" />
              </linearGradient>
            </defs>
            <circle cx="110" cy="110" r="104" className="intro-ticks" />
            <circle cx="110" cy="110" r={RING_R} className="intro-track" />
            <circle
              cx="110" cy="110" r={RING_R}
              className="intro-progress"
              stroke="url(#introRing)"
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * (1 - progress / 100)}
            />
            <circle cx="110" cy="110" r="78" className="intro-orbit" />
          </svg>
          <svg className="intro-mark" viewBox="412 535 1106 940" fill="none">
            <defs>
              <linearGradient id="introMark" x1="560" y1="0" x2="1380" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#19c3ff" />
                <stop offset="0.5" stopColor="#4f86f7" />
                <stop offset="1" stopColor="#9050f0" />
              </linearGradient>
            </defs>
            {MARK_PATHS.map((dPath, i) => (
              <path key={i} d={dPath} pathLength="1" style={{ '--i': i }} />
            ))}
          </svg>
        </div>

        <div className="intro-word" aria-hidden="true">
          {letters.map((ch, i) => (
            <span key={i} className={ch === WORD[i] ? 'is-set' : ''}>{ch}</span>
          ))}
        </div>
        <div className="intro-sub" aria-hidden="true">Technologies</div>
        <div className="intro-tag">Innovate · Integrate · Elevate</div>
      </div>

      <div className="intro-foot">
        <ul className="intro-log" aria-hidden="true">
          {BOOT.filter(([at]) => progress >= at).map(([, verb, target, status]) => (
            <li key={target}>
              <span className="text-[var(--accent)]">&gt;</span> {verb} <span className="intro-target text-[var(--text-2)]">{target}</span>
              <span className="intro-ok">[{status}]</span>
            </li>
          ))}
        </ul>
        <span className="intro-pct tabular-nums">
          {String(progress).padStart(3, '0')}
          <span className="intro-pct-sign">%</span>
        </span>
      </div>
      <span className="intro-bar"><span style={{ transform: `scaleX(${progress / 100})` }} /></span>
    </div>
  );
}
