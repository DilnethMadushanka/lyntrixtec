import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Mail, Building, Calendar, Phone, Globe, ShieldCheck, 
  X, Lock, CheckCircle2, AlertCircle, FileText, Clock, Save, 
  Sparkles, ExternalLink, ChevronRight, Check, KeyRound, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../services/db';
import { emailService } from '../services/emailService';

export default function UserProfileModal({ isOpen, onClose, currentUser, onProfileUpdated, onOpenTracker }) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'security', 'orders'
  
  // Profile Form States
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    company: '',
    birthday: '',
    phone: '',
    country: 'Sri Lanka'
  });

  // Password States & OTP Flow
  const [passwordStep, setPasswordStep] = useState('input'); // 'input' or 'otp'
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(110);
  const [isRealEmailSent, setIsRealEmailSent] = useState(false);
  const otpInputsRef = useRef([]);

  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Countdown Timer
  useEffect(() => {
    let interval = null;
    if (passwordStep === 'otp' && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [passwordStep, timerSeconds]);

  // Inquiries State for dynamic live updates
  const [inquiriesList, setInquiriesList] = useState([]);

  // Sync user data & fresh inquiries on open
  useEffect(() => {
    if (currentUser && isOpen) {
      setFormData({
        name: currentUser.name || '',
        username: currentUser.username || currentUser.email?.split('@')[0] || '',
        email: currentUser.email || '',
        company: currentUser.company || '',
        birthday: currentUser.birthday || '',
        phone: currentUser.phone || '',
        country: currentUser.country || 'Sri Lanka'
      });
      setInquiriesList(db.getInquiries());
      setPasswordStep('input');
      setNewPassword('');
      setConfirmPassword('');
      setOtpDigits(['', '', '', '', '', '']);
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  // Filter inquiries for this user
  const userInquiries = inquiriesList.filter(
    inq => inq.email?.trim().toLowerCase() === currentUser.email?.trim().toLowerCase()
  );

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    try {
      const updated = await db.updateUserProfile({
        ...currentUser,
        name: formData.name,
        username: formData.username,
        company: formData.company,
        birthday: formData.birthday,
        phone: formData.phone,
        country: formData.country
      });

      setLoading(false);
      setNotice('✅ Profile details successfully updated in Cloud DB!');
      try { confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } }); } catch (err) {}
      if (onProfileUpdated) onProfileUpdated(updated);
      setTimeout(() => setNotice(''), 4000);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to update profile.');
    }
  };

  // Step 1: Initiate Password Change with OTP
  const handleInitiatePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    // Dispatch 6-Digit OTP via Gmail Nodemailer
    const otpResult = await emailService.generateAndSendOTP(currentUser.email, 'Change Password Security Verification');
    setGeneratedOtp(otpResult.otpCode);
    setIsRealEmailSent(otpResult.realSent);
    setTimerSeconds(110);
    setOtpDigits(['', '', '', '', '', '']);
    setLoading(false);
    setPasswordStep('otp');
  };

  // Handle OTP Paste Event
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d+$/.test(pastedData)) return;
    const digits = pastedData.slice(0, 6).split('');
    const newDigits = ['', '', '', '', '', ''];
    digits.forEach((d, idx) => {
      if (idx < 6) newDigits[idx] = d;
    });
    setOtpDigits(newDigits);
    const code = newDigits.join('');
    if (code.length === 6) {
      executeVerifyPasswordOtp(code);
    }
  };

  // Handle OTP Digit Input Change with Auto-Verification
  const handleOtpDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    const code = newDigits.join('');
    if (code.length === 6) {
      executeVerifyPasswordOtp(code);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const executeVerifyPasswordOtp = async (codeToVerify) => {
    setError('');

    if (codeToVerify.length < 6) {
      setError('Please enter all 6 digits of the OTP verification code.');
      return;
    }

    if (codeToVerify !== generatedOtp) {
      setError('Invalid OTP code. Please check your verification email and try again.');
      return;
    }

    setLoading(true);

    try {
      await db.updateUserPassword(currentUser.email, newPassword);
      setLoading(false);
      setPasswordStep('input');
      setNewPassword('');
      setConfirmPassword('');
      setNotice('🔒 Password successfully updated and verified via Email OTP!');
      try { confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } }); } catch (err) {}
      setTimeout(() => setNotice(''), 4000);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to update password.');
    }
  };

  // Step 2: Verify OTP & Save New Password
  const handleVerifyPasswordOtp = (e) => {
    e.preventDefault();
    executeVerifyPasswordOtp(otpDigits.join(''));
  };

  const handleResendOtp = async () => {
    setError('');
    const otpResult = await emailService.generateAndSendOTP(currentUser.email, 'Change Password Security Verification');
    setGeneratedOtp(otpResult.otpCode);
    setIsRealEmailSent(otpResult.realSent);
    setTimerSeconds(110);
    setOtpDigits(['', '', '', '', '', '']);
    alert(`📧 A fresh 6-digit authorization code has been dispatched to ${currentUser.email}.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl glass-card p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-cyan-500/40 shadow-2xl shadow-cyan-950 max-h-[92vh] overflow-y-auto">
        
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          aria-label="Close Profile Modal"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* User Hero Banner (Mobile, Tablet & Desktop Responsive) */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 pb-5 border-b border-slate-800/80">
          <div className="relative shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-indigo-500 text-slate-950 font-semibold tracking-tight flex items-center justify-center text-xl sm:text-2xl shadow-lg shadow-cyan-500/30 border-2 border-white/20">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-500 border-2 border-slate-950" title="Active Client Account" />
          </div>

          <div className="text-center sm:text-left space-y-1 w-full">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
              <h3 className="text-lg sm:text-xl font-bold text-white font-sans">{currentUser.name}</h3>
              <span className="text-xs text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800/80">
                @{currentUser.username || currentUser.email?.split('@')[0]}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                {currentUser.role || 'Client'}
              </span>
              {currentUser.authProvider === 'Google' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Google Verified
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 break-all">{currentUser.email}</p>
            <div className="text-[10px] sm:text-[11px] text-slate-500 flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-3 pt-0.5">
              <span>ID: <strong className="text-slate-300">{currentUser.id || 'USR-1001'}</strong></span>
              <span>• Joined: <strong className="text-slate-300">{currentUser.joinedDate || '2026-08-01'}</strong></span>
            </div>
          </div>
        </div>

        {/* Responsive Navigation Tabs */}
        <div className="flex bg-slate-900/90 p-1 rounded-xl sm:rounded-2xl border border-slate-800 my-4 text-[11px] sm:text-xs">
          <button
            onClick={() => { setActiveTab('profile'); setError(''); setNotice(''); }}
            className={`flex-1 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
              activeTab === 'profile' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span>Profile</span>
            <span className="hidden md:inline">Details</span>
          </button>

          <button
            onClick={() => { setActiveTab('security'); setError(''); setNotice(''); }}
            className={`flex-1 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
              activeTab === 'security' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>Security</span>
            <span className="hidden md:inline">& 2FA</span>
          </button>

          <button
            onClick={() => { setActiveTab('orders'); setError(''); setNotice(''); }}
            className={`flex-1 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
              activeTab === 'orders' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>Proposals</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-cyan-400 font-bold">({userInquiries.length})</span>
          </button>
        </div>

        {/* Notice Banners */}
        {notice && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/70 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{notice}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/70 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: EDIT PROFILE DETAILS */}
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="space-y-3.5 sm:space-y-4 text-xs animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              
              <div className="space-y-1">
                <label className="text-slate-300 block text-[11px] sm:text-xs">Full Name *</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 absolute left-3 top-3 sm:top-3.5" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-9 sm:pl-10 pr-3.5 py-2.5 sm:py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-cyan-400 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 block text-[11px] sm:text-xs">Username (@handle) *</label>
                <div className="relative">
                  <span className="text-cyan-400 text-sm font-semibold absolute left-3.5 top-2.5 sm:top-3">@</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. dilneth"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, '') })}
                    className="w-full pl-8 sm:pl-9 pr-3.5 py-2.5 sm:py-3 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 text-xs focus:border-cyan-400 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 block text-[11px] sm:text-xs">Corporate Email (Verified)</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 absolute left-3 top-3 sm:top-3.5" />
                  <input
                    type="email"
                    disabled
                    value={formData.email}
                    className="w-full pl-9 sm:pl-10 pr-3.5 py-2.5 sm:py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs cursor-not-allowed opacity-80"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 block text-[11px] sm:text-xs">Company / Organization</label>
                <div className="relative">
                  <Building className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 absolute left-3 top-3 sm:top-3.5" />
                  <input
                    type="text"
                    placeholder="e.g. Lyntrix Global"
                    value={formData.company}
                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                    className="w-full pl-9 sm:pl-10 pr-3.5 py-2.5 sm:py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-cyan-400 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 block text-[11px] sm:text-xs">Date of Birth / Founded</label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 absolute left-3 top-3 sm:top-3.5" />
                  <input
                    type="date"
                    value={formData.birthday}
                    onChange={e => setFormData({ ...formData, birthday: e.target.value })}
                    className="w-full pl-9 sm:pl-10 pr-3.5 py-2.5 sm:py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-cyan-400 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 block text-[11px] sm:text-xs">Phone / Direct Line</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 absolute left-3 top-3 sm:top-3.5" />
                  <input
                    type="tel"
                    placeholder="+94 71 455 7857"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-9 sm:pl-10 pr-3.5 py-2.5 sm:py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-cyan-400 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 block text-[11px] sm:text-xs">Country / Region</label>
                <div className="relative">
                  <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 absolute left-3 top-3 sm:top-3.5" />
                  <select
                    value={formData.country}
                    onChange={e => setFormData({ ...formData, country: e.target.value })}
                    className="w-full pl-9 sm:pl-10 pr-3.5 py-2.5 sm:py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-cyan-400 focus:outline-none transition-colors"
                  >
                    <option>Sri Lanka</option>
                    <option>United States</option>
                    <option>United Kingdom</option>
                    <option>Germany</option>
                    <option>Singapore</option>
                    <option>Australia</option>
                  </select>
                </div>
              </div>

            </div>

            <div className="pt-2 sm:pt-3 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="glow-btn w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: SECURITY & PASSWORD WITH 6-DIGIT EMAIL OTP */}
        {activeTab === 'security' && (
          <div className="space-y-4 text-xs animate-in fade-in duration-200">
            
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-cyan-400 font-bold flex items-center gap-2 text-xs sm:text-sm">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>2FA Email OTP Password Sentinel</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Updating your password requires 6-digit Email OTP authorization sent to <strong className="text-white break-all">{currentUser.email}</strong>.
              </p>
            </div>

            {passwordStep === 'input' ? (
              <form onSubmit={handleInitiatePasswordChange} className="space-y-3.5 sm:space-y-4">
                <div className="space-y-1">
                  <label className="text-slate-300 block text-[11px] sm:text-xs">New Password *</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      placeholder="Min 6 characters..."
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full pl-9 pr-9 py-2.5 sm:py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-cyan-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors"
                      title={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 block text-[11px] sm:text-xs">Confirm New Password *</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="Re-enter new password..."
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-9 py-2.5 sm:py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-cyan-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors"
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="glow-btn w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{loading ? 'Dispatching OTP Code...' : 'Send OTP to Authorize Change'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyPasswordOtp} className="space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95 duration-200">
                <div className="p-3.5 sm:p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-xs text-center space-y-2">
                  <div className="text-cyan-400 font-bold">Verification Code Dispatched!</div>
                  <div className="text-slate-300 text-[11px] sm:text-xs">
                    We sent a 6-digit OTP code to <strong className="text-white break-all">{currentUser.email}</strong>.
                  </div>

                  {isRealEmailSent ? (
                    <div className="mt-2 p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/80 text-[11px] text-emerald-300 font-bold flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Real Email Dispatched via Gmail! Check Inbox.</span>
                    </div>
                  ) : (
                    <div className="mt-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-emerald-400 font-bold">
                      [SIMULATED MAILBOX] Your OTP is: <u className="tracking-widest font-extrabold text-sm">{generatedOtp}</u>
                    </div>
                  )}
                </div>

                {/* 6 Single-Digit Input Boxes (Mobile & Tablet Screen Scaled) */}
                <div className="flex justify-center gap-1.5 sm:gap-2.5" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => otpInputsRef.current[idx] = el}
                      type="text"
                      maxLength={1}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={digit}
                      onChange={e => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(idx, e)}
                      className="w-9 h-11 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 focus:border-cyan-400 focus:outline-none transition-colors"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400">
                  <span>Expires in: <strong className="text-white">{Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}</strong></span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-cyan-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Resend Code</span>
                  </button>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => setPasswordStep('input')}
                    className="py-3 px-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25"
                  >
                    {loading ? 'Verifying Code...' : 'Verify OTP & Save Password'}
                  </button>
                </div>
              </form>
            )}

          </div>
        )}

        {/* TAB 3: MY PROPOSALS & ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-200">
            {userInquiries.length === 0 ? (
              <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2 sm:space-y-3 text-xs">
                <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="text-slate-300 font-bold">No Proposals Submitted Yet</div>
                <p className="text-slate-500 max-w-sm mx-auto text-[11px]">
                  You haven't requested any technical architecture proposals under this email address yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 sm:space-y-3">
                {userInquiries.map((inq) => (
                  <div 
                    key={inq.id}
                    className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-all text-xs space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="font-bold text-cyan-400">{inq.id}</span>
                        <span className="text-slate-300 text-[11px] sm:text-xs truncate max-w-[140px] sm:max-w-none">• {inq.service}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        inq.status === 'Accepted' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                        inq.status === 'New' ? 'bg-cyan-950 text-cyan-300 border-cyan-800' :
                        inq.status === 'In Review' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                        'bg-purple-950 text-purple-300 border-purple-800'
                      }`}>
                        {inq.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-[10px] sm:text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 gap-2">
                      <div>Scale: <strong className="text-white">{inq.scale || 'Enterprise'}</strong></div>
                      <div>Budget: <strong className="text-emerald-400 font-bold">{inq.budget}</strong></div>
                      <div>Date: <strong className="text-slate-300">{inq.date}</strong></div>
                    </div>

                    {inq.details && (
                      <p className="text-[11px] text-slate-300 bg-slate-950 p-2 sm:p-2.5 rounded-lg border border-slate-800/60 leading-relaxed font-sans">
                        "{inq.details}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
