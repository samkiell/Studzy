# Studzy Backend Migration PRD

## 1. Objective

Remove Supabase as Studzy's backend dependency and migrate to a simpler, independently hosted stack so the application remains available even when Supabase quota restrictions occur.

### Target Architecture

```text
Next.js 16+ / React 19
        |
        +-- Auth.js / NextAuth
        |
        +-- Neon PostgreSQL
        |     └── Application data + pgvector/RAG
        |
        +-- Cloudflare R2
        |     └── Videos, audio, PDFs, images, documents
        |
        +-- Existing AI / external services
              ├── Mistral AI
              ├── Cloudinary (where currently used)
              └── Vercel deployment
```

The migration must preserve existing application behavior while removing Supabase Auth, Supabase Storage, Supabase database clients, RLS dependencies, and Supabase-specific server actions/functions.

---

## 2. Scope

### Migrate from Supabase

- Authentication
- PostgreSQL database
- Storage
- Storage access URLs
- RLS-dependent authorization
- Supabase client/server utilities
- Supabase server actions
- Supabase Edge Functions where functionality is still required
- Supabase-specific environment variables
- Supabase-specific middleware/session handling

### Keep

- Next.js App Router
- React
- Tailwind CSS
- Framer Motion
- Existing UI/components
- Existing business logic where possible
- Mistral AI integration
- Cloudinary integration where already used
- Vercel deployment
- Existing RAG concepts and vector search

---

# 3. Migration Principles

1. **Do not rewrite working features unnecessarily.**
2. **Preserve existing database schema and relationships wherever possible.**
3. **Use PostgreSQL → PostgreSQL migration rather than changing database engines.**
4. **Use Cloudflare R2 exclusively for large/static media and file storage.**
5. **Keep authentication independent from database-provider-specific authentication.**
6. **Replace Supabase RLS with explicit server-side authorization.**
7. **Never expose database or storage credentials to the browser.**
8. **Migration must be modular and reversible during development.**
9. **Do not delete Supabase data until the new system has been verified.**
10. **Every migration step must be testable independently.**

---

# 4. Migration Plan

## Phase 1 — Codebase & Dependency Audit

Create a complete inventory of every Supabase dependency.

Identify:

- Supabase imports
- Supabase client creation
- Auth calls
- Database queries
- Storage operations
- RLS assumptions
- Server actions
- API routes
- Middleware logic
- Edge Functions
- Supabase environment variables
- Tables, relationships, indexes, functions, triggers, extensions
- Realtime usage
- pgvector usage
- Auth user/profile relationships

Deliverable: a migration map showing every file that must change.

---

## Phase 2 — Database Schema Migration

Move the existing Supabase PostgreSQL database to Neon PostgreSQL.

Preserve:

- Tables
- Columns
- Data types
- Primary keys
- Foreign keys
- Indexes
- Constraints
- Default values
- PostgreSQL extensions required by Studzy
- `pgvector` functionality where used
- Database functions/RPCs where required

Use the exported Supabase database as the migration source.

Do not redesign the schema during this phase unless required for compatibility.

Deliverable: Neon contains a verified copy of the application database.

---

## Phase 3 — Data Integrity Verification

Compare Supabase and Neon.

Verify:

- Table counts
- Row counts
- Foreign-key relationships
- Important records
- Question banks
- Courses
- Resources
- Profiles
- User-related records
- CBT attempts/answers
- Chat data
- RAG/vector data
- Timestamps
- IDs
- JSON/JSONB fields

Create migration verification scripts where practical.

No production cutover until critical data matches.

---

## Phase 4 — Database Access Layer

Create a centralized PostgreSQL data-access layer for Neon.

Requirements:

- One reusable database connection strategy
- Server-only database access
- Typed queries where practical
- Centralized error handling
- Transaction support
- No direct database credentials in client code

Refactor application features to use this layer instead of Supabase clients.

Do not scatter raw Neon connection logic throughout the application.

---

## Phase 5 — Authentication Migration

Replace Supabase Auth with Auth.js / NextAuth.

Required behavior:

- Existing login flow
- Email/password authentication
- Session persistence
- Logout
- Protected routes
- Admin authorization
- User identity available server-side
- User identity available client-side where required
- Password reset/recovery where supported by the existing product
- Existing user/profile relationships preserved

Map existing Supabase users to the new authentication model.

Do not casually create duplicate users.

Define the migration strategy for password credentials. If existing password hashes cannot be migrated directly, implement a secure account migration/reset flow rather than storing or handling plaintext passwords.

---

## Phase 6 — Authorization Migration

Supabase RLS currently provides database-level protection.

Replace that model with explicit application authorization.

Implement centralized authorization helpers for:

- Authenticated user checks
- User-owned resources
- Admin-only operations
- Resource ownership
- CBT attempts
- User profiles
- Private data
- Administrative actions

Every protected server action/API route must perform authorization before database mutations or sensitive reads.

Never rely on the client for authorization.

---

## Phase 7 — Cloudflare R2 Storage Migration

Move Supabase Storage objects to Cloudflare R2.

Storage categories include:

- Videos
- Audio
- PDFs
- Images
- Other uploaded documents

Preserve application relationships between resources and their files.

Create a storage abstraction such as:

```text
StorageProvider
├── upload()
├── delete()
├── getUrl()
├── exists()
├── list()
└── metadata()
```

The application should depend on this abstraction rather than directly depending on R2 APIs.

Store R2 object keys/metadata in Neon.

Do not expose R2 secret credentials to clients.

---

## Phase 8 — Storage URL & Media Delivery Migration

Replace Supabase Storage URLs throughout Studzy.

Support:

- Video playback
- Audio playback
- PDF access
- Image access
- Resource downloads
- Admin previews

Verify that existing resource records correctly point to their new R2 objects.

Avoid storing large binary files inside Neon.

For public resources, use appropriate public R2 access/custom domain configuration.

For protected resources, use controlled/signed access where required.

---

## Phase 9 — Upload System Migration

Replace all Supabase Storage upload paths.

Audit and migrate:

- Admin resource uploads
- User uploads
- Image uploads
- Video uploads
- Audio uploads
- Document uploads
- Any background upload process

Keep uploads server-authorized.

Integrate the existing health/guardrail concepts with R2 where appropriate:

- File size limits
- MIME validation
- Upload warnings
- Storage monitoring
- Failed-upload cleanup
- Duplicate handling

The new system must prevent the storage problem that caused the original outage.

---

## Phase 10 — RAG & Vector Migration

Preserve Studzy's existing RAG architecture.

Migrate:

- RAG documents
- Chunks
- Embeddings
- Metadata
- Vector indexes
- Similarity-search functions

Neon PostgreSQL must support the required `pgvector` functionality.

Verify:

```text
Document
→ Parsing
→ Chunking
→ Mistral Embedding
→ Neon/pgvector
→ Similarity Search
→ AI Context
→ Response
```

Do not rebuild the RAG system unless migration compatibility requires it.

---

## Phase 11 — Replace Supabase-Specific Application Logic

Remove/rewrite:

- `@supabase/supabase-js`
- `@supabase/ssr`
- Supabase browser clients
- Supabase server clients
- Supabase auth helpers
- Supabase middleware/session logic
- Supabase database queries
- Supabase storage calls
- Supabase RPC calls
- Supabase Edge Function dependencies

Replace them with:

- Auth.js / NextAuth
- Neon PostgreSQL access layer
- R2 storage abstraction
- Native Next.js server actions/API routes
- Existing external services where appropriate

---

## Phase 12 — Application-Wide Regression Testing

Test every major feature against the migrated backend.

### Authentication

- Login
- Signup
- Logout
- Session persistence
- Protected routes
- Admin access

### Core Application

- Dashboard
- Courses
- Resources
- Profiles
- Bookmarks
- Activity/progress

### CBT

- Question loading
- Starting attempts
- Saving answers
- Submitting attempts
- Results
- Theory questions
- CBT history

### Studzy AI

- Chat
- RAG retrieval
- Citations
- AI study tools

### Resources

- Upload
- Download
- Video playback
- Audio playback
- PDF access
- Resource metadata

### Admin

- User management
- Course management
- Resource management
- Question management
- RAG management
- Health/monitoring tools

---

## Phase 13 — Cutover & Environment Migration

Replace production environment variables with the new infrastructure.

Remove Supabase credentials from active application configuration.

Configure:

- Neon database URL
- Auth.js/NextAuth secrets/configuration
- R2 account/bucket credentials
- R2 public/custom-domain configuration
- Existing AI service credentials
- Existing deployment configuration

Deploy and verify production behavior.

Keep the original Supabase project/data intact temporarily as a rollback source.

---

## Phase 14 — Supabase Removal & Final Cleanup

Only after the new production system is verified:

- Remove unused Supabase packages
- Remove Supabase utilities
- Remove dead server actions
- Remove obsolete middleware logic
- Remove unused environment variables
- Remove Supabase-specific code paths
- Remove obsolete RLS assumptions
- Remove unused Edge Functions
- Update documentation
- Update architecture documentation
- Update deployment documentation

Do not delete the original Supabase project until the migration has been stable and the data has been independently backed up.

---

# 5. Target Data Ownership

| Data | New System |
|---|---|
| Users / Auth | Auth.js / NextAuth |
| User profiles | Neon PostgreSQL |
| Courses | Neon PostgreSQL |
| Questions | Neon PostgreSQL |
| CBT attempts | Neon PostgreSQL |
| CBT answers/results | Neon PostgreSQL |
| Resources metadata | Neon PostgreSQL |
| Chat/session data | Neon PostgreSQL |
| RAG documents | Neon PostgreSQL |
| Vector embeddings | Neon PostgreSQL + pgvector |
| Videos | Cloudflare R2 |
| Audio | Cloudflare R2 |
| PDFs | Cloudflare R2 |
| Documents | Cloudflare R2 |
| Resource images | Cloudflare R2 where applicable |
| Profile images | Existing Cloudinary integration unless intentionally migrated |
| AI | Mistral AI |
| Deployment | Vercel |

---

# 6. Security Requirements

- No secrets in client-side code.
- Neon credentials must remain server-side.
- R2 secret keys must remain server-side.
- Auth secrets must remain server-side.
- All mutations require server-side authorization.
- Admin operations require admin authorization.
- Protected resources must not become accidentally public.
- Validate uploads before storage.
- Validate database inputs.
- Preserve secure password handling.
- Do not expose internal storage keys unnecessarily.
- Use signed/private access for resources that require authorization.

---

# 7. Reliability Requirements

The new architecture must not depend on a single BaaS for the entire application.

A failure or quota restriction in R2 must not corrupt database state.

A database outage must not expose private files.

Authentication failure must not bypass authorization.

Uploads must be transactional from the application's perspective:

```text
Validate
→ Upload file
→ Persist metadata
→ Confirm success
```

If metadata persistence fails after upload, the system must clean up the orphaned storage object where possible.

If storage upload fails, the database must not contain a false resource record.

---

# 8. Migration Safety

Before destructive changes:

1. Export/backup Supabase database.
2. Preserve Supabase storage metadata.
3. Verify Neon import.
4. Verify R2 migration.
5. Run application regression tests.
6. Verify authentication.
7. Verify critical production flows.
8. Keep rollback information available.

Never delete the original Supabase data as part of an early migration step.

---

# 9. Success Criteria

Migration is complete when:

- Studzy no longer requires Supabase to function.
- Users can log in without Supabase Auth.
- Application data is served from Neon PostgreSQL.
- RAG/vector search works from Neon.
- Media is served from Cloudflare R2.
- Uploads no longer consume Supabase Storage.
- Existing CBT functionality works.
- Admin functionality works.
- Resource/video/audio access works.
- Authorization is secure.
- No Supabase secrets or runtime dependencies remain.
- Production deployment works independently of Supabase.
- Existing data has been verified after migration.

---

# 10. Execution Rule for AI Agents

This PRD is the source of truth for the migration.

AI agents must:

- Read this PRD before implementing migration work.
- Inspect the existing code before changing it.
- Work in small, modular phases.
- Avoid unrelated refactors.
- Preserve existing behavior.
- Report files changed.
- Report migration assumptions.
- Report unresolved risks.
- Never delete production data without explicit instruction.
- Never invent missing schema, credentials, or migration mappings.
- Verify each phase before moving to the next.

Each implementation prompt should reference the relevant phase(s) of this PRD and should not silently expand the scope.
