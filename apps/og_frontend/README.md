# DupMe: Real-Time Multiplayer Piano Memory Game

DupMe is a real-time multiplayer piano memory game built with **Next.js 14 (App Router)** and **Tailwind CSS**. Players create and reproduce sequences of notes across three difficulty modes: **EASY**, **MEDIUM**, and **HARD**. The frontend is fully socket-ready and API-ready, allowing a backend to be attached later without requiring any refactoring.

---

## Project Structure

The core application logic and components reside within the `src/` directory.

```
src/
├── app/
│   ├── layout.tsx                  # Global layout (Inter font + styles)
│   ├── globals.css                 # Tailwind CSS + color tokens
│   └── room/[code]/page.tsx        # Main game screen
├── components/
│   ├── Piano.tsx                   # Interactive keyboard with sound
│   ├── CountdownTimer.tsx          # Circular countdown
│   ├── ScorePanel.tsx              # Score + delta display
│   └── RoundHeader.tsx             # Round / turn indicator
└── lib/
    ├── api/
    │   └── gameService.ts          # Mock REST API layer
    ├── socket.ts                   # socket.io manager (ready for backend)
    ├── store/
    │   └── gameStore.ts            # Zustand global state (for sockets)
    ├── useMockGame.ts              # Temporary local game logic
    ├── types.ts                    # Shared types
    └── time.ts                     # Helper utilities
```

---

## Game Flow

The game is divided into two main phases per round: **CREATE** and **REPRODUCE**.

### CREATE PHASE (Creator's Turn)

1.  The creator presses piano keys to record a sequence.
2.  Sounds play locally, and the keys flash **blue**.
3.  The sequence is designed to be sent to the backend via `note:down` / `note:up` events.
4.  When the timer ends, the backend is expected to store the sequence and trigger a `turn:change` event to initiate the Reproduce Phase.

### REPRODUCE PHASE (Follower's Turn)

The opponent (follower) reproduces the sequence based on the active **Game Mode**:

- **EASY**: Sees pressed keys (blue highlights) and their order numbers ($1, 2, 3$).
- **MEDIUM**: Sees pressed keys only (blue highlights), but no numbers.
- **HARD**: Hears sounds only, with **no visual cue**.

### End of Round / Match

The backend compares results and emits a `score:update` or `game:end` event. The UI then updates both `ScorePanel` components.

---

## Game Modes

The frontend renders the game environment based on the backend’s selected mode:

| Mode       | Visual Feedback | Description                                    |
| :--------- | :-------------- | :--------------------------------------------- |
| **EASY**   | Full visual     | Sees order numbers and pressed key highlights. |
| **MEDIUM** | Highlights only | Sees blue highlights only.                     |
| **HARD**   | Sound only      | No visual feedback.                            |

---

## Main Components

| Component                | Description                                                                                                                                                                                                                                                                              |
| :----------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`Piano.tsx`**          | The interactive keyboard. It supports six keys (C D E F G A), plays audio from `/public/keys/{NOTE}.mp3`, and supports mouse and keyboard input (A–H). It handles various props for disabling, displaying order overlays (`EASY` mode numbers), remote notes, and live press visibility. |
| **`CountdownTimer.tsx`** | A circular timer that displays a countdown (10s or 20s). It uses `requestAnimationFrame` for smooth animation.                                                                                                                                                                           |
| **`ScorePanel.tsx`**     | Displays a user's username, score, and score delta.                                                                                                                                                                                                                                      |
| **`RoundHeader.tsx`**    | Shows the current round number and a turn indicator ("Your Turn" / "Wait for them").                                                                                                                                                                                                     |

---

## Hooks and State Management

### `useMockGame.ts`

This is the **local mock logic** for development, used when a backend is not available. It manages all local game state (round, turn, running, scores, etc.) and handlers (`onCreatorPress`, `onFollowerPress`, etc.). This hook will be replaced by `useGameStore` and socket logic once the backend is integrated.

### `store/gameStore.ts` (Zustand)

This is the global state store designed to hold the real-time room and game state when sockets are active: `roomCode`, `mode`, `round`, `turn`, user data (`me`, `opponent`), `remoteActiveNotes`, `orderOverlay`, and `running`.

---

## Socket Structure (`lib/socket.ts`)

The socket manager is ready to connect via `initSocket(roomCode, userId)`.

### Expected Incoming Events (From Backend)

| Event           | Payload            | Description                       |
| :-------------- | :----------------- | :-------------------------------- |
| `mode:set`      | `{mode}`           | Sets the current difficulty mode. |
| `note:down`     | `{note, user}`     | A key was pressed by a user.      |
| `note:up`       | `{note, user}`     | A key was released by a user.     |
| `pattern:final` | `{pattern:Note[]}` | The final sequence to reproduce.  |
| `turn:change`   | `{turn, user}`     | Changes the current turn.         |
| `score:update`  | `{user, points}`   | Updates a user's score.           |
| `game:end`      | `{winner}`         | Ends the current match.           |

### Expected Outgoing Emits (To Backend)

| Event          | Payload                  |
| :------------- | :----------------------- |
| `note:down`    | `{note, roomCode, user}` |
| `note:up`      | `{note, roomCode, user}` |
| `turn:end`     | `{roomCode, turn}`       |
| `pattern:done` | `{pattern}`              |
| `game:reset`   | `{roomCode}`             |

---

## Backend API Mock (`lib/api/gameService.ts`)

This service provides **placeholder methods** for all necessary backend interactions (e.g., `increasePoint`, `startGame`, `savePattern`, `checkPattern`, etc.). The current implementations use `console.log` and are ready to be replaced with real `fetch` calls.

```typescript
// Example real fetch:
async increasePoint(user, pts) {
  return fetch("/**api/increasePoint**", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userName: user, points: pts })
  }).then(r => r.json());
}
```

---

## Game Page (`app/room/[code]/page.tsx`)

The main game screen uses `useMockGame` for local development, but its component layout and props are structured for socket integration.

**Piano Component Logic:**

```tsx
<Piano
  disabled={!running || !iAmActing}
  onPress={onPianoPress}
  orderOverlay={mode === "EASY" ? orderOverlay : null}
  remoteActiveNotes={remoteActiveNotes}
  livePressVisible={mode !== "HARD"}
  showIndexAboveOnPress={false}
/>
```

**Future Backend Integration Steps:**

- Set `mode` from the socket event `mode:set`.
- Fill `remoteActiveNotes` from `note:down/up`.
- Build `orderOverlay` from `pattern:final`.

---

## Technology Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** with custom color tokens
- **Zustand** for real-time state management
- **Inter font** (Google Fonts)
- **Socket.IO Client** (ready, mocked)
- **REST API** (mocked)

---

## Environment Variables

Configure these in a `.env.local` file:

```bash
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

---

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build production bundle
npm run start    # Serve built app
npm run lint     # Run lint check
```

---

## Deployment Notes

1.  Configure `NEXT_PUBLIC_SOCKET_URL` and `NEXT_PUBLIC_API_URL`.
2.  Ensure all audio files exist in `/public/keys/`.
3.  The backend should use **HTTPS WebSocket**.
4.  **Replace `useMockGame`** with the production `useGameStore` and socket event handlers.

## Summary

The DupMe frontend is a robust, modular foundation ready for real-time multiplayer. It supports all three visual difficulty modes and is built for **plug-and-play backend API and Socket.IO integration** without future refactoring.
