import React, { useRef } from 'react';
import SectionHeader from './SectionHeader';
import SnapDots from './SnapDots';

const REVIEWS = [
  {
    name: 'Marcus Vance',
    role: 'VP of Technology',
    company: 'AeroCloud Systems',
    text: 'Lyntrix completely modernized our cloud infrastructure. We migrated 40+ microservices to Kubernetes with zero downtime and reduced cloud costs by 38%.',
    highlight: '38% cloud savings',
  },
  {
    name: 'Dr. Sarah Lin',
    role: 'Chief Information Officer',
    company: 'OmniHealth Global',
    text: 'Their zero-trust security audit and managed SOC deployment gave us the exact audit readiness we needed for SOC 2 Type II compliance in record time.',
    highlight: 'SOC 2 ready',
  },
  {
    name: 'David Rajapakse',
    role: 'Head of Engineering',
    company: 'FinPulse Pay',
    text: 'The Lyntrix team built our high-concurrency payment gateway handling 15,000+ requests/sec with under 25ms latency. Exceptional software craftsmanship.',
    highlight: '15k req/sec',
  },
];

export default function TestimonialsSection() {
  const scroller = useRef(null);
  return (
    <section className="section section-tint">
      <div className="container-x">
        <SectionHeader index="07" label="Clients" title="Trusted by" accent="engineering leaders.">
          How we help technology teams ship faster and operate securely.
        </SectionHeader>

        <div ref={scroller} className="m-carousel grid md:grid-cols-3 gap-3 sm:gap-4 md:pt-6">
          {REVIEWS.map((r, i) => (
            <figure
              key={r.name}
              className={`surface edge-light p-5 sm:p-8 flex flex-col ${i === 1 ? 'md:-translate-y-6 ring-grad' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="serif text-5xl leading-none h-9 -mb-3" aria-hidden="true">&ldquo;</span>
                <span className="chip chip-accent">{r.highlight}</span>
              </div>
              <blockquote className="mt-6 text-[1.05rem] text-[var(--text)] leading-relaxed flex-1">{r.text}</blockquote>
              <figcaption className="mt-8 pt-5 border-t border-[var(--line)] flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-[image:var(--grad)] grid place-items-center font-semibold text-[var(--accent-ink)] shrink-0">
                  {r.name.replace('Dr. ', '').charAt(0)}
                </span>
                <span className="min-w-0">
                  <span className="block font-medium text-white text-sm">{r.name}</span>
                  <span className="block text-xs text-[var(--muted)]">{r.role}, {r.company}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
        <SnapDots scrollerRef={scroller} count={REVIEWS.length} />
      </div>
    </section>
  );
}
