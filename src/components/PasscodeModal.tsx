import React, { useState, useEffect } from 'react';
import { Lock, X, AlertCircle, KeyRound, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { verifyOwnerPasscode } from '../utils/portfolioLogic';

interface PasscodeModalProps {
  isOpen: boolean;
  activePasscode?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const PasscodeModal: React.FC<PasscodeModalProps> = ({
  isOpen,
  activePasscode,
  onClose,
  onSuccess,
}) => {
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPasscode('');
      setShowPassword(false);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyOwnerPasscode(passcode, activePasscode)) {
      setError(null);
      setPasscode('');
      onSuccess();
    } else {
      setError('كلمة السر غير صحيحة. يرجى إدخال كلمة السر المعتمدة للإدارة.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="passcode-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border-2 border-blue-100 bg-white p-6 sm:p-8 text-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-blue-50 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 id="passcode-modal-title" className="text-base sm:text-lg font-extrabold text-slate-900">
                دخول لوحة الإدارة ورفع الصور
              </h2>
              <p className="text-xs text-slate-500 font-medium">محمي بكلمة سر المالك الخاصة</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق نافذة كلمة السر"
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="owner-passcode-input"
              className="block text-xs font-bold text-slate-700 mb-2"
            >
              أدخل كلمة سر الإدارة لتفعيل الإضافة والتعديل:
            </label>
            <div className="relative">
              <KeyRound className="h-4 w-4 text-blue-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="owner-passcode-input"
                type={showPassword ? 'text' : 'password'}
                dir="ltr"
                autoFocus
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="••••••"
                className="w-full rounded-2xl border-2 border-blue-100 bg-slate-50 pr-10 pl-11 py-3 text-center text-base font-mono font-bold tracking-widest text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'إخفاء كلمة السر' : 'إظهار كلمة السر'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-extrabold text-white shadow-md hover:bg-blue-700 transition-colors"
            >
              فتح لوحة التحكم والتعديل
            </button>
          </div>

          <div className="rounded-xl bg-blue-50/70 p-3 text-[11px] text-blue-800 border border-blue-100 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              كلمة السر الافتراضية الأولية هي <strong>109283</strong>، ويمكنك تغييرها في أي وقت من زر <strong>"تغيير كلمة السر"</strong> أعلى الصفحة بعد الدخول.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
