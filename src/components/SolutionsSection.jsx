import React, { useState } from 'react';
import { Layers, Server, ShieldAlert, Cpu, Check, ArrowRight, ArrowUpRight } from 'lucide-react';
import SectionHeader from './SectionHeader';

const SOLUTIONS = [
  {
    title: 'High-Concurrency Enterprise SaaS',
    subtitle: 'Scalable cloud-native web architecture engineered for millions of active users.',
    icon: Layers,
    metrics: ['99.999% availability', 'Sub-50ms response', 'Auto-scaling pods'],
    architecture: [
      'React / Next.js micro-frontend architecture',
      'Node.js & Go high-throughput microservices',
      'PostgreSQL with Redis caching layer',
      'Global CDN & web application firewall (WAF)',
    ],
    highlights: 'Designed for enterprise tech brands needing high throughput and fault-tolerant infrastructure.',
  },
  {
    title: 'Multi-Cloud Infrastructure & FinOps',
    subtitle: 'Migrate, automate and reduce cloud expenditure without performance loss.',
    icon: Server,
    metrics: ['Up to 40% cost savings', 'Zero-downtime migration', 'Terraform IaC'],
    architecture: [
      'Automated multi-region AWS / Azure failover',
      'Kubernetes container clustering',
      'Terraform infrastructure-as-code declarations',
      'Datadog / Prometheus real-time telemetry',
    ],
    highlights: 'Transform legacy workloads into cloud-native auto-scaling environments.',
  },
  {
    title: 'Zero-Trust Defense & Managed SOC',
    subtitle: 'Continuous threat detection, automated isolation and audit readiness.',
    icon: ShieldAlert,
    metrics: ['SOC 2 & ISO 27001 ready', 'Real-time isolation', '<15 min incident SLA'],
    architecture: [
      'Identity-based zero-trust access control (mTLS)',
      'Continuous vulnerability scanning & pentesting',
      'Automated incident isolation pipelines',
      'Encrypted data vaults & audit trail storage',
    ],
    highlights: 'Protect high-value intellectual property and consumer data against advanced threats.',
  },
  {
    title: 'Enterprise AI & Automation',
    subtitle: 'Integrate LLMs, vector search and intelligent automation into business tools.',
    icon: Cpu,
    metrics: ['Vector DB retrieval', 'Custom fine-tuning', 'Automated workflows'],
    architecture: [
      'Private LLM deployment (Llama / Claude APIs)',
      'Pinecone / Qdrant vector search engine',
      'Custom business process automation connectors',
      'Data governance & privacy safeguards',
    ],
    highlights: 'Empower your workforce with custom AI assistants and automated data pipelines.',
  },
];

const TOPOLOGY = [
  ['Cloudflare CDN & WAF', 'Active'],
  ['Kubernetes cluster', 'Auto-scale'],
  ['Zero-trust identity', 'Enforced'],
  ['PostgreSQL & Redis', 'Synced'],
];

export default function SolutionsSection() {
  const [active, setActive] = useState(0);
  const current = SOLUTIONS[active];
  const CurrentIcon = current.icon;

  return (
    <section id="solutions" className="section section-tint">
      <div className="container-x">
        <SectionHeader index="02" label="Solutions" title="Architecture built for" accent="mission-critical scale.">
          Proven patterns from senior software and cloud engineers, adapted to your workload.
        </SectionHeader>

        <div className="grid lg:grid-cols-12 gap-4 lg:gap-6 items-start">
          {/* Index */}
          <div role="tablist" aria-label="Solutions" className="lg:col-span-5 border-t border-[var(--line)]">
            {SOLUTIONS.map((sol, idx) => {
              const isActive = active === idx;
              return (
                <button
                  key={sol.title}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(idx)}
                  className="group relative w-full text-left py-5 sm:py-6 border-b border-[var(--line)] flex items-start gap-5"
                >
                  <span
                    className={`absolute left-0 bottom-[-1px] h-px bg-[image:var(--grad)] transition-[width] duration-700 ease-[var(--ease)] ${
                      isActive ? 'w-full' : 'w-0'
                    }`}
                    aria-hidden="true"
                  />
                  <span className={`font-mono text-xs pt-1.5 transition-colors ${isActive ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span
                      className={`block text-lg sm:text-xl font-medium tracking-[-0.03em] leading-snug transition-colors ${
                        isActive ? 'text-white' : 'text-[var(--muted)] group-hover:text-[var(--text-2)]'
                      }`}
                    >
                      {sol.title}
                    </span>
                    <span
                      className={`grid transition-[grid-template-rows,opacity] duration-500 ${
                        isActive ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <span className="overflow-hidden">
                        <span className="block pt-2 text-sm text-[var(--text-2)] leading-relaxed">{sol.subtitle}</span>
                      </span>
                    </span>
                  </span>
                  <ArrowUpRight
                    className={`w-5 h-5 mt-1 shrink-0 transition-all duration-300 ${
                      isActive ? 'text-[var(--accent)] rotate-45' : 'text-[var(--muted)] opacity-0 group-hover:opacity-100'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Detail */}
          <div key={current.title} className="lg:col-span-7 surface edge-light fade-up overflow-hidden">
            <div className="p-6 sm:p-9 space-y-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="label">Featured architecture</span>
                  <h3 className="h3 mt-2">{current.title}</h3>
                </div>
                <span className="w-12 h-12 rounded-2xl bg-[image:var(--grad)] text-[var(--accent-ink)] grid place-items-center shrink-0">
                  <CurrentIcon className="w-5 h-5" />
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-px rounded-xl overflow-hidden border border-[var(--line)] bg-[var(--line)]">
                {current.metrics.map((m) => (
                  <div key={m} className="bg-[var(--surface)] px-4 py-3.5 text-sm text-white font-medium">
                    {m}
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-5 gap-7">
                <div className="sm:col-span-3">
                  <div className="label mb-3">Blueprint</div>
                  <ul className="space-y-3">
                    {current.architecture.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-[var(--text)]">
                        <Check className="w-4 h-4 mt-0.5 text-[var(--accent)] shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="sm:col-span-2">
                  <div className="label mb-3">Reference topology</div>
                  <ol>
                    {TOPOLOGY.map(([name, status], i) => (
                      <li key={name}>
                        <div
                          className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border text-xs ${
                            i === 1 ? 'border-[var(--accent)]/40 bg-[var(--accent-soft)]' : 'border-[var(--line)] bg-white/[0.02]'
                          }`}
                        >
                          <span className="text-white truncate">{name}</span>
                          <span className="text-[var(--ok)] font-mono shrink-0">{status}</span>
                        </div>
                        {i < TOPOLOGY.length - 1 && <div className="w-px h-3 bg-[var(--line-strong)] mx-auto" aria-hidden="true" />}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>

            <div className="px-6 sm:px-9 py-5 border-t border-[var(--line)] bg-white/[0.015] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-sm text-[var(--text-2)] leading-relaxed max-w-md">{current.highlights}</p>
              <a href="#contact" className="btn btn-ghost btn-sm shrink-0 self-start sm:self-auto">
                Book a deep-dive <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
