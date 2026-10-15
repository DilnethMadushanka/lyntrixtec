import React from 'react';
import { Award, Users, Zap, Check } from 'lucide-react';

const PILLARS = [
  { icon: Zap, title: 'Innovate', text: 'AI, cloud-native architecture and zero-trust standards.' },
  { icon: Users, title: 'Integrate', text: 'Legacy systems harmonized with automated cloud pipelines.' },
  { icon: Award, title: 'Elevate', text: '99.99% uptime, rapid SOC response and business growth.' },
];

const PROMISES = [
  'A senior engineering lead assigned to every enterprise engagement.',
  'Strict adherence to OWASP Top 10 and data compliance standards.',
  'Transparent billing, zero hidden fees and clear SLA contracts.',
];

export default function AboutSection() {
  return (
    <section id="about" className="section section-tint">
      <div className="container-x">
        <div className="eyebrow">
          <span className="idx">06</span>
          <span className="rule" aria-hidden="true" />
          <span>About</span>
        </div>

        <p className="mt-6 text-[clamp(1.75rem,4.4vw,3.4rem)] leading-[1.08] tracking-[-0.04em] font-medium text-white max-w-5xl">
          Lyntrix engineers robust, secure, future-proof software and infrastructure for organizations navigating
          digital transformation, <span className="text-[var(--muted)]">bridging complex engineering with</span>{' '}
          <span className="serif">effortless experiences.</span>
        </p>

        <div className="mt-10 sm:mt-20 grid lg:grid-cols-12 gap-3 sm:gap-4 items-stretch">
          <div className="lg:col-span-4 surface edge-light overflow-hidden relative min-h-[15rem] sm:min-h-[18rem]">
            <img
              src="/logo.jpg"
              alt="Lyntrix Technologies emblem"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-contain p-10 sm:p-12"
            />
            <div className="absolute inset-x-4 bottom-4 px-4 py-3 rounded-xl bg-black/60 backdrop-blur border border-white/10">
              <div className="label !text-[var(--accent)]">Lyntrix Technologies</div>
              <div className="serif-plain text-[var(--text-2)] mt-0.5">Smart solutions. Stronger tomorrow.</div>
            </div>
          </div>

          <div className="lg:col-span-8 grid sm:grid-cols-3 gap-3 sm:gap-4">
            {PILLARS.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="surface surface-interactive edge-light p-5 sm:p-6 flex flex-col">
                <div className="flex items-center justify-between">
                  <Icon className="w-5 h-5 text-[var(--accent)]" />
                  <span className="label">0{i + 1}</span>
                </div>
                <div className="mt-auto pt-5 sm:pt-10 text-2xl font-medium tracking-[-0.04em] text-white">{title}</div>
                <p className="text-sm text-[var(--muted)] mt-2 leading-relaxed">{text}</p>
              </div>
            ))}

            <ul className="sm:col-span-3 surface p-5 sm:p-6 grid sm:grid-cols-3 gap-4 sm:gap-5">
              {PROMISES.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm text-[var(--text-2)] leading-relaxed">
                  <Check className="w-4 h-4 mt-0.5 text-[var(--accent)] shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
