import React, { useState } from 'react';
import SectionHeader from './SectionHeader';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'frontend', label: 'Frontend & mobile' },
  { id: 'backend', label: 'Backend & APIs' },
  { id: 'cloud', label: 'Cloud & DevOps' },
  { id: 'security', label: 'Security & data' },
];

const TECHNOLOGIES = [
  { name: 'React / Next.js', category: 'frontend', desc: 'High-performance UI and server-side rendering', badge: 'Primary' },
  { name: 'TypeScript', category: 'frontend', desc: 'Type-safe enterprise software architecture', badge: 'Standard' },
  { name: 'Tailwind CSS', category: 'frontend', desc: 'Modern responsive component styling', badge: 'Standard' },
  { name: 'React Native', category: 'frontend', desc: 'Cross-platform iOS and Android apps', badge: 'Mobile' },

  { name: 'Node.js / Express', category: 'backend', desc: 'Event-driven high-concurrency microservices', badge: 'Primary' },
  { name: 'Python / FastAPI', category: 'backend', desc: 'AI integration, data engineering and REST APIs', badge: 'Primary' },
  { name: 'Go', category: 'backend', desc: 'Ultra-low latency microservices and network systems', badge: 'High perf' },
  { name: 'GraphQL & REST', category: 'backend', desc: 'Flexible data querying and API gateways', badge: 'API' },

  { name: 'Amazon Web Services', category: 'cloud', desc: 'EC2, EKS, Lambda, S3, RDS, CloudFront', badge: 'Cloud' },
  { name: 'Microsoft Azure', category: 'cloud', desc: 'Azure DevOps, App Services and enterprise cloud', badge: 'Cloud' },
  { name: 'Docker & Kubernetes', category: 'cloud', desc: 'Containerization and resilient orchestration', badge: 'DevOps' },
  { name: 'Terraform', category: 'cloud', desc: 'Declarative infrastructure as code', badge: 'IaC' },

  { name: 'PostgreSQL & Redis', category: 'security', desc: 'Relational integrity and ultra-fast caching', badge: 'Database' },
  { name: 'Zero-Trust mTLS', category: 'security', desc: 'Mutual TLS and identity-bound network policies', badge: 'Security' },
  { name: 'Cloudflare Enterprise', category: 'security', desc: 'DDoS mitigation, WAF and edge routing', badge: 'Security' },
  { name: 'Pinecone / Qdrant', category: 'security', desc: 'Vector databases for AI semantic retrieval', badge: 'AI DB' },
];

export default function TechStackSection() {
  const [active, setActive] = useState('all');
  const list = active === 'all' ? TECHNOLOGIES : TECHNOLOGIES.filter((t) => t.category === active);

  return (
    <section id="tech-stack" className="section">
      <div className="container-x">
        <SectionHeader index="05" label="Stack" title="Battle-tested tools," accent="chosen deliberately.">
          Security-hardened open-source and enterprise frameworks, picked for the job, not the hype.
        </SectionHeader>

        <div role="tablist" aria-label="Technology categories" className="rail mb-8">
          {CATEGORIES.map((c) => (
            <button key={c.id} role="tab" aria-selected={active === c.id} onClick={() => setActive(c.id)} className="tab">
              {c.label}
            </button>
          ))}
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--line)] overflow-hidden">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--line)]">
            {list.map((tech) => (
              <div key={tech.name} className="group bg-[var(--bg)] hover:bg-[var(--surface)] transition-colors duration-300 fade-up p-4 sm:p-6 min-h-[7rem] sm:min-h-[9.5rem] flex flex-col min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <span className="label truncate">{tech.badge}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--line-strong)] transition-colors group-hover:bg-[var(--accent)]" aria-hidden="true" />
                </div>
                <h3 className="mt-auto pt-5 sm:pt-6 font-medium text-white text-[15px] sm:text-lg tracking-[-0.03em] leading-snug break-words">{tech.name}</h3>
                <p className="hidden sm:block mt-1.5 text-sm text-[var(--muted)] leading-relaxed">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
