import React, { useState, useEffect, useRef } from 'react';
import { Check, Send } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../services/db';
import SectionHeader from './SectionHeader';

const SCALE_OPTIONS = [
  { id: 'mvp', name: 'Startup / MVP', multiplier: 1.0, duration: '2-4 weeks' },
  { id: 'growth', name: 'Growth platform', multiplier: 1.8, duration: '4-8 weeks' },
  { id: 'enterprise', name: 'Enterprise scale', multiplier: 3.2, duration: '8-16 weeks' },
];

const CLOUD_OPTIONS = [
  { id: 'aws', name: 'AWS native' },
  { id: 'azure', name: 'Microsoft Azure' },
  { id: 'multicloud', name: 'Multi-cloud hybrid (+20%)' },
];

const SUPPORT_OPTIONS = [
  { id: 'standard', name: 'Standard (business hours)', cost: 0 },
  { id: 'premium', name: '24/7 managed SOC (<15m SLA)', cost: 800 },
];

function Step({ n, title, children }) {
  return (
    <fieldset className="space-y-3 min-w-0">
      <legend className="flex items-center gap-2.5 mb-3">
        <span className="text-xs font-semibold text-[var(--accent)] tabular-nums">0{n}</span>
        <span className="text-sm font-medium text-white">{title}</span>
      </legend>
      {children}
    </fieldset>
  );
}

function Option({ selected, onClick, children, className = '', multi = false }) {
  return (
    <button
      type="button"
      role={multi ? 'checkbox' : 'radio'}
      aria-checked={selected}
      onClick={onClick}
      className={`surface-interactive w-full text-left px-3.5 py-3 sm:p-3.5 rounded-xl border flex items-center justify-between gap-3 min-h-[3rem] ${
        selected ? 'border-[var(--accent)]/70 bg-[var(--accent-soft)] text-white' : 'border-[var(--line)] bg-white/[0.02] text-[var(--text-2)]'
      } ${className}`}
    >
      <span className="min-w-0 text-sm">{children}</span>
      <span
        className={`w-5 h-5 grid place-items-center shrink-0 border ${multi ? 'rounded-md' : 'rounded-full'} ${
          selected ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-ink)]' : 'border-[var(--line-strong)]'
        }`}
      >
        {selected && <Check className="w-3 h-3" strokeWidth={3} />}
      </span>
    </button>
  );
}

export default function InteractiveCostCalculator({ onSelectEstimate, dbTrigger }) {
  const [serviceType, setServiceType] = useState('software');
  const [scale, setScale] = useState('growth');
  const [cloudEnv, setCloudEnv] = useState('aws');
  const [supportTier, setSupportTier] = useState('premium');
  const [selectedAddons, setSelectedAddons] = useState(['compliance', 'cicd']);
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef(null);
  const summaryRef = useRef(null);
  const [formVisible, setFormVisible] = useState(false);
  const [summaryVisible, setSummaryVisible] = useState(false);

  // Mobile price bar: shown while the options are on screen but the summary card is not
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.target === formRef.current) setFormVisible(e.isIntersecting);
        if (e.target === summaryRef.current) setSummaryVisible(e.isIntersecting);
      });
    }, { threshold: 0 });
    if (formRef.current) io.observe(formRef.current);
    if (summaryRef.current) io.observe(summaryRef.current);
    return () => io.disconnect();
  }, []);

  // Dynamic DB prices
  const [dbServices, setDbServices] = useState(db.getServices());
  const [dbAddons, setDbAddons] = useState(db.getAddons());

  useEffect(() => {
    const handleDbUpdate = () => {
      setDbServices(db.getServices());
      setDbAddons(db.getAddons());
    };
    handleDbUpdate();
    window.addEventListener('lyntrix-db-updated', handleDbUpdate);
    return () => window.removeEventListener('lyntrix-db-updated', handleDbUpdate);
  }, [dbTrigger]);

  const serviceOptions = dbServices.filter((s) => !s.archived).map((s) => ({
    id: s.id,
    name: s.title,
    label: `${s.title} (Base $${s.basePrice.toLocaleString()})`,
    base: s.basePrice,
  }));

  const toggleAddon = (id) =>
    setSelectedAddons((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const selectedService = serviceOptions.find((s) => s.id === serviceType) || serviceOptions[0];
  const selectedScale = SCALE_OPTIONS.find((s) => s.id === scale);
  const selectedSupport = SUPPORT_OPTIONS.find((s) => s.id === supportTier);

  let basePrice = selectedService ? selectedService.base : 3500;
  basePrice *= selectedScale ? selectedScale.multiplier : 1.8;
  if (cloudEnv === 'multicloud') basePrice *= 1.2;
  basePrice += selectedSupport ? selectedSupport.cost : 0;

  const addonsTotal = selectedAddons.reduce((sum, id) => {
    const found = dbAddons.find((a) => a.id === id);
    return sum + (found ? found.price : 0);
  }, 0);

  const total = Math.round(basePrice + addonsTotal);
  const min = Math.round(total * 0.9);
  const max = Math.round(total * 1.15);

  const handleRequestQuote = () => {
    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 }, colors: ['#38bdf8', '#818cf8', '#c084fc', '#ffffff'] });
    } catch (e) {
      // confetti is decorative
    }
    setSubmitted(true);
    if (onSelectEstimate) {
      onSelectEstimate({
        // Contact form derives the service name from text before "(" — keep that shape
        service: selectedService.label,
        scale: selectedScale.name,
        estimateRange: `$${min.toLocaleString()} - $${max.toLocaleString()}`,
        duration: selectedScale.duration,
      });
    }
  };

  return (
    <section id="calculator" className="section section-tint">
      <div className="container-x">
        <SectionHeader index="04" label="Estimator" title="Instant" accent="project estimate.">
          Configure your requirements for a budget and timeline projection. Prices update live from our current rate card.
        </SectionHeader>

        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <div ref={formRef} className="lg:col-span-8 surface edge-light p-4 sm:p-8 space-y-8 sm:space-y-9">
            <Step n="1" title="Primary service area">
              <div role="radiogroup" className="grid sm:grid-cols-2 gap-2.5">
                {serviceOptions.map((s) => (
                  <Option key={s.id} selected={serviceType === s.id} onClick={() => setServiceType(s.id)}>
                    <span className="font-medium">{s.name}</span>
                    <span className="block text-xs text-[var(--muted)] tabular-nums mt-0.5">from ${s.base.toLocaleString()}</span>
                  </Option>
                ))}
              </div>
            </Step>

            <Step n="2" title="Scale & complexity">
              <div role="radiogroup" className="grid sm:grid-cols-3 gap-2.5">
                {SCALE_OPTIONS.map((sc) => (
                  <Option key={sc.id} selected={scale === sc.id} onClick={() => setScale(sc.id)}>
                    <span className="font-medium">{sc.name}</span>
                    <span className="block text-xs text-[var(--muted)] tabular-nums mt-0.5">{sc.duration}</span>
                  </Option>
                ))}
              </div>
            </Step>

            <div className="grid sm:grid-cols-2 gap-8">
              <Step n="3" title="Cloud environment">
                <div role="radiogroup" className="space-y-2.5">
                  {CLOUD_OPTIONS.map((c) => (
                    <Option key={c.id} selected={cloudEnv === c.id} onClick={() => setCloudEnv(c.id)}>
                      {c.name}
                    </Option>
                  ))}
                </div>
              </Step>

              <Step n="4" title="Support & SLA">
                <div role="radiogroup" className="space-y-2.5">
                  {SUPPORT_OPTIONS.map((sp) => (
                    <Option key={sp.id} selected={supportTier === sp.id} onClick={() => setSupportTier(sp.id)}>
                      {sp.name}
                    </Option>
                  ))}
                </div>
              </Step>
            </div>

            <Step n="5" title="Optional add-ons">
              <div className="grid sm:grid-cols-2 gap-2.5">
                {dbAddons.filter((a) => !a.archived).map((addon) => (
                  <Option key={addon.id} multi selected={selectedAddons.includes(addon.id)} onClick={() => toggleAddon(addon.id)}>
                    <span className="font-medium">{addon.title || addon.name}</span>
                    <span className="block text-xs text-[var(--muted)] tabular-nums mt-0.5">+${addon.price.toLocaleString()}</span>
                  </Option>
                ))}
              </div>
            </Step>
          </div>

          {/* Summary */}
          <aside ref={summaryRef} className="lg:col-span-4 lg:sticky lg:top-24">
            <div className="surface ring-grad overflow-hidden p-5 sm:p-7 relative">
              <span className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-[#818cf8]/20 blur-3xl pointer-events-none" aria-hidden="true" />
              <div className="label relative">Estimated investment</div>
              <div className="mt-4">
                <div className="stat !text-[clamp(2rem,3.6vw,2.6rem)] tabular-nums break-words">
                  ${min.toLocaleString()}
                  <span className="block text-[var(--muted)] text-[0.55em] tracking-[-0.02em] mt-1">to ${max.toLocaleString()}</span>
                </div>
                <div className="mt-4 chip chip-accent">Delivery · {selectedScale.duration}</div>
              </div>

              <dl className="mt-6 pt-5 border-t border-[var(--line)] space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--muted)]">Service</dt>
                  <dd className="text-right text-[var(--text)]">{selectedService.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--muted)]">Scope</dt>
                  <dd className="text-right text-[var(--text)]">{selectedScale.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--muted)]">Add-ons</dt>
                  <dd className="text-right text-[var(--text)]">{selectedAddons.length} selected</dd>
                </div>
              </dl>

              <div className="mt-6">
                {submitted ? (
                  <div className="p-4 rounded-xl border border-[var(--ok)]/30 bg-[var(--ok)]/10 text-sm text-emerald-200">
                    <div className="font-semibold">Estimate locked in</div>
                    <p className="mt-1 text-emerald-200/80">Add your contact details below to receive a full proposal.</p>
                  </div>
                ) : (
                  <button onClick={handleRequestQuote} className="btn btn-primary w-full">
                    Lock estimate & request proposal
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
                Final scope and pricing are confirmed in a technical discovery session.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile price bar */}
      <div
        className={`lg:hidden fixed inset-x-3 z-40 bottom-[max(0.75rem,env(safe-area-inset-bottom))] transition-all duration-500 ease-[var(--ease)] ${
          formVisible && !summaryVisible ? 'translate-y-0 opacity-100' : 'translate-y-[150%] opacity-0 pointer-events-none'
        }`}
        aria-hidden={!(formVisible && !summaryVisible)}
      >
        <div className="flex items-center justify-between gap-3 rounded-full border border-white/10 bg-[#0e0e13]/90 backdrop-blur-xl pl-5 pr-1.5 py-1.5 shadow-[0_16px_50px_-10px_rgba(0,0,0,0.9)]">
          <div className="min-w-0">
            <div className="label !text-[10px]">Estimate</div>
            <div className="text-white font-medium tabular-nums tracking-[-0.01em] truncate">
              ${min.toLocaleString()} – ${max.toLocaleString()}
            </div>
          </div>
          <button
            type="button"
            onClick={() => summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            className="btn btn-primary btn-sm shrink-0"
          >
            Review
          </button>
        </div>
      </div>
    </section>
  );
}
