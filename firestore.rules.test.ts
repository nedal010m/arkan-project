import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Simulator for evaluating the Zero-Trust Firestore Security Rules logic against the Dirty Dozen Payloads
interface SimulatedAuth {
  uid: string;
  email: string;
  email_verified: boolean;
}

interface SimulatedRequest {
  auth: SimulatedAuth | null;
  pathId: string;
  collection: 'projects' | 'settings' | 'admins';
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestTime: string;
  incomingData?: Record<string, unknown>;
  existingData?: Record<string, unknown>;
}

const PROJECT_KEYS = [
  'title', 'category', 'subCategory', 'description', 'clientName',
  'dimensions', 'materials', 'finishing', 'executionTime', 'imageUrl',
  'visualPreset', 'featured', 'isPublic', 'displayOrder', 'ownerId',
  'createdAt', 'updatedAt',
];

function isValidIdRule(id: unknown): boolean {
  return typeof id === 'string' && id.length >= 1 && id.length <= 128 && /^[a-zA-Z0-9_\-]+$/.test(id);
}

function isVerifiedAdminRule(auth: SimulatedAuth | null): boolean {
  return (
    auth !== null &&
    auth.email_verified === true &&
    auth.email === 'nedal010m@gmail.com'
  );
}

function isValidProjectItemRule(data: Record<string, unknown>, authUid: string): boolean {
  const keys = Object.keys(data);
  if (keys.length !== PROJECT_KEYS.length) return false;
  if (!PROJECT_KEYS.every((k) => keys.includes(k))) return false;
  if (!keys.every((k) => PROJECT_KEYS.includes(k))) return false;

  const isStr = (v: unknown, min: number, max: number) =>
    typeof v === 'string' && v.length >= min && v.length <= max;

  return (
    isStr(data.title, 2, 120) &&
    typeof data.category === 'string' &&
    ['paper_prints', 'outdoor_prints', 'cladding', 'prominent_letters'].includes(data.category) &&
    isStr(data.subCategory, 2, 80) &&
    isStr(data.description, 5, 1000) &&
    isStr(data.clientName, 2, 100) &&
    isStr(data.dimensions, 1, 80) &&
    isStr(data.materials, 2, 160) &&
    isStr(data.finishing, 2, 160) &&
    isStr(data.executionTime, 1, 60) &&
    isStr(data.imageUrl, 0, 600000) &&
    isStr(data.visualPreset, 2, 60) &&
    typeof data.featured === 'boolean' &&
    typeof data.isPublic === 'boolean' &&
    typeof data.displayOrder === 'number' &&
    data.displayOrder >= 0 &&
    data.displayOrder <= 10000 &&
    isValidIdRule(data.ownerId) &&
    data.ownerId === authUid &&
    typeof data.createdAt === 'string' &&
    typeof data.updatedAt === 'string'
  );
}

function evaluateRules(req: SimulatedRequest): 'ALLOWED' | 'PERMISSION_DENIED' {
  if (req.collection === 'projects') {
    if (req.operation === 'create') {
      if (!isVerifiedAdminRule(req.auth)) return 'PERMISSION_DENIED';
      if (!isValidIdRule(req.pathId)) return 'PERMISSION_DENIED';
      if (!req.incomingData || !isValidProjectItemRule(req.incomingData, req.auth!.uid)) {
        return 'PERMISSION_DENIED';
      }
      if (
        req.incomingData.createdAt !== req.requestTime ||
        req.incomingData.updatedAt !== req.requestTime
      ) {
        return 'PERMISSION_DENIED';
      }
      return 'ALLOWED';
    }
    if (req.operation === 'update') {
      if (!isVerifiedAdminRule(req.auth)) return 'PERMISSION_DENIED';
      if (!isValidIdRule(req.pathId)) return 'PERMISSION_DENIED';
      if (!req.incomingData || !req.existingData) return 'PERMISSION_DENIED';
      if (!isValidProjectItemRule(req.incomingData, req.auth!.uid)) return 'PERMISSION_DENIED';
      if (req.incomingData.ownerId !== req.existingData.ownerId) return 'PERMISSION_DENIED';
      if (req.incomingData.createdAt !== req.existingData.createdAt) return 'PERMISSION_DENIED';
      if (req.incomingData.updatedAt !== req.requestTime) return 'PERMISSION_DENIED';
      return 'ALLOWED';
    }
  }
  if (req.collection === 'settings' || req.collection === 'admins') {
    if (!isVerifiedAdminRule(req.auth)) return 'PERMISSION_DENIED';
  }
  return 'PERMISSION_DENIED';
}

const NOW = '2026-10-25T17:00:00Z';
const VALID_ADMIN: SimulatedAuth = {
  uid: 'admin_uid_1',
  email: 'nedal010m@gmail.com',
  email_verified: true,
};

const VALID_PROJECT_PAYLOAD: Record<string, unknown> = {
  title: 'كروت شخصية فاخرة',
  category: 'paper_prints',
  subCategory: 'كروت شخصية فاخرة',
  description: 'طباعة كروت شخصية فاخرة ببصمة ذهبية',
  clientName: 'شركة الأفق',
  dimensions: '9 × 5.5 سم',
  materials: 'ورق كوشيه 350 جرام',
  finishing: 'سلوفان مط وبصمة ذهبية',
  executionTime: '3 أيام',
  imageUrl: '',
  visualPreset: 'cards_gold_foil',
  featured: true,
  isPublic: true,
  displayOrder: 1,
  ownerId: 'admin_uid_1',
  createdAt: NOW,
  updatedAt: NOW,
};

test('firestore.rules file exists and enforces default deny + verified admin checks', () => {
  const rulesText = fs.readFileSync('firestore.rules', 'utf8');
  assert.equal(rulesText.includes("rules_version = '2';"), true);
  assert.equal(rulesText.includes('allow read, write: if false;'), true);
  assert.equal(rulesText.includes("request.auth.token.email_verified == true"), true);
  assert.equal(rulesText.includes("request.auth.token.email == 'nedal010m@gmail.com'"), true);
});

test('Dirty Dozen Payload 1-12 all return PERMISSION_DENIED', () => {
  // 1. Unauthenticated write
  assert.equal(
    evaluateRules({
      auth: null,
      pathId: 'proj_1',
      collection: 'projects',
      operation: 'create',
      requestTime: NOW,
      incomingData: VALID_PROJECT_PAYLOAD,
    }),
    'PERMISSION_DENIED'
  );

  // 2. Unverified email spoof
  assert.equal(
    evaluateRules({
      auth: { uid: 'admin_uid_1', email: 'nedal010m@gmail.com', email_verified: false },
      pathId: 'proj_1',
      collection: 'projects',
      operation: 'create',
      requestTime: NOW,
      incomingData: VALID_PROJECT_PAYLOAD,
    }),
    'PERMISSION_DENIED'
  );

  // 3. Non-admin authenticated write
  assert.equal(
    evaluateRules({
      auth: { uid: 'intruder', email: 'intruder@example.com', email_verified: true },
      pathId: 'agency_profile',
      collection: 'settings',
      operation: 'update',
      requestTime: NOW,
    }),
    'PERMISSION_DENIED'
  );

  // 4. Shadow field injection on create
  assert.equal(
    evaluateRules({
      auth: VALID_ADMIN,
      pathId: 'proj_1',
      collection: 'projects',
      operation: 'create',
      requestTime: NOW,
      incomingData: { ...VALID_PROJECT_PAYLOAD, isVerified: true },
    }),
    'PERMISSION_DENIED'
  );

  // 5. Shadow field injection on update
  assert.equal(
    evaluateRules({
      auth: VALID_ADMIN,
      pathId: 'proj_1',
      collection: 'projects',
      operation: 'update',
      requestTime: NOW,
      existingData: VALID_PROJECT_PAYLOAD,
      incomingData: { ...VALID_PROJECT_PAYLOAD, ghostField: 'hack' },
    }),
    'PERMISSION_DENIED'
  );

  // 6. Owner identity spoofing
  assert.equal(
    evaluateRules({
      auth: VALID_ADMIN,
      pathId: 'proj_1',
      collection: 'projects',
      operation: 'create',
      requestTime: NOW,
      incomingData: { ...VALID_PROJECT_PAYLOAD, ownerId: 'other_uid' },
    }),
    'PERMISSION_DENIED'
  );

  // 7. Immutable field mutation (createdAt changed on update)
  assert.equal(
    evaluateRules({
      auth: VALID_ADMIN,
      pathId: 'proj_1',
      collection: 'projects',
      operation: 'update',
      requestTime: NOW,
      existingData: VALID_PROJECT_PAYLOAD,
      incomingData: { ...VALID_PROJECT_PAYLOAD, createdAt: '2099-01-01T00:00:00Z' },
    }),
    'PERMISSION_DENIED'
  );

  // 8. Invalid category enum
  assert.equal(
    evaluateRules({
      auth: VALID_ADMIN,
      pathId: 'proj_1',
      collection: 'projects',
      operation: 'create',
      requestTime: NOW,
      incomingData: { ...VALID_PROJECT_PAYLOAD, category: 'hacked_category' },
    }),
    'PERMISSION_DENIED'
  );

  // 9. Oversized string (> 120 chars for title)
  assert.equal(
    evaluateRules({
      auth: VALID_ADMIN,
      pathId: 'proj_1',
      collection: 'projects',
      operation: 'create',
      requestTime: NOW,
      incomingData: { ...VALID_PROJECT_PAYLOAD, title: 'أ'.repeat(200) },
    }),
    'PERMISSION_DENIED'
  );

  // 10. ID Poisoning Attack
  assert.equal(
    evaluateRules({
      auth: VALID_ADMIN,
      pathId: 'invalid id with spaces!$%',
      collection: 'projects',
      operation: 'create',
      requestTime: NOW,
      incomingData: VALID_PROJECT_PAYLOAD,
    }),
    'PERMISSION_DENIED'
  );

  // 11. Forged client timestamp
  assert.equal(
    evaluateRules({
      auth: VALID_ADMIN,
      pathId: 'proj_1',
      collection: 'projects',
      operation: 'create',
      requestTime: NOW,
      incomingData: { ...VALID_PROJECT_PAYLOAD, updatedAt: '2020-01-01T00:00:00Z' },
    }),
    'PERMISSION_DENIED'
  );

  // 12. Self-assigned admin escalation
  assert.equal(
    evaluateRules({
      auth: { uid: 'intruder', email: 'intruder@example.com', email_verified: true },
      pathId: 'intruder',
      collection: 'admins',
      operation: 'create',
      requestTime: NOW,
    }),
    'PERMISSION_DENIED'
  );

  // Verify valid admin payload succeeds
  assert.equal(
    evaluateRules({
      auth: VALID_ADMIN,
      pathId: 'proj_1',
      collection: 'projects',
      operation: 'create',
      requestTime: NOW,
      incomingData: VALID_PROJECT_PAYLOAD,
    }),
    'ALLOWED'
  );
});
