import React, { useState } from 'react';
import { X, Copy, Check, Eye, Share2, Shield } from 'lucide-react';
import { buildClientShareUrl, formatWhatsAppUrl } from '../utils/portfolioLogic';

interface ClientShareModalProps {
  isOpen: boolean;
  studioName: string;
  onClose: () => void;
  onActivateClientPreview: () => void;
}

export const ClientShareModal: React.FC<ClientShareModalProps> = ({
  isOpen,
  studioName,
  onClose,
  onActivateClientPreview,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const clientShareUrl = buildClientShareUrl(window.location.href);
  const shareText = `تفضل بمشاهدة سابقة أعمالنا في (${studioName}) للمطبوعات الورقية والخارجية وواجهات الكلادينج والحروف البارزة عبر الرابط التالي: ${clientShareUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(clientShareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 text-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <Share2 className="h-5 w-5 text-blue-600" />
            <h2 id="share-modal-title" className="text-lg font-bold text-slate-900">
              مشاركة رابط العرض للعملاء (مشاهدة فقط)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق نافذة المشاركة"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-5">
          عند إرسال هذا الرابط لأي عميل، سيفتح له المعرض بوضع <strong className="text-slate-900">المشاهدة فقط</strong> بدون أي أزرار تعديل أو إضافة، بينما يظل التعديل محمياً بكلمة السر الخاصة بك.
        </p>

        {/* Share URL Box */}
        <div className="mb-6">
          <label htmlFor="client-share-url-input" className="block text-xs font-semibold text-slate-600 mb-2">
            رابط العميل المخصص للمشاهدة فقط:
          </label>
          <div className="flex items-center gap-2">
            <input
              id="client-share-url-input"
              type="text"
              readOnly
              dir="ltr"
              value={clientShareUrl}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs font-mono-num font-semibold text-blue-700 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
            </button>
          </div>
        </div>

        {/* Direct Share Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <a
            href={formatWhatsAppUrl('', shareText)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-800 hover:border-blue-600 hover:text-blue-700 transition-colors"
          >
            <span>إرسال الرابط عبر واتساب</span>
          </a>
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(clientShareUrl)}&text=${encodeURIComponent(studioName)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-800 hover:border-blue-600 hover:text-blue-700 transition-colors"
          >
            <span>إرسال الرابط عبر تليجرام</span>
          </a>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Shield className="h-4 w-4 text-blue-600" />
            <span>الإضافة والتعديل محمية بكلمة سر المالك</span>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onActivateClientPreview();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors whitespace-nowrap"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>قفل التعديل ومعاينة العميل</span>
          </button>
        </div>
      </div>
    </div>
  );
};
