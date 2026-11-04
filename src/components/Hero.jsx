import React from 'react';
import { ArrowRight, Calculator, Check } from 'lucide-react';
import LatencyWidget from './LatencyWidget';
import CountUp from './CountUp';

const STATS = [
  { to: 250, suffix: '+', label: 'Enterprise projects shipped' },
  { to: 99.99, decimals: 2, suffix: '%', label: 'Uptime SLA target' },
  { to: 15, prefix: '<', suffix: 'm', label: 'Critical incident response' },
  { to: 100, suffix: '%', label: 'Source code ownership' },
];

const PROOF = ['ISO 27001 aligned', '24/7 managed SOC', 'You own all source code'];

const STACK = ['AWS', 'Microsoft Azure', 'Kubernetes', 'Terraform', 'React', 'Node.js', 'Go', 'PostgreSQL', 'Cloudflare', 'Python', 'Docker', 'Datadog'];

// Staggered entrance: each element gets its own delay, offset by the intro overlay in CSS
const d = (n) => ({ '--d': `${n * 0.08}s` });

// The logo mark's three strokes, used for the outlined emblem behind the headline
const MARK_PATHS = [
  'M589 540H777L606 838H417Z',
  'M957 540H1145L610 1470H422Z',
  'M1322 540H1509L1068 1307H1248L1325 1173H1513L1342 1470H787Z',
];

function HeroStage() {
  return (
    <div className="hero-stage" aria-hidden="true">
      <div className="hero-beams" />
      <svg className="hero-emblem" viewBox="412 535 1106 940" fill="none">
        <defs>
          <linearGradient id="heroMarkGrad" x1="560" y1="0" x2="1380" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#19c3ff" />
            <stop offset="0.5" stopColor="#4f86f7" />
            <stop offset="1" stopColor="#9050f0" />
          </linearGradient>
        </defs>
        {MARK_PATHS.map((dPath, i) => (
          <path key={i} d={dPath} stroke="url(#heroMarkGrad)" strokeWidth="3" pathLength="1" style={{ '--i': i }} />
        ))}
      </svg>
      <div className="hero-floor" />
      <div className="hero-scan" />
    </div>
  );
}

const LINE_1 = ['Engineering', 'the', 'systems'];
const LINE_2 = ['modern', 'business'];

function Words({ words, from }) {
  return words.map((w, i) => (
    <React.Fragment key={w}>
      <span className="word-mask">
        <span style={d(from + i)}>{w}</span>
      </span>{' '}
    </React.Fragment>
  ));
}

export default function Hero({ onOpenCalculator, onOpenTracker }) {
  return (
    <section id="hero-section" className="relative pt-32 sm:pt-40 pb-16 sm:pb-24 overflow-hidden">
      <HeroStage />
      <div className="container-x relative">
        <div className="hero-frame max-w-6xl mx-auto text-center">
          <span className="hero-corner tl" aria-hidden="true" />
          <span className="hero-corner tr" aria-hidden="true" />
          <span className="hero-corner bl" aria-hidden="true" />
          <span className="hero-corner br" aria-hidden="true" />

          <div className="hud-meta hero-in" style={d(0)} aria-hidden="true">
            <span><b>LYNTRIX</b>//CORE.SYS</span>
            <span className="hidden sm:inline">NODE CMB-01</span>
            <span className="hidden md:inline">6.9271°N 79.8612°E</span>
            <span className="hud-live"><i />ONLINE</span>
          </div>

          <div className="hero-in mt-6" style={d(0)}>
            <a href="#solutions" className="pill hover:border-white/25 transition-colors">
              <span className="pill-tag">New</span>
              <span>Enterprise AI &amp; automation practice</span>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--muted)]" />
            </a>
          </div>

          <h1 className="h1 hero-h1 mt-7">
            <Words words={LINE_1} from={1} />
            <br className="hidden sm:block" />
            <Words words={LINE_2} from={4} />
            <span className="word-mask">
              <span style={d(6)}><span className="serif drift">runs on.</span></span>
            </span>
          </h1>

          <p className="lead mx-auto mt-7 hero-in" style={d(8)}>
            Resilient custom software, high-concurrency cloud architecture and zero-trust
            security, designed, built and operated by senior engineers.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center hero-in" style={d(9)}>
            <a href="#contact" className="btn btn-primary !min-h-[3.25rem] !px-6">
              Schedule an architecture audit
              <ArrowRight className="w-4 h-4" />
            </a>
            <button onClick={onOpenCalculator} className="btn btn-ghost !min-h-[3.25rem] !px-6">
              <Calculator className="w-4 h-4 text-[var(--accent)]" />
              Estimate your project
            </button>
          </div>

          <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-[var(--text-2)] hero-in" style={d(10)}>
            {PROOF.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <span className="hero-check"><Check className="w-3 h-3" strokeWidth={3} /></span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* Ops console bento */}
        <div className="mt-16 sm:mt-24 grid lg:grid-cols-12 gap-3 sm:gap-4 hero-in" style={d(12)}>
          <div className="lg:col-span-5 ring-grad rounded-[var(--radius-lg)]">
            <LatencyWidget onOpenTracker={onOpenTracker} />
          </div>

          <dl className="lg:col-span-7 grid grid-cols-2 gap-3 sm:gap-4">
            {STATS.map((s, i) => (
              <div key={s.label} className="surface edge-light p-5 sm:p-7 flex flex-col justify-between min-h-[9.5rem] sm:min-h-[11rem]">
                <dt className="flex items-center justify-between gap-3 label">
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" aria-hidden="true" />
                </dt>
                <div>
                  <dd className="stat">
                    <CountUp to={s.to} decimals={s.decimals} prefix={s.prefix} suffix={s.suffix} />
                  </dd>
                  <p className="mt-2 text-xs sm:text-sm text-[var(--muted)]">{s.label}</p>
                </div>
              </div>
            ))}
          </dl>
        </div>

        {/* Stack marquee */}
        <div className="mt-14 sm:mt-20 hero-in" style={d(14)}>
          <p className="label text-center"><span className="text-[var(--accent)]">&gt;_</span> The stack we ship on, every day</p>
          <div className="marquee mt-6" aria-hidden="true">
            {[0, 1].map((k) => (
              <div key={k} className="marquee-track">
                {STACK.map((t) => (
                  <span key={t} className="marquee-item">
                    {t}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
