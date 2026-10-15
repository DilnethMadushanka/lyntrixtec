import React, { useState } from 'react';
import { Plus } from 'lucide-react';

const CATEGORIES = [
  { id: 'engagement', label: 'Engagement' },
  { id: 'security', label: 'Security & compliance' },
  { id: 'cloud', label: 'Cloud & SLAs' },
];

const FAQS = {
  engagement: [
    {
      q: 'Who owns the intellectual property of the software developed?',
      a: 'You retain 100% legal ownership of all source code, architecture blueprints, database schemas and intellectual property. On completion, all repositories are handed over with zero lock-in.',
    },
    {
      q: 'How fast can a senior engineering team be onboarded?',
      a: 'We start discovery sessions within 48 hours of proposal approval. Dedicated engineering pods typically begin sprint development within 5 to 7 business days.',
    },
    {
      q: 'What is your billing structure and contract terms?',
      a: 'Fixed-scope milestone billing for project deliverables, or monthly dedicated-team retainers. All pricing is transparent with zero hidden fees.',
    },
  ],
  security: [
    {
      q: 'How do you ensure SOC 2 and ISO 27001 readiness?',
      a: 'Our code follows OWASP Top 10, identity-bound zero-trust mTLS access controls, encrypted data vaults (AWS KMS / HashiCorp Vault) and continuous vulnerability pentesting.',
    },
    {
      q: 'Do you sign NDAs before discovery?',
      a: 'Yes. We provide a standard mutual NDA before reviewing any proprietary architecture or business data.',
    },
    {
      q: 'How are backups and customer data protected?',
      a: 'Data in transit uses TLS 1.3 and data at rest uses AES-256. Backups are snapshotted automatically with multi-region failover redundancy.',
    },
  ],
  cloud: [
    {
      q: 'What uptime SLA do you guarantee?',
      a: 'A 99.99% availability target for managed cloud environments, supported by Kubernetes auto-scaling and 24/7 SOC monitoring.',
    },
    {
      q: 'What happens if a critical incident occurs?',
      a: 'Our managed IT and SOC team responds in under 15 minutes. Automated PagerDuty escalation alerts the assigned senior leads immediately.',
    },
    {
      q: 'Can you help reduce existing cloud spend (FinOps)?',
      a: 'Yes. A FinOps audit analyzes AWS/Azure infrastructure, finds underutilized instances and introduces containerization, typically reducing cost by 25% to 40%.',
    },
  ],
};

export default function FAQSection() {
  const [category, setCategory] = useState('engagement');
  const [openIndex, setOpenIndex] = useState(0);
  const items = FAQS[category] || FAQS.engagement;

  return (
    <section id="faq" className="section">
      <div className="container-x">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="lg:col-span-4 lg:sticky lg:top-28">
            <div className="eyebrow">
              <span className="idx">08</span>
              <span className="rule" aria-hidden="true" />
              <span>FAQ</span>
            </div>
            <h2 className="h2 mt-5">
              Questions, <span className="serif">answered plainly.</span>
            </h2>
            <p className="lead mt-5">Engineering standards, IP ownership and SLAs. Anything else, ask us directly.</p>
            <a href="#contact" className="btn btn-ghost mt-7">Ask a question</a>
          </div>

          <div className="lg:col-span-8">
            <div role="tablist" aria-label="FAQ categories" className="rail mb-6">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  role="tab"
                  aria-selected={category === c.id}
                  onClick={() => { setCategory(c.id); setOpenIndex(0); }}
                  className="tab"
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="border-t border-[var(--line)]">
              {items.map((faq, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <div key={faq.q} className="border-b border-[var(--line)]">
                    <button
                      onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                      aria-expanded={isOpen}
                      className="group w-full py-6 text-left flex items-start justify-between gap-6"
                    >
                      <span className="flex gap-5">
                        <span className={`font-mono text-xs pt-1.5 ${isOpen ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`}>
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className={`text-lg sm:text-xl font-medium tracking-[-0.03em] leading-snug transition-colors ${isOpen ? 'text-white' : 'text-[var(--text-2)] group-hover:text-white'}`}>
                          {faq.q}
                        </span>
                      </span>
                      <span
                        className={`w-9 h-9 rounded-full border grid place-items-center shrink-0 transition-all duration-300 ${
                          isOpen ? 'bg-[var(--text)] border-[var(--text)] text-[var(--accent-ink)] rotate-45' : 'border-[var(--line-strong)] text-[var(--muted)]'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                      </span>
                    </button>
                    <div className={`grid transition-[grid-template-rows] duration-500 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <div className="overflow-hidden">
                        <p className="pl-9 sm:pl-10 pr-4 sm:pr-12 pb-7 text-[var(--text-2)] leading-relaxed max-w-2xl">{faq.a}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
