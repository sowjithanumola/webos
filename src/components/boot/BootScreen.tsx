import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Sparkles,
  User as UserIcon,
  ShieldCheck,
  Cloud,
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogOut,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  KeyRound,
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
    resetPassword,
    setIsRecoveryMode,
    continueAsGuest,
    migrateGuestFilesToCloud,
  } = useAuth();

  const [authTab, setAuthTab] = useState<'guest' | 'login' | 'signup' | 'reset'>('guest');

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

  // Sync profile name from logged-in user metadata
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
      setAuthError(error.message);
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

    const { error, user: newUser } = await signUp(cleanEmail, password, cleanName);
    setAuthLoading(false);

    if (error) {
      setAuthError(error.message);
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

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setAuthError('Please enter your account email address.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    const { error } = await resetPassword(cleanEmail);
    setAuthLoading(false);

    if (error) {
      const msg = error.message || '';
      if (
        msg.includes('535') ||
        msg.includes('BadCredentials') ||
        msg.includes('Username and Password not accepted') ||
        (error as any).status === 500
      ) {
        setAuthError(
          'Email service error: Cloud SMTP authentication failed (Google 535 BadCredentials). Google requires a 16-character Google App Password (not your Gmail account password) in Supabase Dashboard SMTP settings, or disable Custom SMTP to use default email.'
        );
      } else {
        setAuthError(error.message);
      }
    } else {
      setAuthSuccess(
        'Password reset link has been sent to your email. Click the recovery link in the email to set a new password.'
      );
    }
  };

  const handleMigrate = async () => {
    setAuthLoading(true);
    const count = await migrateGuestFilesToCloud();
    setAuthLoading(false);
    addNotification('Cloud Migration', `Migrated ${count} local files to cloud account.`, 'success');
    bootOS();
  };

  const switchTab = (tab: 'guest' | 'login' | 'signup' | 'reset') => {
    setAuthTab(tab);
    setAuthError(null);
    setAuthSuccess(null);
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

      {/* Main Authentication & Profile Box - Increased size & responsive spacing */}
      <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl rounded-3xl bg-slate-900/95 backdrop-blur-2xl border border-slate-800/90 p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-5 my-4 max-h-[88vh] overflow-y-auto">
        {/* If already authenticated with Supabase */}
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
            {/* Mode Selector Tabs */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 text-xs sm:text-sm">
              <button
                type="button"
                onClick={() => switchTab('guest')}
                className={`py-2 rounded-xl font-medium transition-colors ${
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
                className={`py-2 rounded-xl font-medium transition-colors ${
                  authTab !== 'guest'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cloud Account
              </button>
            </div>

            {/* Guest Profile Mode */}
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

                {/* Color Palette */}
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
            ) : (
              /* Cloud Account Forms: Login, Sign Up, or Password Reset */
              <div className="space-y-4 pt-1">
                {/* Cloud Tabs (Sign In vs Create Account vs Reset) */}
                <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                  <h2 className="text-sm sm:text-base font-semibold text-slate-100">
                    {authTab === 'login'
                      ? 'Sign In to Cloud'
                      : authTab === 'signup'
                      ? 'Create New Cloud Account'
                      : 'Reset Your Password'}
                  </h2>
                  <span className="text-[11px] text-slate-400">
                    {authTab === 'login'
                      ? 'Cloud Workspace'
                      : authTab === 'signup'
                      ? 'Free Account'
                      : 'Account Recovery'}
                  </span>
                </div>

                {/* Form Elements */}
                <form
                  onSubmit={
                    authTab === 'login'
                      ? handleLogin
                      : authTab === 'signup'
                      ? handleSignUp
                      : handlePasswordReset
                  }
                  className="space-y-3.5"
                >
                  {/* Full Name field (Required for Signup) */}
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

                  {/* Email Address */}
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

                  {/* Password (for login and signup) */}
                  {authTab !== 'reset' && (
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
                  )}

                  {/* Confirm Password (for signup) */}
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

                  {/* Feedback Alerts */}
                  {authError && (
                    <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-800 text-xs text-rose-200 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                        <div className="font-semibold text-rose-200">
                          {authError.includes('SMTP') ? 'Cloud Email Delivery Issue (535)' : 'Authentication Notice'}
                        </div>
                      </div>
                      <p className="text-[12px] text-rose-300/90 leading-relaxed pl-6">
                        {authError}
                      </p>
                      {authError.includes('SMTP') && (
                        <div className="mt-2 ml-6 p-2.5 rounded-xl bg-black/50 border border-rose-900/60 text-[11px] text-slate-300 space-y-1.5">
                          <div className="font-semibold text-rose-300">How to fix in 1 minute:</div>
                          <p>
                            1. Open your <strong>Supabase Dashboard</strong> &rarr; <strong>Settings</strong> &rarr; <strong>Authentication</strong> &rarr; <strong>SMTP Settings</strong>.
                          </p>
                          <p>
                            2. <strong>Fastest fix:</strong> Toggle <strong>"Enable Custom SMTP" to OFF</strong> and click <strong>Save</strong>. Supabase will send reset emails instantly using its default built-in mailer.
                          </p>
                          <p>
                            3. <strong>Or with Gmail:</strong> Generate a 16-character App Password at <span className="text-blue-400 font-mono">myaccount.google.com/apppasswords</span> and enter it as your SMTP password.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {authSuccess && (
                    <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-800 text-xs text-emerald-200 space-y-2.5">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
                        <span className="font-semibold text-emerald-300">{authSuccess}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-black/40 border border-emerald-900/60 text-[11px] text-slate-300 space-y-1.5">
                        <div className="font-medium text-emerald-300">How to set your new password:</div>
                        <p>1. Open your inbox and look for the <strong>Reset Password</strong> email.</p>
                        <p>2. Click the <strong>Reset Password link</strong> inside the email.</p>
                        <p>3. WebOS will automatically launch the <strong>Create New Password</strong> form.</p>
                        <button
                          type="button"
                          onClick={() => setIsRecoveryMode(true)}
                          className="mt-2 w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
                        >
                          <KeyRound size={13} />
                          <span>Enter Reset Code or Set Password Now</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
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
                          : authTab === 'signup'
                          ? 'Create Cloud Account'
                          : 'Send Password Reset Link'}
                      </span>
                      <ArrowRight size={15} />
                    </button>
                  </div>

                  {/* Sub-links */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                    {authTab === 'login' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => switchTab('signup')}
                          className="hover:text-blue-400 transition-colors cursor-pointer"
                        >
                          Need an account? <span className="text-blue-400 underline">Sign up</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => switchTab('reset')}
                          className="hover:text-slate-200 transition-colors cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      </>
                    ) : authTab === 'signup' ? (
                      <div className="w-full text-center">
                        <button
                          type="button"
                          onClick={() => switchTab('login')}
                          className="hover:text-blue-400 transition-colors cursor-pointer"
                        >
                          Already have an account? <span className="text-blue-400 underline">Sign in</span>
                        </button>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col items-center gap-2 text-center">
                        <button
                          type="button"
                          onClick={() => switchTab('login')}
                          className="hover:text-blue-400 transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <RotateCcw size={12} />
                          <span>Back to Sign In</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsRecoveryMode(true)}
                          className="text-[11px] text-blue-400 hover:text-blue-300 underline transition-colors cursor-pointer"
                        >
                          Already received an email link or 6-digit code? Click here
                        </button>
                      </div>
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
