import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MessageCircle,
  Phone,
  Send,
  Search,
  SlidersHorizontal,
  Share2,
  Settings,
  Lock,
  Unlock,
  Plus,
  ArrowUpLeft,
  MapPin,
  Clock,
  Layers,
  Award,
  Printer,
  Maximize2,
  Edit3,
  Camera,
  ImagePlus,
  CheckCircle2,
  KeyRound,
  Files,
} from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  OWNER_EMAIL,
  signInAsOwner,
  signOutOwner,
} from './firebase';
import { AgencySettings, ProjectFilterState, ProjectItem, ServiceCategory } from './types/portfolio';
import { INITIAL_PROJECTS, INITIAL_SETTINGS } from './data/seedPortfolio';
import {
  OWNER_PASSCODE,
  SERVICE_CATEGORIES,
  countProjectsByCategory,
  filterAndSortProjects,
  formatSocialUrl,
  formatTelegramUrl,
  formatWhatsAppUrl,
} from './utils/portfolioLogic';
import {
  compressImageFile,
  loadProjectsFromIndexedDB,
  saveProjectsToIndexedDB,
} from './utils/imageStorage';
import { VisualPresetCanvas } from './components/VisualPresetCanvas';
import {
  CategoryStickerIllustration,
  Sticker3DLetters,
  StickerCladdingShield,
  StickerCmykPalette,
  StickerOutdoorRoll,
} from './components/PrintStickersAndIcons';
import { ProjectLightboxModal } from './components/ProjectLightboxModal';
import { SpecificationEstimatorSection } from './components/SpecificationEstimatorSection';
import { OwnerStudioModal } from './components/OwnerStudioModal';
import { ClientShareModal } from './components/ClientShareModal';
import { PasscodeModal } from './components/PasscodeModal';
import { ChangePasscodeModal } from './components/ChangePasscodeModal';

const LOCAL_PROJECTS_KEY = 'arkan_portfolio_projects_v2';
const LOCAL_SETTINGS_KEY = 'arkan_portfolio_settings_v2';
const LOCAL_PASSCODE_KEY = 'arkan_owner_passcode';

export default function App() {
  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_PROJECTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore local storage error
    }
    return INITIAL_PROJECTS;
  });

  const [settings, setSettings] = useState<AgencySettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.studioName) return parsed;
      }
    } catch {
      // ignore local storage error
    }
    return INITIAL_SETTINGS;
  });

  const [activePasscode, setActivePasscode] = useState<string>(() => {
    try {
      return localStorage.getItem(LOCAL_PASSCODE_KEY) || OWNER_PASSCODE;
    } catch {
      return OWNER_PASSCODE;
    }
  });

  const [filter, setFilter] = useState<ProjectFilterState>({
    category: 'all',
    subCategory: 'all',
    searchQuery: '',
    onlyFeatured: false,
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<
    'synced' | 'local_only' | 'syncing' | 'error'
  >('synced');

  // Owner Passcode Protection State
  const [isOwnerUnlocked, setIsOwnerUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('arkan_owner_unlocked') === 'true';
    } catch {
      return false;
    }
  });
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState<boolean>(false);
  const [isChangePasscodeModalOpen, setIsChangePasscodeModalOpen] = useState<boolean>(false);
  const [pendingActionAfterUnlock, setPendingActionAfterUnlock] = useState<
    (() => void) | null
  >(null);

  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [isStudioOpen, setIsStudioOpen] = useState<boolean>(false);
  const [studioInitialTab, setStudioInitialTab] = useState<
    'projects' | 'settings' | 'cloud' | 'security'
  >('projects');
  const [studioInitialCategory, setStudioInitialCategory] = useState<ServiceCategory | undefined>(
    undefined
  );
  const [editingProjectInStudio, setEditingProjectInStudio] = useState<ProjectItem | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [quickUploadToast, setQuickUploadToast] = useState<string | null>(null);

  // Hidden file input for 1-click photo replacement directly on any project card
  const cardQuickFileInputRef = useRef<HTMLInputElement | null>(null);
  const [quickUploadTargetProject, setQuickUploadTargetProject] = useState<ProjectItem | null>(
    null
  );

  const isCloudVerifiedOwner = Boolean(
    isOwnerUnlocked ||
      (currentUser &&
        currentUser.emailVerified &&
        currentUser.email?.toLowerCase() === OWNER_EMAIL.toLowerCase())
  );

  // Load high-capacity IndexedDB projects on mount
  useEffect(() => {
    loadProjectsFromIndexedDB().then((idbProjects) => {
      if (idbProjects && idbProjects.length > 0) {
        setProjects(idbProjects);
      }
    });
  }, []);

  // Track Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore listener for public projects and settings
  useEffect(() => {
    const projectsQuery = query(collection(db, 'projects'), where('isPublic', '==', true));
    const unsubProjects = onSnapshot(
      projectsQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded: ProjectItem[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              title: String(data.title || ''),
              category: (data.category as ServiceCategory) || 'paper_prints',
              subCategory: String(data.subCategory || ''),
              description: String(data.description || ''),
              clientName: String(data.clientName || ''),
              dimensions: String(data.dimensions || ''),
              materials: String(data.materials || ''),
              finishing: String(data.finishing || ''),
              executionTime: String(data.executionTime || ''),
              imageUrl: String(data.imageUrl || ''),
              galleryImages: Array.isArray(data.galleryImages)
                ? data.galleryImages.map(String)
                : data.imageUrl
                  ? [String(data.imageUrl)]
                  : [],
              subProjects: Array.isArray(data.subProjects) ? data.subProjects : [],
              visualPreset: String(data.visualPreset || 'cards_gold_foil'),
              featured: Boolean(data.featured),
              isPublic: data.isPublic !== false,
              displayOrder: Number(data.displayOrder || 1),
              ownerId: String(data.ownerId || 'owner'),
              createdAt:
                data.createdAt?.toDate?.()?.toISOString?.() ||
                String(data.createdAt || new Date().toISOString()),
              updatedAt:
                data.updatedAt?.toDate?.()?.toISOString?.() ||
                String(data.updatedAt || new Date().toISOString()),
            };
          });
          setProjects(loaded);
          saveProjectsToIndexedDB(loaded);
          try {
            localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(loaded));
          } catch {
            // IndexedDB handles large image payloads
          }
          setCloudSyncStatus('synced');
        }
      },
      () => {
        // Keep local / seed projects if cloud collection is empty or offline
      }
    );

    getDoc(doc(db, 'settings', 'agency_profile'))
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.isPublic) {
            const cloudSettings: AgencySettings = {
              studioName: String(data.studioName || INITIAL_SETTINGS.studioName),
              tagline: String(data.tagline || INITIAL_SETTINGS.tagline),
              heroHeadline: String(data.heroHeadline || INITIAL_SETTINGS.heroHeadline),
              heroSubheadline: String(data.heroSubheadline || INITIAL_SETTINGS.heroSubheadline),
              whatsappNumber: String(data.whatsappNumber || INITIAL_SETTINGS.whatsappNumber),
              contactNumber: String(data.contactNumber || INITIAL_SETTINGS.contactNumber),
              facebookUrl: String(data.facebookUrl || ''),
              instagramUrl: String(data.instagramUrl || ''),
              telegramUrl: String(data.telegramUrl || ''),
              locationText: String(data.locationText || INITIAL_SETTINGS.locationText),
              workingHours: String(data.workingHours || INITIAL_SETTINGS.workingHours),
              yearsExperience: Number(data.yearsExperience || INITIAL_SETTINGS.yearsExperience),
              completedProjectsCount: Number(
                data.completedProjectsCount || INITIAL_SETTINGS.completedProjectsCount
              ),
              satisfiedClientsCount: Number(
                data.satisfiedClientsCount || INITIAL_SETTINGS.satisfiedClientsCount
              ),
              isPublic: true,
              ownerId: String(data.ownerId || 'owner'),
              ownerPasscode: data.ownerPasscode ? String(data.ownerPasscode) : undefined,
              updatedAt:
                data.updatedAt?.toDate?.()?.toISOString?.() ||
                String(data.updatedAt || new Date().toISOString()),
            };
            setSettings(cloudSettings);
            if (cloudSettings.ownerPasscode) {
              setActivePasscode(cloudSettings.ownerPasscode);
              localStorage.setItem(LOCAL_PASSCODE_KEY, cloudSettings.ownerPasscode);
            }
            try {
              localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(cloudSettings));
            } catch {
              // ignore quota error
            }
            setCloudSyncStatus('synced');
          }
        }
      })
      .catch(() => {
        // Fallback to local / seed settings if not yet created in Firestore
      });

    return () => {
      unsubProjects();
    };
  }, []);

  // Require Passcode before opening any owner action
  const requireOwnerAccess = (action: () => void) => {
    if (isOwnerUnlocked) {
      action();
    } else {
      setPendingActionAfterUnlock(() => action);
      setIsPasscodeModalOpen(true);
    }
  };

  const persistProjectsLocally = (updatedList: ProjectItem[]) => {
    setProjects(updatedList);
    saveProjectsToIndexedDB(updatedList);
    try {
      localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(updatedList));
    } catch {
      // IndexedDB stores the full base64 images
    }
  };

  // Handlers for CRUD operations (IndexedDB + LocalStorage + Cloud Firestore via Passcode)
  const handleSaveProject = async (project: ProjectItem, isNew: boolean) => {
    const updatedList = isNew
      ? [project, ...projects.filter((p) => p.id !== project.id)]
      : projects.map((p) => (p.id === project.id ? project : p));

    persistProjectsLocally(updatedList);
    if (selectedProject && selectedProject.id === project.id) {
      setSelectedProject(project);
    }

    setCloudSyncStatus('syncing');
    try {
      await setDoc(doc(db, 'projects', project.id), {
        title: project.title,
        category: project.category,
        subCategory: project.subCategory,
        description: project.description,
        clientName: project.clientName,
        dimensions: project.dimensions,
        materials: project.materials,
        finishing: project.finishing,
        executionTime: project.executionTime,
        imageUrl: project.imageUrl || '',
        galleryImages: project.galleryImages || (project.imageUrl ? [project.imageUrl] : []),
        subProjects: project.subProjects || [],
        visualPreset: project.visualPreset || 'cards_gold_foil',
        featured: Boolean(project.featured),
        isPublic: true,
        displayOrder: Number(project.displayOrder || 1),
        ownerId: currentUser?.uid || 'owner_passcode_active',
        adminPasscode: OWNER_PASSCODE,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setCloudSyncStatus('synced');
    } catch {
      setCloudSyncStatus('local_only');
    }
  };

  // Quick 1-click photo upload directly onto an existing project
  const handleQuickPhotoUpload = async (project: ProjectItem, file: File) => {
    try {
      setQuickUploadToast('جاري ضغط وحفظ صورة العمل بأعلى دقة...');
      const compressedDataUrl = await compressImageFile(file);
      const existingGallery = Array.isArray(project.galleryImages)
        ? project.galleryImages.filter(Boolean)
        : project.imageUrl
          ? [project.imageUrl]
          : [];
      const updatedProject: ProjectItem = {
        ...project,
        imageUrl: compressedDataUrl,
        galleryImages: [
          compressedDataUrl,
          ...existingGallery.filter((img) => img !== compressedDataUrl),
        ].slice(0, 6),
        updatedAt: new Date().toISOString(),
      };
      await handleSaveProject(updatedProject, false);
      setQuickUploadToast('تم رفع وحفظ صورة العمل بنجاح في المعرض والسحابة!');
      setTimeout(() => setQuickUploadToast(null), 4000);
    } catch {
      setQuickUploadToast('تعذر قراءة ملف الصورة، يرجى اختيار صورة بصيغة JPG أو PNG.');
      setTimeout(() => setQuickUploadToast(null), 4000);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const updatedList = projects.filter((p) => p.id !== projectId);
    persistProjectsLocally(updatedList);

    if (isCloudVerifiedOwner && currentUser) {
      setCloudSyncStatus('syncing');
      try {
        await deleteDoc(doc(db, 'projects', projectId));
        setCloudSyncStatus('synced');
      } catch {
        setCloudSyncStatus('local_only');
      }
    }
  };

  const handleSaveSettings = async (newSettings: AgencySettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch {
      // ignore
    }

    setCloudSyncStatus('syncing');
    try {
      await setDoc(doc(db, 'settings', 'agency_profile'), {
        studioName: newSettings.studioName,
        tagline: newSettings.tagline,
        heroHeadline: newSettings.heroHeadline,
        heroSubheadline: newSettings.heroSubheadline,
        whatsappNumber: newSettings.whatsappNumber,
        contactNumber: newSettings.contactNumber,
        facebookUrl: newSettings.facebookUrl,
        instagramUrl: newSettings.instagramUrl,
        telegramUrl: newSettings.telegramUrl,
        locationText: newSettings.locationText,
        workingHours: newSettings.workingHours,
        yearsExperience: newSettings.yearsExperience,
        completedProjectsCount: newSettings.completedProjectsCount,
        satisfiedClientsCount: newSettings.satisfiedClientsCount,
        isPublic: true,
        ownerId: currentUser?.uid || 'owner_passcode_active',
        ownerPasscode: newSettings.ownerPasscode || activePasscode,
        adminPasscode: OWNER_PASSCODE,
        updatedAt: serverTimestamp(),
      });
      setCloudSyncStatus('synced');
    } catch {
      setCloudSyncStatus('local_only');
    }
  };

  // Handler for updating the passcode
  const handleUpdatePasscode = async (newCode: string) => {
    setActivePasscode(newCode);
    try {
      localStorage.setItem(LOCAL_PASSCODE_KEY, newCode);
    } catch {
      // ignore
    }
    const updatedSettings: AgencySettings = {
      ...settings,
      ownerPasscode: newCode,
    };
    await handleSaveSettings(updatedSettings);
    setQuickUploadToast(`تم تحديث كلمة سر الإدارة بنجاح إلى: ${newCode}`);
    setTimeout(() => setQuickUploadToast(null), 4000);
  };

  const handleSyncAllToCloud = async () => {
    setCloudSyncStatus('syncing');
    try {
      await handleSaveSettings(settings);
      for (const item of projects) {
        await setDoc(doc(db, 'projects', item.id), {
          title: item.title,
          category: item.category,
          subCategory: item.subCategory,
          description: item.description,
          clientName: item.clientName,
          dimensions: item.dimensions,
          materials: item.materials,
          finishing: item.finishing,
          executionTime: item.executionTime,
          imageUrl: item.imageUrl || '',
          galleryImages: item.galleryImages || (item.imageUrl ? [item.imageUrl] : []),
          subProjects: item.subProjects || [],
          visualPreset: item.visualPreset || 'cards_gold_foil',
          featured: Boolean(item.featured),
          isPublic: true,
          displayOrder: Number(item.displayOrder || 1),
          ownerId: currentUser?.uid || 'owner_passcode_active',
          adminPasscode: OWNER_PASSCODE,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setCloudSyncStatus('synced');
    } catch {
      setCloudSyncStatus('local_only');
    }
  };

  const filteredProjects = useMemo(
    () => filterAndSortProjects(projects, filter),
    [projects, filter]
  );

  const categoryCounts = useMemo(() => countProjectsByCategory(projects), [projects]);

  const currentCategoryMeta = useMemo(
    () => SERVICE_CATEGORIES.find((c) => c.id === filter.category) || SERVICE_CATEGORIES[0],
    [filter.category]
  );

  const whatsappDirectUrl = formatWhatsAppUrl(
    settings.whatsappNumber,
    `مرحباً (${settings.studioName})، تصفحت معرض أعمالكم وأرغب في الاستفسار عن تنفيذ أعمال مطبوعات وواجهات.`
  );

  return (
    <div className="min-h-screen bg-[#F4F8FD] text-[#0F172A] flex flex-col">
      {/* Hidden 1-click file input for replacing/adding photo directly on any project card */}
      <input
        ref={cardQuickFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file && quickUploadTargetProject) {
            await handleQuickPhotoUpload(quickUploadTargetProject, file);
          }
          if (cardQuickFileInputRef.current) {
            cardQuickFileInputRef.current.value = '';
          }
        }}
      />

      {/* Toast Notification */}
      {quickUploadToast && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2.5 rounded-2xl border-2 border-blue-200 bg-white px-5 py-3.5 text-xs sm:text-sm font-extrabold text-blue-900 shadow-xl">
          <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />
          <span>{quickUploadToast}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-8 px-4 sm:px-8 py-4 border-b border-blue-100 bg-white/95 backdrop-blur-md shadow-2xs">
        <a
          href="#top"
          className="text-lg sm:text-xl font-extrabold tracking-tight text-blue-950 whitespace-nowrap shrink-0"
        >
          {settings.studioName}
        </a>

        <nav
          aria-label="التنقل الرئيسي"
          className="hidden md:flex items-center gap-7 text-sm font-bold text-slate-600"
        >
          <a
            href="#portfolio-gallery"
            className="hover:text-blue-600 hover:underline underline-offset-8 transition-colors whitespace-nowrap shrink-0"
          >
            سابقة الأعمال
          </a>
          <a
            href="#specialties"
            className="hover:text-blue-600 hover:underline underline-offset-8 transition-colors whitespace-nowrap shrink-0"
          >
            أقسام التنفيذ
          </a>
          <a
            href="#specs-estimator"
            className="hover:text-blue-600 hover:underline underline-offset-8 transition-colors whitespace-nowrap shrink-0"
          >
            مقايسة الخامات
          </a>
          <a
            href="#contact-hub"
            className="hover:text-blue-600 hover:underline underline-offset-8 transition-colors whitespace-nowrap shrink-0"
          >
            بيانات التواصل
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <a
            href={whatsappDirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 shadow-sm"
          >
            تواصل عبر واتساب
          </a>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Owner Management Bar (Appears ONLY after entering Passcode) */}
        {isOwnerUnlocked && (
          <div className="border-b border-blue-200 bg-gradient-to-l from-blue-50 via-sky-50 to-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-950">
                <Unlock className="h-4 w-4 text-blue-600" />
                <span className="font-extrabold">وضع الإدارة مفعل:</span>
                <span className="hidden sm:inline text-blue-700 font-semibold">
                  يمكنك إضافة وتعديل عدة مشاريع في أي بند وتغيير كلمة السر بحرية.
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStudioInitialCategory(undefined);
                    setEditingProjectInStudio(null);
                    setStudioInitialTab('projects');
                    setIsStudioOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 shadow-sm"
                >
                  <ImagePlus className="h-4 w-4" />
                  <span>إضافة وتعديل الأعمال</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsChangePasscodeModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3.5 py-2 text-xs font-bold text-blue-800 hover:border-blue-600 transition-colors whitespace-nowrap shrink-0"
                >
                  <KeyRound className="h-3.5 w-3.5 text-blue-600" />
                  <span>تغيير كلمة السر</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingProjectInStudio(null);
                    setStudioInitialTab('settings');
                    setIsStudioOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3.5 py-2 text-xs font-bold text-blue-800 hover:border-blue-600 transition-colors whitespace-nowrap shrink-0"
                >
                  <Settings className="h-3.5 w-3.5 text-blue-600" />
                  <span>تعديل كافة بيانات ونصوص الموقع</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3.5 py-2 text-xs font-bold text-blue-800 hover:border-blue-600 transition-colors whitespace-nowrap shrink-0"
                >
                  <Share2 className="h-3.5 w-3.5 text-blue-600" />
                  <span>نسخ رابط العميل</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsOwnerUnlocked(false)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
                >
                  <Lock className="h-3.5 w-3.5 text-slate-500" />
                  <span>قفل التعديل (معاينة كعميل)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section with Custom Stickers */}
        <section className="relative pt-10 sm:pt-14 pb-14 bg-gradient-to-b from-white via-[#F5F9FF] to-[#EEF5FF] border-b border-blue-100 overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-between py-2">
                <div>
                  <div className="text-xs sm:text-sm font-extrabold text-blue-600 mb-3 tracking-wide">
                    {settings.tagline}
                  </div>
                  <h1
                    className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-slate-900 leading-[1.25] tracking-tight mb-5"
                    style={{ textWrap: 'balance' }}
                  >
                    {settings.heroHeadline}
                  </h1>
                  <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-7 max-w-2xl">
                    {settings.heroSubheadline}
                  </p>

                  {/* 4 Custom Die-Cut Domain Stickers Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                    <StickerCmykPalette className="w-full" />
                    <StickerOutdoorRoll className="w-full" />
                    <StickerCladdingShield className="w-full" />
                    <Sticker3DLetters className="w-full" />
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-3.5">
                    <a
                      href="#portfolio-gallery"
                      className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-extrabold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shadow-md"
                    >
                      <span>تصفح معرض الأعمال</span>
                      <ArrowUpLeft className="h-4 w-4" />
                    </a>
                    <a
                      href="#contact-hub"
                      className="inline-flex items-center gap-2 rounded-2xl border-2 border-blue-200 bg-white px-5 py-3.5 text-sm font-extrabold text-blue-800 hover:border-blue-600 transition-colors whitespace-nowrap"
                    >
                      <span>قنوات التواصل السريع</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Daylight Studio Hero Visual Showcase */}
              <div className="lg:col-span-6 flex items-stretch">
                <div
                  onClick={() => setSelectedProject(projects[0] || null)}
                  className="group relative w-full min-h-[340px] sm:min-h-[420px] lg:h-full rounded-3xl overflow-hidden border-4 border-white bg-[#F0F7FF] cursor-pointer shadow-lg"
                >
                  <VisualPresetCanvas
                    preset="hero_flagship"
                    title={settings.studioName}
                    className="w-full h-full min-h-[340px] sm:min-h-[420px]"
                  />
                  <div className="absolute bottom-3 inset-x-3 p-4 sm:p-5 rounded-2xl bg-white/95 backdrop-blur-md border border-blue-100 shadow-sm flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-extrabold text-blue-600 mb-0.5">
                        معرض الأعمال الهندسية والمطبوعات · اضغط للمعاينة
                      </div>
                      <div className="text-sm sm:text-base font-extrabold text-slate-900">
                        تنفيذ متكامل من التصميم والفرز اللوني حتى التركيب الميداني
                      </div>
                    </div>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Maximize2 className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Proof & Metrics Strip */}
            <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 rounded-3xl border-2 border-white bg-white/90 p-6 shadow-sm">
              <div className="border-l border-blue-100 pl-4 last:border-l-0">
                <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-mono">
                  +{settings.completedProjectsCount}
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1">
                  مشروع مطبوعات وواجهات منفذ
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  تسليم مطابق للمواصفات القياسية
                </div>
              </div>

              <div className="lg:border-l border-blue-100 lg:pl-4">
                <div className="text-2xl sm:text-3xl font-extrabold text-blue-950 font-mono">
                  +{settings.satisfiedClientsCount}
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1">
                  علامة تجارية وشركة ومطعم
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  شركاء نجاح في مختلف القطاعات
                </div>
              </div>

              <div className="border-l border-blue-100 pl-4">
                <div className="text-2xl sm:text-3xl font-extrabold text-blue-950">
                  <span className="font-mono">{settings.yearsExperience}</span> <span>عاماً</span>
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1">
                  خبرة في الطباعة وتشكيل الواجهات
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  ماكينات طباعة وتفريغ CNC حديثة
                </div>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-mono">
                  1440 DPI
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1">
                  دقة طباعة وثبات خامات خارجية
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  ضمان فعلي على الكلادينج والإضاءة
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Core Specialties Overview Section with Direct Add Button per Category */}
        <section id="specialties" className="py-14 border-b border-blue-100 bg-[#F4F8FD]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-9">
              <div>
                <div className="text-xs font-extrabold text-blue-600 mb-1.5">
                  أقسام التنفيذ المعتمدة بالرموز التوضيحية
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  اختر القسم لاستعراض أعماله أو إضافة مشاريع جديدة له
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                اضغط على أي بطاقة لفلترة المعرض بالأسفل فوراً
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {SERVICE_CATEGORIES.filter((c) => c.id !== 'all').map((cat, index) => {
                const count = categoryCounts[cat.id as ServiceCategory] || 0;
                const isSelected = filter.category === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => {
                      setFilter((prev) => ({
                        ...prev,
                        category: cat.id as ServiceCategory,
                        subCategory: 'all',
                      }));
                      document
                        .getElementById('portfolio-gallery')
                        ?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`group text-right rounded-3xl border-2 p-6 transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-white shadow-md ring-4 ring-blue-100'
                        : 'border-white bg-white/95 hover:border-blue-300 shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <CategoryStickerIllustration
                          category={cat.id as ServiceCategory}
                          className="w-16 h-16 shrink-0 group-hover:scale-105 transition-transform"
                        />
                        <div className="text-left">
                          <span className="block font-mono text-xs font-extrabold text-blue-600">
                            0{index + 1}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-500">
                            {count} أعمال
                          </span>
                        </div>
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-900 mb-2">
                        {cat.shortLabel}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{cat.subtitle}</p>
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-blue-50">
                      <div className="flex items-center justify-between text-xs font-extrabold text-blue-600 mb-2">
                        <span>عرض أعمال القسم</span>
                        <ArrowUpLeft className="h-4 w-4" />
                      </div>

                      {/* Direct One-Click Button to Add Multiple Projects to this Category */}
                      {isOwnerUnlocked && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStudioInitialCategory(cat.id as ServiceCategory);
                            setEditingProjectInStudio(null);
                            setStudioInitialTab('projects');
                            setIsStudioOpen(true);
                          }}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-blue-700 shadow-2xs transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>+ إضافة مشاريع في {cat.shortLabel}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Main Interactive Portfolio Gallery */}
        <section id="portfolio-gallery" className="py-14 sm:py-16 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
              <div>
                <div className="text-xs font-extrabold text-blue-600 mb-2">
                  معرض سابقة الأعمال الموثقة بالصور والمواصفات
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  نماذج أعمالنا في المطبوعات الورقية والبانر والكلادينج والحروف البارزة
                </h2>
              </div>

              {/* Search Input + Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="h-4 w-4 text-blue-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    aria-label="ابحث في سابقة الأعمال"
                    value={filter.searchQuery}
                    onChange={(e) =>
                      setFilter((prev) => ({ ...prev, searchQuery: e.target.value }))
                    }
                    placeholder="ابحث (كروت، منيو، بانر، كلادينج...)"
                    className="w-full rounded-2xl border-2 border-blue-100 bg-[#F8FAFC] pr-10 pl-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Multi-Project Add in 1 Category Button */}
                <button
                  type="button"
                  onClick={() =>
                    requireOwnerAccess(() => {
                      setStudioInitialCategory(
                        filter.category === 'all' ? 'cladding' : (filter.category as ServiceCategory)
                      );
                      setEditingProjectInStudio(null);
                      setStudioInitialTab('projects');
                      setIsStudioOpen(true);
                    })
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white border-2 border-blue-200 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-blue-800 hover:border-blue-600 hover:bg-blue-50 transition-colors whitespace-nowrap shrink-0 shadow-2xs"
                >
                  <Files className="h-4 w-4 text-blue-600" />
                  <span>إضافة عدة مشاريع في بند واحد</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    requireOwnerAccess(() => {
                      setStudioInitialCategory(undefined);
                      setEditingProjectInStudio(null);
                      setStudioInitialTab('projects');
                      setIsStudioOpen(true);
                    })
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 shadow-sm"
                >
                  <Camera className="h-4 w-4" />
                  <span>{isOwnerUnlocked ? 'إضافة عمل / رفع صور' : 'إضافة صور أعمالك'}</span>
                </button>
              </div>
            </div>

            {/* Interactive Category Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-blue-100">
              <div
                role="tablist"
                aria-label="فلترة حسب القسم"
                className="flex items-center gap-1.5 p-1.5 bg-[#F0F7FF] border border-blue-100 rounded-2xl overflow-x-auto max-w-full"
              >
                {SERVICE_CATEGORIES.map((cat) => {
                  const active = filter.category === cat.id;
                  const count = categoryCounts[cat.id] || 0;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() =>
                        setFilter((prev) => ({
                          ...prev,
                          category: cat.id,
                          subCategory: 'all',
                        }))
                      }
                      className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-colors whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-700 hover:text-blue-700'
                      }`}
                    >
                      {cat.shortLabel} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub-category interactive filter bar */}
            {currentCategoryMeta.subTypes.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6">
                <span className="text-xs font-bold text-slate-500 whitespace-nowrap shrink-0 flex items-center gap-1">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600" />
                  <span>النوع الفرعي:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setFilter((prev) => ({ ...prev, subCategory: 'all' }))}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                    filter.subCategory === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  الكل
                </button>
                {currentCategoryMeta.subTypes.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setFilter((prev) => ({ ...prev, subCategory: sub }))}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                      filter.subCategory === sub
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}

            {/* Projects Bento / Grid */}
            {filteredProjects.length === 0 ? (
              <div className="rounded-3xl border-2 border-blue-100 bg-[#F8FAFC] p-12 text-center">
                <Printer className="h-10 w-10 text-blue-600 mx-auto mb-3 opacity-80" />
                <h3 className="text-lg font-extrabold text-slate-900 mb-1">
                  لا توجد أعمال مطابقة لخيارات البحث الحالية
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-5">
                  جرب اختيار قسم آخر أو مسح كلمة البحث لعرض كافة الأعمال المنفذة.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setFilter({
                      category: 'all',
                      subCategory: 'all',
                      searchQuery: '',
                      onlyFeatured: false,
                    })
                  }
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
                >
                  عرض جميع الأعمال ({projects.length})
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                {filteredProjects.map((project, idx) => {
                  const catLabel =
                    SERVICE_CATEGORIES.find((c) => c.id === project.category)?.shortLabel ||
                    project.category;
                  const isWideHighlight =
                    (idx === 0 && filter.category === 'all' && !filter.searchQuery) ||
                    (filteredProjects.length === 4 && (idx === 0 || idx === 3));

                  return (
                    <article
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className={`group rounded-3xl border-2 border-blue-100/90 bg-white overflow-hidden hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between ${
                        isWideHighlight ? 'md:col-span-2 lg:col-span-2' : ''
                      }`}
                    >
                      <div>
                        {/* Visual Container */}
                        <div
                          className={`relative overflow-hidden bg-[#F0F7FF] border-b border-blue-100 ${
                            isWideHighlight ? 'h-64 sm:h-80' : 'h-60'
                          }`}
                        >
                          <VisualPresetCanvas
                            preset={project.visualPreset}
                            imageUrl={project.imageUrl}
                            title={project.title}
                            className="w-full h-full"
                          />

                          {/* Direct 1-Click Buttons when Unlocked */}
                          {isOwnerUnlocked && (
                            <div
                              className="absolute top-3 left-3 z-10 flex items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setQuickUploadTargetProject(project);
                                  cardQuickFileInputRef.current?.click();
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600/95 px-3 py-2 text-xs font-extrabold text-white shadow-md hover:bg-blue-700 transition-colors"
                              >
                                <Camera className="h-3.5 w-3.5" />
                                <span>رفع صورة</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProjectInStudio(project);
                                  setStudioInitialTab('projects');
                                  setIsStudioOpen(true);
                                }}
                                className="inline-flex items-center gap-1 rounded-xl bg-white/95 border border-blue-200 px-2.5 py-2 text-xs font-bold text-blue-800 shadow-md hover:bg-blue-50 transition-colors"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                                <span>تعديل</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Card Content */}
                        <div className="p-5 sm:p-6">
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mb-2">
                            <span className="font-extrabold text-blue-600">{catLabel}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-slate-700">
                              {project.subCategory}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{project.clientName}</span>
                          </div>

                          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug mb-2">
                            {project.title}
                          </h3>

                          <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                            {project.description}
                          </p>
                        </div>
                      </div>

                      {/* Technical Specs Footer */}
                      <div className="px-5 sm:px-6 pb-5 pt-3.5 border-t border-blue-50 bg-[#F8FBFF] flex items-center justify-between gap-2 text-xs text-slate-600">
                        <span className="truncate font-medium">{project.materials}</span>
                        <span className="font-extrabold text-blue-600 whitespace-nowrap shrink-0 inline-flex items-center gap-1">
                          <span>التفاصيل والمواصفات</span>
                          <ArrowUpLeft className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Material Estimator */}
        <SpecificationEstimatorSection whatsappNumber={settings.whatsappNumber} />

        {/* Contact Hub */}
        <section id="contact-hub" className="py-16 sm:py-20 border-t border-blue-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-5">
                <div className="text-xs font-extrabold text-blue-600 mb-2">
                  قنوات التواصل المعتمدة
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">
                  تواصل معنا مباشرة لمعاينة موقعك أو تسعير مطبوعاتك
                </h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
                  نحن متواجدون عبر واتساب، تليجرام، فيسبوك، وانستجرام للرد الفوري على استفساراتكم وإرسال عينات الخامات وعروض الأسعار التفصيلية.
                </p>

                <div className="space-y-4 text-sm border-t border-blue-100 pt-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-blue-600 shrink-0 mt-1" />
                    <div>
                      <div className="text-xs text-slate-500">العنوان والمقر</div>
                      <div className="font-bold text-slate-900">{settings.locationText}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-blue-600 shrink-0 mt-1" />
                    <div>
                      <div className="text-xs text-slate-500">مواعيد العمل</div>
                      <div className="font-bold text-slate-900">{settings.workingHours}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-blue-600 shrink-0 mt-1" />
                    <div>
                      <div className="text-xs text-slate-500">الهاتف المباشر</div>
                      <a
                        href={`tel:${settings.contactNumber}`}
                        dir="ltr"
                        className="font-mono font-extrabold text-blue-600 hover:underline"
                      >
                        {settings.contactNumber}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Social Cards */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* WhatsApp */}
                <a
                  href={whatsappDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-3xl border-2 border-blue-100 bg-[#F8FBFF] p-6 hover:border-blue-600 hover:bg-blue-50/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-extrabold text-blue-600">
                        مراسلة فورية · WhatsApp
                      </span>
                      <MessageCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900 mb-1">
                      تواصل عبر واتساب
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      أرسل مقاساتك أو ملفات التصميم للحصول على تسعير فوري ومواصفات دقيقة.
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-blue-100 flex items-center justify-between text-xs font-mono font-extrabold text-blue-700">
                    <span dir="ltr">{settings.whatsappNumber}</span>
                    <ArrowUpLeft className="h-4 w-4" />
                  </div>
                </a>

                {/* Facebook */}
                <a
                  href={formatSocialUrl(settings.facebookUrl, 'facebook')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-3xl border-2 border-blue-100 bg-[#F8FBFF] p-6 hover:border-blue-600 hover:bg-blue-50/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-extrabold text-blue-600">
                        الصفحة الرسمية · Facebook
                      </span>
                      <Award className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900 mb-1">
                      تابعنا على فيسبوك
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      شاهد أحدث التركيبات الميدانية لواجهات الكلادينج والحروف البارزة والمطبوعات يومياً.
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-blue-100 flex items-center justify-between text-xs font-extrabold text-blue-700">
                    <span>زيارة صفحة فيسبوك</span>
                    <ArrowUpLeft className="h-4 w-4" />
                  </div>
                </a>

                {/* Instagram */}
                <a
                  href={formatSocialUrl(settings.instagramUrl, 'instagram')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-3xl border-2 border-blue-100 bg-[#F8FBFF] p-6 hover:border-blue-600 hover:bg-blue-50/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-extrabold text-blue-600">
                        معرض الصور والريلز · Instagram
                      </span>
                      <Layers className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900 mb-1">
                      معرضنا على انستجرام
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      تفاصيل عن قرب لجودة الطباعة، الكروت الفاخرة، والواجهات المضيئة ليلاً.
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-blue-100 flex items-center justify-between text-xs font-extrabold text-blue-700">
                    <span>فتح حساب انستجرام</span>
                    <ArrowUpLeft className="h-4 w-4" />
                  </div>
                </a>

                {/* Telegram */}
                <a
                  href={formatTelegramUrl(settings.telegramUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-3xl border-2 border-blue-100 bg-[#F8FBFF] p-6 hover:border-blue-600 hover:bg-blue-50/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-extrabold text-blue-600">
                        إرسال ملفات الطباعة · Telegram
                      </span>
                      <Send className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900 mb-1">
                      تواصل عبر تليجرام
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      لإرسال ملفات التصميم المفتوحة بأعلى جودة (PDF / AI / PSD) مباشرة لقسم التشغيل.
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-blue-100 flex items-center justify-between text-xs font-extrabold text-blue-700">
                    <span>مراسلة عبر تليجرام</span>
                    <ArrowUpLeft className="h-4 w-4" />
                  </div>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-blue-100 bg-[#EEF5FF] py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="font-semibold">
            © {new Date().getFullYear()} {settings.studioName}. جميع الحقوق محفوظة.
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <a
              href="#portfolio-gallery"
              className="hover:text-blue-600 font-semibold transition-colors"
            >
              سابقة الأعمال
            </a>
            <a
              href="#specs-estimator"
              className="hover:text-blue-600 font-semibold transition-colors"
            >
              مقايسة الخامات
            </a>
            <a href="#contact-hub" className="hover:text-blue-600 font-semibold transition-colors">
              التواصل المباشر
            </a>

            {!isOwnerUnlocked ? (
              <button
                type="button"
                onClick={() =>
                  requireOwnerAccess(() => {
                    setEditingProjectInStudio(null);
                    setStudioInitialTab('projects');
                    setIsStudioOpen(true);
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3.5 py-2 text-xs font-extrabold text-blue-800 hover:border-blue-600 hover:text-blue-700 transition-colors whitespace-nowrap shadow-2xs"
              >
                <Lock className="h-3.5 w-3.5 text-blue-600" />
                <span>دخول الإدارة (إضافة وتعديل)</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsChangePasscodeModalOpen(true)}
                  className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50"
                >
                  <KeyRound className="h-3 w-3 text-blue-600" />
                  <span>تغيير كلمة السر</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProjectInStudio(null);
                    setStudioInitialTab('projects');
                    setIsStudioOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>لوحة الإضافة ورفع الصور</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PasscodeModal
        isOpen={isPasscodeModalOpen}
        activePasscode={activePasscode}
        onClose={() => {
          setIsPasscodeModalOpen(false);
          setPendingActionAfterUnlock(null);
        }}
        onSuccess={() => {
          setIsOwnerUnlocked(true);
          try {
            sessionStorage.setItem('arkan_owner_unlocked', 'true');
          } catch {
            // ignore
          }
          setIsPasscodeModalOpen(false);
          if (pendingActionAfterUnlock) {
            pendingActionAfterUnlock();
            setPendingActionAfterUnlock(null);
          }
        }}
      />

      <ChangePasscodeModal
        isOpen={isChangePasscodeModalOpen}
        currentActivePasscode={activePasscode}
        onClose={() => setIsChangePasscodeModalOpen(false)}
        onSuccess={handleUpdatePasscode}
      />

      <ProjectLightboxModal
        project={selectedProject}
        whatsappNumber={settings.whatsappNumber}
        canEdit={isOwnerUnlocked}
        onClose={() => setSelectedProject(null)}
        onEditProject={(proj) => {
          requireOwnerAccess(() => {
            setEditingProjectInStudio(proj);
            setStudioInitialTab('projects');
            setIsStudioOpen(true);
          });
        }}
        onQuickUploadPhoto={handleQuickPhotoUpload}
      />

      <OwnerStudioModal
        isOpen={isStudioOpen}
        initialTab={studioInitialTab}
        initialCategory={studioInitialCategory}
        editingProjectInitial={editingProjectInStudio}
        projects={projects}
        settings={settings}
        currentActivePasscode={activePasscode}
        currentUserEmail={currentUser?.email || null}
        isCloudVerifiedOwner={isCloudVerifiedOwner}
        cloudSyncStatus={cloudSyncStatus}
        onClose={() => {
          setIsStudioOpen(false);
          setEditingProjectInStudio(null);
          setStudioInitialCategory(undefined);
        }}
        onSaveProject={handleSaveProject}
        onDeleteProject={handleDeleteProject}
        onSaveSettings={handleSaveSettings}
        onUpdatePasscode={handleUpdatePasscode}
        onSyncAllToCloud={handleSyncAllToCloud}
        onSignInGoogle={async () => {
          await signInAsOwner();
        }}
        onSignOutGoogle={async () => {
          await signOutOwner();
        }}
      />

      <ClientShareModal
        isOpen={isShareModalOpen}
        studioName={settings.studioName}
        onClose={() => setIsShareModalOpen(false)}
        onActivateClientPreview={() => {
          setIsOwnerUnlocked(false);
          try {
            sessionStorage.removeItem('arkan_owner_unlocked');
          } catch {
            // ignore
          }
        }}
      />
    </div>
  );
}
