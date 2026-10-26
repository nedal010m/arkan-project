# Security Specification (Phase 0: Payload-First Security TDD)

## 1. Data Invariants

1. **Default-Deny Catch-All**: Every unlisted path in Firestore is strictly denied (`allow read, write: if false;`).
2. **Verified Admin-Only Mutations**: Only an authenticated user with a verified email (`request.auth.token.email_verified == true`) who is either the bootstrapped studio owner (`nedal010m@gmail.com`) or registered in `/admins/{uid}` may create, update, or delete `/projects/{projectId}` or `/settings/{settingId}`.
3. **Path ID Hardening**: Document IDs (`projectId`, `settingId`, `adminId`) must match `^[a-zA-Z0-9_\-]+$` and be `<= 128` characters.
4. **Strict Schema & Key Whitelisting (Anti-Shadow-Update)**: Every `create` and `update` on `/projects/{projectId}` and `/settings/{settingId}` must pass `isValidProjectItem(incoming())` or `isValidAgencySettings(incoming())`, enforcing exact `hasAll` and `hasOnly` key sets, string `.size()` bounds, and numeric bounds.
5. **Identity & Temporal Integrity**: `ownerId` must equal `request.auth.uid` on creation and remain immutable on update (`incoming().ownerId == existing().ownerId`). `createdAt` must equal `request.time` on creation and remain immutable on update. `updatedAt` must equal `request.time` on both creation and update.
6. **Public Showcase Read Enforcement**: Clients viewing the portfolio without authentication can only read documents where `resource.data.isPublic == true`.

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 (Unauthenticated Write)**: `auth = null` attempting `create` on `/projects/proj_1` -> `PERMISSION_DENIED`.
2. **Payload 2 (Unverified Email Spoof)**: `auth = { uid: 'u1', email: 'nedal010m@gmail.com', email_verified: false }` attempting `create` on `/projects/proj_1` -> `PERMISSION_DENIED`.
3. **Payload 3 (Non-Admin Authenticated Write)**: `auth = { uid: 'intruder', email: 'intruder@example.com', email_verified: true }` attempting `update` on `/settings/agency_profile` -> `PERMISSION_DENIED`.
4. **Payload 4 (Shadow Field Injection on Create)**: Valid admin sending `ProjectItem` with extra field `isVerified: true` -> `PERMISSION_DENIED`.
5. **Payload 5 (Shadow Field Injection on Update)**: Valid admin updating `/projects/proj_1` with an unlisted field `hackedField: 'x'` -> `PERMISSION_DENIED`.
6. **Payload 6 (Owner Identity Spoofing)**: Valid admin creating a project where `ownerId != request.auth.uid` -> `PERMISSION_DENIED`.
7. **Payload 7 (Immutable Field Mutation)**: Valid admin updating `createdAt` or `ownerId` on an existing project -> `PERMISSION_DENIED`.
8. **Payload 8 (Invalid Category Enum)**: Valid admin setting `category: 'invalid_category'` -> `PERMISSION_DENIED`.
9. **Payload 9 (Resource Exhaustion / Oversized String)**: Valid admin setting `title` to a 500-character string (`maxLength` is 120) -> `PERMISSION_DENIED`.
10. **Payload 10 (ID Poisoning Attack)**: Attempting `create` at `/projects/invalid id with spaces!$%` -> `PERMISSION_DENIED`.
11. **Payload 11 (Forged Client Timestamp)**: Valid admin sending a past or future `updatedAt` timestamp (`updatedAt != request.time`) -> `PERMISSION_DENIED`.
12. **Payload 12 (Self-Assigned Admin Escalation)**: Non-admin user attempting to create `/admins/intruder` -> `PERMISSION_DENIED`.
