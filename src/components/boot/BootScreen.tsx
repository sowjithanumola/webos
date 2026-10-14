import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, User, ShieldCheck, Cloud, Lock, Mail, Key, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { useAuth } from '../../context/AuthContext';

export const BootScreen: React.FC = () => {
  const { bootOS, settings, updateSettings, addNotification } = useOS();
  const { user, signIn, signUp, signOut, resetPassword, isGuest, continueAsGuest, migrateGuestFilesToCloud } = useAuth();

  const [authTab, setAuthTab] = useState<'guest' | 'login' | 'signup' | 'reset'>('guest');
  const [profileName, setProfileName] = useState<string>(settings.profile.name || 'Administrator');
  const [avatarColor, setAvatarColor] = useState<string>(settings.profile.avatarColor || '#38bdf8');

  // Supabase credentials state
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
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
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    const { error } = await signIn(email.trim(), password);
    setAuthLoading(false);
    if (error) {
      setAuthError(error.message);
    } else {
      setAuthSuccess('Signed in successfully!');
      updateSettings({
        profile: {
          ...settings.profile,
          name: email.split('@')[0],
          avatarColor: '#38bdf8',
        },
      });
      setTimeout(() => {
        bootOS();
      }, 500);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    const { error, user: newUser } = await signUp(email.trim(), password, profileName.trim());
    setAuthLoading(false);
    if (error) {
      setAuthError(error.message);
    } else {
      setAuthSuccess('Account created! You can now access your cloud workspace.');
      setTimeout(() => {
        bootOS();
      }, 700);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    const { error } = await resetPassword(email.trim());
    setAuthLoading(false);
    if (error) {
      setAuthError(error.message);
    } else {
      setAuthSuccess('Password reset link sent to your email.');
    }
  };

  const handleMigrate = async () => {
    setAuthLoading(true);
    const count = await migrateGuestFilesToCloud();
    setAuthLoading(false);
    addNotification('Cloud Migration', `Migrated ${count} local files to Supabase cloud.`, 'success');
    bootOS();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 sm:p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-black text-slate-100 select-none overflow-y-auto">
      {/* Top Branding & Clock */}
      <div className="flex flex-col items-center mt-6 sm:mt-10 space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-2xl font-extrabold shadow-2xl shadow-blue-500/20 mb-1">
          W
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">WebOS</h1>
        <p className="text-xs text-slate-400">Desktop Operating System & Cloud Workspace</p>

        <div className="pt-3 text-center">
          <div className="text-4xl sm:text-5xl font-light tracking-tight font-mono tabular-nums text-white">
            {timeStr}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">{dateStr}</div>
        </div>
      </div>

      {/* Main Authentication & Profile Box */}
      <div className="w-full max-w-sm rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-5 shadow-2xl space-y-4 my-4">
        {/* If already authenticated with Supabase */}
        {user ? (
          <div className="space-y-4 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-emerald-300">
                <Cloud size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-100">{user.email}</h3>
                <span className="text-[11px] text-emerald-400">Connected to Supabase Cloud</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={bootOS}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.99]"
              >
                <span>Launch Cloud Desktop</span>
                <ArrowRight size={14} />
              </button>

              <button
                onClick={handleMigrate}
                disabled={authLoading}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                {authLoading ? 'Migrating...' : 'Sync Local Files to Cloud'}
              </button>

              <button
                onClick={signOut}
                className="w-full py-1.5 text-slate-500 hover:text-rose-400 text-xs transition-colors flex items-center justify-center gap-1"
              >
                <LogOut size={12} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mode Selector Tabs */}
            <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => {
                  setAuthTab('guest');
                  setAuthError(null);
                }}
                className={`py-1.5 rounded-lg font-medium transition-colors ${
                  authTab === 'guest'
                    ? 'bg-slate-800 text-slate-100 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Local Guest
              </button>
              <button
                onClick={() => {
                  setAuthTab('login');
                  setAuthError(null);
                }}
                className={`py-1.5 rounded-lg font-medium transition-colors ${
                  authTab !== 'guest'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Supabase Cloud
              </button>
            </div>

            {/* Guest Profile Mode */}
            {authTab === 'guest' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    style={{ backgroundColor: avatarColor }}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-slate-950 font-bold text-sm shadow-md transition-colors"
                  >
                    {profileName.trim()[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Username..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-blue-500 select-text"
                    />
                  </div>
                </div>

                {/* Color Palette */}
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                    Avatar Color
                  </label>
                  <div className="flex items-center justify-between">
                    {colors.map((c) => (
                      <button
                        key={c}
                        onClick={() => setAvatarColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-5 h-5 rounded-full transition-transform ${
                          avatarColor === c ? 'scale-125 ring-2 ring-white/60' : 'hover:scale-110 opacity-80'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleStartGuest}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.99] cursor-pointer"
                >
                  <span>Continue to Desktop</span>
                  <ArrowRight size={14} />
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 pt-1">
                  <ShieldCheck size={12} className="text-emerald-400" />
                  <span>Offline local storage mode</span>
                </div>
              </div>
            ) : (
              /* Supabase Login / Signup Form */
              <form
                onSubmit={
                  authTab === 'login' ? handleLogin : authTab === 'signup' ? handleSignUp : handlePasswordReset
                }
                className="space-y-3"
              >
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={13} className="absolute left-2.5 top-2 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="user@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 select-text"
                    />
                  </div>
                </div>

                {authTab !== 'reset' && (
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock size={13} className="absolute left-2.5 top-2 text-slate-500" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 select-text"
                      />
                    </div>
                  </div>
                )}

                {authError && (
                  <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-800 text-[11px] text-rose-300 flex items-center gap-1.5">
                    <AlertCircle size={13} className="shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {authSuccess && (
                  <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800 text-[11px] text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="shrink-0" />
                    <span>{authSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.99]"
                >
                  <span>
                    {authLoading
                      ? 'Please wait...'
                      : authTab === 'login'
                      ? 'Sign In with Supabase'
                      : authTab === 'signup'
                      ? 'Create Supabase Account'
                      : 'Send Reset Link'}
                  </span>
                  <ArrowRight size={13} />
                </button>

                {/* Sub-links */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  {authTab === 'login' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setAuthTab('signup')}
                        className="hover:text-blue-400"
                      >
                        Don't have an account? Sign up
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthTab('reset')}
                        className="hover:text-slate-200"
                      >
                        Forgot password?
                      </button>
                    </>
                  ) : authTab === 'signup' ? (
                    <button
                      type="button"
                      onClick={() => setAuthTab('login')}
                      className="hover:text-blue-400"
                    >
                      Already registered? Sign in
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAuthTab('login')}
                      className="hover:text-blue-400"
                    >
                      Back to sign in
                    </button>
                  )}
                </div>
              </form>
            )}
          </>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-[11px] text-slate-500">
        WebOS v1.1.0 · Supabase Cloud Connected
      </div>
    </div>
  );
};
