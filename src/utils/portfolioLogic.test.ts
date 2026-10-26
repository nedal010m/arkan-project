import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildClientShareUrl,
  calculateProjectEstimate,
  countProjectsByCategory,
  filterAndSortProjects,
  formatTelegramUrl,
  formatWhatsAppUrl,
  isClientViewOnlyMode,
  isValidId,
  sanitizeId,
  validatePasscodeFormat,
  validateProjectPayload,
  validateSettingsPayload,
  verifyOwnerPasscode,
} from './portfolioLogic';
import { ProjectItem } from '../types/portfolio';

const mockProjects: ProjectItem[] = [
  {
    id: 'proj_1',
    title: 'كروت شخصية فاخرة ببصمة ذهبية',
    category: 'paper_prints',
    subCategory: 'كروت شخصية فاخرة',
    description: 'طباعة كروت شخصية على ورق قطني 600 جرام مع بصمة ذهبية بارزة',
    clientName: 'مكتب المستشار القانوني',
    dimensions: '9 × 5.5 سم',
    materials: 'ورق قطني أسود 600 جرام',
    finishing: 'بصمة ذهبية حرارية + سلوفان مخملي',
    executionTime: '3 أيام عمل',
    imageUrl: '',
    visualPreset: 'cards_gold_foil',
    featured: true,
    isPublic: true,
    displayOrder: 1,
    ownerId: 'owner_1',
    createdAt: '2026-10-01T10:00:00Z',
    updatedAt: '2026-10-01T10:00:00Z',
  },
  {
    id: 'proj_2',
    title: 'واجهة كلادينج وحروف بارزة لمعرض سيارات',
    category: 'cladding',
    subCategory: 'واجهات كلادينج ألومنيوم (ACP)',
    description: 'تجلية واجهة كاملة بألواح كلادينج أسود مطفي وفضي ميتاليك',
    clientName: 'النخبة للسيارات',
    dimensions: '18 × 4.5 متر',
    materials: 'كلادينج ألومنيوم 4 مم PVDF',
    finishing: 'تفريغ CNC مع إضاءة خطية ليد',
    executionTime: '10 أيام عمل',
    imageUrl: '',
    visualPreset: 'cladding_acp_facade',
    featured: false,
    isPublic: true,
    displayOrder: 2,
    ownerId: 'owner_1',
    createdAt: '2026-10-02T10:00:00Z',
    updatedAt: '2026-10-02T10:00:00Z',
  },
];

test('filterAndSortProjects filters by category and search query accurately', () => {
  const paperOnly = filterAndSortProjects(mockProjects, {
    category: 'paper_prints',
    subCategory: 'all',
    searchQuery: '',
    onlyFeatured: false,
  });
  assert.equal(paperOnly.length, 1);
  assert.equal(paperOnly[0].id, 'proj_1');

  const searchCladding = filterAndSortProjects(mockProjects, {
    category: 'all',
    subCategory: 'all',
    searchQuery: 'النخبة',
    onlyFeatured: false,
  });
  assert.equal(searchCladding.length, 1);
  assert.equal(searchCladding[0].id, 'proj_2');
});

test('countProjectsByCategory returns accurate counts for each category', () => {
  const counts = countProjectsByCategory(mockProjects);
  assert.equal(counts.all, 2);
  assert.equal(counts.paper_prints, 1);
  assert.equal(counts.cladding, 1);
  assert.equal(counts.outdoor_prints, 0);
  assert.equal(counts.prominent_letters, 0);
});

test('isClientViewOnlyMode and buildClientShareUrl handle client mode links', () => {
  assert.equal(isClientViewOnlyMode('?mode=client', false), true);
  assert.equal(isClientViewOnlyMode('?view=showcase', false), true);
  assert.equal(isClientViewOnlyMode('', false), false);
  assert.equal(isClientViewOnlyMode('', true), true);

  const shareUrl = buildClientShareUrl('https://example.com/?admin=1#work');
  assert.equal(shareUrl, 'https://example.com/?mode=client');
});

test('formatWhatsAppUrl and formatTelegramUrl normalize phone numbers and handles', () => {
  const waUrl = formatWhatsAppUrl('01012345678', 'مرحبا');
  assert.equal(waUrl.startsWith('https://wa.me/201012345678?text='), true);

  const tgUrl = formatTelegramUrl('@arkan_print');
  assert.equal(tgUrl, 'https://t.me/arkan_print');
});

test('validateProjectPayload and validateSettingsPayload enforce blueprint constraints', () => {
  const validCheck = validateProjectPayload(mockProjects[0]);
  assert.equal(validCheck.valid, true);

  const invalidCheck = validateProjectPayload({
    ...mockProjects[0],
    title: 'أ', // too short (< 2)
  });
  assert.equal(invalidCheck.valid, false);
  assert.equal(invalidCheck.errors.length > 0, true);

  const validSettings = validateSettingsPayload({
    studioName: 'أركان للدعاية والإعلان',
    tagline: 'مطبوعات ورقية وخارجية وواجهات كلادينج وحروف بارزة',
    heroHeadline: 'نصنع واجهتك وهويتك المطبوعة بأعلى معايير الفخامة والدقة',
    heroSubheadline: 'تنفيذ متكامل لكافة المطبوعات الورقية والبانر والفينيل وواجهات الكلادينج والحروف البارزة',
    whatsappNumber: '201012345678',
    contactNumber: '01012345678',
  });
  assert.equal(validSettings.valid, true);
});

test('calculateProjectEstimate returns domain-specific specs and WhatsApp inquiry text', () => {
  const estimate = calculateProjectEstimate({
    category: 'prominent_letters',
    subType: 'حروف إستانلس ذهبي مع أكريليك',
    quantityOrArea: 8,
    isUrgent: true,
  });
  assert.equal(estimate.estimatedDays, '3 إلى 4 أيام عمل');
  assert.equal(estimate.whatsappInquiryText.includes('حروف بارزة 3D'), true);
});

test('sanitizeId and isValidId guard document identifiers', () => {
  const clean = sanitizeId('bad id!@#$');
  assert.equal(isValidId(clean), true);
  assert.equal(isValidId('invalid id with spaces'), false);
});

test('verifyOwnerPasscode accepts 109283 and rejects invalid codes', () => {
  assert.equal(verifyOwnerPasscode('109283'), true);
  assert.equal(verifyOwnerPasscode(' 109283 '), true);
  assert.equal(verifyOwnerPasscode('000000'), false);
  assert.equal(verifyOwnerPasscode(''), false);
  // Custom passcode support
  assert.equal(verifyOwnerPasscode('mySecret99', 'mySecret99'), true);
  assert.equal(verifyOwnerPasscode('109283', 'mySecret99'), false);
});

test('validatePasscodeFormat enforces minimum 4 characters and maximum 32', () => {
  assert.equal(validatePasscodeFormat('1234').valid, true);
  assert.equal(validatePasscodeFormat('arkan_2026').valid, true);
  assert.equal(validatePasscodeFormat('12').valid, false);
  assert.equal(validatePasscodeFormat('a'.repeat(33)).valid, false);
});

