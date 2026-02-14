project_root/
├── menstrual-app/                                  # FRONTEND: React Native (Expo Dev Build)
│   ├── app/                                        # Expo Router: File-based routing
│   │   ├── (auth)/                                 # Authentication Route Group
│   │   │   ├── _layout.tsx
│   │   │   ├── login.tsx                           # Login Screen
│   │   │   └── welcome.tsx                         # Welcome Screen
│   │   ├── (tabs)/                                 # Main App Tabs Route Group
│   │   │   ├── _layout.tsx
│   │   │   ├── chat.tsx                            # AI Chat Screen
│   │   │   ├── index.tsx                           # Dashboard/Home
│   │   │   └── profile.tsx                         # User Profile
│   │   ├── _layout.tsx                             # Root Layout (Providers, Auth Check)
│   │   └── app.config.ts                           # Expo Config
│   ├── components/                                 # UI Components
│   │   ├── DailyLog/                               # Daily Log Feature Components
│   │   │   ├── ActivityCard.tsx
│   │   │   ├── DailyLogContainer.tsx
│   │   │   ├── DailyLogForm.tsx
│   │   │   ├── EditOptionsModal.tsx
│   │   │   └── LogSection.tsx
│   │   ├── Calendar.tsx
│   │   └── SplashScreen.tsx                        # Custom Splash Screen
│   ├── db/                                         # DATA LAYER: WatermelonDB (Offline-First)
│   │   ├── model/
│   │   │   └── DailyLog.ts                         # DailyLog WatermelonDB Model
│   │   ├── index.ts                                # DB Initialization
│   │   └── schema.ts                               # DB Schema Definitions``
│   ├── store/                                      # STATE MANAGEMENT
│   │   └── authStore.ts                            # Zustand + MMKV (Persisted Auth)
│   ├── types/
│   ├── assets/
│   ├── babel.config.js
│   ├── metro.config.js
│   ├── tailwind.config.js                          # NativeWind Config
│   └── package.json
│
└── backend/                                        # BACKEND: FastAPI
    ├── app/                                        # Application Source
    │   ├── api/                                    # [EMPTY] Intended for API Routers
    │   ├── core/                                   # [EMPTY] Intended for Config/Settings
    │   ├── db/                                     # [EMPTY] Intended for DB Session/Repo
    │   ├── schemas/                                # [EMPTY] Intended for Pydantic Models
    │   ├── services/                               # [EMPTY] Intended for Business Logic
    │   ├── main.py                                 # App Entry Point
    │   └── __init__.py
    ├── Dockerfile                                  # Container Definition
    └── requirements.txt                            # Python Dependencies
