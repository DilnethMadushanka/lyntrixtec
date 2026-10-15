import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, Search, ArrowUpRight } from 'lucide-react';

const ROWS = [
  { label: 'Edge node', value: 'Colombo, LK' },
  { label: 'Transport', value: 'TLS 1.3 · AES-256' },
  { label: 'Access model', value: 'Zero-trust' },
];

const seed = () => Array.from({ length: 28 }, () => 8 + Math.round(Math.random() * 9));

export default function LatencyWidget({ onOpenTracker }) {
  const [history, setHistory] = useState(seed);
  const [testing, setTesting] = useState(false);
  const timer = useRef(null);
  const latency = history[history.length - 1];

  useEffect(() => () => clearInterval(timer.current), []);

  const runTest = () => {
    if (testing) return;
    setTesting(true);
    let count = 0;
    timer.current = setInterval(() => {
      setHistory((h) => [...h.slice(1), Math.floor(8 + Math.random() * 10)]);
      count += 1;
      if (count >= 6) {
        clearInterval(timer.current);
        setTesting(false);
      }
    }, 140);
  };

  const max = Math.max(...history, 20);

  return (
    <div className="surface overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[var(--line)]">
        <span className="label">Live platform status</span>
        <span className="flex items-center gap-2 text-xs text-[var(--ok)]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--ok)] opacity-60 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--ok)]" />
          </span>
          Operational
        </span>
      </div>

      <div className="px-5 sm:px-6 pt-6 pb-5 flex-1">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="label">Round-trip latency</div>
            <div className="stat mt-3 tabular-nums">
              {latency}
              <span className="text-base text-[var(--muted)] ml-1 tracking-normal">ms</span>
            </div>
          </div>
          <button onClick={runTest} disabled={testing} className="btn btn-ghost btn-sm">
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Testing…' : 'Run test'}
          </button>
        </div>

        <div className="mt-6 h-14 flex items-end gap-[3px]" aria-hidden="true">
          {history.map((v, i) => (
            <span
              key={i}
              className="flex-1 rounded-[2px] transition-[height] duration-300"
              style={{
                height: `${(v / max) * 100}%`,
                background: i === history.length - 1 ? 'var(--accent)' : 'rgba(163,164,255,0.22)',
              }}
            />
          ))}
        </div>

        <dl className="mt-5 divide-y divide-[var(--line)] text-sm">
          {ROWS.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-4 py-3">
              <dt className="text-[var(--muted)]">{r.label}</dt>
              <dd className="text-[var(--text)] font-mono text-[13px] text-right">{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {onOpenTracker && (
        <button
          onClick={onOpenTracker}
          className="group w-full flex items-center justify-between px-5 sm:px-6 py-4 border-t border-[var(--line)] text-sm text-[var(--text-2)] hover:text-white hover:bg-white/[0.03] transition-colors"
        >
          <span className="flex items-center gap-2">
            <Search className="w-4 h-4 text-[var(--accent)]" />
            Track an existing project
          </span>
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      )}
    </div>
  );
}
