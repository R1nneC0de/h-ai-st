# HEIST — CLAUDE.md

## What This Is
Single-player browser game for Hacklanta 2026 (Jack of All Trades track). Casino heist controlled almost entirely by laptop accelerometer/gyroscope. Three laser corridors, three casino mini-games, one 7-digit vault code assembled from mini-game results. Built to be unhinged to watch from the outside.

## Stack
- **React + Vite** — app shell, game state routing
- **Three.js** via `@react-three/fiber` + `@react-three/drei` — all rendering (3D throughout, no flat 2D)
- **GSAP** — cinematic transitions, vault door, countdowns
- **Howler.js** — all audio
- **Zustand** — global state (phase, score, vault digits, laser section)
- **MacBook accelerometer via WebSocket bridge** — primary input for M3 MacBook Pro. A local Python script reads the Apple SPU accelerometer via IOKit HID and streams orientation data over `ws://127.0.0.1:8765`. The React app consumes this via a `useTilt` hook that normalizes the data into pitch/roll/yaw values. See `sensor-bridge/` directory.
- **DeviceOrientation API** — fallback input path for mobile/tablet (requires HTTPS). Not used on MacBook (returns null on macOS browsers).
- **Vercel** — deploy (hosts the browser game; sensor bridge runs locally on the MacBook)
- No remote backend. Game logic is entirely client-side. The sensor bridge is a local-only process.

## Game Flow
```
Splash → Laser 1 → Slots → Laser 2 → Roulette → Laser 3 → Blackjack → Vault Entry → Vault Reveal
```

## Sensor Input Architecture

### How it works
MacBooks don't expose accelerometer data to browsers — `DeviceOrientation`/`DeviceMotion` APIs return null on macOS. Instead, a local Python WebSocket bridge reads the M3 MacBook Pro's built-in MEMS accelerometer (Apple SPU, `AppleSPUHIDDevice`) via IOKit HID and streams x/y/z acceleration at ~100Hz over `ws://127.0.0.1:8765`. The React app connects to this WebSocket and computes pitch (forward/backward tilt) and yaw (rotation) from the raw acceleration data.

### Sensor bridge (`sensor-bridge/`)
- `bridge.py` — reads accelerometer via `apple-silicon-accelerometer` Python package, computes orientation (Mahony AHRS filter), streams JSON `{ pitch, roll, yaw }` over WebSocket
- Requires: `pip3 install apple-silicon-accelerometer websockets`
- Start with: `python3 sensor-bridge/bridge.py`

### React hook (`useTilt`)
- Connects to `ws://127.0.0.1:8765` on mount
- Exposes `{ pitch, roll, yaw, connected }` — updated every frame
- Falls back to `DeviceOrientation` API if WebSocket unavailable (mobile/tablet)
- Falls back to keyboard (arrow keys) if neither sensor source is available (dev/debug)

### Sensor Mapping (Forward/Backward Only — Laptop Primary)
| Input | Action |
|-------|--------|
| Pitch increases (tilt screen away) | Move forward in corridor |
| Pitch decreases (tilt screen toward) | Move backward |
| Pitch change past threshold | Spin slot reels (commitment maps to speed) |
| Yaw rotation | Spin roulette wheel |
| Pitch forward (committed, held 500ms) | Blackjack: Hit |
| Pitch backward (committed, held 500ms) | Blackjack: Stand |
| Flat/still | Dead Still mechanic (if used) |

> **No left/right (roll) movement.** Laptop tilting sideways is impractical. Corridor is a forward/backward timing gauntlet.

## Vault Code Assembly
| Digits | Source |
|--------|--------|
| 1–3 | Slots reel symbols (Cherry=1, Bell=2, Bar=3, Diamond=4, Seven=7) |
| 4–5 | Roulette result (always 2 digits, e.g. 07 or 23) |
| 6–7 | Blackjack final hand total (always 2 digits, e.g. 08 or 21) |

Each result flashes for **2 seconds** then disappears. Player must memorize.

## Scoring
- Start: **1000 pts**
- Laser hit S1: -20 / S2: -35 / S3: -50 (1.5s invincibility after hit)
- Slots jackpot (777): +300
- Roulette correct number + color: +400 / number only: +200 / color only: +100
- Blackjack 21: +500 / Bust: -150

## Laser Sections
- **S1:** Slow sweeping beams with wide timing gaps, tutorial pace ~60s
- **S2:** Bidirectional + pulsing beams, tighter timing windows, 40% faster ~90s
- **S3:** Rapid-fire + rhythmic pulse patterns, double speed ~90s

## Visual Identity
- Palette: `#080808` bg / `#0a3d2e` felt / `#c9a84c` gold / `#ff2d4b` neon red / `#e8f4ff` laser / `#ff8c00` amber
- Typography: Heavy serif for titles, monospace for numbers/vault code
- Aesthetic: Deep casino noir — Bellagio at 3am

## Key Implementation Notes
- **Sensor bridge must be running** before starting the game — the React app shows a "Connecting to sensor..." state until WebSocket connects
- HTTPS still required if using DeviceOrientation fallback on mobile — dev with Vite SSL plugin, deploy to Vercel
- Tilt thresholds must be deliberate — too sensitive = accidental triggers
- Auto-drift forward in laser if player stationary too long
- Trackpad used **only** in Roulette betting phase (no mouse — trackpad click/tap)
- Keyboard used **only** in Vault code entry (and as debug fallback for tilt)
- Vault validation is local — code assembled in Zustand, compared on confirm

## Zustand Store Shape
```js
{
  phase: 'splash' | 'laser1' | 'slots' | 'laser2' | 'roulette' | 'laser3' | 'blackjack' | 'vault' | 'reveal',
  score: number,
  vaultDigits: string[], // length 7, filled progressively
  laserSection: 1 | 2 | 3,
}
```

## File Structure
```
sensor-bridge/
  bridge.py               # Python WebSocket server — reads MacBook accelerometer, streams pitch/roll/yaw
  requirements.txt        # apple-silicon-accelerometer, websockets
src/
  components/
    Splash.jsx
    LaserCorridor.jsx
    Slots.jsx
    Roulette.jsx
    Blackjack.jsx
    VaultEntry.jsx
    VaultReveal.jsx
    HUD.jsx
  hooks/
    useTilt.js              # primary: WebSocket → accelerometer bridge; fallback: DeviceOrientation → keyboard
  store/
    useGameStore.js
  audio/
    sounds.js         # Howler instances
  utils/
    scoring.js
    vaultCode.js
```

## Build Priority Order
1. Sensor bridge (`sensor-bridge/bridge.py`) + `useTilt` hook — verify accelerometer data flows to browser first, everything depends on it
2. Zustand store + phase routing
3. Laser corridor (core loop)
4. Mini-games (Slots → Roulette → Blackjack)
5. Transitions + GSAP sequences
6. Vault entry + reveal
7. Audio pass
8. Polish + deploy
