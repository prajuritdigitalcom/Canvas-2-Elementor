import React, { useState, useEffect } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  Clock,
  ShieldAlert,
  AlertCircle,
  Loader2,
  KeyRound,
} from 'lucide-react';

interface AppLockModalProps {
  onSuccess: () => void;
}

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 12 * 60 * 60 * 1000; // 12 Hours in milliseconds

export const AppLockModal: React.FC<AppLockModalProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Failed attempts state from localStorage
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    const saved = localStorage.getItem('c2e_failed_attempts');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Lockout timestamp state from localStorage
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(() => {
    const saved = localStorage.getItem('c2e_lockout_until');
    return saved ? parseInt(saved, 10) : null;
  });

  // Remaining time in milliseconds for lockout countdown
  const [remainingMs, setRemainingMs] = useState<number>(0);

  // Timer effect to calculate remaining time every second if locked out
  useEffect(() => {
    if (!lockoutUntil) {
      setRemainingMs(0);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diff = lockoutUntil - now;

      if (diff <= 0) {
        // Lockout expired! Reset lockout state
        localStorage.removeItem('c2e_lockout_until');
        localStorage.removeItem('c2e_failed_attempts');
        setLockoutUntil(null);
        setFailedAttempts(0);
        setErrorMsg(null);
        setRemainingMs(0);
      } else {
        setRemainingMs(diff);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const isLockedOut = lockoutUntil !== null && remainingMs > 0;

  // Format milliseconds to "X jam Y menit Z detik"
  const formatRemainingTime = (ms: number): string => {
    if (ms <= 0) return '0 detik';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours} jam`);
    if (minutes > 0 || hours > 0) parts.push(`${minutes} menit`);
    parts.push(`${seconds} detik`);

    return parts.join(' ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLockedOut || isSubmitting || !password) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Password Correct!
        localStorage.setItem('c2e_auth_token', 'authenticated');
        localStorage.removeItem('c2e_failed_attempts');
        localStorage.removeItem('c2e_lockout_until');
        onSuccess();
      } else {
        // Password Incorrect
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        localStorage.setItem('c2e_failed_attempts', newAttempts.toString());

        if (newAttempts >= MAX_ATTEMPTS) {
          const newLockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
          setLockoutUntil(newLockoutUntil);
          localStorage.setItem('c2e_lockout_until', newLockoutUntil.toString());
          setErrorMsg('Percobaan telah mencapai batas maksimal (3 kali). Akses dikunci selama 12 jam.');
        } else {
          const remainingAttempts = MAX_ATTEMPTS - newAttempts;
          setErrorMsg(
            `Password yang Anda masukkan salah! Sisa percobaan: ${remainingAttempts} kali.`
          );
        }
      }
    } catch (err: any) {
      setErrorMsg('Gagal terhubung ke server untuk verifikasi password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative">
        {/* Top Decorative Header Accent */}
        <div className="h-2 bg-gradient-to-r from-[#fe4c6f] via-rose-500 to-indigo-600" />

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header Icon & Title */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[#fe4c6f]/10 text-[#fe4c6f] border border-[#fe4c6f]/20 shadow-inner mb-1">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Aplikasi Terkunci
              </h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Silakan masukkan password untuk membuka akses.
              </p>
            </div>
          </div>

          {/* Lockout Banner */}
          {isLockedOut ? (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-900 space-y-3">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-rose-900">
                    Akses Dibatasi (12 Jam)
                  </h4>
                  <p className="text-xs text-rose-700 leading-relaxed">
                    Anda telah 3 kali gagal memasukkan password. Input dikunci secara otomatis.
                  </p>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur border border-rose-200 rounded-xl p-3 flex items-center justify-between text-xs font-semibold text-rose-900">
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-rose-600 animate-pulse" />
                  <span>Sisa Waktu Kunci:</span>
                </div>
                <span className="font-mono text-sm text-rose-700 bg-rose-100/80 px-2.5 py-1 rounded-md border border-rose-200">
                  {formatRemainingTime(remainingMs)}
                </span>
              </div>
            </div>
          ) : (
            /* Error Alert if attempts failed */
            errorMsg && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3 text-amber-900 text-xs leading-relaxed animate-in slide-in-from-top-2 duration-200">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">{errorMsg}</p>
                </div>
              </div>
            )
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor="app-password-input"
                  className="font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                  <span>Password Website</span>
                </label>
                {!isLockedOut && (
                  <span className="text-[11px] font-medium text-slate-500">
                    Sisa Percobaan:{' '}
                    <strong className="text-slate-800">
                      {Math.max(0, MAX_ATTEMPTS - failedAttempts)} / {MAX_ATTEMPTS}
                    </strong>
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  id="app-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLockedOut || isSubmitting}
                  placeholder="Masukkan password rahasia..."
                  autoFocus
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#fe4c6f] focus:ring-2 focus:ring-[#fe4c6f]/20 outline-none text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-all pr-11"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLockedOut || isSubmitting}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:opacity-50 transition-colors p-1"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLockedOut || isSubmitting || !password.trim()}
              className="w-full py-3 px-4 bg-[#fe4c6f] hover:bg-[#e03a5b] active:bg-[#c92f4e] text-white font-semibold rounded-xl text-sm shadow-md hover:shadow-lg shadow-[#fe4c6f]/20 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Password...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Buka Akses Website</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Note */}
          <div className="pt-2 border-t border-slate-100 text-center text-[11px] text-slate-500">
            <p>Sistem Keamanan Terenkripsi Server-Side</p>
          </div>
        </div>
      </div>
    </div>
  );
};
