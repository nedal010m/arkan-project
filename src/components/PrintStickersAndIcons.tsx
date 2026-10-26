import React from 'react';
import { ServiceCategory } from '../types/portfolio';

/**
 * Handcrafted Die-Cut Stickers & Illustrative Domain Emblems
 * Designed with thick white sticker borders, soft studio elevation, and royal-blue / cyan / gold accents.
 */

export const StickerCmykPalette: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`inline-flex items-center gap-2.5 rounded-2xl border-2 border-white bg-gradient-to-l from-blue-50 to-white px-3.5 py-2 shadow-md ring-1 ring-blue-100 select-none ${className}`}
  >
    <svg viewBox="0 0 40 40" className="h-8 w-8 shrink-0" aria-hidden="true">
      <circle cx="15" cy="16" r="10" fill="#06B6D4" opacity="0.88" />
      <circle cx="25" cy="16" r="10" fill="#3B82F6" opacity="0.88" />
      <circle cx="20" cy="25" r="10" fill="#F59E0B" opacity="0.88" />
      <circle cx="20" cy="19" r="4.5" fill="#FFFFFF" />
    </svg>
    <div className="text-right">
      <div className="text-xs font-extrabold text-slate-900 leading-tight">فرز ألوان CMYK</div>
      <div className="text-[11px] font-medium text-blue-600">مطابقة لونية 100%</div>
    </div>
  </div>
);

export const Sticker3DLetters: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`inline-flex items-center gap-2.5 rounded-2xl border-2 border-white bg-gradient-to-l from-sky-50 to-white px-3.5 py-2 shadow-md ring-1 ring-blue-100 select-none ${className}`}
  >
    <svg viewBox="0 0 40 40" className="h-8 w-8 shrink-0" aria-hidden="true">
      <rect x="4" y="6" width="32" height="28" rx="8" fill="#1D4ED8" />
      <text
        x="21"
        y="26"
        textAnchor="middle"
        fill="#93C5FD"
        fontSize="15"
        fontWeight="800"
        fontFamily="Cairo, sans-serif"
      >
        3D
      </text>
      <text
        x="19"
        y="24"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="15"
        fontWeight="800"
        fontFamily="Cairo, sans-serif"
      >
        3D
      </text>
      <circle cx="31" cy="11" r="2.5" fill="#FDE047" />
    </svg>
    <div className="text-right">
      <div className="text-xs font-extrabold text-slate-900 leading-tight">حروف بارزة مضيئة</div>
      <div className="text-[11px] font-medium text-blue-600">إستانلس وأكريليك كوري</div>
    </div>
  </div>
);

export const StickerCladdingShield: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`inline-flex items-center gap-2.5 rounded-2xl border-2 border-white bg-gradient-to-l from-blue-50 to-white px-3.5 py-2 shadow-md ring-1 ring-blue-100 select-none ${className}`}
  >
    <svg viewBox="0 0 40 40" className="h-8 w-8 shrink-0" aria-hidden="true">
      <path
        d="M20 4 L34 10 V21 C34 29 27.5 34.5 20 37 C12.5 34.5 6 29 6 21 V10 L20 4 Z"
        fill="#2563EB"
      />
      <path
        d="M20 8 L30 12.5 V20.5 C30 26.5 25.2 30.8 20 32.8 C14.8 30.8 10 26.5 10 20.5 V12.5 L20 8 Z"
        fill="#EFF6FF"
      />
      <path d="M15 20 L18.5 23.5 L25.5 16.5" stroke="#1D4ED8" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <div className="text-right">
      <div className="text-xs font-extrabold text-slate-900 leading-tight">كلادينج معماري ACP</div>
      <div className="text-[11px] font-medium text-blue-600">ضمان وثبات 20 عاماً</div>
    </div>
  </div>
);

export const StickerOutdoorRoll: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`inline-flex items-center gap-2.5 rounded-2xl border-2 border-white bg-gradient-to-l from-sky-50 to-white px-3.5 py-2 shadow-md ring-1 ring-blue-100 select-none ${className}`}
  >
    <svg viewBox="0 0 40 40" className="h-8 w-8 shrink-0" aria-hidden="true">
      <rect x="6" y="8" width="28" height="10" rx="5" fill="#1E40AF" />
      <rect x="9" y="15" width="22" height="19" rx="3" fill="#38BDF8" />
      <rect x="12" y="18" width="16" height="13" rx="2" fill="#FFFFFF" />
      <circle cx="11" cy="13" r="2" fill="#93C5FD" />
    </svg>
    <div className="text-right">
      <div className="text-xs font-extrabold text-slate-900 leading-tight">بانر وفينيل وسي ثرو</div>
      <div className="text-[11px] font-medium text-blue-600">طباعة UV مقاومة للشمس</div>
    </div>
  </div>
);

export const CategoryStickerIllustration: React.FC<{
  category: ServiceCategory;
  className?: string;
}> = ({ category, className = 'h-14 w-14' }) => {
  switch (category) {
    case 'paper_prints':
      return (
        <div
          className={`inline-flex items-center justify-center rounded-2xl border-2 border-white bg-gradient-to-br from-blue-600 to-sky-500 p-2.5 shadow-md ring-1 ring-blue-200 ${className}`}
        >
          <svg viewBox="0 0 48 48" className="w-full h-full" aria-hidden="true">
            <rect x="10" y="6" width="26" height="34" rx="4" fill="#DBEAFE" transform="rotate(-6 23 23)" />
            <rect x="12" y="8" width="26" height="34" rx="4" fill="#FFFFFF" />
            <rect x="17" y="15" width="16" height="3.5" rx="1.5" fill="#1D4ED8" />
            <rect x="17" y="21" width="12" height="2.5" rx="1" fill="#38BDF8" />
            <rect x="17" y="26" width="14" height="2.5" rx="1" fill="#94A3B8" />
            <circle cx="31" cy="34" r="4" fill="#F59E0B" />
          </svg>
        </div>
      );

    case 'outdoor_prints':
      return (
        <div
          className={`inline-flex items-center justify-center rounded-2xl border-2 border-white bg-gradient-to-br from-sky-500 to-blue-700 p-2.5 shadow-md ring-1 ring-blue-200 ${className}`}
        >
          <svg viewBox="0 0 48 48" className="w-full h-full" aria-hidden="true">
            <rect x="6" y="10" width="36" height="22" rx="4" fill="#FFFFFF" />
            <rect x="9" y="13" width="30" height="16" rx="2" fill="#EFF6FF" />
            <line x1="16" y1="32" x2="16" y2="42" stroke="#DBEAFE" strokeWidth="3" strokeLinecap="round" />
            <line x1="32" y1="32" x2="32" y2="42" stroke="#DBEAFE" strokeWidth="3" strokeLinecap="round" />
            <circle cx="15" cy="21" r="4" fill="#0284C7" />
            <rect x="22" y="18" width="13" height="3" rx="1.5" fill="#1E3A8A" />
            <rect x="22" y="23" width="9" height="2.5" rx="1" fill="#38BDF8" />
          </svg>
        </div>
      );

    case 'cladding':
      return (
        <div
          className={`inline-flex items-center justify-center rounded-2xl border-2 border-white bg-gradient-to-br from-blue-700 to-indigo-800 p-2.5 shadow-md ring-1 ring-blue-200 ${className}`}
        >
          <svg viewBox="0 0 48 48" className="w-full h-full" aria-hidden="true">
            <rect x="7" y="8" width="34" height="32" rx="4" fill="#DBEAFE" />
            <line x1="24" y1="8" x2="24" y2="40" stroke="#1E3A8A" strokeWidth="2.5" />
            <line x1="7" y1="22" x2="41" y2="22" stroke="#1E3A8A" strokeWidth="2.5" />
            <rect x="13" y="13" width="22" height="9" rx="2" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.5" />
            <rect x="18" y="28" width="12" height="12" fill="#1D4ED8" />
          </svg>
        </div>
      );

    case 'prominent_letters':
    default:
      return (
        <div
          className={`inline-flex items-center justify-center rounded-2xl border-2 border-white bg-gradient-to-br from-blue-600 to-cyan-500 p-2.5 shadow-md ring-1 ring-blue-200 ${className}`}
        >
          <svg viewBox="0 0 48 48" className="w-full h-full" aria-hidden="true">
            <circle cx="24" cy="24" r="17" fill="#FFFFFF" opacity="0.2" />
            <text
              x="26"
              y="32"
              textAnchor="middle"
              fill="#1E3A8A"
              fontSize="20"
              fontWeight="800"
              fontFamily="Cairo, sans-serif"
            >
              3D
            </text>
            <text
              x="24"
              y="30"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="20"
              fontWeight="800"
              fontFamily="Cairo, sans-serif"
            >
              3D
            </text>
            <circle cx="37" cy="13" r="3" fill="#FDE047" />
          </svg>
        </div>
      );
  }
};
