# WhatsApp Mobile Application Clone

A full-stack, real-time mobile messaging application inspired by **WhatsApp**, developed with **React Native (Expo)**, **TypeScript**, **Expo Router**, **Socket.IO**, **Expo SQLite**, **Expo SecureStore**, and a custom **Node.js + Express + TypeScript** backend powered by concurrency-safe **JSON file persistence**.

---

## 1. Project Description

This project is a complete mobile messaging system built for Android and iOS. It implements end-to-end JWT authentication, real-time bidirectional 1-on-1 and group messaging over WebSockets (Socket.IO), delivery and read receipts (`sent` -> `delivered` -> `read`), live typing indicators, online/offline presence tracking, 24-hour text status updates, community groups, simulated voice/video calls, persistent Light/Dark/System themes, and offline-first mobile synchronization using **Expo SQLite**.

---

## 2. Project Objectives

- Apply core and advanced **React Native** concepts (`FlatList`, `SectionList`, `KeyboardAvoidingView`, custom modals, and responsive Flexbox layouts) in a production-grade mobile architecture.
- Implement nested **Expo Router** navigation combining **Stack**, **Drawer** (`Profile`, `New Group`, `Starred Messages`, `Archived Chats`, `Settings`, `Help`, `Logout`), **Bottom Tabs** (`Chats`, `Updates`, `Communities`, `Calls`), and parameterized routes (`/chat/[id]`, `/contact/[id]`).
- Architect clean global state management using the **React Context API** (`AuthContext`, `ThemeContext`, `ChatContext`) and `useReducer`, strictly decoupling UI state from REST and WebSocket services.
- Build a custom **Express + TypeScript** REST API and **Socket.IO** real-time server from scratch using **JSON files** (`users.json`, `conversations.json`, `messages.json`, `groups.json`, `statuses.json`) with a concurrency-safe write queue and atomic file replacement.
- Persist mobile data locally using **Expo SQLite** (conversations, messages, contacts, and offline outbox queue) and **Expo SecureStore** (JWT tokens).

---

## 3. Technologies Used

### Frontend (Mobile)
- **Framework:** React Native `0.76` with Expo SDK `52`
- **Language:** TypeScript (`strict: true`)
- **Navigation:** Expo Router v4 (`Stack`, `Tabs`, `@react-navigation/drawer`)
- **State Management:** React Context API + `useReducer`, `useContext`, `useCallback`, `useMemo`, `useRef`
- **Real-Time Client:** `socket.io-client`
- **Local Database:** `expo-sqlite` (WAL mode, indexed tables)
- **Secure Credentials:** `expo-secure-store` & `@react-native-async-storage/async-storage`

### Backend (Server)
- **Runtime & Framework:** Node.js, Express.js, TypeScript
- **Real-Time Engine:** Socket.IO (mounted on the shared Node `http.Server`)
- **Authentication & Security:** `jsonwebtoken` (JWT) & `bcrypt` (10-round salted password hashing)
- **Persistent Storage:** Custom asynchronous `JsonStorageService<T>` backed by `backend/data/*.json` and `uuid` v4 identifiers

---

## 4. Main Features

- **Authentication & Security:** Welcome, Registration (Full Name, Email, Password, Confirm Password validation), and Login screens; bcrypt password hashing; JWT Bearer protection on all private REST routes and Socket.IO handshakes; token storage in `Expo SecureStore`.
- **Chats Screen:** `FlatList` conversation list with contact avatars, online badges, unread counters, live `"typing..."` preview, search bar, filter chips (`All`, `Unread`, `Online`, `Groups`), long-press to archive/unarchive, and a New Chat contact selector modal.
- **Individual Chat Screen:** Real-time messaging via Socket.IO, WhatsApp sent (`#DCF8C6` / `#005C4B`) and received (`#FFFFFF` / `#202C33`) bubbles, single grey check (`sent`), double grey check (`delivered`), and double blue check (`read`) indicators, live typing indicator, long-press to star messages, and automatic scrolling via `useRef`.
- **Updates Screen:** `SectionList` partitioning 24-hour status updates into **Recent updates** (unviewed green ring) and **Viewed updates** (grey ring), plus a full-screen Status Composer with customizable background colors and a Status Viewer tracking view counts.
- **Communities & Groups:** `SectionList` grouping groups by parent community, Group Details modal with member lists and admin badges, and a **New Group** creator (`POST /api/groups`).
- **Calls Screen:** Clearly labeled **Simulated Call Functionality** with incoming/outgoing/missed audio and video call history and an interactive active call screen with a live duration timer.
- **Theme System:** Full **Light Mode**, **Dark Mode**, and **System Default Mode** support persisted across app restarts.
- **Offline-First SQLite Sync:** Hydrates chats and messages from `expo-sqlite` on launch, syncs with the backend when online, and queues outgoing messages in `pending_outbox` when offline.

---

## 5. Frontend Architecture

```text
frontend/
  app/
    _layout.tsx                # Root Stack + ThemeProvider, AuthProvider, ChatProvider
    index.tsx                  # Auth session guard & redirector
    (auth)/
      _layout.tsx              # Auth Stack layout
      welcome.tsx              # WhatsApp Welcome screen
      login.tsx                # Login screen (+ quick demo user fill)
      register.tsx             # Registration screen with field validation
    (drawer)/
      _layout.tsx              # Drawer layout with CustomDrawerContent
      profile.tsx              # Editable Profile & avatar customizer
      new-group.tsx            # Multi-contact Group creation screen
      starred.tsx              # Starred Messages screen
      archived.tsx             # Archived Chats screen
      settings.tsx             # Profile, Theme, Account, Privacy, Notifications, Logout
      help.tsx                 # Help Center & Live System Diagnostics
      (tabs)/
        _layout.tsx            # Bottom Tabs (Chats, Updates, Communities, Calls)
        chats.tsx              # Conversation list with Search & Filters
        updates.tsx            # Status Updates (SectionList)
        communities.tsx        # Communities & Groups (SectionList)
        calls.tsx              # Simulated Audio & Video Calls
    chat/
      [id].tsx                 # Parameterized Individual Chat screen
    contact/
      [id].tsx                 # Parameterized Contact Info screen
  src/
    components/                # CustomDrawerContent, ConversationItem, MessageBubble
    contexts/                  # AuthContext, ThemeContext, ChatContext (useReducer)
    database/                  # sqliteService.ts (Expo SQLite persistence & outbox)
    services/                  # api.ts, authService.ts, chatService.ts, socketService.ts
    theme/                     # colors.ts (Light & Dark palettes)
    types/                     # Shared TypeScript interfaces
    utils/                     # secureStorage.ts, formatTime.ts
```

---

## 6. Backend Architecture

```text
backend/
  src/
    config/
      env.ts                   # Environment variable loader
    controllers/               # auth, user, conversation, message, group, status controllers
    middleware/                # authMiddleware.ts (JWT), errorMiddleware.ts
    models/
      repositories.ts          # Singleton JsonStorageService instances & toPublicUser()
    routes/                    # Express routers for /api/auth, /users, /conversations, etc.
    services/
      jsonStorage.ts           # Concurrency-safe generic JSON file storage service
    sockets/
      socketHandler.ts         # Socket.IO server, rooms, presence, receipts, typing events
    types/
      index.ts                 # Backend entity interfaces
    utils/
      AppError.ts              # Custom HTTP error class
      jwt.ts                   # JWT sign & verify helpers
      runIntegrationTests.ts   # 12-part automated integration test suite
    index.ts                   # HTTP server entry point mounting Express & Socket.IO
  data/
    users.json
    conversations.json
    messages.json
    groups.json
    statuses.json
```

---

## 7. JSON Storage Explanation

All backend data persists in `backend/data/*.json` through `JsonStorageService<T>` (`backend/src/services/jsonStorage.ts`):
1. **Per-File Asynchronous Write Queue:** Every read and write operation on a JSON file is chained onto a `Promise` queue (`this.writeQueue`) so concurrent requests never interleave or overwrite each other.
2. **Atomic Temp-File Replacement:** Before touching the target `.json` file, `writeRaw()` validates the serialized JSON via `JSON.parse()`, writes it to a process-scoped `.tmp` file, and atomically renames the `.tmp` file over the destination `.json` file.
3. **Automatic Missing-File Recovery:** `ensureFileExists()` automatically creates `backend/data/` and initializes missing files with `[]`.
4. **UUID Identifiers & Password Security:** Every created entity receives a `uuid` v4 `id`, and user passwords are hashed with `bcrypt` (`10` salt rounds) before storage.

---

## 8. Socket.IO Implementation

Socket.IO runs on the same `http.Server` instance as Express (`backend/src/sockets/socketHandler.ts`):
- **JWT Handshake Middleware (`io.use`)**: Verifies `socket.handshake.auth.token` before allowing any connection.
- **Rooms**: Connected users automatically join their personal room (`user:<userId>`) and their conversation rooms (`conversation:<conversationId>`).
- **Client-to-Server Events**:
  - `user:online`
  - `conversation:join`
  - `conversation:leave`
  - `message:send`
  - `message:delivered`
  - `message:read`
  - `typing:start`
  - `typing:stop`
- **Server-to-Client Events**:
  - `message:new`
  - `message:sent`
  - `message:delivered`
  - `message:read`
  - `user:online`
  - `user:offline`
  - `typing:update`

---

## 9. Installation & Environment Configuration

### Prerequisites
- **Node.js** v18+ (tested on v24) and **npm**
- **Expo Go** app on your Android/iOS device, or **Android Studio Emulator** / **Xcode iOS Simulator**

### 1. Clone the Repository & Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

Copy `backend/.env.example` to `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

`backend/.env` values:
```env
PORT=4000
JWT_SECRET=replace_with_a_strong_secret_key_in_local_env
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
```

*(Optional)* For the frontend, `getBackendBaseUrl()` in `frontend/src/services/api.ts` automatically detects your LAN IP in Expo Go, `http://10.0.2.2:4000` on Android Emulator, and `http://localhost:4000` on iOS Simulator. To override manually, copy `frontend/.env.example` to `frontend/.env` and set `EXPO_PUBLIC_API_URL`.

---

## 10. How to Start the Backend & Frontend

### Start the Backend Server (Port 4000)

```bash
cd backend
npm run dev
```

To run the 12-part automated backend + Socket.IO test suite:
```bash
cd backend
npm run build
npm test
```

### Start the Frontend (Expo)

```bash
cd frontend
npx expo start
```

---

## 11. Android and iOS Testing Instructions

1. **Ensure Backend is Running:** Start `npm run dev` in `backend/` first.
2. **Testing on Android Emulator:** Press `a` in the Expo terminal (or run `npm run android`). The app automatically connects to `http://10.0.2.2:4000`.
3. **Testing on iOS Simulator (macOS):** Press `i` in the Expo terminal (or run `npm run ios`). The app automatically connects to `http://localhost:4000`.
4. **Testing on Physical Android / iOS Device:** Ensure your phone and computer are on the same Wi-Fi network and scan the QR code in **Expo Go**.
5. **Testing Two-User Real-Time Messaging:**
   - Open the app on two devices/simulators (or one emulator + one web browser via `w`).
   - On the Login screen, tap **Fill Alice** (`alice@example.com` / `password123`) on Device 1 and **Fill Bob** (`bob@example.com` / `password123`) on Device 2 (or register two new accounts).
   - Open their conversation to observe live typing indicators (`typing...`), instant message delivery, double-blue read receipts, and online/offline presence updates.

---

## 12. Screenshots

> Place your captured Android & iOS screenshots in a `screenshots/` folder at the project root and reference them below:

| Welcome & Auth | Chats List (Light & Dark) | Individual Chat (Real-Time) | Updates, Communities & Calls |
|---|---|---|---|
| `screenshots/auth.png` | `screenshots/chats.png` | `screenshots/conversation.png` | `screenshots/tabs.png` |

---

## 13. Future Improvements

- End-to-end signal-protocol payload encryption with device key pairs.
- Push notifications when the app is backgrounded using `expo-notifications`.
- Voice note recording (`expo-av`) and image/document attachments (`expo-image-picker`).
- WebRTC peer-to-peer media streams for live audio and video calls.

---

## 14. Author Information

- **Author:** Second-Year Computer Engineering Student
- **Course:** Mobile Development Midterm Project
- **Environment:** Google Antigravity IDE
# mobile-midterm-official
