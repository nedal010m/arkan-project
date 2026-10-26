import React, { useState, useEffect } from 'react';

interface VisualPresetCanvasProps {
  preset: string;
  imageUrl?: string;
  title: string;
  className?: string;
}

export const VisualPresetCanvas: React.FC<VisualPresetCanvasProps> = ({
  preset,
  imageUrl,
  title,
  className = 'w-full h-full',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [imageUrl]);

  if (imageUrl && imageUrl.trim().length > 0 && !imgFailed) {
    return (
      <div className={`relative overflow-hidden bg-blue-50 ${className}`}>
        <img
          src={imageUrl}
          alt={title}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-[#EFF6FF] select-none ${className}`}>
      {renderPresetSvg(preset)}
    </div>
  );
};

function renderPresetSvg(preset: string) {
  switch (preset) {
    case 'hero_flagship':
      return (
        <svg viewBox="0 0 800 540" className="w-full h-full object-cover" aria-hidden="true">
          <defs>
            <linearGradient id="studioDaylight" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#EFF6FF" />
              <stop offset="50%" stopColor="#DBEAFE" />
              <stop offset="100%" stopColor="#E0F2FE" />
            </linearGradient>
            <linearGradient id="royalFacade" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1E3A8A" />
              <stop offset="55%" stopColor="#1D4ED8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <filter id="softDrop" x="-10%" y="-10%" width="125%" height="125%">
              <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#1E3A8A" floodOpacity="0.18" />
            </filter>
          </defs>

          {/* Soft Soothing Daylight Studio Canvas */}
          <rect width="800" height="540" fill="url(#studioDaylight)" />
          <circle cx="700" cy="80" r="180" fill="#93C5FD" opacity="0.25" />
          <circle cx="90" cy="460" r="160" fill="#BAE6FD" opacity="0.35" />

          {/* Main Architectural Cladding & 3D Signage Showcase Board */}
          <g filter="url(#softDrop)">
            <rect
              x="55"
              y="38"
              width="690"
              height="270"
              rx="22"
              fill="url(#royalFacade)"
              stroke="#FFFFFF"
              strokeWidth="5"
            />
          </g>

          {/* Cladding Panel Geometric Lines */}
          <g stroke="#60A5FA" strokeWidth="1.2" opacity="0.35">
            <line x1="230" y1="42" x2="230" y2="304" />
            <line x1="400" y1="42" x2="400" y2="304" />
            <line x1="570" y1="42" x2="570" y2="304" />
            <line x1="60" y1="170" x2="740" y2="170" />
          </g>

          {/* Center White Sticker-Style 3D Signage Badge */}
          <g filter="url(#softDrop)">
            <rect
              x="130"
              y="78"
              width="540"
              height="135"
              rx="18"
              fill="#FFFFFF"
              stroke="#BFDBFE"
              strokeWidth="3"
            />
            <rect x="148" y="92" width="110" height="24" rx="12" fill="#EFF6FF" />
            <text
              x="203"
              y="108"
              textAnchor="middle"
              fill="#2563EB"
              fontFamily="Cairo, sans-serif"
              fontWeight="700"
              fontSize="12"
            >
              جودة معتمدة 100%
            </text>
            <text
              x="400"
              y="152"
              textAnchor="middle"
              fill="#0F172A"
              fontFamily="Cairo, sans-serif"
              fontWeight="800"
              fontSize="32"
            >
              أركـان للواجهات والمطبوعات
            </text>
            <text
              x="400"
              y="188"
              textAnchor="middle"
              fill="#2563EB"
              fontFamily="IBM Plex Mono, sans-serif"
              fontWeight="600"
              fontSize="13"
              letterSpacing="3"
            >
              PAPER PRINT · BANNER & VINYL · ACP CLADDING · 3D LETTERS
            </text>
          </g>

          {/* Bottom 3 Floating Sticker Cards (Paper Prints, Outdoor Vinyl, 3D Letters) */}
          {/* Card 1: Luxury Paper Prints */}
          <g transform="translate(65, 330)" filter="url(#softDrop)">
            <rect width="205" height="165" rx="18" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="4" />
            <rect x="16" y="16" width="173" height="92" rx="12" fill="#EFF6FF" />
            <rect x="34" y="30" width="110" height="64" rx="6" fill="#2563EB" transform="rotate(-4 89 62)" />
            <rect x="44" y="34" width="110" height="64" rx="6" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="1.5" />
            <circle cx="68" cy="66" r="12" fill="#DBEAFE" stroke="#1D4ED8" strokeWidth="2" />
            <rect x="88" y="56" width="50" height="6" rx="3" fill="#1E3A8A" />
            <rect x="88" y="68" width="36" height="5" rx="2.5" fill="#38BDF8" />
            <text x="102" y="135" textAnchor="middle" fill="#0F172A" fontSize="14" fontWeight="800" fontFamily="Cairo">
              كروت ومنيوهات وفلايرات
            </text>
            <text x="102" y="153" textAnchor="middle" fill="#2563EB" fontSize="11" fontWeight="600" fontFamily="Cairo">
              مطبوعات ورقية فاخرة
            </text>
          </g>

          {/* Card 2: Outdoor Banner & See-Through */}
          <g transform="translate(297, 330)" filter="url(#softDrop)">
            <rect width="205" height="165" rx="18" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="4" />
            <rect x="16" y="16" width="173" height="92" rx="12" fill="#E0F2FE" />
            <rect x="38" y="28" width="128" height="68" rx="8" fill="#0284C7" stroke="#FFFFFF" strokeWidth="2" />
            <text x="102" y="62" textAnchor="middle" fill="#FFFFFF" fontSize="14" fontWeight="800" fontFamily="Cairo">
              بانر · فينيل · سي ثرو
            </text>
            <text x="102" y="80" textAnchor="middle" fill="#BAE6FD" fontSize="10" fontWeight="700" fontFamily="IBM Plex Mono">
              1440 DPI UV OUTDOOR
            </text>
            <text x="102" y="135" textAnchor="middle" fill="#0F172A" fontSize="14" fontWeight="800" fontFamily="Cairo">
              مطبوعات خارجية عملاقة
            </text>
            <text x="102" y="153" textAnchor="middle" fill="#0284C7" fontSize="11" fontWeight="600" fontFamily="Cairo">
              ثبات ألوان ضد الشمس
            </text>
          </g>

          {/* Card 3: Cladding & 3D Prominent Letters */}
          <g transform="translate(530, 330)" filter="url(#softDrop)">
            <rect width="205" height="165" rx="18" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="4" />
            <rect x="16" y="16" width="173" height="92" rx="12" fill="#DBEAFE" />
            <rect x="38" y="28" width="128" height="68" rx="8" fill="#1E3A8A" stroke="#60A5FA" strokeWidth="2" />
            <text x="102" y="70" textAnchor="middle" fill="#FFFFFF" fontSize="22" fontWeight="800" fontFamily="Cairo">
              3D LED
            </text>
            <circle cx="148" cy="42" r="5" fill="#FDE047" />
            <text x="102" y="135" textAnchor="middle" fill="#0F172A" fontSize="14" fontWeight="800" fontFamily="Cairo">
              كلادينج وحروف بارزة
            </text>
            <text x="102" y="153" textAnchor="middle" fill="#1D4ED8" fontSize="11" fontWeight="600" fontFamily="Cairo">
              تشطيب هندسي متكامل
            </text>
          </g>
        </svg>
      );

    case 'cards_gold_foil':
      return (
        <svg viewBox="0 0 600 450" className="w-full h-full object-cover" aria-hidden="true">
          <rect width="600" height="450" fill="#EFF6FF" />
          <circle cx="500" cy="80" r="140" fill="#BFDBFE" opacity="0.5" />
          <circle cx="80" cy="380" r="120" fill="#BAE6FD" opacity="0.5" />
          {/* Sticker Badge Top Right */}
          <rect x="395" y="28" width="170" height="38" rx="19" fill="#FFFFFF" stroke="#BFDBFE" strokeWidth="2" />
          <text x="480" y="52" textAnchor="middle" fill="#1D4ED8" fontSize="13" fontWeight="800" fontFamily="Cairo">
            كروت سلوفان وبصمة
          </text>
          {/* Back royal blue card */}
          <g transform="translate(145, 85) rotate(-6)">
            <rect width="300" height="180" rx="16" fill="#1D4ED8" stroke="#FFFFFF" strokeWidth="4" />
            <text x="150" y="98" textAnchor="middle" fill="#FFFFFF" fontSize="22" fontWeight="800" fontFamily="Cairo">
              هوية ورقية متكاملة
            </text>
          </g>
          {/* Front white luxury card */}
          <g transform="translate(135, 165) rotate(3)">
            <rect width="320" height="190" rx="16" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="3" />
            <circle cx="78" cy="95" r="34" fill="#EFF6FF" stroke="#2563EB" strokeWidth="3" />
            <polygon points="78,72 95,108 61,108" fill="#2563EB" />
            <rect x="135" y="65" width="140" height="13" rx="4" fill="#0F172A" />
            <rect x="135" y="88" width="105" height="9" rx="3" fill="#2563EB" />
            <rect x="135" y="108" width="125" height="7" rx="3" fill="#94A3B8" />
            <rect x="135" y="142" width="150" height="26" rx="8" fill="#EFF6FF" />
            <text x="210" y="159" textAnchor="middle" fill="#1D4ED8" fontSize="11" fontWeight="700" fontFamily="IBM Plex Mono">
              600 GSM · VELVET + UV
            </text>
          </g>
        </svg>
      );

    case 'menu_leather':
      return (
        <svg viewBox="0 0 600 450" className="w-full h-full object-cover" aria-hidden="true">
          <rect width="600" height="450" fill="#F0F9FF" />
          <circle cx="90" cy="90" r="130" fill="#BAE6FD" opacity="0.45" />
          <rect x="390" y="25" width="175" height="36" rx="18" fill="#FFFFFF" stroke="#7DD3FC" strokeWidth="2" />
          <text x="477" y="48" textAnchor="middle" fill="#0369A1" fontSize="13" fontWeight="800" fontFamily="Cairo">
            منيوهات ضد الماء
          </text>
          <g transform="translate(95, 65)">
            {/* Left Royal Blue Cover */}
            <rect x="0" y="0" width="195" height="320" rx="14" fill="#1E3A8A" stroke="#FFFFFF" strokeWidth="4" />
            <rect x="16" y="16" width="163" height="288" rx="8" fill="none" stroke="#93C5FD" strokeDasharray="6 4" strokeWidth="1.5" />
            <circle cx="97" cy="105" r="28" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
            <text x="97" y="113" textAnchor="middle" fill="#FFFFFF" fontSize="16" fontWeight="800" fontFamily="Cairo">
              MENU
            </text>
            <text x="97" y="175" textAnchor="middle" fill="#FFFFFF" fontSize="18" fontWeight="800" fontFamily="Cairo">
              منيو مطعم وكافيه
            </text>
            <text x="97" y="202" textAnchor="middle" fill="#93C5FD" fontSize="12" fontFamily="Cairo">
              حفر ليزر + سلوفان حراري
            </text>

            {/* Right Crisp Page */}
            <rect x="205" y="6" width="195" height="308" rx="14" fill="#FFFFFF" stroke="#BFDBFE" strokeWidth="3" />
            <rect x="228" y="34" width="95" height="11" rx="4" fill="#1E3A8A" />
            <line x1="228" y1="58" x2="375" y2="58" stroke="#3B82F6" strokeWidth="2" />
            {[80, 118, 156, 194, 232].map((y, idx) => (
              <g key={idx}>
                <rect x="228" y={y} width="95" height="8" rx="3" fill="#0F172A" />
                <rect x="342" y={y} width="32" height="8" rx="3" fill="#2563EB" />
                <rect x="228" y={y + 14} width="125" height="5" rx="2" fill="#94A3B8" />
              </g>
            ))}
          </g>
        </svg>
      );

    case 'brochure_spot_uv':
      return (
        <svg viewBox="0 0 600 450" className="w-full h-full object-cover" aria-hidden="true">
          <rect width="600" height="450" fill="#EFF6FF" />
          <g transform="translate(85, 70)">
            <polygon points="0,25 140,0 140,285 0,310" fill="#DBEAFE" stroke="#FFFFFF" strokeWidth="3" />
            <polygon points="140,0 285,25 285,310 140,285" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="3" />
            <polygon points="285,25 425,0 425,285 285,310" fill="#E0F2FE" stroke="#FFFFFF" strokeWidth="3" />
            <circle cx="212" cy="95" r="34" fill="#EFF6FF" stroke="#2563EB" strokeWidth="3" />
            <rect x="28" y="65" width="84" height="90" rx="8" fill="#2563EB" />
            <rect x="165" y="152" width="95" height="11" rx="4" fill="#0F172A" />
            <rect x="165" y="172" width="75" height="8" rx="3" fill="#3B82F6" />
            <rect x="315" y="60" width="82" height="11" rx="4" fill="#1D4ED8" />
            <rect x="315" y="84" width="82" height="130" rx="8" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="2" />
            <text x="212" y="262" textAnchor="middle" fill="#1D4ED8" fontSize="13" fontWeight="800" fontFamily="Cairo">
              فلايرات وبروشورات شركات مطوية
            </text>
          </g>
        </svg>
      );

    case 'notebooks_ncr':
      return (
        <svg viewBox="0 0 600 450" className="w-full h-full object-cover" aria-hidden="true">
          <rect width="600" height="450" fill="#F0F9FF" />
          <g transform="translate(85, 70)">
            <rect x="45" y="24" width="220" height="280" rx="12" fill="#BAE6FD" stroke="#FFFFFF" strokeWidth="3" />
            <rect x="22" y="12" width="220" height="280" rx="12" fill="#DBEAFE" stroke="#FFFFFF" strokeWidth="3" />
            <rect x="0" y="0" width="220" height="280" rx="12" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="2.5" />
            <rect x="0" y="0" width="220" height="52" rx="12" fill="#1D4ED8" />
            <text x="110" y="32" textAnchor="middle" fill="#FFFFFF" fontSize="15" fontWeight="800" fontFamily="Cairo">
              دفاتر فواتير مكربنة NCR
            </text>
            <text x="195" y="76" textAnchor="end" fill="#2563EB" fontSize="13" fontWeight="700" fontFamily="IBM Plex Mono">
              NO. 004892
            </text>
            {[100, 130, 160, 190, 220].map((y) => (
              <line key={y} x1="22" y1={y} x2="198" y2={y} stroke="#E2E8F0" strokeWidth="2" />
            ))}
          </g>
          <g transform="translate(345, 100)">
            <rect x="0" y="0" width="170" height="250" rx="14" fill="#1E3A8A" stroke="#FFFFFF" strokeWidth="4" />
            {[25, 55, 85, 115, 145, 175, 205, 230].map((y) => (
              <circle key={y} cx="4" cy={y} r="5.5" fill="#93C5FD" />
            ))}
            <text x="90" y="118" textAnchor="middle" fill="#FFFFFF" fontSize="19" fontWeight="800" fontFamily="Cairo">
              دفاتر ومفكرات
            </text>
            <text x="90" y="146" textAnchor="middle" fill="#93C5FD" fontSize="12" fontWeight="700" fontFamily="Cairo">
              سلك معدني وتجليد فاخر
            </text>
          </g>
        </svg>
      );

    case 'outdoor_banner_flex':
      return (
        <svg viewBox="0 0 600 450" className="w-full h-full object-cover" aria-hidden="true">
          <rect width="600" height="450" fill="#E0F2FE" />
          <circle cx="510" cy="80" r="110" fill="#FFFFFF" opacity="0.6" />
          {/* Steel Billboard Truss */}
          <rect x="275" y="295" width="50" height="155" fill="#334155" />
          {/* Illuminated Flex Billboard */}
          <rect x="50" y="60" width="500" height="245" rx="18" fill="#FFFFFF" stroke="#2563EB" strokeWidth="5" />
          <rect x="68" y="78" width="464" height="209" rx="12" fill="#1D4ED8" />
          {[95, 195, 300, 405, 505].map((x) => (
            <circle key={x} cx={x} cy="69" r="4" fill="#64748B" />
          ))}
          <text x="300" y="168" textAnchor="middle" fill="#FFFFFF" fontSize="30" fontWeight="800" fontFamily="Cairo">
            بانر وفليكس خارجي عملاق
          </text>
          <text x="300" y="210" textAnchor="middle" fill="#BAE6FD" fontSize="14" fontWeight="700" fontFamily="IBM Plex Mono">
            KOREAN 510G FLEX · WEATHERPROOF 1440 DPI
          </text>
        </svg>
      );

    case 'vinyl_seethrough':
      return (
        <svg viewBox="0 0 600 450" className="w-full h-full object-cover" aria-hidden="true">
          <defs>
            <pattern id="meshPatternLight" width="8" height="8" patternUnits="userSpaceOnUse">
              <circle cx="4" cy="4" r="1.6" fill="#2563EB" opacity="0.28" />
            </pattern>
          </defs>
          <rect width="600" height="450" fill="#EFF6FF" />
          <g transform="translate(55, 50)">
            <rect width="490" height="345" rx="16" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="4" />
            <rect x="16" y="16" width="222" height="313" rx="8" fill="url(#meshPatternLight)" stroke="#93C5FD" />
            <rect x="252" y="16" width="222" height="313" rx="8" fill="url(#meshPatternLight)" stroke="#93C5FD" />
            <rect x="45" y="108" width="400" height="120" rx="16" fill="#1D4ED8" stroke="#FFFFFF" strokeWidth="4" />
            <text x="245" y="162" textAnchor="middle" fill="#FFFFFF" fontSize="25" fontWeight="800" fontFamily="Cairo">
              فينيل وسي ثرو للواجهات الزجاجية
            </text>
            <text x="245" y="198" textAnchor="middle" fill="#BAE6FD" fontSize="13" fontWeight="700" fontFamily="IBM Plex Mono">
              ONE-WAY VISION PERFORATED VINYL · UV INK
            </text>
          </g>
        </svg>
      );

    case 'cladding_acp_facade':
      return (
        <svg viewBox="0 0 600 450" className="w-full h-full object-cover" aria-hidden="true">
          <rect width="600" height="450" fill="#EFF6FF" />
          <g transform="translate(45, 45)">
            <rect width="510" height="355" rx="18" fill="#1E3A8A" stroke="#FFFFFF" strokeWidth="5" />
            <line x1="125" y1="0" x2="125" y2="355" stroke="#3B82F6" strokeWidth="3" />
            <line x1="255" y1="0" x2="255" y2="355" stroke="#3B82F6" strokeWidth="3" />
            <line x1="385" y1="0" x2="385" y2="355" stroke="#3B82F6" strokeWidth="3" />
            <line x1="0" y1="135" x2="510" y2="135" stroke="#3B82F6" strokeWidth="3" />
            <line x1="0" y1="245" x2="510" y2="245" stroke="#3B82F6" strokeWidth="3" />
            <rect x="85" y="38" width="340" height="76" rx="14" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="3" />
            <text x="255" y="84" textAnchor="middle" fill="#1E3A8A" fontSize="21" fontWeight="800" fontFamily="Cairo">
              واجهات كلادينج معماري ACP
            </text>
            <rect x="155" y="248" width="200" height="102" rx="6" fill="#DBEAFE" stroke="#FFFFFF" strokeWidth="3" />
          </g>
        </svg>
      );

    case 'cladding_wood_cnc':
      return (
        <svg viewBox="0 0 600 450" className="w-full h-full object-cover" aria-hidden="true">
          <rect width="600" height="450" fill="#F0F9FF" />
          <g transform="translate(50, 45)">
            <rect width="500" height="355" rx="18" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="3" />
            {[16, 44, 72, 100, 380, 408, 436, 464].map((x) => (
              <rect key={x} x={x} y="16" width="20" height="323" rx="4" fill="#2563EB" />
            ))}
            <rect x="132" y="16" width="236" height="323" rx="12" fill="#1E3A8A" />
            <circle cx="250" cy="150" r="66" fill="none" stroke="#93C5FD" strokeWidth="3" strokeDasharray="8 5" />
            <circle cx="250" cy="150" r="44" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
            <text x="250" y="157" textAnchor="middle" fill="#FFFFFF" fontSize="18" fontWeight="800" fontFamily="Cairo">
              CNC + ACP
            </text>
            <text x="250" y="270" textAnchor="middle" fill="#FFFFFF" fontSize="16" fontWeight="700" fontFamily="Cairo">
              كلادينج وتفريغ ليزر مضيء
            </text>
          </g>
        </svg>
      );

    case 'letters_gold_stainless':
    default:
      return (
        <svg viewBox="0 0 600 450" className="w-full h-full object-cover" aria-hidden="true">
          <rect width="600" height="450" fill="#EFF6FF" />
          <rect x="45" y="55" width="510" height="340" rx="22" fill="#1D4ED8" stroke="#FFFFFF" strokeWidth="6" />
          <rect x="195" y="82" width="210" height="32" rx="16" fill="#FFFFFF" />
          <text x="300" y="103" textAnchor="middle" fill="#1D4ED8" fontSize="13" fontWeight="800" fontFamily="Cairo">
            إستانلس 304 + أكريليك مضيء
          </text>
          <text
            x="305"
            y="232"
            textAnchor="middle"
            fill="#1E3A8A"
            fontSize="58"
            fontWeight="800"
            fontFamily="Cairo"
          >
            حروف بارزة 3D
          </text>
          <text
            x="300"
            y="226"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="58"
            fontWeight="800"
            fontFamily="Cairo"
          >
            حروف بارزة 3D
          </text>
          <text
            x="300"
            y="305"
            textAnchor="middle"
            fill="#DBEAFE"
            fontSize="13"
            fontWeight="700"
            fontFamily="IBM Plex Mono"
            letterSpacing="3"
          >
            304 STAINLESS STEEL · OPAL ACRYLIC · SAMSUNG LED
          </text>
        </svg>
      );
  }
}
