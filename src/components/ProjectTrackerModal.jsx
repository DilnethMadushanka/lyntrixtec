import React, { useState } from 'react';
import { Search, X, CheckCircle2, Clock, AlertCircle, ShieldCheck, ArrowRight, Activity, Terminal } from 'lucide-react';
import { db } from '../services/db';

export default function ProjectTrackerModal({ isOpen, onClose }) {
  const [trackingId, setTrackingId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searched, setSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = (e) => {
    e.preventDefault();
    setSearched(true);
    const inquiries = db.getInquiries();
    const found = inquiries.find(item => item.id.toLowerCase() === trackingId.trim().toLowerCase());
    setSearchResult(found || null);
  };

  // Timeline Steps Generator
  const getTimelineSteps = (status) => {
    const isNew = status === 'New';
    const isInReview = status === 'In Review';
    const isProposalSent = status === 'Proposal Sent';
    const isClosedWon = status === 'Closed Won';

    return [
      {
        title: 'Requirement Audit & Discovery',
        desc: 'Technical discovery session & baseline project scoping.',
        completed: true,
        current: isNew
      },
      {
        title: 'Architecture Blueprint & IaC Specs',
        desc: 'System architecture design, database schema & SLA formulation.',
        completed: isInReview || isProposalSent || isClosedWon,
        current: isInReview
      },
      {
        title: 'Proposal & Commercial Agreement',
        desc: 'Formal commercial proposal lock & non-disclosure execution.',
        completed: isProposalSent || isClosedWon,
        current: isProposalSent
      },
      {
        title: 'Core Development & Security Pentest',
        desc: 'Sprint engineering, Zero-Trust shielding & continuous testing.',
        completed: isClosedWon,
        current: false
      },
      {
        title: 'Production Staging & Launch',
        desc: 'Global Edge CDN deployment & 24/7 SOC telemetry activation.',
        completed: isClosedWon,
        current: false
      }
    ];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl glass-card p-6 sm:p-8 rounded-2xl border border-cyan-500/40 shadow-2xl shadow-cyan-950 overflow-hidden">
        
        {/* Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/30">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-extrabold text-white font-sans">Project Status Tracker</h3>
          <p className="text-xs text-slate-400 font-mono">ENTER YOUR UNIQUE PROPOSAL / TRACKING ID</p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="space-y-3 mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Terminal className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                placeholder="e.g. LYN-9021 or LYN-9020"
                value={trackingId}
                onChange={e => setTrackingId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="glow-btn px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 text-slate-950 font-bold text-xs font-mono shrink-0"
            >
              Lookup ID
            </button>
          </div>

          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>🔒 Enter the unique tracking ID assigned to your technical proposal.</span>
          </div>
        </form>

        {/* Search Results Display */}
        {searched && (
          searchResult ? (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              
              {/* Project Card Header */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400">{searchResult.id}</span>
                  <div className="text-base font-bold text-white font-sans">{searchResult.name}</div>
                  <div className="text-xs text-slate-400 font-mono">{searchResult.service}</div>
                </div>

                <div className="text-right">
                  <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${
                    searchResult.status === 'New' ? 'bg-cyan-950 text-cyan-400 border-cyan-800' :
                    searchResult.status === 'In Review' ? 'bg-amber-950 text-amber-400 border-amber-800' :
                    searchResult.status === 'Proposal Sent' ? 'bg-indigo-950 text-indigo-400 border-indigo-800' :
                    'bg-emerald-950 text-emerald-400 border-emerald-800'
                  }`}>
                    STATUS: {searchResult.status.toUpperCase()}
                  </span>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">Est. Budget: {searchResult.budget}</div>
                </div>
              </div>

              {/* Progress Timeline */}
              <div className="space-y-3">
                <div className="text-xs font-mono text-slate-400 uppercase">Live Engineering Timeline</div>
                
                <div className="space-y-3">
                  {getTimelineSteps(searchResult.status).map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs font-mono">
                      <div className="mt-0.5 shrink-0">
                        {step.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : step.current ? (
                          <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-700" />
                        )}
                      </div>
                      <div>
                        <div className={`font-bold ${step.completed ? 'text-emerald-400' : step.current ? 'text-cyan-300' : 'text-slate-500'}`}>
                          {step.title}
                        </div>
                        <div className="text-[11px] text-slate-400">{step.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="p-6 text-center space-y-2 bg-slate-900/60 rounded-xl border border-slate-800 font-mono">
              <AlertCircle className="w-6 h-6 text-rose-400 mx-auto" />
              <div className="text-xs text-rose-300 font-bold">No project record found for ID "{trackingId}".</div>
              <div className="text-[11px] text-slate-400">Please double check your ID or contact your account lead.</div>
            </div>
          )
        )}

      </div>
    </div>
  );
}
