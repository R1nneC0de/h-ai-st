# HEIST — CLAUDE.md

## What This Is
Single-player browser game for Hacklanta 2026 (Jack of All Trades track). Casino heist controlled almost entirely by laptop accelerometer/gyroscope. Three laser corridors, three casino mini-games, one 7-digit vault code assembled from mini-game results. Built to be unhinged to watch from the outside.

## Stack
- **React + Vite** — app shell, game state routing
- **Three.js** via `@react-three/fiber` + `@react-three/drei` — all rendering (3D throughout, no flat 2D)
- **GSAP** — cinematic transitions, vault door, countdowns
- **Howler.js** — all audio
- **Zustand** — global state (phase, score, vault digits, laser section)
- **DeviceOrientation + DeviceMotion API** — core input, requires HTTPS
- **Vercel** — deploy (handles HTTPS for sensor permissions)
- No backend. Everything client-side.

## Game Flow
```
Splash → Laser 1 → Slots → Laser 2 → Roulette → Laser 3 → Blackjack → Vault Entry → Vault Reveal
```

## Sensor Mapping (Forward/Backward Only — Laptop Primary)
| Axis | Action |
|------|--------|
| `beta` decreases (tilt screen away) | Move forward in corridor |
| `beta` increases (tilt screen toward) | Move backward |
| `beta` tilt past threshold | Spin slot reels (commitment maps to speed) |
| `alpha` rotation | Spin roulette wheel |
| `beta` forward (committed, held 500ms) | Blackjack: Hit |
| `beta` backward (committed, held 500ms) | Blackjack: Stand |
| Flat/still | Dead Still mechanic (if used) |

> **No left/right (gamma) movement.** Laptop tilting sideways is impractical. Corridor is a forward/backward timing gauntlet.

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
- HTTPS required for DeviceOrientation — dev with `ngrok` or deploy to Vercel early and test on device
- Tilt thresholds must be deliberate — too sensitive = accidental triggers
- Auto-drift forward in laser if player stationary too long
- Trackpad used **only** in Roulette betting phase (no mouse — trackpad click/tap)
- Keyboard used **only** in Vault code entry
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
    useDeviceOrientation.js
    useDeviceMotion.js
  store/
    useGameStore.js
  audio/
    sounds.js         # Howler instances
  utils/
    scoring.js
    vaultCode.js
```

## Build Priority Order
1. `useDeviceOrientation` hook — verify sensor access first, everything depends on it
2. Zustand store + phase routing
3. Laser corridor (core loop)
4. Mini-games (Slots → Roulette → Blackjack)
5. Transitions + GSAP sequences
6. Vault entry + reveal
7. Audio pass
8. Polish + deploy
