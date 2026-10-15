import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, Clock, Calendar, UserCheck, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../services/db';
import { emailService } from '../services/emailService';

const TIME_SLOTS = [
  '09:00 AM - 09:30 AM (IST)',
  '11:00 AM - 11:30 AM (IST)',
  '02:00 PM - 02:30 PM (IST)',
  '04:00 PM - 04:30 PM (IST)',
  '06:00 PM - 06:30 PM (IST)',
  '08:00 PM - 08:30 PM (IST)',
];

const PLATFORMS = ['Google Meet (Video Call)', 'Zoom Workplace', 'Microsoft Teams', 'Direct Phone Call'];

const CHANNELS = [
  { icon: Mail, label: 'Email', value: 'lyntrixtec@gmail.com', href: 'mailto:lyntrixtec@gmail.com' },
  { icon: Phone, label: 'Hotline & WhatsApp', value: '+94 71 455 7857', href: 'https://wa.me/94714557857', external: true },
  { icon: MapPin, label: 'Headquarters', value: 'Colombo, Sri Lanka · Global remote teams' },
];

function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-[var(--text-2)]">{label}</span>
      {children}
    </label>
  );
}

export default function ContactSection({ estimateData, onInquirySubmitted, currentUser, onOpenAuth }) {
  const tomorrowDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    service: 'Software Development',
    budget: '$5,000 - $15,000',
    details: '',
  });

  // 'proposal' = full proposal (+ optional consultation), 'consultation_only' = standalone booking
  const [formTab, setFormTab] = useState('proposal');
  const [wantConsultation, setWantConsultation] = useState(true);
  const [consultationDate, setConsultationDate] = useState(tomorrowDate);
  const [consultationTime, setConsultationTime] = useState(TIME_SLOTS[0]);
  const [meetingPlatform, setMeetingPlatform] = useState(PLATFORMS[0]);

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailNotice, setEmailNotice] = useState('');

  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        name: currentUser.name || prev.name || '',
        email: currentUser.email || prev.email,
        phone: currentUser.phone || prev.phone || '',
      }));
    }
  }, [currentUser]);

  useEffect(() => {
    if (estimateData) {
      setFormData((prev) => ({
        ...prev,
        service: estimateData.service ? estimateData.service.split('(')[0].trim() : prev.service,
        budget: estimateData.estimateRange || prev.budget,
        details: `Pre-configured from Estimator: ${estimateData.service} (${estimateData.scale}). Est. Budget: ${estimateData.estimateRange}.`,
      }));
      setFormTab('proposal');
    }
  }, [estimateData]);

  const isConsultationOnly = formTab === 'consultation_only';
  const showScheduler = isConsultationOnly || wantConsultation;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      if (onOpenAuth) onOpenAuth('signin');
      return;
    }

    setIsSubmitting(true);

    const newLead = {
      id: `LYN-${Math.floor(1000 + Math.random() * 9000)}`,
      name: formData.name || currentUser.name || 'Valued Client',
      email: formData.email || currentUser.email,
      phone: formData.phone || currentUser.phone || 'N/A',
      service: isConsultationOnly ? `1-on-1 Consultation (${formData.service})` : formData.service,
      scale: estimateData ? estimateData.scale : isConsultationOnly ? 'Free Consultation Call' : 'Custom Project',
      budget: isConsultationOnly ? 'Free Consultation' : formData.budget,
      status: 'Pending Approval',
      consultationStatus: 'Pending Approval',
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      details:
        formData.details ||
        (isConsultationOnly
          ? `Standalone 1-on-1 Architecture Consultation Booking Request for ${consultationDate} at ${consultationTime}.`
          : 'N/A'),
      hasConsultation: isConsultationOnly ? true : wantConsultation,
      consultationDate: showScheduler ? consultationDate : null,
      consultationTime: showScheduler ? consultationTime : null,
      meetingPlatform: showScheduler ? meetingPlatform : null,
    };

    await db.addInquiry(newLead);
    if (onInquirySubmitted) onInquirySubmitted();

    await emailService.sendAdminOrderAlert(newLead);

    setEmailNotice(
      isConsultationOnly
        ? `Free 1-on-1 consultation request for ${consultationDate} at ${consultationTime} saved. Status: pending admin approval. You will be emailed the confirmed meeting link once approved.`
        : wantConsultation
          ? `Proposal and consultation request for ${consultationDate} saved. Status: pending admin approval. You will be emailed the confirmed meeting link once approved.`
          : 'Proposal received. Our architecture team will review your specifications.'
    );

    setIsSubmitting(false);
    setSubmitted(true);
    try {
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 }, colors: ['#38bdf8', '#818cf8', '#c084fc', '#ffffff'] });
    } catch (err) {
      // confetti is decorative
    }
  };

  const set = (key) => (e) => setFormData({ ...formData, [key]: e.target.value });

  return (
    <section id="contact" className="section">
      <div className="container-x">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <div className="eyebrow">
                <span className="idx">09</span>
                <span className="rule" aria-hidden="true" />
                <span>Contact</span>
              </div>
              <h2 className="h2 mt-5 !text-[clamp(2.4rem,6vw,4.5rem)]">
                Let’s build your <span className="serif">next platform.</span>
              </h2>
              <p className="lead mt-5">
                Accelerating software delivery, migrating to cloud or locking down security? Talk directly with our lead architects.
              </p>
            </div>

            <ul className="border-y border-[var(--line)] divide-y divide-[var(--line)]">
              {CHANNELS.map(({ icon: Icon, label, value, href, external }) => {
                const inner = (
                  <>
                    <span className="w-11 h-11 rounded-full border border-[var(--line-strong)] text-[var(--accent)] grid place-items-center shrink-0 transition-colors group-hover:bg-[var(--text)] group-hover:text-[var(--accent-ink)] group-hover:border-[var(--text)]">
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="label block">{label}</span>
                      <span className="block text-white font-medium break-words">{value}</span>
                    </span>
                  </>
                );
                return (
                  <li key={label}>
                    {href ? (
                      <a
                        href={href}
                        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        className="group flex items-center gap-4 py-5 transition-colors"
                      >
                        {inner}
                      </a>
                    ) : (
                      <div className="flex items-center gap-4 py-5">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="flex items-start gap-3 text-sm text-[var(--text-2)]">
              <Clock className="w-5 h-5 text-[var(--ok)] shrink-0 mt-0.5" />
              <p>Every inquiry alerts our team instantly and is acknowledged within 2 hours.</p>
            </div>
          </div>

          {/* Right */}
          <div className="lg:col-span-7 surface ring-grad p-5 sm:p-8 lg:p-10 w-full">
            {submitted ? (
              <div className="py-8 sm:py-12 text-center space-y-4 fade-up">
                <div className="w-14 h-14 rounded-full bg-[var(--ok)]/10 text-[var(--ok)] border border-[var(--ok)]/30 grid place-items-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="h3">Request received</h3>
                <p className="text-[var(--text-2)] max-w-md mx-auto">
                  Thank you, <strong className="text-white">{formData.name}</strong>. Your details have been saved securely.
                </p>
                {emailNotice && (
                  <p className="text-sm text-[var(--text-2)] max-w-md mx-auto p-4 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)]">
                    {emailNotice}
                  </p>
                )}
                <button onClick={() => setSubmitted(false)} className="btn btn-ghost">
                  Submit another inquiry
                </button>
              </div>
            ) : !currentUser ? (
              <div className="py-8 text-center space-y-6 max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] grid place-items-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="space-y-3">
                  <span className="chip chip-accent">Registered clients only</span>
                  <h3 className="h3">Sign in to submit a proposal</h3>
                  <p className="text-sm text-[var(--text-2)] leading-relaxed">
                    To keep engagements secure and schedule 1-on-1 architecture consultations, proposals are accepted from verified Lyntrix accounts.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button type="button" onClick={() => onOpenAuth && onOpenAuth('signin')} className="btn btn-primary">
                    <UserCheck className="w-4 h-4" /> Sign in
                  </button>
                  <button type="button" onClick={() => onOpenAuth && onOpenAuth('signup')} className="btn btn-ghost">
                    Create free account
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div role="tablist" aria-label="Request type" className="grid sm:grid-cols-2 gap-1 p-1 rounded-full bg-white/[0.03] border border-[var(--line)]">
                  {[
                    { id: 'proposal', icon: Send, label: 'Technical proposal' },
                    { id: 'consultation_only', icon: Calendar, label: 'Free consultation only' },
                  ].map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={formTab === id}
                      onClick={() => setFormTab(id)}
                      className={`min-h-[2.75rem] px-3 rounded-full text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                        formTab === id ? 'bg-[var(--text)] text-[var(--accent-ink)]' : 'text-[var(--muted)] hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="h3 !text-xl">
                      {isConsultationOnly ? 'Book a free architecture consultation' : 'Request a technical proposal'}
                    </h3>
                    <div className="text-xs text-[var(--ok)] flex items-center gap-1.5 mt-1.5 break-all">
                      <UserCheck className="w-3.5 h-3.5 shrink-0" />
                      Signed in as {currentUser.email}
                    </div>
                  </div>
                  {estimateData && !isConsultationOnly && <span className="chip chip-accent">Pre-filled from estimator</span>}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Full name *">
                    <input type="text" required autoComplete="name" placeholder="Your name" value={formData.name} onChange={set('name')} className="field" />
                  </Field>
                  <Field label="Email *">
                    <input type="email" required autoComplete="email" placeholder="name@company.com" value={formData.email} onChange={set('email')} className="field" />
                  </Field>
                  <Field label="Phone (optional)">
                    <input type="tel" autoComplete="tel" placeholder="+94 71 455 7857" value={formData.phone} onChange={set('phone')} className="field" />
                  </Field>
                  <Field label="Primary technology area">
                    <select value={formData.service} onChange={set('service')} className="field">
                      <option>Software Development</option>
                      <option>Cloud Migration & DevOps</option>
                      <option>Cybersecurity Defense</option>
                      <option>IT Consulting & Strategy</option>
                      <option>24/7 Managed IT Support</option>
                    </select>
                  </Field>
                </div>

                <Field label={isConsultationOnly ? 'Topics to discuss (optional)' : 'Project requirements & scope *'}>
                  <textarea
                    rows={4}
                    required={!isConsultationOnly}
                    placeholder={
                      isConsultationOnly
                        ? 'Any specific technical topics or questions for the call…'
                        : 'Briefly describe your goals, target platform, integrations or expected deliverables…'
                    }
                    value={formData.details}
                    onChange={set('details')}
                    className="field resize-y"
                  />
                </Field>

                <div className="p-4 sm:p-5 rounded-2xl border border-[var(--line)] bg-white/[0.02] space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <Calendar className="w-4 h-4 text-[var(--accent)]" />
                      Free 1-on-1 architecture session
                    </div>
                    {!isConsultationOnly && (
                      <label className="flex items-center gap-2.5 text-sm text-[var(--text-2)] cursor-pointer select-none min-h-[2.5rem]">
                        <input
                          type="checkbox"
                          checked={wantConsultation}
                          onChange={(e) => setWantConsultation(e.target.checked)}
                          className="w-5 h-5 rounded accent-[var(--accent)] cursor-pointer"
                        />
                        Include consultation
                      </label>
                    )}
                  </div>

                  {showScheduler && (
                    <div className="grid sm:grid-cols-3 gap-3">
                      <Field label="Date *">
                        <input type="date" required min={tomorrowDate} value={consultationDate} onChange={(e) => setConsultationDate(e.target.value)} className="field" />
                      </Field>
                      <Field label="Time slot *">
                        <select value={consultationTime} onChange={(e) => setConsultationTime(e.target.value)} className="field">
                          {TIME_SLOTS.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Platform *">
                        <select value={meetingPlatform} onChange={(e) => setMeetingPlatform(e.target.value)} className="field">
                          {PLATFORMS.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full !min-h-[3.25rem] disabled:opacity-70">
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-[var(--accent-ink)] border-t-transparent animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      {isConsultationOnly ? 'Book consultation' : 'Submit proposal request'}
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-xs text-[var(--muted)] text-center">
                  Our team is notified instantly at lyntrixtec@gmail.com.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
