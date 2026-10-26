import React, { useState } from 'react';
import { MessageCircle, Sliders, CheckCircle2, Layers, Clock, ShieldCheck } from 'lucide-react';
import { ServiceCategory } from '../types/portfolio';
import {
  SERVICE_CATEGORIES,
  calculateProjectEstimate,
  formatWhatsAppUrl,
} from '../utils/portfolioLogic';

interface SpecificationEstimatorSectionProps {
  whatsappNumber: string;
}

export const SpecificationEstimatorSection: React.FC<SpecificationEstimatorSectionProps> = ({
  whatsappNumber,
}) => {
  const selectableCategories = SERVICE_CATEGORIES.filter((c) => c.id !== 'all') as {
    id: ServiceCategory;
    label: string;
    shortLabel: string;
    subtitle: string;
    subTypes: string[];
  }[];

  const [category, setCategory] = useState<ServiceCategory>('paper_prints');
  const currentCategoryObj =
    selectableCategories.find((c) => c.id === category) || selectableCategories[0];

  const [subType, setSubType] = useState<string>(currentCategoryObj.subTypes[0]);
  const [quantityOrArea, setQuantityOrArea] = useState<number>(1000);
  const [isUrgent, setIsUrgent] = useState<boolean>(false);

  const handleCategoryChange = (newCat: ServiceCategory) => {
    setCategory(newCat);
    const catMeta = selectableCategories.find((c) => c.id === newCat);
    if (catMeta && catMeta.subTypes.length > 0) {
      setSubType(catMeta.subTypes[0]);
    }
    if (newCat === 'paper_prints') {
      setQuantityOrArea(1000);
    } else if (newCat === 'outdoor_prints') {
      setQuantityOrArea(24);
    } else if (newCat === 'cladding') {
      setQuantityOrArea(45);
    } else {
      setQuantityOrArea(8);
    }
  };

  const estimate = calculateProjectEstimate({
    category,
    subType,
    quantityOrArea,
    isUrgent,
  });

  const whatsappUrl = formatWhatsAppUrl(whatsappNumber, estimate.whatsappInquiryText);

  return (
    <section id="specs-estimator" className="py-16 sm:py-20 border-t border-slate-200 bg-[#F1F5F9]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10">
          <div className="text-xs font-bold text-blue-600 mb-2">
            دليل المواصفات الفنية وطلب التسعير السريع
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
            استكشف الخامات الأنسب لمشروعك واطلب مقايسة فورية
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            حدد نوع المطبوعات أو الواجهة المطلوبة لمعرفة التوصية الهندسية للخامات والتشطيب ومدة التنفيذ المتوقعة، ثم أرسل المواصفات مباشرة عبر واتساب.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Interactive Controls Column */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between">
            <div className="space-y-6">
              {/* 1. Category selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-3">
                  1. اختر القسم الرئيسي
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {selectableCategories.map((cat) => {
                    const active = cat.id === category;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryChange(cat.id)}
                        className={`rounded-xl px-3.5 py-2.5 text-xs font-bold transition-colors whitespace-nowrap truncate ${
                          active
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-400 hover:bg-blue-50/40'
                        }`}
                      >
                        {cat.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Sub-Type selector */}
              <div>
                <label
                  htmlFor="estimator-subtype"
                  className="block text-xs font-bold text-slate-700 mb-2.5"
                >
                  2. اختر نوع العمل التفصيلي
                </label>
                <select
                  id="estimator-subtype"
                  value={subType}
                  onChange={(e) => setSubType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                >
                  {currentCategoryObj.subTypes.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Quantity / Area Input + Urgent Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="estimator-quantity"
                    className="block text-xs font-bold text-slate-700 mb-2"
                  >
                    {category === 'paper_prints'
                      ? '3. الكمية التقريبية (عدد القطع / النسخ)'
                      : category === 'prominent_letters'
                      ? '3. عدد الحروف أو طول اللافتة (متر)'
                      : '3. المساحة التقريبية (متر مربع م²)'}
                  </label>
                  <input
                    id="estimator-quantity"
                    type="number"
                    min={1}
                    max={100000}
                    value={quantityOrArea}
                    onChange={(e) => setQuantityOrArea(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-mono-num font-bold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-3 cursor-pointer rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 hover:border-blue-400 transition-colors">
                    <input
                      type="checkbox"
                      checked={isUrgent}
                      onChange={(e) => setIsUrgent(e.target.checked)}
                      className="h-4 w-4 accent-blue-600 rounded"
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      تنفيذ مستعجل (أولوية تشغيل سريعة)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-blue-600" />
                <span>تتحدث التوصيات الفنية تلقائياً حسب اختيارك</span>
              </span>
              <span className="font-bold text-blue-700">{subType}</span>
            </div>
          </div>

          {/* Output Recommendation Card */}
          <div className="lg:col-span-5 rounded-2xl border border-blue-200 bg-gradient-to-b from-blue-900 to-slate-900 p-6 sm:p-8 text-white shadow-md flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-blue-300 mb-2">
                بطاقة التوصية الفنية للمشروع
              </div>
              <h3 className="text-xl font-bold text-white mb-5">{subType}</h3>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Layers className="h-4 w-4 text-blue-400 shrink-0 mt-1" />
                  <div>
                    <div className="text-xs text-blue-200">الخامات الموصى بها</div>
                    <div className="text-white font-medium mt-0.5">
                      {estimate.recommendedMaterials}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-1" />
                  <div>
                    <div className="text-xs text-blue-200">التشطيب والحماية</div>
                    <div className="text-white font-medium mt-0.5">
                      {estimate.recommendedFinishing}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-blue-400 shrink-0 mt-1" />
                  <div>
                    <div className="text-xs text-blue-200">المدة الزمنية المتوقعة</div>
                    <div className="text-blue-300 font-bold mt-0.5">{estimate.estimatedDays}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-4 w-4 text-blue-400 shrink-0 mt-1" />
                  <div>
                    <div className="text-xs text-blue-200">معيار الجودة والضمان</div>
                    <div className="text-slate-200 mt-0.5">{estimate.qualityGuarantee}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-blue-800/70">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-900 hover:bg-blue-50 transition-colors whitespace-nowrap shadow-sm"
              >
                <MessageCircle className="h-4 w-4 text-blue-700" />
                <span>إرسال هذه المواصفات لطلب عرض سعر عبر واتساب</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
