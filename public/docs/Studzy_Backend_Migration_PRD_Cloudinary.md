# Studzy Backend Migration PRD

## 1. Objective

Migrate Studzy completely away from Supabase so the application remains
operational when Supabase quotas are exhausted.

Target architecture:

``` text
Next.js
├── Neon PostgreSQL
│   └── Application database
├── Auth.js / NextAuth
│   └── Authentication and sessions
└── Cloudinary
    └── Media/file storage and delivery
        ├── Videos
        ├── Audio
        ├── Images
        ├── PDFs
        └── Other supported resources
```

Preserve existing functionality and avoid unnecessary architectural
changes.

## 2. Migration Scope

Replace:

  Current                         Replacement
  ------------------------------- --------------------
  Supabase PostgreSQL             Neon PostgreSQL
  Supabase Auth                   Auth.js / NextAuth
  Supabase Storage                Cloudinary
  Supabase SSR/session handling   Auth.js / NextAuth
  Supabase Storage SDK            Cloudinary SDK/API

Remove runtime Supabase dependencies after successful cutover. Keep
Supabase intact as the migration/rollback source until verification is
complete.

## 3. Database Migration

Migrate the existing Supabase PostgreSQL database to Neon.

Requirements:

-   Preserve tables, rows, relationships, foreign keys, indexes,
    sequences and constraints.
-   Preserve required PostgreSQL extensions where supported.
-   Preserve/rewrite required functions and RPCs that contain
    Supabase-specific assumptions.
-   Preserve vector/RAG functionality where currently used.
-   Audit and remove Supabase-specific database assumptions.
-   Do not modify or destroy the source database during migration.

Verify:

-   Row counts.
-   Foreign keys and indexes.
-   Important application queries.
-   Courses and CBT questions.
-   User/profile records.
-   Resources.
-   RAG data.
-   Admin data.
-   Other critical tables.

## 4. Authentication Migration

Replace Supabase Auth with Auth.js / NextAuth.

Requirements:

-   Preserve login, signup, logout and sessions.
-   Preserve protected routes and admin authorization.
-   Preserve user identity relationships with application data.
-   Map existing Supabase users to the new auth model.
-   Never expose passwords or authentication secrets.
-   Determine the safest supported strategy for existing password
    migration. If hashes cannot be migrated directly, use a controlled
    account migration/password-reset flow.

Audit every:

-   `auth.getUser()` usage.
-   Supabase session checks.
-   Middleware auth checks.
-   User ID lookups.
-   Protected server actions.
-   Client auth hooks.
-   Admin authorization checks.

## 5. Media and File Storage Migration

Replace Supabase Storage with **Cloudinary**.

Cloudinary will be the primary storage and delivery provider for
media/resources.

Support at minimum:

-   Videos.
-   Audio.
-   Images.
-   PDFs.
-   Documents/resources where supported.
-   Upload.
-   Download.
-   Streaming/video delivery.
-   Delete.
-   Replacement where currently supported.
-   Optimized delivery URLs.
-   Secure/signed delivery where required.

### Migration

``` text
Supabase Storage
      ↓
Migration script / download-transfer process
      ↓
Cloudinary
```

Inventory all Supabase buckets and object paths first.

For each object, preserve useful metadata such as:

-   Original filename.
-   Application filename.
-   MIME type.
-   Resource association.
-   Folder/category.
-   Existing database reference.

Store Cloudinary identifiers/URLs in the appropriate database records
after migration.

Verify:

-   Object/file count.
-   Total migrated size.
-   Every important file type.
-   Video playback.
-   Audio playback.
-   PDF access.
-   Image access.
-   Resource links.
-   Database references.
-   Cloudinary delivery URLs.

Do not delete Supabase objects until migration is fully verified.

### Cloudinary design

Use Cloudinary's SDK/API through a dedicated server-side storage
service.

Create a provider abstraction so application code does not become
tightly coupled to Cloudinary.

Example:

``` text
src/lib/storage/
├── types
├── cloudinary
├── upload
├── download
├── delete
├── list
└── delivery
```

Keep Cloudinary credentials server-side.

Do not expose API secrets through `NEXT_PUBLIC_*`.

## 6. Storage Abstraction

All application file operations should go through the storage
abstraction.

The abstraction should support:

-   Upload.
-   Delete.
-   Replace.
-   Retrieve metadata.
-   Generate delivery URLs.
-   Generate secure/signed URLs where required.
-   Identify provider resource IDs.
-   Handle upload failures.
-   Handle provider quota/limit errors.

The application should not directly call Cloudinary from unrelated UI
components.

## 7. Database Layer

Create/standardize a Neon PostgreSQL access layer.

Requirements:

-   Centralized database connection.
-   Proper Next.js/serverless connection handling.
-   No Supabase client imports.
-   Keep database logic out of UI components where practical.
-   Preserve existing service/domain boundaries.

## 8. Authentication Architecture

Use:

``` text
Next.js
  ↓
Auth.js / NextAuth
  ↓
Neon PostgreSQL
```

Create reusable server-side helpers for:

-   Current user.
-   Require authentication.
-   Require admin.
-   Session access.
-   User ID access.

Protected routes and server operations must use these helpers rather
than provider-specific logic.

## 9. CBT Compatibility

The existing authenticated CBT must continue working.

Verify:

-   Course loading.
-   Question loading.
-   Attempt creation.
-   Attempt ownership.
-   Submission.
-   Scoring.
-   Theory grading.
-   Results.
-   AI explanations.
-   Offline/localStorage sessions.
-   Admin CBT management.

The public `/cbtx` system must remain compatible with the migrated
backend.

Do not unnecessarily modify working authenticated CBT behavior.

## 10. Admin System

Preserve admin functionality and replace its Supabase dependencies.

Admin must continue supporting:

-   Resource uploads.
-   File management.
-   Question management.
-   Course management.
-   User management.
-   Analytics.
-   AI knowledge/RAG management.
-   System health.

### Health System

Update the existing health page to monitor:

-   Neon database health/usage where measurable.
-   Cloudinary storage/media usage.
-   Resource/file counts.
-   Storage growth.
-   Upload failures.
-   Authentication health.
-   Critical service availability.
-   Application errors.

The health page remains the central operational dashboard.

## 11. Cloudinary Guardrails

Retain the existing guardrail system and adapt it to Cloudinary.

The system should:

-   Monitor Cloudinary storage/credit usage.
-   Warn administrators before limits are approached.
-   Block or restrict uploads when configured safety limits are reached.
-   Show banners/toasts.
-   Display current usage and remaining allowance where available.
-   Display growth trends.
-   Display recent/largest files.
-   Allow admins to inspect files from the health page.
-   Allow admins to delete unnecessary files without opening the
    Cloudinary dashboard.
-   Keep provider limits/configuration centralized and configurable.

Recommended application thresholds:

-   60%: Notice.
-   70%: Warning.
-   80%: Critical.
-   90%: Emergency.
-   100%: Exhausted.

Do not hard-code assumptions about Cloudinary's free-plan credits. Make
the allowance configurable because Cloudinary usage can involve storage,
bandwidth, transformations and other resource consumption.

## 12. Environment Variables

Neon:

``` text
DATABASE_URL
```

Auth.js:

``` text
AUTH_SECRET
```

Cloudinary:

``` text
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

Use the exact variables required by the selected Cloudinary SDK.

Never expose secrets through `NEXT_PUBLIC_*`.

## 13. Migration Sequence

### Phase 1: Audit

-   Inspect the entire codebase.
-   Find every Supabase dependency.
-   Find every table/query/function/RPC.
-   Find every auth dependency.
-   Find every storage operation.
-   Find every Supabase URL/reference.
-   Identify every bucket/object category.
-   Produce a migration checklist.

### Phase 2: Database

-   Import PostgreSQL into Neon.
-   Verify schema/data.
-   Fix compatibility issues.
-   Verify critical queries.

### Phase 3: Cloudinary

-   Create/configure Cloudinary account.
-   Configure folders/resource types.
-   Migrate Supabase Storage objects.
-   Verify files and metadata.
-   Update database references.
-   Implement the storage abstraction.
-   Test uploads/deletes/delivery.

### Phase 4: Authentication

-   Implement Auth.js / NextAuth.
-   Migrate user identity relationships.
-   Implement session/protection helpers.
-   Test login, signup, logout, protected routes and admin access.

### Phase 5: Application Refactor

-   Replace Supabase database calls with Neon.
-   Replace Supabase auth with Auth.js.
-   Replace Supabase Storage with Cloudinary.
-   Replace middleware.
-   Update server actions/API routes.
-   Update URLs and environment variables.

### Phase 6: Admin + Health

-   Update uploads.
-   Update resource management.
-   Update RAG/knowledge workflows.
-   Update health metrics.
-   Update Cloudinary guardrails.
-   Add Cloudinary file management.

### Phase 7: Testing

Test:

-   Authentication.
-   Database reads/writes.
-   Resource uploads.
-   Video/audio playback.
-   PDF access.
-   Image access.
-   CBT.
-   Admin features.
-   RAG/AI.
-   Mobile behavior.
-   Error handling.
-   Cloudinary limits.
-   Large-file handling.

### Phase 8: Cutover

1.  Switch production environment variables.
2.  Deploy migrated application.
3.  Verify critical user flows.
4.  Monitor errors.
5.  Keep Supabase intact temporarily for rollback.

### Phase 9: Supabase Removal

After stable verification:

-   Remove Supabase dependencies.
-   Remove obsolete environment variables.
-   Remove unused Supabase code.
-   Remove migration-only code when safe.
-   Keep a final backup/export before deleting source data.

## 14. Engineering Rules

-   Write modular, maintainable code.
-   Reuse existing components/utilities where appropriate.
-   Keep provider-specific code behind abstractions.
-   Do not rewrite unrelated features.
-   Do not unnecessarily break the existing CBT.
-   Never expose secrets.
-   Validate uploads before storage operations.
-   Add clear errors and server-side logging.
-   Make migration scripts repeatable/idempotent where possible.
-   Prefer migration scripts over destructive manual operations.
-   Verify before deleting source data.
-   Keep Cloudinary-specific logic isolated from business logic.

## 15. Definition of Done

The migration is complete when:

-   Studzy runs without Supabase.
-   Neon contains verified application data.
-   Auth.js / NextAuth handles authentication.
-   Cloudinary serves all migrated resources.
-   Videos, audio, PDFs and images work.
-   Admin uploads/deletions work.
-   CBT works.
-   RAG/AI functionality works.
-   Health/guardrails monitor the new infrastructure.
-   No production code requires Supabase credentials.
-   Only the new infrastructure credentials remain in production
    configuration.
-   A verified rollback/backup copy of the original Supabase data
    exists.
