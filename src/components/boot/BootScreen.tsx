import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Cloud,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { useAuth } from '../../context/AuthContext';

export const BootScreen: React.FC = () => {
  const { bootOS, settings, updateSettings, addNotification } = useOS();
  const {
    user,
    signInWithGoogle,
    signOut,
    continueAsGuest,
    migrateGuestFilesToCloud,
  } = useAuth();

  const [authTab, setAuthTab] = useState<'guest' | 'cloud'>('guest');

  // Guest profile state
  const [profileName, setProfileName] = useState<string>(settings.profile.name || 'Administrator');
  const [avatarColor, setAvatarColor] = useState<string>(settings.profile.avatarColor || '#38bdf8');

  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState<boolean>(false);

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleCopyDomain = () => {
    if (currentDomain) {
      navigator.clipboard.writeText(currentDomain);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const isUnauthorizedDomain = Boolean(
    authError &&
      (authError.includes('unauthorized-domain') ||
        authError.includes('auth/unauthorized-domain'))
  );

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

  // Update OS profile when user signs in
  useEffect(() => {
    if (user) {
      const name = user.displayName || user.email?.split('@')[0] || 'User';
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

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);

    const { error, user: signedInUser } = await signInWithGoogle();
    setAuthLoading(false);

    if (error) {
      setAuthError(error.message || 'Google sign in was cancelled or failed.');
    } else if (signedInUser) {
      updateSettings({
        profile: {
          ...settings.profile,
          name: signedInUser.displayName || 'Google User',
        },
      });
      addNotification('Signed In', `Welcome back, ${signedInUser.displayName || 'User'}!`, 'success');
      bootOS();
    }
  };

  const handleMigrate = async () => {
    setAuthLoading(true);
    const count = await migrateGuestFilesToCloud();
    setAuthLoading(false);
    addNotification('Cloud Sync', `Migrated ${count} local files to your cloud account.`, 'success');
    bootOS();
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
      <div className="w-full max-w-md sm:max-w-lg rounded-3xl bg-slate-900/95 backdrop-blur-2xl border border-slate-800/90 p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-5 my-4">
        {user ? (
          <div className="space-y-5 text-center">
            <div className="flex flex-col items-center gap-2.5">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Profile'}
                  className="w-16 h-16 rounded-full border-2 border-emerald-400/40 shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 border-2 border-emerald-400/40 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-emerald-950">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="space-y-0.5">
                <h3 className="font-bold text-base sm:text-lg text-slate-100">
                  Welcome back, {user.displayName || user.email?.split('@')[0]}!
                </h3>
                <div className="text-xs text-slate-400 font-mono">{user.email}</div>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Cloud Account Connected
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
                onClick={() => {
                  setAuthTab('guest');
                  setAuthError(null);
                }}
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
                onClick={() => {
                  setAuthTab('cloud');
                  setAuthError(null);
                }}
                className={`py-2 rounded-xl font-medium transition-colors cursor-pointer ${
                  authTab === 'cloud'
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
                      Guest Profile Name
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
            ) : (
              /* Mode 2: Cloud Account Google Sign-In */
              <div className="space-y-4 pt-1">
                <div className="text-center space-y-1 pb-1">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-2">
                    <Cloud size={24} />
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-100">
                    Cloud Account Workspace
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sync your virtual files, desktop layout, and notes seamlessly across devices.
                  </p>
                </div>

                {isUnauthorizedDomain ? (
                  <div className="p-4 rounded-2xl bg-amber-950/70 border border-amber-700/80 text-amber-200 text-xs space-y-3">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle size={18} className="shrink-0 text-amber-400 mt-0.5" />
                      <div>
                        <div className="font-bold text-amber-100 text-xs sm:text-sm">
                          Domain Authorization Required
                        </div>
                        <p className="text-[11.5px] text-amber-300/90 mt-1 leading-relaxed">
                          Cloud authentication requires adding your deployment domain to your <strong>Authorized domains</strong> list.
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-950/90 p-2.5 rounded-xl border border-amber-850/60 space-y-1.5">
                      <div className="text-[11px] text-slate-400">Domain to authorize:</div>
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-xs font-mono text-emerald-300 font-semibold truncate bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                          {currentDomain}
                        </code>
                        <button
                          type="button"
                          onClick={handleCopyDomain}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-[11px] font-medium flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                        >
                          {copiedDomain ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          <span>{copiedDomain ? 'Copied!' : 'Copy Domain'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-300">
                      <div className="font-semibold text-amber-200">30-Second Domain Setup:</div>
                      <ol className="list-decimal list-inside space-y-1 text-slate-300/90 leading-normal">
                        <li>
                          Open <a
                            href="https://console.firebase.google.com/project/webos-ff50c/authentication/settings"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 underline font-medium inline-flex items-center gap-0.5"
                          >
                            <span>Cloud Auth Settings</span>
                            <ExternalLink size={10} />
                          </a>
                        </li>
                        <li>Scroll down to <strong>Authorized domains</strong> &rarr; click <strong>Add domain</strong></li>
                        <li>Paste <code className="text-emerald-300 bg-slate-900 px-1 rounded">{currentDomain}</code> and click <strong>Save</strong>.</li>
                      </ol>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href="https://console.firebase.google.com/project/webos-ff50c/authentication/settings"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-center text-xs transition-colors shadow-sm"
                      >
                        Open Cloud Settings &rarr;
                      </a>
                      <button
                        type="button"
                        onClick={handleStartGuest}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors cursor-pointer"
                      >
                        Use Local Guest
                      </button>
                    </div>
                  </div>
                ) : authError ? (
                  <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-800 text-xs text-rose-200 space-y-1">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                      <div className="font-semibold text-rose-200">Authentication Notice</div>
                    </div>
                    <p className="text-[12px] text-rose-300/90 pl-6">{authError}</p>
                  </div>
                ) : null}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={authLoading}
                    className="w-full py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-lg transition-transform active:scale-[0.99] cursor-pointer disabled:opacity-50"
                  >
                    {/* Google SVG Logo */}
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>{authLoading ? 'Signing in with Google...' : 'Sign in with Google'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  <span>Cloud Storage & Identity Protected</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-slate-500 pb-2">
        <p>WebOS &bull; Zero external trackers &bull; Client-side sandboxed &bull; Cloud Storage</p>
      </div>
    </div>
  );
};
