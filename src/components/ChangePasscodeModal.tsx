import React, { useState } from 'react';
import { KeyRound, X, AlertCircle, CheckCircle2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { validatePasscodeFormat, verifyOwnerPasscode } from '../utils/portfolioLogic';

interface ChangePasscodeModalProps {
  isOpen: boolean;
  currentActivePasscode: string;
  onClose: () => void;
  onSuccess: (newPasscode: string) => void;
}

export const ChangePasscodeModal: React.FC<ChangePasscodeModalProps> = ({
  isOpen,
  currentActivePasscode,
  onClose,
  onSuccess,
}) => {
  const [oldPasscode, setOldPasscode] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // 1. Verify old passcode
    if (!verifyOwnerPasscode(oldPasscode, currentActivePasscode)) {
      setError('كلمة السر الحالية غير صحيحة، يرجى كتابتها للتأكد من هويتك.');
      return;
    }

    // 2. Validate format
    const formatCheck = validatePasscodeFormat(newPasscode);
    if (!formatCheck.valid) {
      setError(formatCheck.errors[0] || 'كلمة السر الجديدة غير صالحة.');
      return;
    }

    // 3. Confirm match
    if (newPasscode !== confirmPasscode) {
      setError('كلمة السر الجديدة وتأكيدها غير متطابقين.');
      return;
    }

    const cleanNewPasscode = newPasscode.trim();
    setSuccessMsg(`تم تغيير كلمة سر الإدارة بنجاح إلى: ${cleanNewPasscode}`);
    setTimeout(() => {
      onSuccess(cleanNewPasscode);
      onClose();
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-passcode-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border-2 border-blue-100 bg-white p-6 sm:p-8 text-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-blue-50 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 id="change-passcode-title" className="text-base sm:text-lg font-extrabold text-slate-900">
                تغيير كلمة سر الإدارة
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                تخصيص كلمة السر المستخدمة لإضافة وتعديل الأعمال
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {successMsg ? (
          <div className="rounded-2xl bg-green-50 p-6 text-center border border-green-200 space-y-3">
            <ShieldCheck className="h-10 w-10 text-green-600 mx-auto" />
            <h3 className="text-base font-extrabold text-green-900">{successMsg}</h3>
            <p className="text-xs text-green-700">
              تم حفظ كلمة السر الجديدة سحابياً ومحلياً على جهازك.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                كلمة السر الحالية *
              </label>
              <div className="relative">
                <input
                  type={showOld ? 'text' : 'password'}
                  required
                  autoFocus
                  value={oldPasscode}
                  onChange={(e) => {
                    setOldPasscode(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="كلمة السر الحالية (الافتراضية: 109283)"
                  className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 pr-4 pl-11 py-2.5 text-sm text-right font-mono text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                كلمة السر الجديدة (4 خانات على الأقل) *
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  value={newPasscode}
                  onChange={(e) => {
                    setNewPasscode(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="كلمة السر الجديدة"
                  className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 pr-4 pl-11 py-2.5 text-sm text-right font-mono text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                تأكيد كلمة السر الجديدة *
              </label>
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={confirmPasscode}
                onChange={(e) => {
                  setConfirmPasscode(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="أعد كتابة كلمة السر الجديدة للتأكيد"
                className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 pr-4 pl-4 py-2.5 text-sm text-right font-mono text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-blue-700 shadow-md transition-colors"
              >
                حفظ كلمة السر الجديدة
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
