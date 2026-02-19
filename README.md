# 🌸 Tapasi — Menstrual Health Tracker

A privacy-first, offline-capable menstrual health tracking app built with **Expo React Native** and **Supabase**. All data is stored locally first using WatermelonDB, with automatic background sync to the cloud.

---

## ✨ Features

### 📅 Daily Logging
Comprehensive daily health tracking including:
- **Bleeding** — flow intensity (Heavy/Medium/Light/Spotting/Clots) & color
- **Mood** — Happy, Neutral, Sensitive, Irritable, Sad, Low Self-Esteem, Procrastinating
- **Symptoms** — Cramps, Backache, Bloating, Nausea, Fatigue, Facial Hair, Acne
- **Cravings** — Sugar, Snacking, Sour
- **Exercise** — Walking, Light Workout + step count
- **Work Load** — Easy, Moderate, High, Overwhelming, Brain Fog
- **Sleep** — Hours slept + quality (Good/Fair/Poor)
- **Weight** — Daily weight tracking (kg)
- **Habits** — Birth control, smoking, alcohol

### 📆 Interactive Calendar
- Visual period date markers and activity indicators
- Date selection with full daily log view
- Month navigation

### 💬 Chat (Demo)
- Health assistant chat interface with message editing
- Planned: AI-powered health insights

### 🔐 Authentication
- **Google Sign-In** via native module + Supabase token exchange
- Session persistence with MMKV storage
- Auto-redirect based on auth state

### 🔄 Offline-First Sync
- Local data stored in **WatermelonDB** (SQLite + JSI for performance)
- Automatic sync to **Supabase PostgreSQL** via RPC functions
- Sync triggers: on every save + on app foreground
- Conflict resolution via WatermelonDB's built-in sync protocol
- Handles new users gracefully (empty initial data)

---

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Expo SDK 54 (Dev Build) | React Native with native modules |
| **Routing** | Expo Router v6 | File-based navigation |
| **Styling** | NativeWind v4 + Tailwind CSS | Utility-first styling |
| **Local Database** | WatermelonDB v0.28 (SQLite + JSI) | Offline-first data layer |
| **Cloud Database** | Supabase PostgreSQL | Remote data storage + RPC sync |
| **Authentication** | Supabase Auth + Google Sign-In | Native OAuth flow |
| **State Management** | Zustand v5 + MMKV | Persisted auth state |
| **UI Components** | Lucide Icons, Expo Blur, React Native Calendars | Premium UI elements |
| **Backend** | FastAPI (scaffolded) | Future API services |

---

## 📁 Project Structure

```
MenstrualApp/
├── menstrual-app/                          # Frontend: Expo React Native
│   ├── app/                                # Expo Router (file-based routing)
│   │   ├── (auth)/                         # Auth route group
│   │   │   ├── welcome.tsx                 # Welcome screen
│   │   │   └── login.tsx                   # Google + email login
│   │   ├── (tabs)/                         # Main app tabs
│   │   │   ├── index.tsx                   # Calendar + daily log
│   │   │   ├── chat.tsx                    # AI chat (demo)
│   │   │   └── profile.tsx                 # User profile + settings
│   │   └── _layout.tsx                     # Root layout (auth + sync)
│   ├── components/
│   │   ├── DailyLog/                       # Log form components
│   │   │   ├── DailyLogContainer.tsx       # Observable wrapper
│   │   │   ├── DailyLogForm.tsx            # Main form (all sections)
│   │   │   ├── ActivityCard.tsx            # Reusable toggle card
│   │   │   ├── EditOptionsModal.tsx        # Filter modal
│   │   │   └── LogSection.tsx              # Section component
│   │   ├── Calendar.tsx                    # Custom calendar component
│   │   └── SplashScreen.tsx                # Animated splash
│   ├── db/                                 # Data layer
│   │   ├── model/DailyLog.ts               # WatermelonDB model
│   │   ├── schema.ts                       # DB schema (v1)
│   │   ├── index.ts                        # DB initialization
│   │   ├── sync.ts                         # Supabase sync service
│   │   └── supabase_sync_setup.sql         # SQL for Supabase RPCs
│   ├── store/authStore.ts                  # Zustand auth store
│   ├── lib/
│   │   ├── supabase.ts                     # Supabase client (MMKV adapter)
│   │   └── storage.ts                      # MMKV initialization
│   └── types/logs.ts                       # TypeScript type definitions
│
├── backend/                                # Backend: FastAPI (scaffolded)
│   ├── app/main.py                         # Entry point
│   ├── Dockerfile                          # Container definition
│   └── requirements.txt                    # Python dependencies
│
├── project_workflow_diagram.md             # Architecture diagram (Mermaid)
└── project_file_structure.md               # Detailed file tree
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Xcode (for iOS) or Android Studio (for Android)
- An Expo account
- A Supabase project

### 1. Clone & Install

```bash
git clone <repo-url>
cd MenstrualApp/menstrual-app
npm install
```

### 2. Environment Variables

Create `menstrual-app/.env`:

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_web_client_id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_google_ios_client_id
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Supabase Setup

1. Create a `daily_logs` table in Supabase (see schema below)
2. Run `db/supabase_sync_setup.sql` in the Supabase SQL Editor to set up:
   - Row Level Security (RLS) policies
   - Auto-update `updated_at` trigger
   - `watermelon_pull` and `watermelon_push` RPC functions

### 4. Run the App

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

> **Note:** This is an Expo Dev Build (not Expo Go) — native modules like Google Sign-In and WatermelonDB require a custom dev client.

---

## 🗄️ Database Schema

### Supabase `daily_logs` Table

```sql
create table public.daily_logs (
  id text not null,
  user_id uuid not null,
  date date not null,
  bleeding_flow text null,
  bleeding_color text null,
  moods_json jsonb null,
  symptoms_json jsonb null,
  cravings_json jsonb null,
  exercise_json jsonb null,
  work_load text null,
  sleep_hours numeric null,
  sleep_quality text null,
  weight numeric null,
  birth_control boolean null,
  smoke boolean null,
  alcohol boolean null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz null,
  constraint daily_logs_pkey primary key (id),
  constraint daily_logs_user_id_fkey foreign key (user_id) references auth.users (id)
);
```

### WatermelonDB Local Schema

Mirrors the Supabase schema with these differences:
- No `user_id` (single-user local DB)
- JSON fields stored as strings (parsed on read/write)
- Timestamps stored as milliseconds (converted during sync)

---

## 🔄 Sync Architecture

```
┌─────────────┐     triggerSync()      ┌──────────────┐
│ WatermelonDB │ ◄──── synchronize() ──► │   Supabase   │
│  (SQLite)    │                         │ (PostgreSQL) │
└─────────────┘                         └──────────────┘
       ▲                                       ▲
       │                                       │
  On Every Save                          RPC Functions
  On App Foreground                  watermelon_pull()
                                     watermelon_push()
```

- **Pull**: Fetches all changes since `lastPulledAt` for the authenticated user
- **Push**: Upserts created/updated records, soft-deletes removed records
- **Debounced**: 2-second debounce prevents excessive sync calls
- **Retry**: Automatic retry-once on failure
- **RLS**: Row Level Security ensures users only access their own data

---

## 🛠️ Development

### Key Commands

```bash
npm run start          # Start Expo dev server
npx expo run:ios       # Build & run on iOS
npx expo run:android   # Build & run on Android
```

### Debugging

- **Reactotron** is configured for development builds (Zustand store inspection)
- All significant actions are logged with `[Module] Action` format
- Sync operations log with `[Sync]` prefix

---

## 📄 License

Private project.
