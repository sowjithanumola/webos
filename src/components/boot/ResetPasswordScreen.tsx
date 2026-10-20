import React, { useState, useEffect } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  RotateCcw,
  Mail,
  Send,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOS } from '../../context/OSContext';

export const ResetPasswordScreen: React.FC = () => {
  const {
    user,
    session,
    loading: authInitializing,
    recoveryError,
    setRecoveryError,
    clearRecoveryState,
    updatePassword,
    resetPassword,
    verifyRecoveryOtp,
  } = useAuth();
  const { bootOS, addNotification } = useOS();

  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Fallback for requesting new link or pasting link URL
  const [emailInput, setEmailInput] = useState<string>(user?.email || '');
  const [directLinkInput, setDirectLinkInput] = useState<string>('');
  const [showManualPaste, setShowManualPaste] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  const hasActiveSession = Boolean(session || user);

  useEffect(() => {
    if (user?.email && !emailInput) {
      setEmailInput(user.email);
    }
  }, [user, emailInput]);

  useEffect(() => {
    if (recoveryError) {
      setError(recoveryError);
    }
  }, [recoveryError]);

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResendSuccess(null);

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setLoading(true);

    // If manual token was pasted without active session
    if (!hasActiveSession && directLinkInput.trim()) {
      const { error: otpErr } = await verifyRecoveryOtp(emailInput.trim(), directLinkInput.trim());
      if (otpErr) {
        setLoading(false);
        setError(otpErr.message || 'Invalid recovery link or token. Please request a new email link below.');
        return;
      }
    }

    const { error: updateErr } = await updatePassword(newPassword);
    setLoading(false);

    if (updateErr) {
      setError(updateErr.message || 'Failed to update password. Your recovery session may have expired.');
    } else {
      setIsSuccess(true);
      setRecoveryError(null);
      addNotification('Password Updated', 'Your cloud account password has been changed.', 'success');
    }
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setError('Please enter your account email address.');
      return;
    }

    setLoading(true);
    setError(null);
    setResendSuccess(null);

    const { error: resetErr } = await resetPassword(emailInput.trim());
    setLoading(false);

    if (resetErr) {
      setError(resetErr.message);
    } else {
      setRecoveryError(null);
      setResendSuccess(
        `A password reset link has been dispatched to ${emailInput.trim()}. Please open your inbox and click the "Reset Password" link in the email!`
      );
    }
  };

  const handleContinueToDesktop = () => {
    clearRecoveryState();
    bootOS();
  };

  const handleReturnToLogin = () => {
    clearRecoveryState();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-4 sm:p-6 lg:p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-black text-slate-100 select-none overflow-y-auto">
      {/* Top Branding */}
      <div className="flex flex-col items-center mt-4 sm:mt-8 space-y-2 text-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-2xl sm:text-3xl font-extrabold shadow-2xl shadow-blue-500/20 mb-1">
          W
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">WebOS Cloud Security</h1>
        <p className="text-xs sm:text-sm text-slate-400">Account Password Recovery & Reset</p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md sm:max-w-lg rounded-3xl bg-slate-900/95 backdrop-blur-2xl border border-slate-800/90 p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6 my-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-11 h-11 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <KeyRound size={22} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100">
              {isSuccess ? 'Password Updated' : 'Create New Password'}
            </h2>
            <p className="text-xs text-slate-400">
              {isSuccess
                ? 'Your cloud credentials have been updated'
                : hasActiveSession
                ? 'Recovery link verified — enter your new password below'
                : 'Click the link in your email to reset your password'}
            </p>
          </div>
        </div>

        {authInitializing ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-300">
            <Loader2 size={28} className="animate-spin text-blue-400" />
            <p className="text-xs sm:text-sm font-medium">Verifying your recovery link from email...</p>
          </div>
        ) : isSuccess ? (
          <div className="space-y-5 py-2">
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 flex items-start gap-3">
              <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs sm:text-sm">
                <div className="font-semibold text-emerald-300">Password Changed Successfully!</div>
                <p className="text-emerald-200/90 leading-relaxed">
                  Your new password is now active. You can launch straight into your WebOS desktop or return to the login screen.
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleContinueToDesktop}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-transform active:scale-[0.99] cursor-pointer"
              >
                <span>Continue to WebOS Desktop</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={handleReturnToLogin}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              >
                Return to Sign In Screen
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-800 text-xs sm:text-sm text-rose-200 space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertCircle size={17} className="shrink-0 mt-0.5 text-rose-400" />
                  <div className="space-y-1">
                    <div className="font-semibold text-rose-300">Recovery Notice</div>
                    <p className="text-xs text-rose-200/90 leading-relaxed">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {resendSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-800 text-xs text-emerald-200 flex items-start gap-2.5">
                <CheckCircle2 size={17} className="shrink-0 mt-0.5 text-emerald-400" />
                <span className="leading-relaxed">{resendSuccess}</span>
              </div>
            )}

            {hasActiveSession ? (
              /* ACTIVE RECOVERY SESSION: User clicked email link! Simple New Password Form */
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={15} className="text-emerald-400 shrink-0" />
                    <span className="text-slate-300">Account verified:</span>
                  </div>
                  <span className="font-mono font-semibold text-emerald-300 truncate max-w-[220px]">
                    {user?.email}
                  </span>
                </div>

                <form onSubmit={handleSavePassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                      New Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-3 text-slate-500" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        placeholder="At least 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 select-text"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors"
                        title={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Confirm New Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-3 text-slate-500" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="Re-enter new password"
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

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                    <div className={`flex items-center gap-1.5 ${newPassword.length >= 6 ? 'text-emerald-400' : ''}`}>
                      <CheckCircle2 size={13} />
                      <span>Min. 6 characters</span>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${
                        newPassword && newPassword === confirmPassword ? 'text-emerald-400' : ''
                      }`}
                    >
                      <CheckCircle2 size={13} />
                      <span>Passwords match</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-transform active:scale-[0.99] cursor-pointer"
                    >
                      <span>{loading ? 'Saving New Password...' : 'Save New Password'}</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* NO ACTIVE SESSION: User opened /reset-password directly without clicking email link */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/60 text-xs text-blue-200 space-y-2">
                  <div className="font-semibold text-blue-300 flex items-center gap-1.5">
                    <ExternalLink size={15} />
                    <span>Click the Link in Your Email</span>
                  </div>
                  <p className="text-[12px] text-blue-200/90 leading-relaxed">
                    Supabase sends a secure reset link directly to your inbox. Simply open that email and click the <strong>"Reset Password"</strong> link to choose your new password.
                  </p>
                </div>

                <form onSubmit={handleSendResetEmail} className="space-y-3.5 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Need a new reset email link?
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-3 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="user@example.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 select-text"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
                  >
                    <Send size={14} />
                    <span>{loading ? 'Sending...' : 'Send Password Reset Link'}</span>
                  </button>
                </form>

                {/* Subtle paste fallback for users who copied link directly */}
                <div className="pt-2 border-t border-slate-800/80 text-center">
                  {!showManualPaste ? (
                    <button
                      type="button"
                      onClick={() => setShowManualPaste(true)}
                      className="text-[11px] text-slate-400 hover:text-blue-400 underline transition-colors cursor-pointer"
                    >
                      Copied full recovery link from email? Click here to paste it
                    </button>
                  ) : (
                    <div className="space-y-2 pt-2 text-left">
                      <label className="text-xs font-semibold text-slate-300 block">
                        Paste Full Reset Link or Token
                      </label>
                      <input
                        type="text"
                        placeholder="https://...#access_token=... or token hash"
                        value={directLinkInput}
                        onChange={(e) => setDirectLinkInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 select-text"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!directLinkInput.trim()) return;
                          setLoading(true);
                          setError(null);
                          const { error: otpErr } = await verifyRecoveryOtp(emailInput.trim(), directLinkInput.trim());
                          setLoading(false);
                          if (otpErr) {
                            setError(otpErr.message || 'Invalid recovery link. Please click the link directly in your email.');
                          }
                        }}
                        disabled={loading || !directLinkInput.trim()}
                        className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-medium transition-colors"
                      >
                        Verify Pasted Link
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={handleReturnToLogin}
                className="w-full py-2 text-slate-400 hover:text-slate-200 text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Return to Sign In</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-slate-500 mb-2">
        WebOS v1.1.0 · Cloud Security
      </div>
    </div>
  );
};
