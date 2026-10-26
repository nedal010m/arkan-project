import {
  AgencySettings,
  CategoryMeta,
  ProjectFilterState,
  ProjectItem,
  ServiceCategory,
  SpecificationEstimateInput,
  SpecificationEstimateResult,
} from '../types/portfolio';

export const SERVICE_CATEGORIES: CategoryMeta[] = [
  {
    id: 'all',
    label: 'جميع الأعمال والتخصصات',
    shortLabel: 'كل الأعمال',
    subtitle: 'تشكيلة متكاملة من المطبوعات الورقية والخارجية وواجهات الكلادينج والحروف البارزة',
    badgeText: 'معرض شامل',
    subTypes: [],
  },
  {
    id: 'paper_prints',
    label: 'المطبوعات الورقية التجارية',
    shortLabel: 'مطبوعات ورقية',
    subtitle: 'كروت شخصية فاخرة · فلايرات وبروشورات · منيوهات مطاعم · دفاتر وفواتير رسمية · فولدرات شركات',
    badgeText: 'أوفست وديجيتال فاخر',
    subTypes: [
      'كروت شخصية فاخرة',
      'فلايرات وبروشورات',
      'منيوهات مطاعم وكافيهات',
      'دفاتر فواتير ومفكرات',
      'فولدرات ومطبوعات شركات',
    ],
  },
  {
    id: 'outdoor_prints',
    label: 'المطبوعات الخارجية والواجهات الزجاجية',
    shortLabel: 'مطبوعات خارجية',
    subtitle: 'بانر خارجي ثقيل · فليكس مضيء · فينيل استيكر · سي ثرو للواجهات الزجاجية بدقة UV',
    badgeText: 'مقاوم للشمس والأمطار',
    subTypes: [
      'بانر خارجي ثقيل',
      'فليكس واجهات مضيء',
      'فينيل استيكر مط ولامع',
      'سي ثرو (See-Through) للزجاج',
    ],
  },
  {
    id: 'cladding',
    label: 'التشطيبات الخارجية وواجهات الكلادينج',
    shortLabel: 'واجهات كلادينج',
    subtitle: 'تجلية واجهات المباني والمعارض بألواح كلادينج ألومنيوم مقاومة للعوامل الجوية مع تفريغ CNC',
    badgeText: 'ضمان مصنعي 20 عاماً',
    subTypes: [
      'واجهات كلادينج ألومنيوم (ACP)',
      'كلادينج خشبي وميتاليك',
      'كلادينج تفريغ CNC مضيء',
      'شاسيهات وتكسيات مداخل تجارية',
    ],
  },
  {
    id: 'prominent_letters',
    label: 'الحروف البارزة واللافتات المضيئة',
    shortLabel: 'حروف بارزة 3D',
    subtitle: 'حروف إستانلس ذهبي وفضي · أكريليك مضيء · إضاءة خلفية هالو (Backlit) · نيون فليكس',
    badgeText: 'إضاءة ليد سامسونج IP68',
    subTypes: [
      'حروف إستانلس ذهبي مع أكريليك',
      'حروف بارزة إضاءة هالو خلفية',
      'حروف أكريليك مضيئة بالكامل',
      'حروف صاج مجلفن وإلكتروستاتيك',
    ],
  },
];

export const VALID_CATEGORIES: ServiceCategory[] = [
  'paper_prints',
  'outdoor_prints',
  'cladding',
  'prominent_letters',
];

export const OWNER_PASSCODE = '109283';

export function verifyOwnerPasscode(inputCode: string, activePasscode?: string): boolean {
  const target = (activePasscode && activePasscode.trim().length > 0)
    ? activePasscode.trim()
    : OWNER_PASSCODE;
  return inputCode.trim() === target;
}

export function validatePasscodeFormat(newCode: string): ValidationResult {
  const code = newCode.trim();
  const errors: string[] = [];
  if (code.length < 4) {
    errors.push('كلمة السر يجب أن تتكون من 4 خانات على الأقل.');
  }
  if (code.length > 32) {
    errors.push('كلمة السر لا يجب أن تتجاوز 32 خانة.');
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function sanitizeId(rawId: string): string {
  const cleaned = rawId.trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
  if (!cleaned) return `item_${Date.now()}`;
  return cleaned.slice(0, 128);
}

export function isValidId(id: string): boolean {
  return typeof id === 'string' && id.length >= 1 && id.length <= 128 && /^[a-zA-Z0-9_\-]+$/.test(id);
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateProjectPayload(input: Partial<ProjectItem>): ValidationResult {
  const errors: string[] = [];

  const title = (input.title ?? '').trim();
  if (title.length < 2 || title.length > 120) {
    errors.push('عنوان العمل يجب أن يكون بين حرفين و 120 حرفاً.');
  }

  if (!input.category || !VALID_CATEGORIES.includes(input.category)) {
    errors.push('يرجى اختيار قسم صحيح للعمل.');
  }

  const subCategory = (input.subCategory ?? '').trim();
  if (subCategory.length < 2 || subCategory.length > 80) {
    errors.push('النوع الفرعي للعمل يجب أن يكون بين حرفين و 80 حرفاً.');
  }

  const description = (input.description ?? '').trim();
  if (description.length < 2 || description.length > 1000) {
    errors.push('تفاصيل العمل مطلوبة (بين حرفين و 1000 حرف).');
  }

  const imageUrl = input.imageUrl ?? '';
  if (imageUrl.length > 900000) {
    errors.push('حجم الصورة كبير جداً، يرجى اختيار صورة أصغر حجماً.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateSettingsPayload(input: Partial<AgencySettings>): ValidationResult {
  const errors: string[] = [];

  const studioName = (input.studioName ?? '').trim();
  if (studioName.length < 2 || studioName.length > 100) {
    errors.push('اسم المؤسسة أو المعرض يجب أن يكون بين حرفين و 100 حرف.');
  }

  const tagline = (input.tagline ?? '').trim();
  if (tagline.length < 2 || tagline.length > 160) {
    errors.push('الشعار اللفظي يجب أن يكون بين حرفين و 160 حرفاً.');
  }

  const heroHeadline = (input.heroHeadline ?? '').trim();
  if (heroHeadline.length < 5 || heroHeadline.length > 180) {
    errors.push('العنوان الرئيسي يجب أن يكون بين 5 و 180 حرفاً.');
  }

  const heroSubheadline = (input.heroSubheadline ?? '').trim();
  if (heroSubheadline.length < 5 || heroSubheadline.length > 400) {
    errors.push('النص التعريفي يجب أن يكون بين 5 و 400 حرف.');
  }

  const whatsappNumber = (input.whatsappNumber ?? '').trim();
  if (whatsappNumber.length < 3 || whatsappNumber.length > 120) {
    errors.push('رقم الواتساب مطلوب للتواصل المباشر.');
  }

  const contactNumber = (input.contactNumber ?? '').trim();
  if (contactNumber.length < 3 || contactNumber.length > 40) {
    errors.push('رقم الهاتف المباشر مطلوب.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function filterAndSortProjects(
  projects: ProjectItem[],
  filter: ProjectFilterState
): ProjectItem[] {
  const query = filter.searchQuery.trim().toLowerCase();

  return projects
    .filter((item) => {
      if (!item.isPublic) return false;
      if (filter.category !== 'all' && item.category !== filter.category) {
        return false;
      }
      if (filter.subCategory !== 'all' && item.subCategory !== filter.subCategory) {
        return false;
      }
      if (filter.onlyFeatured && !item.featured) {
        return false;
      }
      if (query.length > 0) {
        const haystack = [
          item.title,
          item.subCategory,
          item.description,
          item.clientName,
          item.materials,
          item.finishing,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (a.featured !== b.featured) {
        return a.featured ? -1 : 1;
      }
      return a.displayOrder - b.displayOrder;
    });
}

export function countProjectsByCategory(projects: ProjectItem[]): Record<ServiceCategory | 'all', number> {
  const publicItems = projects.filter((p) => p.isPublic);
  return {
    all: publicItems.length,
    paper_prints: publicItems.filter((p) => p.category === 'paper_prints').length,
    outdoor_prints: publicItems.filter((p) => p.category === 'outdoor_prints').length,
    cladding: publicItems.filter((p) => p.category === 'cladding').length,
    prominent_letters: publicItems.filter((p) => p.category === 'prominent_letters').length,
  };
}

export function isClientViewOnlyMode(searchParamsString: string, forcedClientPreview: boolean): boolean {
  if (forcedClientPreview) return true;
  const params = new URLSearchParams(searchParamsString);
  const mode = params.get('mode') || params.get('view');
  return mode === 'client' || mode === 'preview' || mode === 'showcase';
}

export function buildClientShareUrl(currentHref: string): string {
  try {
    const url = new URL(currentHref);
    url.searchParams.delete('admin');
    url.searchParams.set('mode', 'client');
    url.hash = '';
    return url.toString();
  } catch {
    return `${currentHref.split('?')[0]}?mode=client`;
  }
}

export function formatWhatsAppUrl(rawPhoneOrUrl: string, customMessage?: string): string {
  const trimmed = rawPhoneOrUrl.trim();
  const encodedMsg = customMessage ? `?text=${encodeURIComponent(customMessage)}` : '';

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (customMessage && !trimmed.includes('text=')) {
      const separator = trimmed.includes('?') ? '&' : '?';
      return `${trimmed}${separator}text=${encodeURIComponent(customMessage)}`;
    }
    return trimmed;
  }

  let digits = trimmed.replace(/[^0-9]/g, '');
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('01') && digits.length === 11) {
    digits = `2${digits}`;
  }
  if (!digits) {
    digits = '201000000000';
  }
  return `https://wa.me/${digits}${encodedMsg}`;
}

export function formatTelegramUrl(rawHandleOrUrl: string): string {
  const trimmed = rawHandleOrUrl.trim();
  if (!trimmed) return 'https://t.me/';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const cleanHandle = trimmed.replace(/^@/, '');
  return `https://t.me/${cleanHandle}`;
}

export function formatSocialUrl(rawUrl: string, platform: 'facebook' | 'instagram'): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return platform === 'facebook' ? 'https://facebook.com' : 'https://instagram.com';
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const cleanHandle = trimmed.replace(/^@/, '');
  return platform === 'facebook'
    ? `https://facebook.com/${cleanHandle}`
    : `https://instagram.com/${cleanHandle}`;
}

export function calculateProjectEstimate(
  input: SpecificationEstimateInput
): SpecificationEstimateResult {
  const qty = Math.max(1, input.quantityOrArea);

  switch (input.category) {
    case 'paper_prints': {
      const isCardsOrMenus = input.subType.includes('كروت') || input.subType.includes('منيو');
      const recommendedMaterials = isCardsOrMenus
        ? 'ورق كوشيه أو قطني فاخر 350 - 600 جرام مع طباعة أوفست/ديجيتال عالية الدقة'
        : 'ورق كوشيه 150 - 250 جرام أو ورق مكربن NCR رسمي بفرز ألوان CMYK قياسي';
      const recommendedFinishing = isCardsOrMenus
        ? 'سلوفان مخملي (Velvet) + بصمة حرارية أو Spot UV بارز'
        : 'سلوفان مط أو لامع مع طي وتدبيس أو تجميع سلك معدني';
      const estimatedDays = input.isUrgent
        ? '24 إلى 48 ساعة عمل'
        : qty > 2000
        ? '4 إلى 6 أيام عمل'
        : '2 إلى 4 أيام عمل';
      const qualityGuarantee = 'فرز ألوان مطابق للتصميم بنسبة 100% وقص ليزر/مقص رقمي بدون شوائب';
      const whatsappInquiryText = `مرحباً، أرغب في الاستفسار عن تنفيذ مطبوعات ورقية (${input.subType}) - الكمية التقريبية: ${qty} - المواصفات المقترحة: ${recommendedMaterials}.`;
      return {
        recommendedMaterials,
        recommendedFinishing,
        estimatedDays,
        qualityGuarantee,
        whatsappInquiryText,
      };
    }
    case 'outdoor_prints': {
      const isSeeThrough = input.subType.includes('سي ثرو') || input.subType.includes('فينيل');
      const recommendedMaterials = isSeeThrough
        ? 'فينيل مثقب (See-Through 160 ميكرون) أو فينيل كاست خارجي بأحبار UV أصلية'
        : 'خامة بانر أو فليكس كوري ثقيل 510 جرام مقاوم للرياح وأشعة الشمس';
      const recommendedFinishing = isSeeThrough
        ? 'طبقة حماية لامينيشن UV ضد الخدش والبهتان مع تركيب احترافي خالي من الفقاعات'
        : 'لحام حراري مزدوج للأطراف + حلقات معدنية (حلقات ستانلس) أو شد على شاسيه';
      const estimatedDays = input.isUrgent ? '24 ساعة عمل' : qty > 50 ? '2 إلى 4 أيام عمل' : '1 إلى 2 يوم عمل';
      const qualityGuarantee = 'ثبات ألوان ضد الشمس والأمطار مع دقة طباعة تصل إلى 1440 DPI';
      const whatsappInquiryText = `مرحباً، أرغب في الاستفسار عن مطبوعات خارجية (${input.subType}) - المساحة التقريبية: ${qty} متر مربع.`;
      return {
        recommendedMaterials,
        recommendedFinishing,
        estimatedDays,
        qualityGuarantee,
        whatsappInquiryText,
      };
    }
    case 'cladding': {
      const recommendedMaterials =
        'ألواح كلادينج ألومنيوم (سماكة 4 مم - طبقة ألومنيوم 0.5 مم) بدهان PVDF الأصلي مع شاسيه حديد مجلفن ثقيل';
      const recommendedFinishing =
        'تفريز وتجميع زوايا هندسي مخفي + عزل سيليكون هيكلي مقاوم للمياه + إضاءة ليد خطية غاطسة';
      const estimatedDays = input.isUrgent
        ? '5 إلى 7 أيام عمل'
        : qty > 40
        ? '10 إلى 14 يوم عمل'
        : '7 إلى 10 أيام عمل';
      const qualityGuarantee = 'ضمان مصنعي يصل إلى 20 عاماً على ثبات اللون ومقاومة العوامل الجوية';
      const whatsappInquiryText = `مرحباً، أرغب في طلب معاينة وعرض سعر لواجهة كلادينج (${input.subType}) - المساحة التقريبية: ${qty} متر مربع.`;
      return {
        recommendedMaterials,
        recommendedFinishing,
        estimatedDays,
        qualityGuarantee,
        whatsappInquiryText,
      };
    }
    case 'prominent_letters': {
      const recommendedMaterials =
        'إستانلس ستيل 304 غير قابل للصدأ (ذهبي مرآة أو مصنفر) + وش أو ظهر أكريليك أوبال كوري سماكة 4 مم';
      const recommendedFinishing =
        'عدسات ليد سامسونج كوري ضد الماء (IP68) + ترانس تغذية أصلي بضمان عامين + تثبيت مسمار خفي';
      const estimatedDays = input.isUrgent ? '3 إلى 4 أيام عمل' : '5 إلى 8 أيام عمل';
      const qualityGuarantee = 'إضاءة متجانسة بالكامل بدون بقع ضوئية ومقاومة تامة للصدأ والرطوبة';
      const whatsappInquiryText = `مرحباً، أرغب في تنفيذ لافتة حروف بارزة 3D (${input.subType}) - العدد أو المقاس التقريبي: ${qty}.`;
      return {
        recommendedMaterials,
        recommendedFinishing,
        estimatedDays,
        qualityGuarantee,
        whatsappInquiryText,
      };
    }
  }
}
