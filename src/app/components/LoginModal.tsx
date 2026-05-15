'use client';

import { useState, FormEvent } from 'react';
import { X, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useModalTransition } from '../hooks/useModalTransition';
import PageTransitionOverlay from './PageTransitionOverlay';
import { createClient } from '../../lib/supabase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'login';

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const supabase = createClient();
  const { mounted, backdropClass, panelClass } = useModalTransition(isOpen);
  const [navigating, setNavigating] = useState<{ href: string; label: string } | null>(null);
  const [mode, setMode] = useState<AuthMode | 'forgot-password' | 'reset-verify' | 'reset-new-password'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [loginData, setLoginData] = useState({
    identifier: '',
    password: '',
  });
  

  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const navigate = (href: string, label = 'Loading...') => {
    setNavigating({ href, label });
    setTimeout(() => { window.location.href = href; }, 900);
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginData.identifier,
      password: loginData.password,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@miller.law';
    if (data.user?.email === ADMIN_EMAIL) {
      navigate('/admin', 'Entering admin portal...');
    } else {
      navigate('/client', 'Signing you in...');
    }
  };

  const handleForgotPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!resetIdentifier.trim()) return;
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email: resetIdentifier,
      options: { shouldCreateUser: false },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setMode('reset-verify');
  };

  const handleResetVerifySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!resetCode.trim()) return;
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.verifyOtp({
      email: resetIdentifier,
      token: resetCode,
      type: 'magiclink',
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setMode('reset-new-password');
  };

  const handleResetNewPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (resetNewPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (resetNewPassword !== resetConfirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.updateUser({ password: resetNewPassword });
    setLoading(false);
    if (error) { setError(error.message); return; }
    navigate('/client', 'Password updated! Signing you in...');
  };

  const resetModal = () => {
    setMode('login');
    setLoginData({ identifier: '', password: '' });
    setResetIdentifier('');
    setResetCode('');
    setResetNewPassword('');
    setResetConfirmPassword('');
    setShowResetPassword(false);
    setShowResetConfirm(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError('');
    setLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!mounted) return null;

  if (navigating) return <PageTransitionOverlay message={navigating.label} />;

  if (mode === 'reset-verify') {
    return (
      <div className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 ${backdropClass}`}>
        <div className={`bg-white rounded-2xl border-2 border-[#D4AF37]/30 p-8 max-w-md w-full shadow-xl relative ${panelClass}`}>
          <button onClick={handleClose} className="absolute top-4 right-4 text-[#6B7280] hover:text-[#1A2B3C] transition-colors">
            <X size={24} />
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={32} className="text-[#D4AF37]" />
            </div>
            <h2 className="text-3xl font-bold text-[#1A2B3C] mb-2" style={{ fontFamily: 'Playfair Display' }}>
              Check Your Email
            </h2>
            <p className="text-[#64748B] text-sm">
              We sent an 8-digit verification code to{' '}
              <span className="font-semibold text-[#1A2B3C]">{resetIdentifier}</span>.
            </p>
          </div>

          <form onSubmit={handleResetVerifySubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-[#1A2B3C] mb-2">Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={8}
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                placeholder="00000000"
                required
                className="w-full px-4 py-3 border-2 border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all text-center text-2xl tracking-[0.5em] font-bold"
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading || resetCode.length < 8}
              className="w-full bg-[#D4AF37] hover:bg-[#C49D2E] text-[#1A2B3C] font-bold py-3 rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <button
              type="button"
              onClick={() => setMode('forgot-password')}
              className="w-full text-[#64748B] hover:text-[#1A2B3C] font-medium text-sm"
            >
              ← Resend Code
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (mode === 'reset-new-password') {
    return (
      <div className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 ${backdropClass}`}>
        <div className={`bg-white rounded-2xl border-2 border-[#D4AF37]/30 p-8 max-w-md w-full shadow-xl relative ${panelClass}`}>
          <button onClick={handleClose} className="absolute top-4 right-4 text-[#6B7280] hover:text-[#1A2B3C] transition-colors">
            <X size={24} />
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={32} className="text-[#D4AF37]" />
            </div>
            <h2 className="text-3xl font-bold text-[#1A2B3C] mb-2" style={{ fontFamily: 'Playfair Display' }}>
              New Password
            </h2>
            <p className="text-[#64748B] text-sm">Must be at least 8 characters.</p>
          </div>

          <form onSubmit={handleResetNewPasswordSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#1A2B3C] mb-2">New Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]"><Lock size={20} /></div>
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  className="w-full pl-12 pr-12 py-3 border-2 border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                />
                <button type="button" onClick={() => setShowResetPassword(!showResetPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]">
                  {showResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1A2B3C] mb-2">Confirm Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]"><Lock size={20} /></div>
                <input
                  type={showResetConfirm ? 'text' : 'password'}
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  className="w-full pl-12 pr-12 py-3 border-2 border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                />
                <button type="button" onClick={() => setShowResetConfirm(!showResetConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]">
                  {showResetConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF37] hover:bg-[#C49D2E] text-[#1A2B3C] font-bold py-3 rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (mode === 'forgot-password') {
    return (
      <div className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 ${backdropClass}`}>
        <div className={`bg-white rounded-2xl border-2 border-[#D4AF37]/30 p-8 max-w-md w-full shadow-xl relative ${panelClass}`}>
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-[#6B7280] hover:text-[#1A2B3C] transition-colors"
          >
            <X size={24} />
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={32} className="text-[#D4AF37]" />
            </div>
            <h2 className="text-3xl font-bold text-[#1A2B3C] mb-2" style={{ fontFamily: 'Playfair Display' }}>
              Forgot Password
            </h2>
            <p className="text-[#64748B]">Choose where to receive your reset instructions.</p>
          </div>

          <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-[#1A2B3C] mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#64748B]">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  value={resetIdentifier}
                  onChange={(e) => setResetIdentifier(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-12 pr-4 py-3 border-2 border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF37] hover:bg-[#C49D2E] text-[#1A2B3C] font-bold py-3 rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>

            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full text-[#64748B] hover:text-[#1A2B3C] font-medium"
            >
              ← Back to Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Login Screen (Default)
  return (
    <div className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 ${backdropClass}`}>
      <div className={`bg-white rounded-2xl border-2 border-[#D4AF37]/30 p-8 max-w-md w-full shadow-xl relative ${panelClass}`}>
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-[#6B7280] hover:text-[#1A2B3C] transition-colors"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-[#D4AF37]" />
          </div>
          <h2 className="text-3xl font-bold text-[#1A2B3C] mb-2" style={{ fontFamily: 'Playfair Display' }}>
            Portal Login
          </h2>
          <p className="text-[#64748B]">Welcome back! Please login to your account.</p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-[#1A2B3C] mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#64748B]">
                <Mail size={20} />
              </div>
              <input
                type="email"
                value={loginData.identifier}
                onChange={(e) => setLoginData({ ...loginData, identifier: e.target.value })}
                placeholder="you@example.com"
                required
                className="w-full pl-12 pr-4 py-3 border-2 border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1A2B3C] mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#64748B]">
                <Lock size={20} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                placeholder="Enter your password"
                required
                className="w-full pl-12 pr-12 py-3 border-2 border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#64748B] hover:text-[#1A2B3C]"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="text-right">
            <button type="button" onClick={() => setMode('forgot-password')} className="text-sm text-[#D4AF37] hover:text-[#C49D2E] font-medium">
              Forgot Password?
            </button>
          </div>

          {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#D4AF37] hover:bg-[#C49D2E] text-[#1A2B3C] font-bold py-3 rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Login to Portal'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[#64748B] text-sm">
            Access is by invitation only.{' '}
            <a href="/#contact" onClick={handleClose} className="text-[#D4AF37] hover:text-[#C49D2E] font-semibold">Contact us</a>
            {' '}to get started.
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-[#D4AF37]/20">
          <p className="text-xs text-center text-[#64748B]">
            By logging in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
