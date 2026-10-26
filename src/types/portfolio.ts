export type ServiceCategory =
  | 'paper_prints'
  | 'outdoor_prints'
  | 'cladding'
  | 'prominent_letters';

export interface CategoryMeta {
  id: ServiceCategory | 'all';
  label: string;
  shortLabel: string;
  subtitle: string;
  badgeText: string;
  subTypes: string[];
}

export interface SubProjectItem {
  id: string;
  title: string;
  clientOrLocation?: string;
  dimensions?: string;
  materials?: string;
  description?: string;
  imageUrl?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  category: ServiceCategory;
  subCategory: string;
  description: string;
  clientName: string;
  dimensions: string;
  materials: string;
  finishing: string;
  executionTime: string;
  imageUrl: string;
  galleryImages?: string[];
  subProjects?: SubProjectItem[];
  visualPreset: string;
  featured: boolean;
  isPublic: boolean;
  displayOrder: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgencySettings {
  studioName: string;
  tagline: string;
  heroHeadline: string;
  heroSubheadline: string;
  whatsappNumber: string;
  contactNumber: string;
  facebookUrl: string;
  instagramUrl: string;
  telegramUrl: string;
  locationText: string;
  workingHours: string;
  yearsExperience: number;
  completedProjectsCount: number;
  satisfiedClientsCount: number;
  isPublic: boolean;
  ownerId: string;
  ownerPasscode?: string;
  updatedAt: string;
}

export interface ProjectFilterState {
  category: ServiceCategory | 'all';
  subCategory: string | 'all';
  searchQuery: string;
  onlyFeatured: boolean;
}

export interface SpecificationEstimateInput {
  category: ServiceCategory;
  subType: string;
  quantityOrArea: number;
  isUrgent?: boolean;
}

export interface SpecificationEstimateResult {
  recommendedMaterials: string;
  recommendedFinishing: string;
  estimatedDays: string;
  qualityGuarantee: string;
  whatsappInquiryText: string;
}
