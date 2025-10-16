# DupMe Game - Backend

## Features

- Increase / decrease player points
- Start a game and initialize players
- Start a turn (returns role and duration)
- Save and check patterns (with pattern progress tracking)
- Save match results and end a game (leaderboard)
- Reset a game's state
- Retrieve game states and player points for debugging or monitoring

---

## Tech Stack

- Node.js
- TypeScript
- Express

---

## Project Structure

```
apps/backend/
├─ src/
│  ├─ controllers/
│  │  └─ game_controller.ts    # Express route handlers
│  ├─ routes/
│  │  └─ game.ts               # Express router wiring
│  └─ services/
│     └─ game_service.ts       # In-memory game logic
└─ package.json
```

---

## API Reference

Base route: `/api/game`

> All request/response bodies are JSON.

---

### Root & Health Check

**`GET /api/game/`**

- Response: `{ message: "Game API root" }`
- Notes: Quick server health check.

---

### Player Points Management

**`PATCH /api/game/increasePoint`**

- Body: `{ userName: string, points: number }`
- Response: `{ success, userName, previousPoints, addedPoints, newPoints }`
- Notes: Adds points to a player (creates entry if missing).

**`PATCH /api/game/decreasePoint`**

- Body: `{ userName: string, points: number }`
- Response: `{ success, userName, previousPoints, deductedPoints, newPoints }`
- Notes: Deducts points, flooring at 0.

**`GET /api/game/getPlayerPoints/:username`**

- Response: `{ success, username, points }`
- Notes: Retrieve current match points for a player.

---

### Game Management

**`POST /api/game/startGame`**

- Body: `{ roomId: string, players: Player[] }`
- Response: `{ success, roomId, firstPlayer, message, players: [{ username, points }] }`
- Notes: Initializes a new game for a room, randomizes the first player, and resets points to 0.

**`POST /api/game/startTurn`**

- Body: `{ turnId: string, role: "creator" | "follower" }`
- Response: `{ success, turnId, role, duration, message, timestamp }`
- Notes: Returns the turn duration (creator: 10s, follower: 20s).

**`POST /api/game/savePattern`**

- Body: `{ roomId: string, turnId: string, seq: string[] }`
- Response: `{ success, roomId, turnId, length, pattern, message }`
- Notes: Saves the current pattern for a turn.

**`POST /api/game/checkPattern`**

- Body: `{ roomId: string, turnId: string, key: string | string[] }`
- Response: `{ success, correct, nextIndex, done, totalLength, expectedKey, message }`
- Notes: Checks a key or sequence against the current pattern and updates progress.

**`POST /api/game/saveMatchResult`**

- Body: `{ roomId: string, p1: string, p2: string, p1Score: number, p2Score: number, winner: string }`
- Response: `{ success, roomId, match, message }`
- Notes: Updates the scores for a match within a game.

**`POST /api/game/endGame`**

- Body: `{ roomId: string, scores: Record<string, number>, winner: string }`
- Response: `{ success, roomId, winner, leaderboard, message, timestamp }`
- Notes: Finalizes a game and returns a sorted leaderboard.

**`POST /api/game/resetGame`**

- Body: `{ roomId: string }`
- Response: `{ success, roomId, message }`
- Notes: Resets patterns, scores, and turn history for a room.

---

### Game State & Debug Helpers

**`GET /api/game/getGameState/:roomId`**

- Response: `{ success, gameState }`
- Notes: Returns the full current game state for a room.

**`GET /api/game/getAllGameStates`**

- Response: `{ success, gameStates: GameState[] }`
- Notes: Returns all current game states.

---

## Data Models

**User**

```ts
export interface User {
	id: number;
	username: string;
	password_hash: string;
	win_count: number;
	loss_count: number;
	draw_count: number;
	is_active: boolean;
}
```

**GameState**

```ts
interface GameState {
	roomId: string;
	players: Player[];
	currentPattern: string[];
	patternIndex: number;
	firstPlayer?: Player;
	scores: Record<string, number>;
	turnHistory: Array<{
		turnId: string;
		role: "creator" | "follower";
		timestamp: Date;
	}>;
}
```

# Testing Game Services

```bash
set -u

BASE_URL="${BASE_URL:-http://localhost:4000/api/game}"
CURL="${CURL:-curl}"
JQ="$(command -v jq || true)"

# Test data
ROOM_ID="test-room-1"
TURN_ID="turn-1"
PLAYER_A="alice"
PLAYER_B="bob"

# Helpful helpers
print_header() {
  echo
  echo "------------------------------------------------------------------------"
  echo "$1"
  echo "------------------------------------------------------------------------"
}

do_request() {
  local method="$1"; shift
  local url="$1"; shift
  local data="${1:-}"; shift || true

  echo
  echo "-> ${method} ${url}"
  if [[ -n "$data" ]]; then
    echo "   Payload: $data"
  fi

  # Perform request, capture HTTP status and body
  if [[ -n "$data" ]]; then
    response=$($CURL -s -w "\n%{http_code}" -X "$method" "$url" -H "Content-Type: application/json" -d "$data")
  else
    response=$($CURL -s -w "\n%{http_code}" -X "$method" "$url")
  fi

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  echo "   HTTP status: $http_code"
  if [[ -n "$body" ]]; then
    if [[ -n "$JQ" ]]; then
      echo "$body" | jq .
    else
      echo "$body"
    fi
  else
    echo "   (empty body)"
  fi
}

# Start tests
echo "Running Game API tests against: $BASE_URL"
echo "Make sure your server is running."

# 1) Root
print_header "1) GET /"
do_request GET "$BASE_URL/"

# 2) Reset game
print_header "2) POST /resetGame (reset any existing state for room)"
do_request POST "$BASE_URL/resetGame" "{\"roomId\":\"$ROOM_ID\"}"

# 3) Start game
print_header "3) POST /startGame"
START_GAME_PAYLOAD=$(cat <<EOF
{
  "roomId": "$ROOM_ID",
  "players": [
    { "username": "$PLAYER_A" },
    { "username": "$PLAYER_B" }
  ]
}
EOF
)
do_request POST "$BASE_URL/startGame" "$START_GAME_PAYLOAD"

# 4) Get game state
print_header "4) GET /getGameState/:roomId"
do_request GET "$BASE_URL/getGameState/$ROOM_ID"

# 5) Get all game states
print_header "5) GET /getAllGameStates"
do_request GET "$BASE_URL/getAllGameStates"

# 6) Get player points for alice
print_header "6) GET /getPlayerPoints/:username (alice)"
do_request GET "$BASE_URL/getPlayerPoints/$PLAYER_A"

# 7) Increase points (alice)
print_header "7) PATCH /increasePoint (alice +5)"
do_request PATCH "$BASE_URL/increasePoint" "{\"userName\":\"$PLAYER_A\",\"points\":5}"

# 8) Decrease points (bob)
print_header "8) PATCH /decreasePoint (bob -2)"
do_request PATCH "$BASE_URL/decreasePoint" "{\"userName\":\"$PLAYER_B\",\"points\":2}"

# 9) Get updated points for alice
print_header "9) GET /getPlayerPoints/:username (alice)"
do_request GET "$BASE_URL/getPlayerPoints/$PLAYER_A"

# 10) Get updated points for bob
print_header "10) GET /getPlayerPoints/:username (bob)"
do_request GET "$BASE_URL/getPlayerPoints/$PLAYER_B"

# 11) Start Turn (creator)
print_header "11) POST /startTurn (creator)"
do_request POST "$BASE_URL/startTurn" "{\"turnId\":\"$TURN_ID\",\"role\":\"creator\"}"

# 12) Generate random pattern
print_header "12) GET /randomPattern"
do_request GET "$BASE_URL/randomPattern"

# 13) Save pattern
print_header "13) POST /savePattern"
PATTERN_SEQ='["C","D","E","F","G"]'
do_request POST "$BASE_URL/savePattern" "{\"roomId\":\"$ROOM_ID\",\"turnId\":\"$TURN_ID\",\"seq\":$PATTERN_SEQ}"

# 14) Check pattern correct single key
print_header "14) POST /checkPattern (single correct key)"
do_request POST "$BASE_URL/checkPattern" "{\"roomId\":\"$ROOM_ID\",\"turnId\":\"$TURN_ID\",\"key\":\"C\"}"

# 15) Check pattern incorrect key
print_header "15) POST /checkPattern (single incorrect key)"
do_request POST "$BASE_URL/checkPattern" "{\"roomId\":\"$ROOM_ID\",\"turnId\":\"$TURN_ID\",\"key\":\"A\"}"

# 16) Check pattern sequence
print_header "16) POST /checkPattern (sequence of keys)"
do_request POST "$BASE_URL/checkPattern" "{\"roomId\":\"$ROOM_ID\",\"turnId\":\"$TURN_ID\",\"key\":[\"D\",\"E\",\"F\",\"G\"]}"

# 17) Save match result
print_header "17) POST /saveMatchResult"
do_request POST "$BASE_URL/saveMatchResult" "{\"roomId\":\"$ROOM_ID\",\"p1\":\"$PLAYER_A\",\"p2\":\"$PLAYER_B\",\"p1Score\":3,\"p2Score\":1,\"winner\":\"$PLAYER_A\"}"

# 18) End game
print_header "18) POST /endGame"
SCORES_JSON=$(cat <<EOF
{
  "$PLAYER_A": 3,
  "$PLAYER_B": 1
}
EOF
)
do_request POST "$BASE_URL/endGame" "{\"roomId\":\"$ROOM_ID\",\"scores\":$SCORES_JSON,\"winner\":\"$PLAYER_A\"}"

# 19) Get final leaderboard via getGameState
print_header "19) GET /getGameState/:roomId (final)"
do_request GET "$BASE_URL/getGameState/$ROOM_ID"

# 20) Reset game at end
print_header "20) POST /resetGame (cleanup)"
do_request POST "$BASE_URL/resetGame" "{\"roomId\":\"$ROOM_ID\"}"

echo
echo "All requests done."
```
