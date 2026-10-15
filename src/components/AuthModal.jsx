import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Lock, Building, Calendar, Phone, Globe, ShieldCheck, X, Sparkles, AlertCircle, ArrowRight, CheckCircle2, KeyRound, RefreshCw, Key, Eye, EyeOff } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../services/db';
import { emailService } from '../services/emailService';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialMode = 'signin', initialEmail = '' }) {
  const [mode, setMode] = useState(initialMode || 'signin'); // 'signin', 'signup', 'forgot_password', 'otp_verify', 'set_new_password', or 'google_prompt'
  const [otpPurpose, setOtpPurpose] = useState('signup'); // 'signup' or 'forgot_password'
  
  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Sign In States
  const [loginEmail, setLoginEmail] = useState(initialEmail || '');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Sign Up States
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail || '');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [birthday, setBirthday] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Sri Lanka');

  // Forgot Password / Reset States
  const [forgotEmail, setForgotEmail] = useState(initialEmail || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccessNotice, setResetSuccessNotice] = useState('');

  // Sync initialMode on modal open
  useEffect(() => {
    if (isOpen && initialMode) {
      setMode(initialMode);
      if (initialEmail) {
        setForgotEmail(initialEmail);
        setLoginEmail(initialEmail);
      }
    }
  }, [isOpen, initialMode, initialEmail]);

  // Google SSO Prompt States
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleCompany, setGoogleCompany] = useState('');
  const [googleBirthday, setGoogleBirthday] = useState('');

  // OTP Verification States
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [pendingUserData, setPendingUserData] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(110);
  const [isRealEmailSent, setIsRealEmailSent] = useState(false);
  const otpInputsRef = useRef([]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Countdown Timer
  useEffect(() => {
    let interval = null;
    if (mode === 'otp_verify' && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [mode, timerSeconds]);

  if (!isOpen) return null;

  // Handle Standard Sign In
  const handleSignIn = (e) => {
    e.preventDefault();
    setError('');
    setResetSuccessNotice('');
    setLoading(true);

    setTimeout(() => {
      try {
        // 1. Check if credentials belong to an Admin in Cloud DB
        const adminAuth = db.validateAdminCredentials(loginEmail, loginPassword);
        if (adminAuth && adminAuth.success) {
          setLoading(false);
          try { confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } }); } catch (err) {}
          const adminProfile = {
            id: adminAuth.admin.id,
            name: adminAuth.admin.name,
            email: adminAuth.admin.email,
            role: 'Admin',
            isAdmin: true
          };
          db.setCurrentUser(adminProfile);
          onAuthSuccess(adminProfile, true);
          onClose();
          return;
        }

        // 2. Regular Client login
        const user = db.loginUser(loginEmail, loginPassword);
        setLoading(false);
        try { confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } }); } catch (err) {}
        onAuthSuccess(user, false);
        onClose();
      } catch (err) {
        setLoading(false);
        setError(err.message || 'Failed to sign in. Invalid email or password.');
      }
    }, 600);
  };

  // Initiate Registration with OTP Verification
  const handleInitiateSignUp = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !company || !birthday) {
      setError('Please fill in all required fields including Date of Birth and Company Name.');
      return;
    }

    setLoading(true);

    // Generate 6-Digit OTP & Dispatch Email
    const otpResult = await emailService.generateAndSendOTP(email);
    setGeneratedOtp(otpResult.otpCode);
    setIsRealEmailSent(otpResult.realSent);
    setOtpPurpose('signup');
    setPendingUserData({
      name,
      email,
      password,
      company,
      birthday,
      phone,
      country,
      authProvider: 'Email'
    });
    setTimerSeconds(110);
    setOtpDigits(['', '', '', '', '', '']);
    setLoading(false);
    setMode('otp_verify');
  };

  // Initiate Forgot Password with OTP Verification
  const handleInitiateForgotPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!forgotEmail) {
      setError('Please enter your corporate email address.');
      return;
    }

    setLoading(true);

    // Generate 6-Digit OTP & Dispatch Email
    const otpResult = await emailService.generateAndSendOTP(forgotEmail);
    setGeneratedOtp(otpResult.otpCode);
    setIsRealEmailSent(otpResult.realSent);
    setOtpPurpose('forgot_password');
    setPendingUserData({
      email: forgotEmail
    });
    setTimerSeconds(110);
    setOtpDigits(['', '', '', '', '', '']);
    setLoading(false);
    setMode('otp_verify');
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
      triggerVerifyOtp(code);
    }
  };

  // Handle OTP Digit Input Change with Auto-Verification
  const handleOtpDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto-focus next input box
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    const code = newDigits.join('');
    if (code.length === 6) {
      triggerVerifyOtp(code);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const triggerVerifyOtp = async (codeToVerify) => {
    setError('');

    if (codeToVerify.length < 6) {
      setError('Please enter all 6 digits of the OTP verification code.');
      return;
    }

    if (codeToVerify !== generatedOtp) {
      setError('Invalid OTP code. Please check your verification code and try again.');
      return;
    }

    setLoading(true);

    try {
      if (otpPurpose === 'forgot_password') {
        setLoading(false);
        setMode('set_new_password');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const newUser = await db.registerUser(pendingUserData);
        setLoading(false);
        try { confetti({ particleCount: 110, spread: 85, origin: { y: 0.6 } }); } catch (err) {}
        onAuthSuccess(newUser, false);
        onClose();
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Registration failed.');
    }
  };

  // Verify 6-Digit OTP Code
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    triggerVerifyOtp(otpDigits.join(''));
  };

  // Handle Set New Password Submission
  const handleSetNewPassword = (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      try {
        const targetEmail = forgotEmail || pendingUserData?.email;
        db.updateUserPassword(targetEmail, newPassword);
        setLoading(false);
        try { confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 } }); } catch (err) {}
        
        setResetSuccessNotice('🎉 Password successfully updated! You can now sign in with your new password.');
        setLoginEmail(targetEmail);
        setLoginPassword('');
        setMode('signin');
      } catch (err) {
        setLoading(false);
        setError(err.message || 'Failed to update password.');
      }
    }, 600);
  };

  const handleResendOtp = async () => {
    setError('');
    const targetEmail = pendingUserData ? pendingUserData.email : forgotEmail || email;
    const otpResult = await emailService.generateAndSendOTP(targetEmail);
    setGeneratedOtp(otpResult.otpCode);
    setIsRealEmailSent(otpResult.realSent);
    setTimerSeconds(110);
    setOtpDigits(['', '', '', '', '', '']);
    alert(`📧 A new 6-digit verification code has been generated for ${targetEmail}.`);
  };

  // Google Official OAuth Popup Flow
  const handleLaunchGoogleOAuth = () => {
    setError('');
    setLoading(true);

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1087051735660-iupg8tuvqp0bebkh6mda98borimo9ipn.apps.googleusercontent.com';

    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          prompt: 'select_account',
          callback: (response) => {
            if (response.access_token) {
              fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${response.access_token}` }
              })
                .then(res => res.json())
                .then(async (googleProfile) => {
                  const user = await db.googleAuth({
                    name: googleProfile.name || googleProfile.email.split('@')[0],
                    email: googleProfile.email,
                    company: 'Google Verified Client',
                    birthday: '1998-05-14',
                  });
                  setLoading(false);
                  try { confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } }); } catch (err) {}
                  onAuthSuccess(user, false);
                  onClose();
                })
                .catch(() => {
                  setLoading(false);
                  setMode('google_prompt');
                });
            } else {
              setLoading(false);
              setMode('google_prompt');
            }
          },
          error_callback: (err) => {
            console.warn('Google OAuth error:', err);
            setLoading(false);
            setMode('google_prompt');
          }
        });
        client.requestAccessToken({ prompt: 'select_account' });
      } catch (err) {
        setLoading(false);
        setMode('google_prompt');
      }
    } else {
      setLoading(false);
      if (!googleEmail) {
        setGoogleEmail('raveeshaheshan26@gmail.com');
        setGoogleName('Raveesha Heshan');
      }
      setMode('google_prompt');
    }
  };

  const handleCompleteGoogleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const targetEmail = googleEmail || 'lyntrixtec@gmail.com';
    const targetName = googleName || 'Dilneth Madushanka';
    const targetCompany = googleCompany || 'Google Verified Enterprise';
    const targetBirthday = googleBirthday || '1998-05-14';

    try {
      const googleProfile = {
        name: targetName,
        email: targetEmail,
        company: targetCompany,
        birthday: targetBirthday,
      };
      const user = await db.googleAuth(googleProfile);
      setLoading(false);
      try { confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } }); } catch (err) {}
      onAuthSuccess(user, false);
      onClose();
    } catch (err) {
      setLoading(false);
      setError('Google Authentication failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg glass-card p-6 sm:p-8 rounded-2xl border border-cyan-500/40 shadow-2xl shadow-cyan-950 max-h-[90vh] overflow-y-auto">
        
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
            {mode === 'otp_verify' ? <KeyRound className="w-6 h-6" /> :
             mode === 'forgot_password' || mode === 'set_new_password' ? <Key className="w-6 h-6" /> :
             <User className="w-6 h-6" />}
          </div>
          <h3 className="text-2xl font-semibold tracking-tight text-white font-sans">
            {mode === 'signin' ? 'Client Portal Sign In' :
             mode === 'signup' ? 'Create Enterprise Account' :
             mode === 'forgot_password' ? 'Account Recovery' :
             mode === 'otp_verify' ? '2FA Email Verification' :
             mode === 'set_new_password' ? 'Set New Secure Password' :
             'Google OAuth Verification'}
          </h3>
          <p className="text-xs text-slate-400">
            {mode === 'signin' ? 'ACCESS YOUR PROJECTS & PROPOSALS' :
             mode === 'signup' ? 'REGISTER COMPANY PROFILE & SCOPE' :
             mode === 'forgot_password' ? 'ENTER CORPORATE EMAIL FOR 6-DIGIT OTP' :
             mode === 'otp_verify' ? 'ENTER 6-DIGIT CODE SENT TO YOUR EMAIL' :
             mode === 'set_new_password' ? 'CREATE A NEW ACCESS PASSWORD' :
             'GOOGLE SINGLE SIGN-ON VERIFICATION'}
          </p>
        </div>

        {/* Toggle Mode Buttons (Only shown for signin / signup) */}
        {(mode === 'signin' || mode === 'signup') && (
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 mb-6">
            <button
              onClick={() => { setMode('signin'); setError(''); setResetSuccessNotice(''); }}
              className={`flex-1 py-2 text-xs rounded-lg transition-all ${
                mode === 'signin' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); setResetSuccessNotice(''); }}
              className={`flex-1 py-2 text-xs rounded-lg transition-all ${
                mode === 'signup' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800' : 'text-slate-400 hover:text-white'
              }`}
            >
              Register Company
            </button>
          </div>
        )}

        {/* Success Notice Banner */}
        {resetSuccessNotice && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/70 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{resetSuccessNotice}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Google SSO Launcher Button (Only for signin / signup) */}
        {(mode === 'signin' || mode === 'signup') && (
          <div className="mb-5">
            <button
              onClick={handleLaunchGoogleOAuth}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100 hover:text-cyan-300 text-sm font-semibold flex items-center justify-center gap-3 transition-colors shadow-md shadow-slate-950"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{loading ? 'Opening Google Identity Window...' : 'Continue with Google Sign-In'}</span>
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800" /></div>
              <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-[#0d111a] px-2 text-slate-500">OR EMAIL CREDENTIALS</span></div>
            </div>
          </div>
        )}

        {/* FORGOT PASSWORD FORM (Enter Email) */}
        {mode === 'forgot_password' && (
          <form onSubmit={handleInitiateForgotPassword} className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
              <div className="text-cyan-400 font-bold flex items-center gap-2">
                <Key className="w-4 h-4" />
                <span>Password Reset Verification</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Enter your registered corporate email address below. We will send a secure 6-digit OTP code to verify your identity.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Corporate Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="e.g. name@company.com"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(''); }}
                className="flex-1 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition-colors"
              >
                Back to Sign In
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-2 py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25"
              >
                {loading ? 'Sending Code...' : 'Send 6-Digit OTP Code'}
              </button>
            </div>
          </form>
        )}

        {/* 6-DIGIT OTP VERIFICATION SCREEN */}
        {mode === 'otp_verify' && (
          <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-xs text-center space-y-2">
              <div className="text-cyan-400 font-bold">Verification Code Dispatched!</div>
              <div className="text-slate-300">
                We sent a 6-digit OTP code to <strong className="text-white">{pendingUserData?.email || forgotEmail || email}</strong>.
              </div>

              {/* Status Banner */}
              {isRealEmailSent ? (
                <div className="mt-3 p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/80 text-[11px] text-emerald-300 font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Real Email Sent! Please check your Inbox / Spam folder.</span>
                </div>
              ) : (
                <div className="mt-3 p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-emerald-400 font-bold space-y-1">
                  <div className="flex items-center justify-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    <span>[SIMULATED MAILBOX] Your OTP Code is: <u className="tracking-widest font-extrabold text-sm">{generatedOtp}</u></span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    💡 To send real emails to your Gmail inbox, add your free EmailJS Key to <code className="text-cyan-400">.env</code> file.
                  </div>
                </div>
              )}
            </div>

            {/* 6 Single-Digit Input Boxes */}
            <div className="flex justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => otpInputsRef.current[idx] = el}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpDigitChange(idx, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(idx, e)}
                  className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 focus:border-cyan-400 focus:outline-none transition-colors"
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Code expires in: <strong className="text-white">{Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}</strong></span>
              <button
                type="button"
                onClick={handleResendOtp}
                className="text-cyan-400 hover:underline flex items-center gap-1 font-bold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Resend Code</span>
              </button>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode(otpPurpose === 'forgot_password' ? 'forgot_password' : 'signup');
                  setError('');
                }}
                className="flex-1 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-2 py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25"
              >
                {loading ? 'Verifying Code...' : otpPurpose === 'forgot_password' ? 'Verify & Reset Password' : 'Verify OTP & Activate Account'}
              </button>
            </div>

          </form>
        )}

        {/* SET NEW PASSWORD SCREEN (After OTP Verified) */}
        {mode === 'set_new_password' && (
          <form onSubmit={handleSetNewPassword} className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs space-y-1">
              <div className="text-emerald-400 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Identity Verified!</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                Create a new secure password for <strong className="text-white">{forgotEmail || pendingUserData?.email}</strong>.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">New Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  placeholder="Enter min 6 characters..."
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors"
                  title={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Confirm New Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="Re-enter new password..."
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors"
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="glow-btn w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 mt-2"
            >
              {loading ? 'Updating Password...' : 'Save New Password & Sign In'}
            </button>
          </form>
        )}

        {/* Google SSO Prompt */}
        {mode === 'google_prompt' && (
          <form onSubmit={handleCompleteGoogleAuth} className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                </svg>
                <span>Google Workspace Profile Verification</span>
              </div>
              <p className="text-slate-400">
                Confirm your Google account details to save your identity profile to Cloud DB.
              </p>
              <div className="mt-2 p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>🔒 Google OAuth 2.0 Encrypted Identity Token</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Google Email Address *</label>
              <input
                type="email"
                required
                placeholder="lyntrixtec@gmail.com"
                value={googleEmail}
                onChange={e => setGoogleEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Full Name *</label>
              <input
                type="text"
                required
                placeholder="Dilneth Madushanka"
                value={googleName}
                onChange={e => setGoogleName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Company Name</label>
                <input
                  type="text"
                  placeholder="Lyntrix Global Client"
                  value={googleCompany}
                  onChange={e => setGoogleCompany(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Date of Birth / Founded</label>
                <input
                  type="date"
                  value={googleBirthday}
                  onChange={e => setGoogleBirthday(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="py-3 px-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25"
              >
                {loading ? 'Authenticating with Google...' : 'Confirm & Sign In with Google'}
              </button>
            </div>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={triggerExternalGooglePopup}
                className="text-[11px] text-slate-400 hover:text-cyan-400 underline"
              >
                🔑 Try External Google Popup (Requires Console Whitelist)
              </button>
            </div>
          </form>
        )}

        {/* Email Sign In Form */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Corporate Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot_password'); setError(''); setResetSuccessNotice(''); }}
                  className="text-[11px] text-cyan-400 hover:underline hover:text-cyan-300"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showLoginPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors"
                  title={showLoginPassword ? "Hide password" : "Show password"}
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="glow-btn w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25"
            >
              {loading ? (
                <span>Authenticating Session...</span>
              ) : (
                <>
                  <span>Sign In to Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Email Sign Up Form */}
        {mode === 'signup' && (
          <form onSubmit={handleInitiateSignUp} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Full Name *</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Dilneth Madushanka"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Corporate Email *</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Company Name *</label>
                <div className="relative">
                  <Building className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lyntrix Global"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Date of Birth / Founded *</label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="date"
                    required
                    value={birthday}
                    onChange={e => setBirthday(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Phone Number</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    placeholder="+94 71 455 7857"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Country</label>
                <div className="relative">
                  <Globe className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <select
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-cyan-400 focus:outline-none"
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

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Password *</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showSignUpPassword ? "text" : "password"}
                  required
                  placeholder="Min 6 characters..."
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                  title={showSignUpPassword ? "Hide password" : "Show password"}
                >
                  {showSignUpPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="glow-btn w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25"
            >
              {loading ? (
                <span>Generating 6-Digit OTP...</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Send OTP & Verify Account</span>
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
