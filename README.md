# Book Wise — mobile app

**Book Wise** helps primary-school children practise reading and helps teachers follow their
progress. Children read books in the app, take comprehension tests and do reading-speed sessions
where the app listens to them reading aloud and highlights every word as correct, wrong or
skipped. Teachers create classrooms, assign books, tests and reading fragments, and see results
and statistics.

The UI is available in Ukrainian and English.

It is one of three repositories:

| Repository | Role |
|---|---|
| `book-wise-mobile` (this one) | React Native / Expo app for students and teachers |
| `book-wise-be-java` | REST API, database, file storage, authorization |
| `book-wise-be-python` | Speech recognition, AI test generation, stress check |

## Features

**Students**
- Read PDF books, with the reading position saved
- Comprehension tests for books
- Reading-speed sessions: live word highlighting, words per minute, accuracy, a short quiz
  about the text, and a stress check of the recording
- Reading history with audio playback and a colour legend
- Join a classroom with a code; complete reading fragments assigned by the teacher

**Teachers**
- Classrooms, join codes and local students (children without their own account)
- Assign books and tests; create reading fragments (fixed paragraphs or random excerpts,
  time limit, number of attempts)
- Results per fragment, per student history and statistics (grades, reading time, reading speed)

## Tech stack

- Expo SDK 57, React Native 0.86 (New Architecture), React 19, TypeScript
- Expo Router (file-based routing)
- Tamagui (UI), Redux Toolkit (state)
- Supabase Auth
- `react-native-live-audio-stream` for streaming microphone audio, `expo-audio` for playback
- `react-native-pdf` for reading books
- `react-native-gifted-charts` for statistics

## How it talks to the backends

- **REST** → Java backend (`EXPO_PUBLIC_API_BASE_URL`), with the Supabase access token in the
  `Authorization` header.
- **WebSocket** → Python service (`EXPO_PUBLIC_PYTHON_WS_BASE_URL`) at `/ws/reading-speed` for
  reading-speed sessions: the app sends 16 kHz mono PCM audio and receives word statuses live.

## Getting started

### Prerequisites

- Node.js 24
- Android Studio (Android SDK) and/or Xcode
- Running `book-wise-be-java` and `book-wise-be-python` (see their READMEs)
- A Supabase project

The app uses native modules (microphone streaming, PDF), so it runs as a
[development build](https://docs.expo.dev/develop/development-builds/introduction/),
**not in Expo Go**.

### 1. Install dependencies

```bash
npm install                     # .npmrc sets legacy-peer-deps=true
```

### 2. Configure environment

`app.config.js` loads `.env.production` when `APP_ENV=production`, otherwise `.env.development`:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://<your-lan-ip>:8080
EXPO_PUBLIC_PYTHON_WS_BASE_URL=ws://<your-lan-ip>:8001

SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<anon key>
```

Use your computer's LAN IP (not `localhost`) when running on a physical device.

### 3. Run

```bash
npm run android                 # build and install the dev build on a device/emulator
npm run ios
npm start                       # start Metro for an already installed dev build
```

### Builds (EAS)

```bash
eas build --profile preview --platform android      # internal APK
eas build --profile production --platform android   # Play Store app bundle
```

Backend URLs for EAS builds are set in `eas.json`.

### Other scripts

```bash
npm run lint
npm test
```

## Project structure

```
app/                    # Screens (Expo Router)
├── login.tsx
└── (app)/              # Authenticated area: books, reader, tests, classrooms,
                        # readingSpeed, readingHistory, classroomReading, statistics
components/             # UI components (modals, buttons, inputs, reading speed, statistics)
api/endpoints/          # REST clients for the Java backend
services/               # Reading-speed WebSocket client, audio recorder
auth/                   # Supabase auth provider
store/                  # Redux slices
hooks/, utils/, types/, constants/
localization/           # ua.ts, en.ts
styles/tamagui.config.ts
```
