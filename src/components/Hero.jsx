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
    <section id="hero-section" className="relative pt-36 sm:pt-44 pb-16 sm:pb-24">
      <div className="container-x relative">
        <div className="max-w-6xl mx-auto text-center">
          <div className="hero-in" style={d(0)}>
            <a href="#solutions" className="pill hover:border-white/25 transition-colors">
              <span className="pill-tag">New</span>
              <span>Enterprise AI &amp; automation practice</span>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--muted)]" />
            </a>
          </div>

          <h1 className="h1 mt-8">
            <Words words={LINE_1} from={1} />
            <br className="hidden sm:block" />
            <Words words={LINE_2} from={4} />
            <span className="word-mask">
              <span style={d(6)} className="serif drift">runs on.</span>
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
                <Check className="w-4 h-4 text-[var(--accent)] shrink-0" />
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
          <p className="label text-center">The stack we ship on, every day</p>
          <div className="marquee mt-6" aria-hidden="true">
            {[0, 1].map((k) => (
              <div key={k} className="marquee-track">
                {STACK.map((t) => (
                  <span key={t} className="text-lg sm:text-xl font-medium tracking-[-0.02em] text-white/35 whitespace-nowrap">
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
