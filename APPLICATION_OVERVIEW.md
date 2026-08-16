# Studzy Application Overview

**Studzy** is a modern, AI-powered study companion designed to streamline the academic journey for Software Engineering students. It combines course and resource management, AI-driven study tools (CBT exams, theory practice, flashcards, Studzy AI), and institutional verification into a unified, high-performance web application.

## 🚀 Mission
To empower students by providing smart tools that make studying more efficient, organized, and personalized.

---

## 🛠 Technical Stack

### Frontend
- **Framework**: [Next.js 16+](https://nextjs.org/) (App Router, Turbopack, Server Actions)
- **Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend, Database & Storage
- **Database**: [Neon](https://neon.tech/) Serverless PostgreSQL
  - **Vector DB**: `pgvector` extension for high-performance semantic search in RAG.
  - **Connection Pooling**: Serverless `@neondatabase/serverless` connection pool.
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
  - Modular domain schemas (`auth`, `courses`, `cbt`, `theory`, `chat`, `activity`, `rag`).
  - Strict type safety and query performance.
- **Authentication**: [Auth.js / NextAuth v5](https://authjs.dev/)
  - Custom `users` table via `@auth/drizzle-adapter`.
  - Credentials provider with `bcryptjs` password hashing.
  - Google OAuth provider for seamless social logins.
  - Secure Edge-compatible middleware route protection.
- **File & Media Storage**: [Filebase](https://filebase.com/) (S3-Compatible Decentralized Storage)
  - Managed via `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`.
  - Storage bucket for course materials (PDF, Video, Audio) and RAG documents.
- **AI Engine**:
  - [Google Generative AI](https://ai.google.dev/) (Gemini 2.5 Flash) & [Mistral AI](https://mistral.ai/)
- **Mailing**: [Resend](https://resend.com/) & [Nodemailer](https://nodemailer.com/)
- **Deployment**: [Vercel](https://vercel.com/) (with Analytics and Speed Insights)

---

## 🌟 Core Features

### 1. Smart Study Assistant (Studzy AI)
A retrieval-augmented generation (RAG) system that allows students to interact intelligently with their study materials.
- **Context-Aware**: AI answers questions grounded in uploaded PDFs and lecture notes.
- **pgvector Search**: Real-time cosine similarity search across study materials.
- **Source Citation**: Direct referencing to course resources.

### 2. AI Study & Assessment Tools
- **CBT Simulator**: Timed multiple-choice exam simulation with instant scoring, reviews, and analytics.
- **Theory Exam Practice**: Written theory exams with AI-powered multi-criteria grading and feedback.
- **Exam Predictor**: Analyzes study patterns and material complexity to predict exam outcomes.
- **Flashcard Generator**: Automatically generates flashcards from study resources.
- **Quiz Generator**: Generates practice quizzes to test knowledge retention.

### 3. Resource Repository
A centralized hub for academic content.
- **Support for Multiple Formats**: PDF, Video, and Audio streamed directly from Filebase S3.
- **Hierarchical Organization**: Organized by department, course, level, and semester.
- **Bookmarks & Completion Tracking**: Personalized tracking of study progress.

### 4. Interactive Dashboard
Provides a personalized view of student progress.
- **Activity & Streak Tracking**: Real-time heartbeat tracking for daily study streaks.
- **Presence & Study Buddies**: See fellow coursemates currently active in study units.
- **Quick Links**: Access to recently used tools and materials.

### 5. Institutional ID System
A digital student ID card system.
- **Dynamic Cards**: High-fidelity digital IDs with custom avatars and QR code verification.
- **Public Profile Verification**: Dedicated `/id/[username]` verification routes.

### 6. Admin Control Center
A powerful dashboard for managing the platform.
- **User Management**: Oversee user accounts, roles, verification, and status.
- **Content Management**: Upload and organize courses and resources to Filebase S3.
- **RAG Management**: Ingest PDFs, monitor embeddings, and run pgvector similarity diagnostics.
- **Storage & System Health**: Live storage usage monitoring, quotas, and file management.

---

## 🏗 Architecture Overview

Studzy follows a modern serverless web architecture:

- **Server Actions & Route Handlers**: Next.js server actions handle secure server-side logic and database operations with Drizzle ORM.
- **Storage Abstraction**: Centralized Filebase S3 client handles file uploads, presigned URLs, streaming downloads, and deletions.
- **RAG Pipeline**:
  1. **Ingestion**: Documents in Filebase S3 are parsed via `pdf-parse`, chunked, and embedded using Google Generative AI / Mistral.
  2. **Storage**: Vector embeddings (768-dim) reside in Neon (`study_material_embeddings`).
  3. **Retrieval**: Neon `pgvector` cosine similarity (`<=>`) queries return top matching chunks to build contextual prompts for Gemini.
- **Type Safety**: End-to-end TypeScript from database models to client UI components.

---

## 🔮 Future Roadmap

- **Offline Mode**: IndexedDB caching for offline quiz taking and note reading.
- **Real-Time Study Rooms**: Collaborative study sessions and group messaging.
- **Voice-to-Note**: AI transcription and summarization for recorded lectures.
- **LTI Integration**: Canvas, Blackboard, and Moodle integration.
