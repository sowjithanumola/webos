import React, { useState } from 'react';
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
  Hash,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOS } from '../../context/OSContext';

export const ResetPasswordScreen: React.FC = () => {
  const { user, session, updatePassword, verifyRecoveryOtp, recoveryError, clearRecoveryState } = useAuth();
  const { bootOS, addNotification } = useOS();

  // If user is already active from recovery session token in URL
  const hasActiveSession = !!user || !!session;

  const [emailInput, setEmailInput] = useState<string>(user?.email || '');
  const [tokenInput, setTokenInput] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Validation rules
  const hasMinLength = newPassword.length >= 6;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isFormValid = hasMinLength && passwordsMatch && (hasActiveSession || (emailInput.trim().length > 3 && tokenInput.trim().length >= 4));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasMinLength) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (!passwordsMatch) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // If there is no active recovery session yet (e.g. user manually came to this screen with an OTP or token)
    if (!hasActiveSession) {
      const cleanEmail = emailInput.trim();
      const cleanToken = tokenInput.trim();

      if (!cleanEmail) {
        setIsSubmitting(false);
        setErrorMessage('Please enter your account email address.');
        return;
      }
      if (!cleanToken) {
        setIsSubmitting(false);
        setErrorMessage('Please enter the 6-digit code or recovery token from your email.');
        return;
      }

      const { error: otpError } = await verifyRecoveryOtp(cleanEmail, cleanToken);
      if (otpError) {
        setIsSubmitting(false);
        setErrorMessage(otpError.message || 'Invalid or expired verification code. Please check your email.');
        return;
      }
    }

    // Now update password for the recovery session
    const { error: updateError } = await updatePassword(newPassword);
    setIsSubmitting(false);

    if (updateError) {
      setErrorMessage(
        updateError.message || 'Failed to update password. Your recovery session may have expired. Please request a new link.'
      );
    } else {
      setIsSuccess(true);
      addNotification(
        'Password Updated',
        'Your cloud account password has been successfully reset.',
        'success'
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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-black text-slate-100 select-none overflow-y-auto">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative w-full max-w-md sm:max-w-lg rounded-3xl bg-slate-900/95 backdrop-blur-2xl border border-slate-800/90 p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6 my-auto">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-2xl font-extrabold shadow-xl shadow-blue-500/20 mb-1">
            <KeyRound size={26} />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {isSuccess
              ? 'Password Reset Complete'
              : recoveryError
              ? 'Invalid Recovery Link'
              : 'Create New Password'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm">
            {isSuccess
              ? 'Your password has been changed. You can now access your cloud workspace.'
              : recoveryError
              ? 'This link cannot be used to reset your password.'
              : user?.email
              ? `Choose a new secure password for ${user.email}`
              : 'Enter your new secure password below to complete recovery.'}
          </p>
        </div>

        {/* State 1: Expired / Invalid Recovery Link */}
        {recoveryError && !isSuccess ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs sm:text-sm space-y-2">
              <div className="flex items-center gap-2 font-semibold text-amber-300">
                <AlertCircle size={18} className="shrink-0 text-amber-400" />
                <span>Recovery Link Expired or Invalid</span>
              </div>
              <p className="text-amber-200/90 leading-relaxed text-xs">
                {recoveryError}
              </p>
              <p className="text-slate-400 text-[11px] pt-1">
                For security, password reset links expire after a short time and can only be clicked once.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleReturnToLogin}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-transform active:scale-[0.99] cursor-pointer"
              >
                <span>Request a New Reset Link</span>
                <ArrowRight size={15} />
              </button>

              <button
                type="button"
                onClick={handleReturnToLogin}
                className="w-full py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Back to WebOS Login</span>
              </button>
            </div>
          </div>
        ) : isSuccess ? (
          /* State 2: Success State */
          <div className="space-y-5 text-center">
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/70 text-emerald-200 space-y-2">
              <div className="flex items-center justify-center gap-2 font-semibold text-emerald-300 text-sm">
                <CheckCircle2 size={20} className="text-emerald-400" />
                <span>Password Successfully Updated</span>
              </div>
              <p className="text-xs text-emerald-200/90 leading-relaxed">
                Your credentials have been securely stored in the cloud. You are now authenticated.
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleContinueToDesktop}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-transform active:scale-[0.99] cursor-pointer"
              >
                <span>Continue to WebOS Desktop</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={handleReturnToLogin}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors cursor-pointer"
              >
                Return to Login Screen
              </button>
            </div>
          </div>
        ) : (
          /* State 3: Password Reset Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* If there is no active session yet, ask for email and verification code/token */}
            {!hasActiveSession && (
              <div className="space-y-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <div className="text-[11px] text-slate-400 leading-snug">
                  Enter your account email and the 6-digit code or token sent to your inbox:
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Account Email
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="user@example.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">
                    6-Digit Code / Email Token
                  </label>
                  <div className="relative">
                    <Hash size={15} className="absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 123456 or recovery token"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                New Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-colors select-text"
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

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-colors select-text"
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

            {/* Password Validation Requirements */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-[11px]">
              <div
                className={`flex items-center gap-1.5 transition-colors ${
                  hasMinLength ? 'text-emerald-400 font-medium' : 'text-slate-400'
                }`}
              >
                <CheckCircle2 size={13} className={hasMinLength ? 'text-emerald-400' : 'text-slate-600'} />
                <span>At least 6 characters long</span>
              </div>
              <div
                className={`flex items-center gap-1.5 transition-colors ${
                  passwordsMatch ? 'text-emerald-400 font-medium' : 'text-slate-400'
                }`}
              >
                <CheckCircle2 size={13} className={passwordsMatch ? 'text-emerald-400' : 'text-slate-600'} />
                <span>Passwords match</span>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 space-y-2.5">
              <button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-transform active:scale-[0.99] cursor-pointer"
              >
                <span>{isSubmitting ? 'Saving New Password...' : 'Save New Password'}</span>
                <ArrowRight size={15} />
              </button>

              <button
                type="button"
                onClick={handleReturnToLogin}
                className="w-full py-2 text-slate-400 hover:text-slate-200 text-xs transition-colors text-center cursor-pointer"
              >
                Cancel and return to login
              </button>
            </div>
          </form>
        )}

        {/* Security badge footer */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
          <ShieldCheck size={13} className="text-emerald-400" />
          <span>Encrypted Cloud Authentication & Row-Level Security</span>
        </div>
      </div>
    </div>
  );
};
