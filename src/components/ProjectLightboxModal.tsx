import React, { useEffect, useState } from 'react';
import {
  X,
  MessageCircle,
  Edit3,
  CheckCircle2,
  Ruler,
  Layers,
  Sparkles,
  Clock,
  Building2,
  Camera,
} from 'lucide-react';
import { ProjectItem } from '../types/portfolio';
import { SERVICE_CATEGORIES, formatWhatsAppUrl } from '../utils/portfolioLogic';
import { VisualPresetCanvas } from './VisualPresetCanvas';

interface ProjectLightboxModalProps {
  project: ProjectItem | null;
  whatsappNumber: string;
  canEdit: boolean;
  onClose: () => void;
  onEditProject: (project: ProjectItem) => void;
  onQuickUploadPhoto?: (project: ProjectItem, file: File) => void;
}

export const ProjectLightboxModal: React.FC<ProjectLightboxModalProps> = ({
  project,
  whatsappNumber,
  canEdit,
  onClose,
  onEditProject,
  onQuickUploadPhoto,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [project]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (project) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project, onClose]);

  if (!project) return null;

  const allImages = [
    ...(project.imageUrl ? [project.imageUrl] : []),
    ...(project.galleryImages || []).filter((img) => img && img !== project.imageUrl),
  ];
  const activeImageUrl = allImages[activeImageIndex] || project.imageUrl;

  const categoryLabel =
    SERVICE_CATEGORIES.find((c) => c.id === project.category)?.shortLabel || project.category;

  const whatsappInquiryMsg = `مرحباً، شاهدت عملكم (${project.title}) في قسم (${categoryLabel} - ${project.subCategory}) وأرغب في الاستفسار عن تنفيذ عمل مماثل.`;
  const whatsappHref = formatWhatsAppUrl(whatsappNumber, whatsappInquiryMsg);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4 md:p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-project-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-blue-100 bg-white text-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-bold text-blue-600">{categoryLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{project.subCategory}</span>
            <span aria-hidden="true">·</span>
            <span>{project.clientName}</span>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && onQuickUploadPhoto && (
              <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 shadow-xs">
                <Camera className="h-3.5 w-3.5" />
                <span>رفع صورة للعمل</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onQuickUploadPhoto(project, file);
                    }
                  }}
                />
              </label>
            )}

            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  const target = project;
                  onClose();
                  onEditProject(target);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors whitespace-nowrap shrink-0"
              >
                <Edit3 className="h-3.5 w-3.5 text-blue-600" />
                <span>تعديل البيانات</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق نافذة تفاصيل العمل"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900 hover:border-blue-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Visual Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-7 bg-[#EFF6FF] min-h-[280px] sm:min-h-[380px] flex flex-col justify-between">
            <div className="flex-1 min-h-[280px] sm:min-h-[360px]">
              <VisualPresetCanvas
                preset={project.visualPreset}
                imageUrl={activeImageUrl}
                title={project.title}
                className="w-full h-full min-h-[280px] sm:min-h-[360px]"
              />
            </div>

            {allImages.length > 1 && (
              <div className="flex items-center gap-2 p-3 bg-white/90 border-t border-blue-100 overflow-x-auto">
                {allImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`h-14 w-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      activeImageIndex === idx
                        ? 'border-blue-600 ring-2 ring-blue-200'
                        : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${project.title} - ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Technical Specifications & Details */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between border-t lg:border-t-0 lg:border-r border-slate-100 bg-white">
            <div>
              <h2
                id="lightbox-project-title"
                className="text-xl sm:text-2xl font-extrabold leading-snug text-slate-900 mb-3"
              >
                {project.title}
              </h2>
              <p className="text-sm leading-relaxed text-slate-600 mb-6">
                {project.description}
              </p>

              {/* Specification List */}
              <div className="space-y-3.5 border-t border-slate-100 pt-5 text-sm">
                <div className="flex items-start gap-3">
                  <Building2 className="h-4 w-4 text-blue-600 shrink-0 mt-1" />
                  <div>
                    <div className="text-xs text-slate-500">العميل / الجهة</div>
                    <div className="font-bold text-slate-900">{project.clientName}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Layers className="h-4 w-4 text-blue-600 shrink-0 mt-1" />
                  <div>
                    <div className="text-xs text-slate-500">الخامات المعتمدة</div>
                    <div className="font-bold text-slate-900">{project.materials}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Sparkles className="h-4 w-4 text-blue-600 shrink-0 mt-1" />
                  <div>
                    <div className="text-xs text-slate-500">التشطيب والإضاءة</div>
                    <div className="font-bold text-slate-900">{project.finishing}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Ruler className="h-4 w-4 text-blue-600 shrink-0 mt-1" />
                  <div>
                    <div className="text-xs text-slate-500">المقاسات والأبعاد</div>
                    <div className="font-bold text-slate-900">{project.dimensions}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-blue-600 shrink-0 mt-1" />
                  <div>
                    <div className="text-xs text-slate-500">مدة التنفيذ والتسليم</div>
                    <div className="font-bold text-slate-900">{project.executionTime}</div>
                  </div>
                </div>
              </div>

              {/* Sub-projects / Branches List if Available */}
              {project.subProjects && project.subProjects.length > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="text-xs font-extrabold text-blue-900 mb-2">
                    الفروع والأجزاء المنفذة في هذا البند ({project.subProjects.length}):
                  </div>
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {project.subProjects.map((sub, sIdx) => (
                      <div
                        key={sub.id || sIdx}
                        className="rounded-xl border border-blue-100 bg-[#F8FBFF] p-2.5 text-xs"
                      >
                        <div className="font-bold text-slate-900 flex items-center justify-between">
                          <span>{sub.title}</span>
                          {sub.dimensions && (
                            <span className="font-mono text-[11px] text-blue-600">
                              {sub.dimensions}
                            </span>
                          )}
                        </div>
                        {sub.description && (
                          <div className="text-[11px] text-slate-600 mt-1">
                            {sub.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action CTA */}
            <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col gap-3">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shadow-md shadow-blue-600/20"
              >
                <MessageCircle className="h-4 w-4" />
                <span>اطلب تنفيذ عمل مماثل عبر واتساب</span>
              </a>
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                <span>معاينة مجانية للموقع وفرز ألوان معتمد قبل التشغيل</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
