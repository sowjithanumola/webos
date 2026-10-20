import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  User as UserIcon,
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogOut,
  CheckCircle2,
  AlertCircle,
  MailCheck,
  Send,
  Sparkles,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { useAuth } from '../../context/AuthContext';

export const BootScreen: React.FC = () => {
  const { bootOS, settings, updateSettings, addNotification } = useOS();
  const {
    user,
    signIn,
    signUp,
    signOut,
    resendConfirmationEmail,
    continueAsGuest,
    migrateGuestFilesToCloud,
  } = useAuth();

  const [authTab, setAuthTab] = useState<'guest' | 'login' | 'signup' | 'confirm-email'>('guest');

  // Guest profile state
  const [profileName, setProfileName] = useState<string>(settings.profile.name || 'Administrator');
  const [avatarColor, setAvatarColor] = useState<string>(settings.profile.avatarColor || '#38bdf8');

  // Cloud credentials state
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Email confirmation state
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState<string>('');
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  const colors = ['#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f43f5e', '#a855f7'];

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      );
      setDateStr(
        now.toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      updateSettings({
        profile: {
          ...settings.profile,
          name,
        },
      });
    }
  }, [user]);

  const handleStartGuest = () => {
    updateSettings({
      profile: {
        ...settings.profile,
        name: profileName.trim() || 'User',
        avatarColor,
      },
    });
    continueAsGuest();
    bootOS();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setAuthError('Please enter both your email and password.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    const { error } = await signIn(email.trim(), password);
    setAuthLoading(false);

    if (error) {
      if (
        error.message?.toLowerCase().includes('email not confirmed') ||
        (error as any)?.code === 'email_not_confirmed'
      ) {
        setPendingConfirmationEmail(email.trim());
        setAuthError('Email not confirmed yet. Please verify your email via the link sent to your inbox.');
      } else {
        setAuthError(error.message);
      }
    } else {
      setAuthSuccess('Signed in successfully! Loading desktop...');
      setTimeout(() => {
        bootOS();
      }, 500);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = fullName.trim();
    const cleanEmail = email.trim();

    if (!cleanName || cleanName.length < 2) {
      setAuthError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!cleanEmail) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match. Please re-enter.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    const { error, needsEmailConfirmation } = await signUp(cleanEmail, password, cleanName);
    setAuthLoading(false);

    if (error) {
      setAuthError(error.message);
    } else if (needsEmailConfirmation) {
      // Transition to confirmation screen
      setPendingConfirmationEmail(cleanEmail);
      setAuthTab('confirm-email');
      addNotification('Confirmation Required', `Verification email sent to ${cleanEmail}`, 'info');
    } else {
      updateSettings({
        profile: {
          ...settings.profile,
          name: cleanName,
        },
      });
      setAuthSuccess('Account created successfully! Welcome to WebOS.');
      setTimeout(() => {
        bootOS();
      }, 700);
    }
  };

  const handleResendConfirmation = async () => {
    if (!pendingConfirmationEmail) return;
    setAuthLoading(true);
    setResendStatus(null);
    const { error } = await resendConfirmationEmail(pendingConfirmationEmail);
    setAuthLoading(false);
    if (error) {
      setResendStatus(`Failed to resend: ${error.message}`);
    } else {
      setResendStatus('A fresh confirmation link has been sent to your inbox!');
    }
  };

  const handleMigrate = async () => {
    setAuthLoading(true);
    const count = await migrateGuestFilesToCloud();
    setAuthLoading(false);
    addNotification('Cloud Migration', `Migrated ${count} local files to cloud account.`, 'success');
    bootOS();
  };

  const switchTab = (tab: typeof authTab) => {
    setAuthTab(tab);
    setAuthError(null);
    setAuthSuccess(null);
    setResendStatus(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-4 sm:p-6 lg:p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-black text-slate-100 select-none overflow-y-auto">
      {/* Top Branding & Clock */}
      <div className="flex flex-col items-center mt-3 sm:mt-6 space-y-2 text-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-2xl sm:text-3xl font-extrabold shadow-2xl shadow-blue-500/20 mb-1">
          W
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">WebOS</h1>
        <p className="text-xs sm:text-sm text-slate-400">Desktop Operating System & Cloud Workspace</p>

        <div className="pt-2 text-center">
          <div className="text-4xl sm:text-5xl font-light tracking-tight font-mono tabular-nums text-white">
            {timeStr}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">{dateStr}</div>
        </div>
      </div>

      {/* Main Authentication & Profile Box */}
      <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl rounded-3xl bg-slate-900/95 backdrop-blur-2xl border border-slate-800/90 p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-5 my-4 max-h-[88vh] overflow-y-auto">
        {user ? (
          <div className="space-y-5 text-center">
            <div className="flex flex-col items-center gap-2.5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 border-2 border-emerald-400/40 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-emerald-950">
                {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-base sm:text-lg text-slate-100">
                  Welcome back, {user.user_metadata?.full_name || user.email?.split('@')[0]}!
                </h3>
                <div className="text-xs text-slate-400 font-mono">{user.email}</div>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Connected to Cloud Account
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={bootOS}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-transform active:scale-[0.99] cursor-pointer"
              >
                <span>Launch Cloud Desktop</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={handleMigrate}
                disabled={authLoading}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              >
                {authLoading ? 'Migrating files...' : 'Sync Local Files to Cloud'}
              </button>

              <button
                onClick={signOut}
                className="w-full py-2 text-slate-400 hover:text-rose-400 text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut size={13} />
                <span>Sign Out from Account</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Top Switcher (Guest vs Cloud) */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 text-xs sm:text-sm">
              <button
                type="button"
                onClick={() => switchTab('guest')}
                className={`py-2 rounded-xl font-medium transition-colors cursor-pointer ${
                  authTab === 'guest'
                    ? 'bg-slate-800 text-slate-100 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Local Guest
              </button>
              <button
                type="button"
                onClick={() => switchTab('login')}
                className={`py-2 rounded-xl font-medium transition-colors cursor-pointer ${
                  authTab !== 'guest'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cloud Account
              </button>
            </div>

            {/* Mode 1: Local Guest */}
            {authTab === 'guest' ? (
              <div className="space-y-4 pt-1">
                <div className="flex items-center gap-3.5">
                  <div
                    style={{ backgroundColor: avatarColor }}
                    className="w-12 h-12 rounded-full flex items-center justify-center text-slate-950 font-bold text-base shadow-md transition-colors shrink-0"
                  >
                    {profileName.trim()[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Guest Username
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="e.g. Administrator"
                      className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 select-text"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Avatar Theme Color
                  </label>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800/60">
                    {colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAvatarColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                          avatarColor === c
                            ? 'scale-125 ring-2 ring-white shadow-md'
                            : 'hover:scale-110 opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleStartGuest}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-transform active:scale-[0.99] cursor-pointer"
                  >
                    <span>Continue as Guest</span>
                    <ArrowRight size={16} />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 pt-1">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>Isolated offline browser storage</span>
                </div>
              </div>
            ) : authTab === 'confirm-email' ? (
              /* Mode 2: Confirm Email Prompt after Sign Up */
              <div className="space-y-5 pt-1 text-center">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-xl shadow-blue-500/10">
                  <MailCheck size={32} />
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-lg font-bold text-slate-100">Confirm Your Email Address</h2>
                  <p className="text-xs sm:text-sm text-slate-400">
                    We've sent a verification link to:
                  </p>
                  <div className="inline-block px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-blue-300 font-medium">
                    {pendingConfirmationEmail || email}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left text-xs text-slate-300 space-y-2.5">
                  <div className="font-semibold text-slate-200 flex items-center gap-2">
                    <Sparkles size={14} className="text-blue-400" />
                    <span>Next steps to activate your cloud account:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-400 text-[12px] leading-relaxed">
                    <li>Open your email inbox (and check your <strong>Spam</strong> or <strong>Promotions</strong> folder).</li>
                    <li>Click the <strong>Confirm your mail</strong> link inside the email.</li>
                    <li>Once confirmed, click the button below to sign in!</li>
                  </ol>
                </div>

                {resendStatus && (
                  <div className={`p-3 rounded-xl border text-xs text-left ${
                    resendStatus.includes('Failed')
                      ? 'bg-rose-950/70 border-rose-800 text-rose-200'
                      : 'bg-emerald-950/70 border-emerald-800 text-emerald-200'
                  }`}>
                    {resendStatus}
                  </div>
                )}

                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(pendingConfirmationEmail || email);
                      switchTab('login');
                    }}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-transform active:scale-[0.99] cursor-pointer"
                  >
                    <span>I've Confirmed, Go to Sign In</span>
                    <ArrowRight size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={authLoading}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send size={14} />
                    <span>{authLoading ? 'Resending Link...' : 'Resend Confirmation Email'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStartGuest}
                    className="w-full py-2 text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer"
                  >
                    Explore as Local Guest for now
                  </button>
                </div>
              </div>
            ) : (
              /* Mode 3: Cloud Login & Sign Up Forms (No Forgot Password) */
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                  <h2 className="text-sm sm:text-base font-semibold text-slate-100">
                    {authTab === 'login' ? 'Sign In to Cloud' : 'Create New Cloud Account'}
                  </h2>
                  <span className="text-[11px] text-slate-400">
                    {authTab === 'login' ? 'Cloud Workspace' : 'Free Account'}
                  </span>
                </div>

                <form
                  onSubmit={authTab === 'login' ? handleLogin : handleSignUp}
                  className="space-y-3.5"
                >
                  {authTab === 'signup' && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300 block">
                        Full Name <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <UserIcon size={15} className="absolute left-3.5 top-3 text-slate-500" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Alex Morgan"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 select-text"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-3 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="user@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 select-text"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-3 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder={authTab === 'signup' ? 'At least 6 characters' : '••••••••'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 select-text"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {authTab === 'signup' && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300 block">
                        Confirm Password <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-3 text-slate-500" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          placeholder="Re-enter your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 select-text"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors"
                          title={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  )}

                  {authError && (
                    <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-800 text-xs text-rose-200 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                        <div className="font-semibold text-rose-200">Authentication Notice</div>
                      </div>
                      <p className="text-[12px] text-rose-300/90 leading-relaxed pl-6">
                        {authError}
                      </p>
                      {authError.toLowerCase().includes('not confirmed') && (
                        <div className="pl-6 pt-1">
                          <button
                            type="button"
                            onClick={handleResendConfirmation}
                            className="px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-white font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Send size={12} />
                            <span>Resend Confirmation Email</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {authSuccess && (
                    <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-800 text-xs text-emerald-200 flex items-start gap-2">
                      <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
                      <span className="font-semibold text-emerald-300">{authSuccess}</span>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-transform active:scale-[0.99] cursor-pointer"
                    >
                      <span>
                        {authLoading
                          ? 'Processing...'
                          : authTab === 'login'
                          ? 'Sign In to Cloud'
                          : 'Create Cloud Account'}
                      </span>
                      <ArrowRight size={15} />
                    </button>
                  </div>

                  <div className="flex items-center justify-center text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                    {authTab === 'login' ? (
                      <button
                        type="button"
                        onClick={() => switchTab('signup')}
                        className="hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        Need an account? <span className="text-blue-400 underline">Sign up</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => switchTab('login')}
                        className="hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        Already have an account? <span className="text-blue-400 underline">Sign in</span>
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-xs text-slate-500 mb-2">
        WebOS v1.1.0 · Cloud Sync Active
      </div>
    </div>
  );
};
