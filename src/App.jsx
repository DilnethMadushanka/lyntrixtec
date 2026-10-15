import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ServicesSection from './components/ServicesSection';
import SolutionsSection from './components/SolutionsSection';
import CaseStudiesSection from './components/CaseStudiesSection';
import InteractiveCostCalculator from './components/InteractiveCostCalculator';
import TechStackSection from './components/TechStackSection';
import AboutSection from './components/AboutSection';
import TestimonialsSection from './components/TestimonialsSection';
import FAQSection from './components/FAQSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import AdminDashboard from './components/AdminDashboard';
import ProjectTrackerModal from './components/ProjectTrackerModal';
import AuthModal from './components/AuthModal';
import UserProfileModal from './components/UserProfileModal';
import AmbientBackground from './components/AmbientBackground';
import IntroLoader from './components/IntroLoader';
import ScrollProgress from './components/ScrollProgress';
import SwipeReveal from './components/SwipeReveal';
import { db } from './services/db';
import { LayoutDashboard, AlertTriangle } from 'lucide-react';

const isUserAdmin = (user, admin) => {
  if (admin) return true;
  if (!user) return false;
  if (user.isAdmin) return true;
  const role = (user.role || '').toLowerCase();
  return role.includes('admin');
};

export default function App() {
  const [estimateData, setEstimateData] = useState(null);
  const [currentUser, setCurrentUser] = useState(db.getCurrentUser());
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    const admin = db.getCurrentAdmin();
    const user = db.getCurrentUser();
    return isUserAdmin(user, admin);
  });
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [initialAuthMode, setInitialAuthMode] = useState('signin');
  const [initialAuthEmail, setInitialAuthEmail] = useState('');
  const [verificationToast, setVerificationToast] = useState('');
  // 'site' or 'admin'; remembered for this tab so a refresh keeps an admin in the console
  const [viewMode, setViewMode] = useState(() => {
    try {
      return sessionStorage.getItem('lyntrix_view') === 'admin' ? 'admin' : 'site';
    } catch (e) {
      return 'site';
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('lyntrix_view', viewMode);
    } catch (e) {}
  }, [viewMode]);
  const [dbTrigger, setDbTrigger] = useState(0);

  // Server Maintenance Mode Config State
  const [maintenanceConfig, setMaintenanceConfig] = useState(() => db.getMaintenanceConfig());

  useEffect(() => {
    const syncMaintenance = () => {
      setMaintenanceConfig(db.getMaintenanceConfig());
    };
    const syncDbState = () => {
      const user = db.getCurrentUser();
      const admin = db.getCurrentAdmin();
      setCurrentUser(user);
      setIsAdminLoggedIn(isUserAdmin(user, admin));
      setDbTrigger(prev => prev + 1);
    };

    window.addEventListener('lyntrix-maintenance-updated', syncMaintenance);
    window.addEventListener('lyntrix-db-updated', syncDbState);
    return () => {
      window.removeEventListener('lyntrix-maintenance-updated', syncMaintenance);
      window.removeEventListener('lyntrix-db-updated', syncDbState);
    };
  }, []);

  // Cursor spotlight: feed pointer position (relative to the hovered card) into CSS vars
  useEffect(() => {
    if (!window.matchMedia('(hover: hover)').matches) return undefined;
    let raf = 0;
    const onMove = (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const card = e.target.closest?.('.surface-interactive, .glass-card');
        if (!card) return;
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  // 1-Click Magic Email Verification Link Listener & Cloud DB Sync
  useEffect(() => {
    // Background sync with Cloud Firestore
    db.syncWithCloud().then(() => {
      setDbTrigger(prev => prev + 1);
    });

    try {
      const params = new URLSearchParams(window.location.search);
      const verifyOtp = params.get('verify_otp');
      const email = params.get('email');
      const action = params.get('action'); // 'register', 'reset', 'change_password'

      if (verifyOtp && email) {
        // Clean URL parameters without reloading page
        window.history.replaceState({}, document.title, window.location.pathname);

        if (action === 'reset') {
          // Open password reset directly
          setInitialAuthMode('set_new_password');
          setInitialAuthEmail(email);
          setIsAuthOpen(true);
        } else if (action === 'change_password') {
          // Open profile modal directly for password update
          setVerificationToast(`✨ 1-Click Verification Confirmed for ${email}!`);
          setIsProfileOpen(true);
          setTimeout(() => setVerificationToast(''), 6000);
        } else {
          // Instant 1-Click Account Activation & Login
          const existingUsers = db.getUsers();
          let matched = existingUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
          if (!matched) {
            matched = {
              id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
              name: email.split('@')[0],
              email: email,
              company: 'Verified Corporate Client',
              birthday: '1998-05-14',
              phone: '+94 71 455 7857',
              country: 'Sri Lanka',
              role: 'Client',
              status: 'Active',
              joinedDate: new Date().toISOString().split('T')[0],
              authProvider: '1-Click Email Link'
            };
            db.saveUsers([matched, ...existingUsers]);
          }
          db.setCurrentUser(matched);
          setCurrentUser(matched);
          setVerificationToast(`🎉 1-Click Email Verification Success! Welcome, ${matched.name}.`);
          setTimeout(() => setVerificationToast(''), 6000);
        }
      }
    } catch (err) {
      console.warn('URL verification handler note:', err);
    }
  }, []);

  const handleSelectEstimate = (data) => {
    setEstimateData(data);
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenCalculator = () => {
    const calcSection = document.getElementById('calculator');
    if (calcSection) {
      calcSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setViewMode('site');
    db.logoutAdmin();
    db.logoutUser();
    setCurrentUser(null);
  };

  const handleAuthSuccess = (user, isAdmin = false) => {
    setCurrentUser(user);
    if (isAdmin || user.role === 'Admin') {
      setIsAdminLoggedIn(true);
      setViewMode('admin');
    }
    setDbTrigger(prev => prev + 1);
  };

  const handleLogoutUser = () => {
    db.logoutUser();
    db.logoutAdmin();
    setCurrentUser(null);
    setIsAdminLoggedIn(false);
    setViewMode('site');
  };

  const triggerDataRefresh = () => {
    setDbTrigger(prev => prev + 1);
  };

  if (viewMode === 'admin' && isAdminLoggedIn) {
    return (
      <AdminDashboard
        onLogout={handleLogout}
        onReturnToSite={() => setViewMode('site')}
        onDataUpdated={triggerDataRefresh}
      />
    );
  }

  // Check if Full Maintenance Lock Overlay is active (and visitor is not Master Admin)
  if (maintenanceConfig.enabled && maintenanceConfig.mode === 'full' && !isAdminLoggedIn && viewMode !== 'admin') {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-amber-500/30 selection:text-amber-300 font-sans">
        <AmbientBackground intensity={0.6} />

        <div className="max-w-xl w-full glass-card p-6 sm:p-12 rounded-3xl border border-amber-500/30 text-center space-y-6 relative z-10 fade-up">

          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/90 border border-amber-600/80 text-xs font-mono text-amber-300 font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>SYSTEM UPGRADE IN PROGRESS</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-medium tracking-[-0.04em] text-white">
              Scheduled Platform Maintenance
            </h1>
          </div>

          <p className="text-sm text-slate-300 font-mono leading-relaxed bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            {maintenanceConfig.message || '⚠️ Scheduled Platform Upgrade in Progress. Systems are undergoing routine maintenance.'}
          </p>

          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs font-mono">
            <div>
              <div className="text-slate-400">ESTIMATED ETA</div>
              <div className="text-amber-400 font-bold text-base mt-0.5">{maintenanceConfig.eta || '30 Minutes'}</div>
            </div>
            <div>
              <div className="text-slate-400">SECURITY STATUS</div>
              <div className="text-emerald-400 font-bold text-base mt-0.5">TLS 1.3 Secure</div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs font-mono">
            <a
              href="mailto:lyntrixtec@gmail.com"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 text-slate-200 border border-slate-700 hover:text-cyan-400 transition-colors flex items-center justify-center gap-2"
            >
              <span>Email Advisory</span>
            </a>
            <a
              href="https://wa.me/94714557857"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 transition-colors flex items-center justify-center gap-2 font-bold"
            >
              <span>Hotline / WhatsApp: +94 71 455 7857</span>
            </a>
          </div>

          {/* Admin Login Bypass Link */}
          <div className="pt-2">
            <button
              onClick={() => {
                setInitialAuthMode('signin');
                setIsAuthOpen(true);
              }}
              className="text-[11px] text-slate-400 hover:text-cyan-400 underline font-mono"
            >
              Admin Sign In / Login Bypass
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] relative">
      <IntroLoader />
      <ScrollProgress />
      <AmbientBackground />

      {/* Floating Admin Switcher when logged in */}
      {isAdminLoggedIn && (
        <div className="fixed right-4 z-50 bottom-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            onClick={() => setViewMode('admin')}
            className="btn btn-primary btn-sm shadow-2xl shadow-black/50"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Open Admin Console</span>
          </button>
        </div>
      )}

      <Navbar
        onOpenCalculator={handleOpenCalculator}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdminDashboard={() => setViewMode('admin')}
        onOpenTracker={() => setIsTrackerOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenUserProfile={() => setIsProfileOpen(true)}
        currentUser={currentUser}
        onLogoutUser={handleLogoutUser}
        maintenanceConfig={maintenanceConfig}
      />

      <main className="relative z-10">
        <Hero onOpenCalculator={handleOpenCalculator} onOpenTracker={() => setIsTrackerOpen(true)} />
        <SwipeReveal>
          <ServicesSection dbTrigger={dbTrigger} />
        </SwipeReveal>
        <SwipeReveal>
          <SolutionsSection />
        </SwipeReveal>
        <SwipeReveal>
          <CaseStudiesSection />
        </SwipeReveal>
        <SwipeReveal>
          <InteractiveCostCalculator onSelectEstimate={handleSelectEstimate} dbTrigger={dbTrigger} />
        </SwipeReveal>
        <SwipeReveal>
          <TechStackSection />
        </SwipeReveal>
        <SwipeReveal>
          <AboutSection />
        </SwipeReveal>
        <SwipeReveal>
          <TestimonialsSection />
        </SwipeReveal>
        <SwipeReveal>
          <FAQSection />
        </SwipeReveal>
        <SwipeReveal>
          <ContactSection
            estimateData={estimateData}
            onInquirySubmitted={triggerDataRefresh}
            currentUser={currentUser}
            onOpenAuth={(mode = 'signin') => {
              setInitialAuthMode(mode);
              setIsAuthOpen(true);
            }}
          />
        </SwipeReveal>
      </main>

      <Footer
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdminDashboard={() => setViewMode('admin')}
      />

      {/* 1-Click Verification Success Toast Notification */}
      {verificationToast && (
        <div className="fixed top-20 inset-x-4 sm:inset-x-auto sm:right-5 sm:max-w-sm z-[80] p-4 rounded-2xl bg-emerald-950/95 border border-emerald-500/50 text-emerald-200 text-sm shadow-2xl shadow-black/50 flex items-center gap-3 fade-up">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span>{verificationToast}</span>
        </div>
      )}

      {/* Unified Login / Register Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          setInitialAuthMode('signin');
          setInitialAuthEmail('');
        }}
        onAuthSuccess={handleAuthSuccess}
        initialMode={initialAuthMode}
        initialEmail={initialAuthEmail}
      />

      {/* User Profile & Account Management Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onProfileUpdated={(updated) => {
          setCurrentUser(updated);
          triggerDataRefresh();
        }}
        onOpenTracker={() => {
          setIsProfileOpen(false);
          setIsTrackerOpen(true);
        }}
      />

      {/* Project Status Tracker Modal */}
      <ProjectTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
      />
    </div>
  );
}
