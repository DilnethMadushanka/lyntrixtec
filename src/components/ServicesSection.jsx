import React, { useRef } from 'react';
import { Code2, Cloud, Shield, Compass, Headphones, ArrowUpRight, Check } from 'lucide-react';
import SectionHeader from './SectionHeader';
import SnapDots from './SnapDots';

const SERVICES = [
  {
    id: 'software',
    icon: Code2,
    title: 'Software Development',
    badge: 'Core competency',
    description: 'We build enterprise-grade software engineered for high concurrency, security and effortless maintainability, on modern stacks.',
    deliverables: [
      'Custom web & mobile app development',
      'Microservice & REST/GraphQL API design',
      'SaaS product development',
      'Legacy code modernization & refactoring',
    ],
    tech: ['React', 'Node.js', 'Python', 'TypeScript', 'PostgreSQL', 'Docker'],
  },
  {
    id: 'cloud',
    icon: Cloud,
    title: 'Cloud Solutions',
    badge: 'AWS / Azure / GCP',
    description: 'Streamline operations with auto-scaling multi-cloud architecture, infrastructure as code and zero-downtime deployment pipelines.',
    deliverables: [
      'AWS & Azure cloud migration',
      'Kubernetes & container orchestration',
      'Infrastructure as code (Terraform)',
      'Cloud cost optimization & FinOps audit',
    ],
    tech: ['AWS', 'Azure', 'Kubernetes', 'Terraform', 'Docker', 'GitHub Actions'],
  },
  {
    id: 'security',
    icon: Shield,
    title: 'Cybersecurity',
    badge: 'Zero-trust defense',
    description: 'Protect enterprise data and customer trust with continuous penetration testing, SOC monitoring and zero-trust access policies.',
    deliverables: [
      'Penetration testing & security audits',
      'Zero-trust architecture implementation',
      'ISO 27001 & SOC 2 compliance preparation',
      'Real-time threat monitoring & incident response',
    ],
    tech: ['SIEM', 'Cloudflare Enterprise', 'SentinelOne', 'Vault', 'OAuth2/OIDC', 'TLS 1.3'],
  },
  {
    id: 'consulting',
    icon: Compass,
    title: 'IT Consulting',
    badge: 'Strategic advisory',
    description: 'Align technology investment with business objectives. Senior architects advise on technology selection, scalable systems and digital transformation.',
    deliverables: [
      'Digital transformation roadmaps',
      'Enterprise architecture design',
      'Technology stack optimization',
      'Fractional CTO advisory',
    ],
    tech: ['TOGAF', 'Agile/Scrum', 'System architecture', 'FinOps', 'Data strategy'],
  },
  {
    id: 'support',
    icon: Headphones,
    title: 'Support & Maintenance',
    badge: '24/7 managed IT',
    description: 'Dedicated engineers monitor your infrastructure, manage updates and respond to incidents in minutes, protecting 99.99% uptime.',
    deliverables: [
      '24/7 monitoring & automated alerting',
      'Database optimization & backups',
      'SLA-backed incident resolution',
      'Patch management & security updates',
    ],
    tech: ['Prometheus', 'Grafana', 'PagerDuty', 'Datadog', 'Backup vaults'],
  },
];

const SLA = [
  ['Deployment', 'Zero downtime'],
  ['Security', 'SOC 2 / ISO ready'],
  ['Response', '< 15 minutes'],
  ['Engineering', 'Assigned lead'],
];

// Bento layout: a wide hero card beside one tile, then a row of three
const SPAN = ['sm:col-span-2 lg:col-span-4', 'lg:col-span-2', 'lg:col-span-2', 'lg:col-span-2', 'lg:col-span-2'];

function ServiceCard({ service, index, featured }) {
  const Icon = service.icon;
  return (
    <article
      className={`surface surface-interactive edge-light group relative overflow-hidden p-5 sm:p-8 flex flex-col ${SPAN[index]} ${
        featured ? 'ring-grad' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="w-11 h-11 rounded-xl border border-[var(--line-strong)] bg-white/[0.03] text-[var(--accent)] grid place-items-center shrink-0 transition-colors group-hover:bg-[var(--accent-soft)]">
          <Icon className="w-5 h-5" />
        </span>
        <span className="label">{String(index + 1).padStart(2, '0')} / {String(SERVICES.length).padStart(2, '0')}</span>
      </div>

      <div className={featured ? 'mt-8 sm:mt-14' : 'mt-8'}>
        <span className="chip">{service.badge}</span>
        <h3 className={`${featured ? 'h3 sm:!text-[clamp(1.9rem,3.6vw,2.75rem)]' : 'h3'} mt-3`}>{service.title}</h3>
        <p className={`mt-3 text-[var(--text-2)] leading-relaxed ${featured ? 'text-sm sm:text-base max-w-xl' : 'text-sm'}`}>{service.description}</p>
      </div>

      <ul className={`mt-6 grid gap-x-6 gap-y-2.5 ${featured ? 'sm:grid-cols-2' : ''}`}>
        {(featured ? service.deliverables : service.deliverables.slice(0, 3)).map((item, i) => (
          <li key={item} className={`items-start gap-2.5 text-sm text-[var(--text)] ${i >= 3 ? 'hidden sm:flex' : 'flex'}`}>
            <Check className="w-4 h-4 mt-0.5 text-[var(--accent)] shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-7 flex items-end justify-between gap-4">
        <div className="flex flex-wrap gap-1.5">
          {(featured ? service.tech : service.tech.slice(0, 3)).map((t, i) => (
            <span key={t} className={`chip ${i >= 3 ? 'max-sm:!hidden' : ''}`}>{t}</span>
          ))}
        </div>
        <a
          href="#contact"
          aria-label={`Request a ${service.title.toLowerCase()} proposal`}
          className="w-10 h-10 rounded-full border border-[var(--line-strong)] grid place-items-center shrink-0 text-[var(--text-2)] transition-all duration-300 group-hover:bg-[var(--text)] group-hover:text-[var(--accent-ink)] group-hover:border-[var(--text)]"
        >
          <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>

      {featured && (
        <dl className="hidden sm:grid mt-8 pt-6 border-t border-[var(--line)] grid-cols-2 lg:grid-cols-4 gap-4">
          {SLA.map(([k, v]) => (
            <div key={k}>
              <dt className="label">{k}</dt>
              <dd className="mt-1.5 text-sm text-[var(--text)] font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
}

export default function ServicesSection() {
  const scroller = useRef(null);
  return (
    <section id="services" className="section">
      <div className="container-x">
        <SectionHeader index="01" label="Services" title="Everything your stack needs," accent="under one roof.">
          End-to-end engineering across software, cloud, security and operations, built for reliability and steady growth.
        </SectionHeader>

        <div ref={scroller} className="m-carousel grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
          {SERVICES.map((s, i) => (
            <ServiceCard key={s.id} service={s} index={i} featured={i === 0} />
          ))}
        </div>
        <SnapDots scrollerRef={scroller} count={SERVICES.length} />
      </div>
    </section>
  );
}
