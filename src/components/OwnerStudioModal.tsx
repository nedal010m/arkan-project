import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit3,
  Save,
  Cloud,
  LogIn,
  LogOut,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Phone,
  Layers,
  ImagePlus,
  Camera,
  KeyRound,
  Eye,
  EyeOff,
  Files,
  ArrowRight,
  ShieldCheck,
  Settings,
  Award,
  MapPin,
} from 'lucide-react';
import { AgencySettings, ProjectItem, ServiceCategory, SubProjectItem } from '../types/portfolio';
import {
  SERVICE_CATEGORIES,
  sanitizeId,
  validatePasscodeFormat,
  validateProjectPayload,
  validateSettingsPayload,
  verifyOwnerPasscode,
} from '../utils/portfolioLogic';
import { compressImageFile } from '../utils/imageStorage';
import { VISUAL_PRESETS } from '../data/seedPortfolio';
import { VisualPresetCanvas } from './VisualPresetCanvas';

interface OwnerStudioModalProps {
  isOpen: boolean;
  initialTab?: 'projects' | 'settings' | 'cloud' | 'security';
  initialCategory?: ServiceCategory;
  editingProjectInitial?: ProjectItem | null;
  projects: ProjectItem[];
  settings: AgencySettings;
  currentActivePasscode?: string;
  currentUserEmail: string | null;
  isCloudVerifiedOwner: boolean;
  cloudSyncStatus: 'synced' | 'local_only' | 'syncing' | 'error';
  onClose: () => void;
  onSaveProject: (project: ProjectItem, isNew: boolean) => Promise<void>;
  onBatchSaveProjects?: (newProjects: ProjectItem[]) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
  onSaveSettings: (newSettings: AgencySettings) => Promise<void>;
  onUpdatePasscode?: (newPasscode: string) => Promise<void>;
  onSyncAllToCloud: () => Promise<void>;
  onSignInGoogle: () => Promise<void>;
  onSignOutGoogle: () => Promise<void>;
}

const EMPTY_PROJECT_FORM: Omit<ProjectItem, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'> = {
  title: '',
  category: 'paper_prints',
  subCategory: 'كروت شخصية فاخرة',
  description: '',
  clientName: 'عميل مميز',
  dimensions: 'مقاس قياسي معتمد',
  materials: 'خامات أصلية فرز أول',
  finishing: 'تشطيب احترافي عالي الجودة',
  executionTime: '3 أيام عمل',
  imageUrl: '',
  galleryImages: [],
  subProjects: [],
  visualPreset: 'cards_gold_foil',
  featured: true,
  isPublic: true,
  displayOrder: 1,
};

interface BatchProjectDraft {
  tempId: string;
  title: string;
  clientName: string;
  subCategory: string;
  dimensions: string;
  materials: string;
  finishing: string;
  executionTime: string;
  description: string;
  imageUrl: string;
  galleryImages: string[];
}

export const OwnerStudioModal: React.FC<OwnerStudioModalProps> = ({
  isOpen,
  initialTab = 'projects',
  initialCategory,
  editingProjectInitial = null,
  projects,
  settings,
  currentActivePasscode = '109283',
  currentUserEmail,
  isCloudVerifiedOwner,
  cloudSyncStatus,
  onClose,
  onSaveProject,
  onBatchSaveProjects,
  onDeleteProject,
  onSaveSettings,
  onUpdatePasscode,
  onSyncAllToCloud,
  onSignInGoogle,
  onSignOutGoogle,
}) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'settings' | 'cloud' | 'security'>(
    initialTab
  );
  const [projectMode, setProjectMode] = useState<'single' | 'batch'>('single');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState(EMPTY_PROJECT_FORM);
  const [settingsForm, setSettingsForm] = useState<AgencySettings>(settings);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sub-projects inside current project
  const [subProjectsList, setSubProjectsList] = useState<SubProjectItem[]>([]);

  // Batch Multi-Project State for a Single Category
  const [batchCategory, setBatchCategory] = useState<ServiceCategory>(
    initialCategory || 'cladding'
  );
  const [batchDrafts, setBatchDrafts] = useState<BatchProjectDraft[]>([
    {
      tempId: 'draft_1',
      title: 'مشروع واجهة كلادينج 1',
      clientName: 'معرض أو شركة 1',
      subCategory: 'واجهات كلادينج ألومنيوم (ACP)',
      dimensions: 'ارتفاع 6 متر × عرض 14 متر',
      materials: 'ألواح ألومنيوم كلادينج 4 مم PVDF',
      finishing: 'تطعيم تكسيات وليد سامسونج مخفي',
      executionTime: '5 إلى 7 أيام',
      description: 'تنفيذ وتجلية واجهة المعرض بألواح الكلادينج المقاومة للشمس مع شاسيه حديد معالج ضد الصدأ.',
      imageUrl: '',
      galleryImages: [],
    },
    {
      tempId: 'draft_2',
      title: 'مشروع واجهة كلادينج 2',
      clientName: 'معرض أو شركة 2',
      subCategory: 'كلادينج تفريغ CNC مضيء',
      dimensions: 'ارتفاع 4 متر × عرض 10 متر',
      materials: 'كلادينج أسود مطفي مع شيتات ذهبي',
      finishing: 'تفريغ CNC دقيق وإضاءة داخلية',
      executionTime: '4 أيام عمل',
      description: 'تصميم وتنفيذ واجهة تجارية راقية مع تفريغ ليزر هندسي وإضاءة موفرة متوهجة ليلاً.',
      imageUrl: '',
      galleryImages: [],
    },
  ]);

  // Passcode Change State
  const [passOld, setPassOld] = useState('');
  const [passNew, setPassNew] = useState('');
  const [passConfirm, setPassConfirm] = useState('');
  const [showPassOld, setShowPassOld] = useState(false);
  const [showPassNew, setShowPassNew] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (initialCategory) {
      setBatchCategory(initialCategory);
      setProjectForm((prev) => ({
        ...prev,
        category: initialCategory,
      }));
    }
  }, [initialCategory]);

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  useEffect(() => {
    if (editingProjectInitial) {
      setActiveTab('projects');
      setProjectMode('single');
      setEditingId(editingProjectInitial.id);
      setProjectForm({
        title: editingProjectInitial.title,
        category: editingProjectInitial.category,
        subCategory: editingProjectInitial.subCategory,
        description: editingProjectInitial.description,
        clientName: editingProjectInitial.clientName,
        dimensions: editingProjectInitial.dimensions,
        materials: editingProjectInitial.materials,
        finishing: editingProjectInitial.finishing,
        executionTime: editingProjectInitial.executionTime,
        imageUrl: editingProjectInitial.imageUrl,
        galleryImages: editingProjectInitial.galleryImages || [],
        subProjects: editingProjectInitial.subProjects || [],
        visualPreset: editingProjectInitial.visualPreset,
        featured: editingProjectInitial.featured,
        isPublic: editingProjectInitial.isPublic,
        displayOrder: editingProjectInitial.displayOrder,
      });
      setSubProjectsList(editingProjectInitial.subProjects || []);
      setFormErrors([]);
    } else {
      setEditingId(null);
      setProjectForm({
        ...EMPTY_PROJECT_FORM,
        category: initialCategory || 'paper_prints',
        displayOrder: projects.length + 1,
      });
      setSubProjectsList([]);
    }
  }, [editingProjectInitial, isOpen, initialCategory]);

  if (!isOpen) return null;

  const selectableCategories = SERVICE_CATEGORIES.filter((c) => c.id !== 'all') as {
    id: ServiceCategory;
    label: string;
    shortLabel: string;
    subTypes: string[];
  }[];

  const currentCategoryMeta =
    selectableCategories.find((c) => c.id === projectForm.category) || selectableCategories[0];

  const currentBatchCategoryMeta =
    selectableCategories.find((c) => c.id === batchCategory) || selectableCategories[0];

  const startNewProject = (targetCategory?: ServiceCategory) => {
    setEditingId(null);
    const cat = targetCategory || projectForm.category;
    const catMeta = selectableCategories.find((c) => c.id === cat) || selectableCategories[0];
    setProjectForm({
      ...EMPTY_PROJECT_FORM,
      category: cat,
      subCategory: catMeta.subTypes[0] || 'كروت شخصية فاخرة',
      displayOrder: projects.length + 1,
    });
    setSubProjectsList([]);
    setFormErrors([]);
    setStatusBanner(null);
  };

  const selectProjectToEdit = (item: ProjectItem) => {
    setProjectMode('single');
    setEditingId(item.id);
    setProjectForm({
      title: item.title,
      category: item.category,
      subCategory: item.subCategory,
      description: item.description,
      clientName: item.clientName,
      dimensions: item.dimensions,
      materials: item.materials,
      finishing: item.finishing,
      executionTime: item.executionTime,
      imageUrl: item.imageUrl,
      galleryImages: item.galleryImages || [],
      subProjects: item.subProjects || [],
      visualPreset: item.visualPreset,
      featured: item.featured,
      isPublic: item.isPublic,
      displayOrder: item.displayOrder,
    });
    setSubProjectsList(item.subProjects || []);
    setFormErrors([]);
    setStatusBanner(null);
  };

  const processSelectedFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploadingImage(true);
    setFormErrors([]);
    try {
      const compressedList: string[] = [];
      const maxFiles = Math.min(files.length, 6);
      for (let i = 0; i < maxFiles; i++) {
        const dataUrl = await compressImageFile(files[i]);
        compressedList.push(dataUrl);
      }

      if (compressedList.length > 0) {
        setProjectForm((prev) => {
          const primary = prev.imageUrl || compressedList[0];
          const existingGallery = prev.galleryImages || [];
          const combined = Array.from(new Set([primary, ...existingGallery, ...compressedList])).slice(
            0,
            6
          );
          return {
            ...prev,
            imageUrl: combined[0] || '',
            galleryImages: combined,
            title:
              prev.title.trim().length > 0 ? prev.title : `تنفيذ ${prev.subCategory}`,
            description:
              prev.description.trim().length > 0
                ? prev.description
                : `تنفيذ احترافي في قسم ${prev.subCategory} بأعلى جودة طباعة وتشطيب.`,
          };
        });
        setStatusBanner(
          `تم إرفاق وضغط ${compressedList.length} صورة بنجاح! اضغط على "حفظ العمل" بالأسفل لاعتمادها في المعرض.`
        );
      }
    } catch (err) {
      setFormErrors([err instanceof Error ? err.message : 'تعذر رفع الصورة المختارة.']);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleProjectSubmit = async (e?: React.FormEvent, continueToNextInSameCategory = false) => {
    if (e) e.preventDefault();
    setFormErrors([]);
    setStatusBanner(null);

    const preparedForm = {
      ...projectForm,
      title: projectForm.title.trim() || `عمل ${projectForm.subCategory}`,
      description:
        projectForm.description.trim() ||
        `تنفيذ عالي الجودة في قسم ${projectForm.subCategory} مع ضمان الخامات المعتمدة.`,
      clientName: projectForm.clientName.trim() || 'عميل مميز',
      dimensions: projectForm.dimensions.trim() || 'مقاس قياسي معتمد',
      materials: projectForm.materials.trim() || 'خامات أصلية فرز أول',
      finishing: projectForm.finishing.trim() || 'تشطيب احترافي متكامل',
      executionTime: projectForm.executionTime.trim() || '3 إلى 5 أيام عمل',
      subProjects: subProjectsList,
    };

    const validation = validateProjectPayload(preparedForm);
    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const nowIso = new Date().toISOString();
      const currentCategory = preparedForm.category;
      if (editingId) {
        const updatedItem: ProjectItem = {
          ...preparedForm,
          id: editingId,
          ownerId: 'owner',
          createdAt:
            projects.find((p) => p.id === editingId)?.createdAt || nowIso,
          updatedAt: nowIso,
        };
        await onSaveProject(updatedItem, false);
      } else {
        const newId = sanitizeId(
          `proj_${preparedForm.category}_${Date.now().toString(36)}`
        );
        const newItem: ProjectItem = {
          ...preparedForm,
          id: newId,
          ownerId: 'owner',
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        await onSaveProject(newItem, true);
      }

      if (continueToNextInSameCategory) {
        // Keep category & finishing defaults, clear images & title for the next project
        setStatusBanner(
          `تم حفظ المشروع بنجاح! تم تجهيز النموذج لإضافة مشروع آخر في نفس البند (${currentCategoryMeta.shortLabel}).`
        );
        startNewProject(currentCategory);
      } else {
        setStatusBanner(
          editingId
            ? 'تم حفظ تعديلات وصور العمل بنجاح وتحديث المعرض السحابي!'
            : 'تمت إضافة العمل وصوره إلى سابقة الأعمال بنجاح!'
        );
        if (!editingId) {
          startNewProject();
        }
      }
    } catch (err) {
      setFormErrors([err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ العمل.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Batch Save all projects in this category
  const handleSaveBatchProjects = async () => {
    setFormErrors([]);
    setStatusBanner(null);
    setIsSubmitting(true);
    try {
      const nowIso = new Date().toISOString();
      let savedCount = 0;

      for (let i = 0; i < batchDrafts.length; i++) {
        const draft = batchDrafts[i];
        if (!draft.title.trim()) continue;

        const newId = sanitizeId(`proj_${batchCategory}_${Date.now().toString(36)}_${i}`);
        const newItem: ProjectItem = {
          id: newId,
          title: draft.title.trim(),
          category: batchCategory,
          subCategory: draft.subCategory || currentBatchCategoryMeta.subTypes[0] || 'تنفيذ احترافي',
          description: draft.description.trim() || `تنفيذ متميز في قسم ${batchCategory}`,
          clientName: draft.clientName.trim() || 'عميل معتمد',
          dimensions: draft.dimensions.trim() || 'حسب المقايسة المعتمدة',
          materials: draft.materials.trim() || 'خامات أصلية فرز أول',
          finishing: draft.finishing.trim() || 'تشطيب احترافي وضمان جودة',
          executionTime: draft.executionTime.trim() || '3 إلى 5 أيام عمل',
          imageUrl: draft.imageUrl || '',
          galleryImages: draft.galleryImages || (draft.imageUrl ? [draft.imageUrl] : []),
          visualPreset:
            batchCategory === 'cladding'
              ? 'cladding_acp_facade'
              : batchCategory === 'prominent_letters'
              ? 'letters_gold_stainless'
              : batchCategory === 'outdoor_prints'
              ? 'outdoor_banner_flex'
              : 'cards_gold_foil',
          featured: true,
          isPublic: true,
          displayOrder: projects.length + i + 1,
          ownerId: 'owner',
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        await onSaveProject(newItem, true);
        savedCount++;
      }

      setStatusBanner(
        `تمت إضافة وحفظ ${savedCount} مشاريع جديدة بنجاح في بند (${currentBatchCategoryMeta.shortLabel})!`
      );
      setProjectMode('single');
    } catch (err) {
      setFormErrors([err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ المشاريع.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);
    setStatusBanner(null);

    const validation = validateSettingsPayload(settingsForm);
    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveSettings({
        ...settingsForm,
        updatedAt: new Date().toISOString(),
      });
      setStatusBanner('تم حفظ كافة نصوص وبيانات الموقع وإحصائياته وتحديث السحاب بنجاح.');
    } catch (err) {
      setFormErrors([err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ الإعدادات.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);
    setStatusBanner(null);

    if (!verifyOwnerPasscode(passOld, currentActivePasscode)) {
      setFormErrors(['كلمة السر الحالية غير صحيحة.']);
      return;
    }

    const formatCheck = validatePasscodeFormat(passNew);
    if (!formatCheck.valid) {
      setFormErrors(formatCheck.errors);
      return;
    }

    if (passNew !== passConfirm) {
      setFormErrors(['كلمة السر الجديدة وتأكيدها غير متطابقين.']);
      return;
    }

    setIsSubmitting(true);
    try {
      if (onUpdatePasscode) {
        await onUpdatePasscode(passNew.trim());
      }
      setStatusBanner(`تم تغيير كلمة سر الإدارة بنجاح إلى: ${passNew.trim()}`);
      setPassOld('');
      setPassNew('');
      setPassConfirm('');
    } catch (err) {
      setFormErrors([err instanceof Error ? err.message : 'حدث خطأ أثناء تحديث كلمة السر.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentGallery =
    projectForm.galleryImages && projectForm.galleryImages.length > 0
      ? projectForm.galleryImages
      : projectForm.imageUrl
      ? [projectForm.imageUrl]
      : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-3 sm:p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="owner-studio-title"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl border-2 border-blue-100 bg-white text-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-blue-50 bg-gradient-to-l from-blue-50/90 to-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 id="owner-studio-title" className="text-base sm:text-lg font-extrabold text-slate-900">
                لوحة تحكم المالك · إدارة الأعمال والصور وتغيير كلمة السر
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                ارفع صور أعمالك، أضف عدة مشاريع في بند واحد (مثل الكلادينج)، وعيّن كلمة سر خاصة بك
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-700">
              {cloudSyncStatus === 'synced'
                ? 'متصل بالحفظ السحابي'
                : cloudSyncStatus === 'syncing'
                ? 'جاري الحفظ السحابي...'
                : 'الحفظ الفوري نشط'}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق لوحة التحكم"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:border-blue-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-blue-100 bg-white px-6 py-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('projects');
              setFormErrors([]);
              setStatusBanner(null);
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'projects'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span>إضافة وتعديل الأعمال والصور ({projects.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('security');
              setFormErrors([]);
              setStatusBanner(null);
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'security'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>تغيير كلمة السر (الأمان)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('settings');
              setFormErrors([]);
              setStatusBanner(null);
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            <span>تعديل كافة بيانات ونصوص الموقع</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('cloud');
              setFormErrors([]);
              setStatusBanner(null);
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'cloud'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cloud className="h-3.5 w-3.5" />
            <span>الحفظ السحابي</span>
          </button>
        </div>

        {/* Status / Error Alerts */}
        {(statusBanner || formErrors.length > 0) && (
          <div className="px-6 pt-4 bg-[#F8FBFF]">
            {statusBanner && (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{statusBanner}</span>
              </div>
            )}
            {formErrors.length > 0 && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800 space-y-1">
                {formErrors.map((err, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F8FBFF]">
          {/* TAB 1: PROJECTS & PHOTOS */}
          {activeTab === 'projects' && (
            <div>
              {/* Top Sub-Mode Bar: Single Project vs. Multi-Project Batch in 1 Category */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3 rounded-2xl bg-white border border-blue-100 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-700">طريقة الإضافة:</span>
                  <button
                    type="button"
                    onClick={() => setProjectMode('single')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      projectMode === 'single'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    مشروع واحد مع تفاصيله
                  </button>
                  <button
                    type="button"
                    onClick={() => setProjectMode('batch')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      projectMode === 'batch'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    <Files className="h-3.5 w-3.5" />
                    <span>إضافة عدة مشاريع في بند واحد (مثل الكلادينج)</span>
                  </button>
                </div>

                {projectMode === 'single' && (
                  <button
                    type="button"
                    onClick={() => startNewProject()}
                    className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-2xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>عمل جديد</span>
                  </button>
                )}
              </div>

              {/* MODE 1: SINGLE PROJECT FORM */}
              {projectMode === 'single' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Right Column in RTL: Existing Projects List */}
                  <div className="lg:col-span-5 flex flex-col rounded-3xl border-2 border-blue-100 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-blue-50">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">
                          الأعمال الحالية ({projects.length})
                        </h3>
                        <p className="text-[11px] text-slate-500">اضغط لتعديل أي عمل أو صوره</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => startNewProject()}
                        className="inline-flex items-center gap-1 rounded-xl bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>جديد</span>
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
                      {projects.map((item) => {
                        const isEditingThis = editingId === item.id;
                        return (
                          <div
                            key={item.id}
                            className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
                              isEditingThis
                                ? 'border-blue-600 bg-blue-50/80 shadow-xs'
                                : 'border-slate-200 bg-slate-50/50 hover:border-blue-300'
                            }`}
                          >
                            <div
                              onClick={() => selectProjectToEdit(item)}
                              className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                            >
                              <div className="h-12 w-16 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                                <VisualPresetCanvas
                                  preset={item.visualPreset}
                                  imageUrl={item.imageUrl}
                                  title={item.title}
                                  className="w-full h-full"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-bold text-slate-900 truncate">
                                  {item.title}
                                </h4>
                                <div className="text-[11px] text-blue-600 truncate mt-0.5 font-medium">
                                  {item.subCategory}
                                  {item.subProjects && item.subProjects.length > 0 && (
                                    <span className="text-slate-500 mr-1.5 font-normal">
                                      ({item.subProjects.length} فروع/أجزاء)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => selectProjectToEdit(item)}
                                aria-label="تعديل هذا العمل"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:border-blue-600"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`هل أنت متأكد من حذف العمل "${item.title}"؟`)) {
                                    onDeleteProject(item.id);
                                    if (editingId === item.id) startNewProject();
                                  }
                                }}
                                aria-label="حذف هذا العمل"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-red-600 hover:border-red-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Left Column in RTL: Single Project Form */}
                  <div className="lg:col-span-7 rounded-3xl border-2 border-blue-100 bg-white p-6 shadow-sm">
                    <form onSubmit={(e) => handleProjectSubmit(e, false)} className="space-y-5">
                      <div className="flex items-center justify-between pb-3 border-b border-blue-50">
                        <h3 className="text-base font-extrabold text-slate-900">
                          {editingId ? 'تعديل بيانات وصور العمل' : 'إضافة عمل جديد إلى المعرض'}
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleProjectSubmit(undefined, true)}
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-blue-600 bg-blue-50 px-3.5 py-2 text-xs font-extrabold text-blue-700 hover:bg-blue-600 hover:text-white transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>حفظ وإضافة مشروع آخر لنفس البند</span>
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-blue-700 shadow-sm transition-colors"
                          >
                            <Save className="h-3.5 w-3.5" />
                            <span>{isSubmitting ? 'جاري الحفظ...' : 'حفظ العمل'}</span>
                          </button>
                        </div>
                      </div>

                      {/* STEP 1: Multi-Photo Uploader at the Top */}
                      <div className="rounded-2xl border-2 border-dashed border-blue-300 bg-gradient-to-l from-blue-50/70 to-white p-5">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm shrink-0">
                              <ImagePlus className="h-6 w-6" />
                            </div>
                            <div>
                              <div className="text-sm font-extrabold text-slate-900">
                                1. ارفع صور العمل من جهازك أو هاتفك
                              </div>
                              <div className="text-xs text-slate-600">
                                يمكنك اختيار صورة واحدة أو عدة صور معاً (يتم ضغطها وحفظها تلقائياً بأعلى جودة)
                              </div>
                            </div>
                          </div>

                          <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white hover:bg-blue-700 transition-colors shadow-sm shrink-0">
                            <Upload className="h-4 w-4" />
                            <span>{isUploadingImage ? 'جاري ضغط الصور...' : 'اختر صور من جهازك'}</span>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              disabled={isUploadingImage}
                              onChange={(e) => processSelectedFiles(e.target.files)}
                            />
                          </label>
                        </div>

                        {/* Gallery Thumbnails */}
                        {currentGallery.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-blue-100">
                            <div className="text-xs font-bold text-slate-700 mb-2">
                              صور العمل المرفقة ({currentGallery.length} صور) - اضغط لتحديد الصورة الرئيسية:
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              {currentGallery.map((imgUrl, idx) => (
                                <div
                                  key={idx}
                                  onClick={() =>
                                    setProjectForm((prev) => ({
                                      ...prev,
                                      imageUrl: imgUrl,
                                    }))
                                  }
                                  className={`group relative h-20 w-24 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                                    projectForm.imageUrl === imgUrl
                                      ? 'border-blue-600 ring-2 ring-blue-300'
                                      : 'border-slate-200 hover:border-blue-400'
                                  }`}
                                >
                                  <img
                                    src={imgUrl}
                                    alt="معاينة"
                                    className="w-full h-full object-cover"
                                  />
                                  {projectForm.imageUrl === imgUrl && (
                                    <span className="absolute top-1 right-1 rounded-md bg-blue-600 px-1 text-[9px] font-bold text-white">
                                      رئيسية
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const filtered = currentGallery.filter((_, i) => i !== idx);
                                      setProjectForm((prev) => ({
                                        ...prev,
                                        imageUrl: filtered[0] || '',
                                        galleryImages: filtered,
                                      }));
                                    }}
                                    className="absolute bottom-1 left-1 opacity-0 group-hover:opacity-100 rounded bg-red-600 p-1 text-white transition-opacity"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Main Fields */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          عنوان العمل *
                        </label>
                        <input
                          type="text"
                          value={projectForm.title}
                          onChange={(e) =>
                            setProjectForm((prev) => ({ ...prev, title: e.target.value }))
                          }
                          placeholder="مثال: تنفيذ واجهة كلادينج وحروف بارزة لمطعم وكافيه..."
                          className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            القسم الرئيسي *
                          </label>
                          <select
                            value={projectForm.category}
                            onChange={(e) => {
                              const newCat = e.target.value as ServiceCategory;
                              const newMeta =
                                selectableCategories.find((c) => c.id === newCat) ||
                                selectableCategories[0];
                              setProjectForm((prev) => ({
                                ...prev,
                                category: newCat,
                                subCategory: newMeta.subTypes[0] || '',
                              }));
                            }}
                            className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                          >
                            {selectableCategories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.shortLabel} ({c.label})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            التصنيف الفرعي *
                          </label>
                          <input
                            type="text"
                            list="subTypesList"
                            value={projectForm.subCategory}
                            onChange={(e) =>
                              setProjectForm((prev) => ({ ...prev, subCategory: e.target.value }))
                            }
                            className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                          />
                          <datalist id="subTypesList">
                            {currentCategoryMeta.subTypes.map((s) => (
                              <option key={s} value={s} />
                            ))}
                          </datalist>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            اسم العميل أو المشروع
                          </label>
                          <input
                            type="text"
                            value={projectForm.clientName}
                            onChange={(e) =>
                              setProjectForm((prev) => ({ ...prev, clientName: e.target.value }))
                            }
                            className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            المقاسات أو الكمية
                          </label>
                          <input
                            type="text"
                            value={projectForm.dimensions}
                            onChange={(e) =>
                              setProjectForm((prev) => ({ ...prev, dimensions: e.target.value }))
                            }
                            className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            الخامات المستخدمة
                          </label>
                          <input
                            type="text"
                            value={projectForm.materials}
                            onChange={(e) =>
                              setProjectForm((prev) => ({ ...prev, materials: e.target.value }))
                            }
                            className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            التشطيب والإضاءة
                          </label>
                          <input
                            type="text"
                            value={projectForm.finishing}
                            onChange={(e) =>
                              setProjectForm((prev) => ({ ...prev, finishing: e.target.value }))
                            }
                            className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          وصف وتفاصيل العمل
                        </label>
                        <textarea
                          rows={2}
                          value={projectForm.description}
                          onChange={(e) =>
                            setProjectForm((prev) => ({ ...prev, description: e.target.value }))
                          }
                          placeholder="اشرح تفاصيل التنفيذ والخامات لكي يراها العميل عند فتح بطاقة العمل..."
                          className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                        />
                      </div>

                      {/* Sub-Projects / Multiple Branches Section inside this item */}
                      <div className="rounded-2xl border border-blue-100 bg-[#F5F9FF] p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-extrabold text-blue-900">
                              مشاريع فرعية أو فروع تابعة لهذا العقد/البند (اختياري)
                            </div>
                            <div className="text-[11px] text-slate-500">
                              مثلاً: واجهة المعرض الرئيسي، بوابة المستودع، مدخل الإدارة...
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newSub: SubProjectItem = {
                                id: `sub_${Date.now()}`,
                                title: `فرع / جزء ${subProjectsList.length + 1}`,
                                dimensions: 'حسب المقايسة',
                                materials: projectForm.materials || 'كلادينج فرز أول',
                                description: 'تنفيذ مطابق للمواصفات',
                              };
                              setSubProjectsList((prev) => [...prev, newSub]);
                            }}
                            className="inline-flex items-center gap-1 rounded-xl bg-white border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-600 hover:text-white transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                            <span>إضافة فرع / جزء فرعي</span>
                          </button>
                        </div>

                        {subProjectsList.map((sub, sIdx) => (
                          <div
                            key={sub.id}
                            className="rounded-xl border border-blue-200 bg-white p-3 space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-blue-800">
                                جزء فرعي #{sIdx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setSubProjectsList((prev) => prev.filter((_, i) => i !== sIdx))
                                }
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={sub.title}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSubProjectsList((prev) =>
                                    prev.map((item, i) =>
                                      i === sIdx ? { ...item, title: val } : item
                                    )
                                  );
                                }}
                                placeholder="اسم الفرع أو الجزء (مثال: واجهة المعرض الشمالية)"
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
                              />
                              <input
                                type="text"
                                value={sub.dimensions || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSubProjectsList((prev) =>
                                    prev.map((item, i) =>
                                      i === sIdx ? { ...item, dimensions: val } : item
                                    )
                                  );
                                }}
                                placeholder="المقاسات (مثال: 5م × 8م)"
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Bottom Submit Buttons */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-blue-50">
                        <button
                          type="button"
                          onClick={() => handleProjectSubmit(undefined, true)}
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-blue-600 bg-blue-50 px-5 py-3 text-xs sm:text-sm font-extrabold text-blue-700 hover:bg-blue-600 hover:text-white transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          <span>حفظ وإضافة مشروع آخر لنفس البند ({currentCategoryMeta.shortLabel})</span>
                        </button>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-xs sm:text-sm font-extrabold text-white hover:bg-blue-700 shadow-md transition-colors"
                        >
                          <Save className="h-4 w-4" />
                          <span>{isSubmitting ? 'جاري الحفظ...' : 'حفظ العمل وإنهاء'}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* MODE 2: BATCH MULTI-PROJECT ADD IN 1 CATEGORY */}
              {projectMode === 'batch' && (
                <div className="rounded-3xl border-2 border-blue-100 bg-white p-6 shadow-sm space-y-6">
                  {/* Category Picker */}
                  <div className="rounded-2xl border border-blue-100 bg-gradient-to-l from-blue-50 to-white p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-extrabold text-slate-900">
                          اختر البند المطلوب إضافة عدة مشاريع فيه:
                        </div>
                        <div className="text-xs text-slate-600">
                          يمكنك إضافة تفاصيل وصور كذا مشروع تحت هذا البند (مثل الكلادينج أو المطبوعات) وحفظها دفعة واحدة.
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {selectableCategories.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setBatchCategory(c.id);
                              // update draft defaults
                              setBatchDrafts((prev) =>
                                prev.map((d, i) => ({
                                  ...d,
                                  title: `مشروع ${c.shortLabel} ${i + 1}`,
                                  subCategory: c.subTypes[0] || c.shortLabel,
                                }))
                              );
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-colors ${
                              batchCategory === c.id
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-400'
                            }`}
                          >
                            {c.shortLabel}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* List of projects in this batch */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-slate-900">
                        مشاريع بند ({currentBatchCategoryMeta.shortLabel}) المجهزة للحفظ ({batchDrafts.length}):
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          const nextNum = batchDrafts.length + 1;
                          setBatchDrafts((prev) => [
                            ...prev,
                            {
                              tempId: `draft_${Date.now()}_${nextNum}`,
                              title: `مشروع ${currentBatchCategoryMeta.shortLabel} ${nextNum}`,
                              clientName: `عميل ${nextNum}`,
                              subCategory: currentBatchCategoryMeta.subTypes[0] || 'تنفيذ معتمد',
                              dimensions: 'مقاس قياسي',
                              materials: 'خامات أصلية فرز أول',
                              finishing: 'تشطيب احترافي',
                              executionTime: '3 إلى 5 أيام',
                              description: `تنفيذ متميز لمشروع ${currentBatchCategoryMeta.shortLabel} بأعلى دقة.`,
                              imageUrl: '',
                              galleryImages: [],
                            },
                          ]);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 px-3.5 py-1.5 text-xs font-extrabold text-blue-700 hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>+ إضافة مشروع آخر لهذا البند</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {batchDrafts.map((draft, idx) => (
                        <div
                          key={draft.tempId}
                          className="rounded-2xl border-2 border-blue-100 bg-[#F8FBFF] p-5 space-y-3 relative group"
                        >
                          <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                            <span className="text-xs font-extrabold text-blue-700">
                              مشروع رقم {idx + 1} في ({currentBatchCategoryMeta.shortLabel})
                            </span>
                            {batchDrafts.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setBatchDrafts((prev) => prev.filter((_, i) => i !== idx))
                                }
                                className="text-slate-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              عنوان المشروع *
                            </label>
                            <input
                              type="text"
                              value={draft.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBatchDrafts((prev) =>
                                  prev.map((d, i) => (i === idx ? { ...d, title: val } : d))
                                );
                              }}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                العميل / الجهة
                              </label>
                              <input
                                type="text"
                                value={draft.clientName}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBatchDrafts((prev) =>
                                    prev.map((d, i) => (i === idx ? { ...d, clientName: val } : d))
                                  );
                                }}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                الأبعاد / المقاسات
                              </label>
                              <input
                                type="text"
                                value={draft.dimensions}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBatchDrafts((prev) =>
                                    prev.map((d, i) => (i === idx ? { ...d, dimensions: val } : d))
                                  );
                                }}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                الخامات
                              </label>
                              <input
                                type="text"
                                value={draft.materials}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBatchDrafts((prev) =>
                                    prev.map((d, i) => (i === idx ? { ...d, materials: val } : d))
                                  );
                                }}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                مدة التنفيذ
                              </label>
                              <input
                                type="text"
                                value={draft.executionTime}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBatchDrafts((prev) =>
                                    prev.map((d, i) => (i === idx ? { ...d, executionTime: val } : d))
                                  );
                                }}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
                              />
                            </div>
                          </div>

                          {/* Photo Uploader for this project draft */}
                          <div className="pt-1">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              صورة هذا المشروع
                            </label>
                            <div className="flex items-center gap-3">
                              {draft.imageUrl ? (
                                <div className="h-14 w-20 rounded-xl overflow-hidden border border-blue-300 relative shrink-0">
                                  <img
                                    src={draft.imageUrl}
                                    alt="معاينة"
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setBatchDrafts((prev) =>
                                        prev.map((d, i) => (i === idx ? { ...d, imageUrl: '' } : d))
                                      )
                                    }
                                    className="absolute inset-0 bg-red-600/70 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 transition-colors">
                                  <Upload className="h-3.5 w-3.5" />
                                  <span>رفع صورة للمشروع</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const compressed = await compressImageFile(file);
                                        setBatchDrafts((prev) =>
                                          prev.map((d, i) =>
                                            i === idx
                                              ? {
                                                  ...d,
                                                  imageUrl: compressed,
                                                  galleryImages: [compressed],
                                                }
                                              : d
                                          )
                                        );
                                      }
                                    }}
                                  />
                                </label>
                              )}
                              <span className="text-[10px] text-slate-500">
                                {draft.imageUrl ? 'تم إرفاق الصورة' : 'اختياري (يمكن إضافتها لاحقاً)'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Big Batch Save Button */}
                    <div className="pt-4 flex items-center justify-between border-t border-blue-50">
                      <button
                        type="button"
                        onClick={() => {
                          const nextNum = batchDrafts.length + 1;
                          setBatchDrafts((prev) => [
                            ...prev,
                            {
                              tempId: `draft_${Date.now()}_${nextNum}`,
                              title: `مشروع ${currentBatchCategoryMeta.shortLabel} ${nextNum}`,
                              clientName: `عميل ${nextNum}`,
                              subCategory: currentBatchCategoryMeta.subTypes[0] || 'تنفيذ معتمد',
                              dimensions: 'مقاس قياسي',
                              materials: 'خامات أصلية فرز أول',
                              finishing: 'تشطيب احترافي',
                              executionTime: '3 إلى 5 أيام',
                              description: `تنفيذ متميز لمشروع ${currentBatchCategoryMeta.shortLabel} بأعلى دقة.`,
                              imageUrl: '',
                              galleryImages: [],
                            },
                          ]);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-blue-200 bg-white px-5 py-3 text-xs sm:text-sm font-extrabold text-blue-700 hover:border-blue-600 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>+ إضافة مشروع آخر للبند</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveBatchProjects}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-xs sm:text-sm font-extrabold text-white hover:bg-blue-700 shadow-md transition-colors"
                      >
                        <Save className="h-4 w-4" />
                        <span>
                          {isSubmitting
                            ? 'جاري حفظ المشاريع...'
                            : `حفظ جميع مشاريع بند (${currentBatchCategoryMeta.shortLabel}) دفعة واحدة`}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SECURITY & PASSCODE */}
          {activeTab === 'security' && (
            <div className="max-w-2xl mx-auto rounded-3xl border-2 border-blue-100 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 border-b border-blue-50 pb-4 mb-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                    تغيير كلمة سر الإدارة والتعديل
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    خصّص كلمة السر الخاصة بك للدخول إلى لوحة التحكم وإضافة وتعديل الأعمال
                  </p>
                </div>
              </div>

              <form onSubmit={handleChangePasscodeSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    كلمة السر الحالية *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassOld ? 'text' : 'password'}
                      required
                      value={passOld}
                      onChange={(e) => setPassOld(e.target.value)}
                      placeholder="كلمة السر الحالية (الافتراضية: 109283)"
                      className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 pr-4 pl-11 py-3 text-sm text-right font-mono text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassOld(!showPassOld)}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    كلمة السر الجديدة (4 خانات على الأقل) *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassNew ? 'text' : 'password'}
                      required
                      value={passNew}
                      onChange={(e) => setPassNew(e.target.value)}
                      placeholder="كلمة السر الجديدة التي تفضلها"
                      className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 pr-4 pl-11 py-3 text-sm text-right font-mono text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassNew(!showPassNew)}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    تأكيد كلمة السر الجديدة *
                  </label>
                  <input
                    type={showPassNew ? 'text' : 'password'}
                    required
                    value={passConfirm}
                    onChange={(e) => setPassConfirm(e.target.value)}
                    placeholder="أعد كتابة كلمة السر الجديدة للتأكيد"
                    className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 pr-4 pl-4 py-3 text-sm text-right font-mono text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="rounded-2xl bg-blue-50/80 p-4 border border-blue-200 flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-900 leading-relaxed font-medium">
                    كلمة السر الحالية المعتمدة هي:{' '}
                    <strong className="font-mono text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                      {currentActivePasscode}
                    </strong>
                    . بمجرد تغييرها، ستصبح كلمتك الجديدة هي الوحيدة التي تفتح لوحة الإضافة والتعديل.
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-2xl bg-blue-600 px-6 py-3 text-xs sm:text-sm font-extrabold text-white hover:bg-blue-700 shadow-md transition-colors"
                  >
                    {isSubmitting ? 'جاري الحفظ...' : 'حفظ كلمة السر الجديدة'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: SETTINGS & ALL WEBSITE DATA */}
          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto rounded-3xl border-2 border-blue-100 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <form onSubmit={handleSettingsSubmit} className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 pb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                      تعديل كافة بيانات ونصوص الموقع بالكامل
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      يمكنك هنا تعديل اسم المعرض، نصوص الواجهة الرئيسية، أرقام الإحصائيات، بيانات وقنوات التواصل
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-2.5 text-xs sm:text-sm font-extrabold text-white hover:bg-blue-700 shadow-md transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isSubmitting ? 'جاري الحفظ...' : 'حفظ كافة التعديلات'}</span>
                  </button>
                </div>

                {/* Section 1: Hero & Branding */}
                <div className="rounded-2xl border border-blue-100 bg-[#F8FBFF] p-5 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-blue-900 pb-2 border-b border-blue-100">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <span>1. هوية المؤسسة ونصوص الواجهة الرئيسية (Hero Section)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        اسم المؤسسة / الاستوديو *
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsForm.studioName}
                        onChange={(e) =>
                          setSettingsForm((prev) => ({ ...prev, studioName: e.target.value }))
                        }
                        placeholder="أركان للدعاية والإعلان والواجهات المعمارية"
                        className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        الشعار اللفظي (Tagline) *
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsForm.tagline}
                        onChange={(e) =>
                          setSettingsForm((prev) => ({ ...prev, tagline: e.target.value }))
                        }
                        placeholder="هندسة الواجهات المعمارية · الحروف البارزة · المطبوعات"
                        className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      العنوان الرئيسي الكبير في الواجهة (Hero Headline) *
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsForm.heroHeadline}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({ ...prev, heroHeadline: e.target.value }))
                      }
                      placeholder="نصنع واجهة علامتك التجارية وهويتك المطبوعة بدقة هندسية تخطف الأنظار"
                      className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 font-bold focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      النص التعريفي التفصيلي أسفل العنوان (Hero Subheadline) *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={settingsForm.heroSubheadline}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({ ...prev, heroSubheadline: e.target.value }))
                      }
                      placeholder="من الكروت الشخصية الفاخرة والمنيوهات والدفاتر، إلى مطبوعات البانر والفينيل والسي ثرو، وصولاً إلى تشطيبات واجهات الكلادينج والحروف البارزة المضيئة بأجود الخامات المعتمدة."
                      className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 leading-relaxed focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Section 2: Numbers & Metrics */}
                <div className="rounded-2xl border border-blue-100 bg-[#F8FBFF] p-5 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-blue-900 pb-2 border-b border-blue-100">
                    <Award className="h-4 w-4 text-blue-600" />
                    <span>2. أرقام وإحصائيات النجاح المعروضة في الواجهة</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        عدد المشاريع المنفذة *
                      </label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={settingsForm.completedProjectsCount}
                        onChange={(e) =>
                          setSettingsForm((prev) => ({
                            ...prev,
                            completedProjectsCount: Number(e.target.value) || 0,
                          }))
                        }
                        className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                      <span className="text-[11px] text-slate-500 mt-1 block">يظهر في الواجهة: +{settingsForm.completedProjectsCount}</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        عدد العملاء والشركات *
                      </label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={settingsForm.satisfiedClientsCount}
                        onChange={(e) =>
                          setSettingsForm((prev) => ({
                            ...prev,
                            satisfiedClientsCount: Number(e.target.value) || 0,
                          }))
                        }
                        className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                      <span className="text-[11px] text-slate-500 mt-1 block">يظهر في الواجهة: +{settingsForm.satisfiedClientsCount}</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        سنوات الخبرة *
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        required
                        value={settingsForm.yearsExperience}
                        onChange={(e) =>
                          setSettingsForm((prev) => ({
                            ...prev,
                            yearsExperience: Number(e.target.value) || 0,
                          }))
                        }
                        className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                      <span className="text-[11px] text-slate-500 mt-1 block">يظهر في الواجهة: {settingsForm.yearsExperience} عاماً</span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Contact & Social Channels */}
                <div className="rounded-2xl border border-blue-100 bg-[#F8FBFF] p-5 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-blue-900 pb-2 border-b border-blue-100">
                    <Phone className="h-4 w-4 text-blue-600" />
                    <span>3. أرقام وقنوات التواصل والمراسلة الفورية</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        رقم الواتساب المعتمد (مع كود الدولة) *
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        required
                        value={settingsForm.whatsappNumber}
                        onChange={(e) =>
                          setSettingsForm((prev) => ({ ...prev, whatsappNumber: e.target.value }))
                        }
                        placeholder="201012345678"
                        className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        الهاتف المباشر للاتصال *
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        required
                        value={settingsForm.contactNumber}
                        onChange={(e) =>
                          setSettingsForm((prev) => ({ ...prev, contactNumber: e.target.value }))
                        }
                        placeholder="01012345678"
                        className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        رابط صفحة فيسبوك
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={settingsForm.facebookUrl}
                        onChange={(e) =>
                          setSettingsForm((prev) => ({ ...prev, facebookUrl: e.target.value }))
                        }
                        placeholder="facebook.com/yourpage"
                        className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        رابط حساب انستجرام
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={settingsForm.instagramUrl}
                        onChange={(e) =>
                          setSettingsForm((prev) => ({ ...prev, instagramUrl: e.target.value }))
                        }
                        placeholder="instagram.com/yourhandle"
                        className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        معرف أو رابط تليجرام
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={settingsForm.telegramUrl}
                        onChange={(e) =>
                          setSettingsForm((prev) => ({ ...prev, telegramUrl: e.target.value }))
                        }
                        placeholder="t.me/yourusername"
                        className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Location & Hours */}
                <div className="rounded-2xl border border-blue-100 bg-[#F8FBFF] p-5 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-blue-900 pb-2 border-b border-blue-100">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span>4. المقر الجغرافي ومواعيد العمل الرسمية</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        العنوان والمقر بالتفصيل *
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsForm.locationText}
                        onChange={(e) =>
                          setSettingsForm((prev) => ({ ...prev, locationText: e.target.value }))
                        }
                        placeholder="القاهرة · مصر الجديدة · شارع الأهرام الرئيسي"
                        className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        مواعيد وأيام العمل الرسمية *
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsForm.workingHours}
                        onChange={(e) =>
                          setSettingsForm((prev) => ({ ...prev, workingHours: e.target.value }))
                        }
                        placeholder="السبت إلى الخميس: 9:00 ص - 10:00 م (الجمعة عطلة)"
                        className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2 flex items-center justify-between border-t border-blue-100">
                  <span className="text-xs text-slate-500">
                    يتم حفظ هذه البيانات تلقائياً سحابياً ومحلياً على جهازك
                  </span>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-7 py-3 text-xs sm:text-sm font-extrabold text-white hover:bg-blue-700 shadow-md transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isSubmitting ? 'جاري الحفظ...' : 'حفظ كافة بيانات ونصوص الموقع'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: CLOUD SYNC */}
          {activeTab === 'cloud' && (
            <div className="max-w-2xl mx-auto rounded-3xl border-2 border-blue-100 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-blue-50 pb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
                  <Cloud className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                    الحفظ السحابي التلقائي
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    يتم حفظ كافة الأعمال والصور وإعدادات المعرض في قاعدة بيانات Firestore السحابية فور إدخال كلمة السر.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800">حالة المزامنة السحابية:</span>
                  <span className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-bold text-white">
                    {cloudSyncStatus === 'synced' ? 'متصل ومحفوظ سحابياً' : 'مفعل وجاهز'}
                  </span>
                </div>
                <div className="text-xs text-slate-600 leading-relaxed">
                  عدد المشاريع المخزنة في المعرض: <strong>{projects.length} أعمال</strong>.
                  <br />
                  الحفظ يعمل تلقائياً بكلمة السر <strong>{currentActivePasscode}</strong>، وتخزن الصور عالية الدقة في ذاكرة IndexedDB السريعة والسحابة في نفس الوقت.
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={onSyncAllToCloud}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-xs sm:text-sm font-extrabold text-white hover:bg-blue-700 shadow-md transition-colors"
                >
                  <Cloud className="h-4 w-4" />
                  <span>مزامنة كافة الأعمال مع السحابة الآن</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
