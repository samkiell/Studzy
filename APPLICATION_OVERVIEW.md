# Studzy Application Overview

**Studzy** is a modern, AI-powered study companion designed to streamline the academic journey for SWE students at oau. It combines resource management, AI-driven study tools, and institutional features into a unified, high-performance web application.

## 🚀 Mission
To empower students by providing smart tools that make studying more efficient, organized, and personalized.

---

## 🛠 Technical Stack

### Frontend
- **Framework**: [Next.js 16+](https://nextjs.org/) (App Router)
- **Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend & Infrastructure
- **BaaS**: [Supabase](https://supabase.com/)
  - **Auth**: Secure email/password authentication & social logins.
  - **PostgreSQL**: Robust relational database with RLS (Row Level Security).
  - **Storage**: Scalable file storage for study materials and user profiles.
  - **Vector DB**: `pgvector` for efficient similarity searches in RAG.
- **AI Engine**: [Mistral AI](https://mistral.ai/) (Embeddings and LLM)
- **Mailing**: [NodeMailer](https://nodemailer.com/)
- **Image Management**: [Cloudinary](https://cloudinary.com/) (Profile images)
- **Deployment**: [Vercel](https://vercel.com/) (with Analytics and Speed Insights)

---

## 🌟 Core Features

### 1. Smart Study Assistant (Studzy AI)
A retrieval-augmented generation (RAG) system that allows students to chat with their study materials.
- **Context-Aware**: AI answers questions based on uploaded PDFs and notes.
- **Source Citation**: Provides references back to the original material.

### 2. AI Study Tools
- **Exam Predictor**: Analyzes study patterns and material complexity to predict exam outcomes.
- **Flashcard Generator**: Automatically creates flashcards from study resources.
- **Quiz Generator**: Generates practice quizzes to test knowledge retention.

### 3. Resource Repository
A centralized hub for academic content.
- **Support for Multiple Formats**: PDF, Video, and Audio.
- **Hierarchical Organization**: Organized by course and level.
- **Featured Materials**: Highlights critical study resources.

### 4. Interactive Dashboard
Provides a personalized view of student progress.
- **Activity Tracking**: Monitor last accessed resources.
- **Progress Tracking**: Visual indicators of completed study goals.
- **Quick Links**: Access to recently used tools and materials.

### 5. Institutional ID System
A digital student ID card system.
- **Dynamic Cards**: High-fidelity digital IDs.
- **Verification QR**: Back-of-card QR codes for institutional validation.

### 6. Admin Control Center
A powerful dashboard for managing the platform.
- **User Management**: Oversee user accounts and roles.
- **Content Management**: Upload and organize courses and resources.
- **RAG Management**: Monitor and test document embeddings.

---

## 🏗 Architecture Overview

Studzy follows a serverless, modern web architecture:

- **Row Level Security (RLS)**: Essential for multi-tenant data protection directly at the database level.
- **Edge Functions / Server Actions**: Next.js server actions handle secure server-side logic and database interactions.
- **RAG Pipeline**:
  1. **Ingestion**: Documents are parsed, chunked, and embedded using Mistral AI.
  2. **Storage**: Vectors reside in Supabase (`study_material_embeddings`).
  3. **Retrieval**: `pgvector` similarity search finds relevant context for user queries.
- **Modular Components**: High reuse of UI components using Tailwind and Radix primitives.

---

## 🔮 Future Improvements

### Short Term
- **Mobile PWA**: Enable "Add to Home Screen" for better mobile accessibility.
- **Collaborative Study Groups**: Enable real-time shared study spaces for peers.
- **Dark Mode Support**: Full system-wide UI themes.

### Medium Term
- **Offline Mode**: Allow users to save study materials for offline access.
- **Voice-to-Note**: AI transcription and summarization for recorded lectures.
- **LTI Integration**: Connect with LMS platforms like Canvas or Moodle.

### Long Term
- **Universal Institutional ID**: A blockchain-verified student identity system.
- **Global Study Marketplace**: Allow top students to share or sell high-quality study notes.
- **Predictive Performance Analytics**: Advanced ML models to suggest optimal study schedules based on performance data.
