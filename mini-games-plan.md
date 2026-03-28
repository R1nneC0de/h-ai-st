# HEIST — Mini-Games Implementation Plan

Focused plan for **Slots**, **Roulette**, and **Blackjack**: what the repo has today, what to build first, and how to achieve **showpiece-quality 3D UI and motion** (R3F + GSAP + Howler + post-processing).

---

## 1. Codebase snapshot (as of now)

| Area | Status |
|------|--------|
| **Stack** | React 19, Vite 8, `@react-three/fiber` + `drei`, Three.js, GSAP, Howler, Zustand — all in `package.json`, not yet wired for gameplay |
| **App** | Single `Canvas` with ambient + gold point light, `drei` `<Text>` ("HEIST" / "scaffold loaded"), background `#080808` |
| **Dev HTTPS** | `@vitejs/plugin-basic-ssl` — good for later `DeviceOrientation` / `DeviceMotion` |
| **Design tokens** | `src/index.css` defines palette (felt, gold, neon red, laser, amber) + Playfair / JetBrains Mono (HTML fonts) |
| **GDD** | `project.md` — full mechanics, scoring, transitions |
| **Missing for mini-games** | Zustand store, phase router, `useDeviceOrientation` / motion hooks, `public/fonts` directory (App.jsx references `/fonts/PlayfairDisplay-Black.ttf` but file doesn't exist), Howler sound map, shared HUD, mini-game components |

**Implication:** Mini-games should be built **after** a thin global layer exists: `phase`, `score`, `vaultDigits[]`, and sensor hooks. Otherwise each mini-game will re-implement state and be hard to integrate with lasers and vault later.

---

## 2. Design doc vs implementation guide (`CLAUDE.md`)

Resolve these **before** coding blackjack / laser movement so controls stay consistent:

| Topic | `project.md` | `CLAUDE.md` (repo rule) |
|--------|----------------|-------------------------|
| Laser lateral movement | Gamma — sidestep | **No left/right** — forward/back only |
| Blackjack actions | Tilt **left** = Hit, **right** = Stand | **Beta forward** (held) = Hit, **beta backward** (held) = Stand |

**Recommendation:** Implement **CLAUDE.md** mapping for shipped build (laptop-first). If you want `project.md`'s left/right blackjack, treat it as an alternate profile (e.g. tablet).

---

## 3. Shared environment: `CasinoStage` wrapper

Every mini-game renders inside a shared `CasinoStage` component so they feel like rooms in the same expensive casino — not three disconnected demos. Build this once, mount it around each game.

### 3.1 Scene graph

```
<CasinoStage>
  ├─ <Floor />           felt-textured plane, slight reflectivity
  ├─ <FogLayer />        drei <Fog> near=8 far=30 color="#080808"
  ├─ <KeyLight />        warm spot from above-right, casts shadows
  ├─ <RimLight />        gold (#c9a84c) from behind, outlines props
  ├─ <FillLight />       very dim cool ambient so shadows aren't crushed
  ├─ <BokehBackground /> instanced quads at z=-20, random sizes,
  │                      subtle parallax on camera, slight shimmer
  ├─ <VelvetRopes />     low-poly rope + stanchion instances at edges
  ├─ <CasinoAmbience />  Howler: distant crowd murmur, chip clatter, ducked during gameplay
  └─ {children}          the actual mini-game
</CasinoStage>
```

### 3.2 Lighting rig (shared)

| Light | Type | Color | Intensity | Purpose |
|-------|------|-------|-----------|---------|
| Key | `SpotLight` | `#fff5e0` warm white | 1.5 | Hero illumination, casts the only sharp shadows |
| Rim | `PointLight` | `#c9a84c` gold | 0.6 | Edge glow on chrome/glass, reads as "expensive" |
| Fill | `AmbientLight` | `#1a1a2e` cool blue-black | 0.15 | Prevents pitch-black crush without flattening |
| Accent (per game) | `RectAreaLight` / `PointLight` | Varies | Low | Local color wash — neon red for slots danger, green for felt, gold for jackpot |

Shadows: `SpotLight` with `shadow-mapSize={[1024,1024]}`, `shadow-bias={-0.001}`, only on the key light. Soft penumbra `0.4`.

### 3.3 Materials system

Define a small set of reusable materials as a `materials.js` module:

| Name | Base | Key Properties |
|------|------|---------------|
| `chromeMat` | `MeshStandardMaterial` | `metalness: 1`, `roughness: 0.15`, `envMapIntensity: 1.2` — for slot machine body, roulette chrome ring |
| `goldMat` | `MeshStandardMaterial` | `color: #c9a84c`, `metalness: 0.9`, `roughness: 0.25` — trim, filigree, accents |
| `feltMat` | `MeshStandardMaterial` | `color: #0a3d2e`, `roughness: 0.95`, `metalness: 0` — roulette/blackjack table surface |
| `glassMat` | `MeshPhysicalMaterial` | `transmission: 0.9`, `roughness: 0.05`, `ior: 1.5`, `thickness: 0.5` — slot machine glass panel |
| `neonMat` | `MeshStandardMaterial` | `emissive: #ff2d4b`, `emissiveIntensity: 2`, `toneMapped: false` — laser accents, warning strips |
| `velvetMat` | `MeshStandardMaterial` | `color: #2a0a0a`, `roughness: 1.0`, `metalness: 0` — rope trim, slot machine surround |

Pair with a drei `<Environment preset="night" />` tuned to low intensity (0.3) for convincing reflections on chrome/glass without extra work.

### 3.4 Typography system

Two tiers:

| Tier | Tech | Use Case | Font |
|------|------|----------|------|
| In-scene 3D | drei `<Text3D>` with `@react-three/drei` `FontLoader` or `<Text>` (Troika) | Titles, vault digit flash, hand totals, "JACKPOT" | Playfair Display Black (download `.ttf` to `public/fonts/`) |
| In-scene numeric | drei `<Text>` (Troika, lighter weight) | Scores, countdown numbers, reel symbols, bet amounts | JetBrains Mono (download `.ttf` to `public/fonts/`) |

**No HTML overlays for identity text.** All game-facing typography lives in 3D so it catches lighting, casts shadows, and can be animated with GSAP/R3F.

Exception: Roulette betting grid uses `drei` `<Html>` for precise click targets (CSS-styled, not default browser chrome).

---

## 4. Post-processing pipeline

Shared `EffectComposer` from `@react-three/postprocessing`, always mounted:

| Effect | Config | Purpose |
|--------|--------|---------|
| **Bloom** | `intensity: 0.4`, `luminanceThreshold: 0.8`, `luminanceSmoothing: 0.3` | Neon glow on emissive materials, laser halo, jackpot flash |
| **Vignette** | `offset: 0.3`, `darkness: 0.7` | Draws eye to center, noir framing |
| **ChromaticAberration** | `offset: [0, 0]` default, animated to `[0.005, 0.005]` on jackpot/21/bust | Momentary distortion on high-drama beats |
| **Noise** | `opacity: 0.03` | Subtle film grain, breaks up banding in dark areas |

Performance: disable bloom on low-DPR devices (`dpr < 1.5`). Chromatic aberration is zero-cost when offset is `[0,0]`.

---

## 5. Motion design system (GSAP + R3F)

### 5.1 Principles

| Concern | Owner | Why |
|---------|-------|-----|
| Timelines (sequenced, labeled, scrubable) | **GSAP** | Intro camera moves, phase changes, digit flash, outro pulls. Labels let audio sync via `call()` |
| Continuous physics-driven motion | **R3F `useFrame`** | Reel spin, ball orbit, card lerp, idle sway. Runs every frame, driven by velocity/damping |
| Spring-like settling | **GSAP with custom ease** or manual damped spring in `useFrame` | Reel overshoot, lever snap-back, card landing bounce |

### 5.2 Shared timing language

Every mini-game follows this 5-beat structure so they feel rhythmically related:

```
ENTER  →  INTERACT  →  RESOLVE  →  REVEAL  →  EXIT
```

| Beat | Duration | GSAP Timeline Label | What Happens |
|------|----------|---------------------|--------------|
| **ENTER** | 1.5–2s | `enter` | Camera dollies in + slight orbit, game prop scales from 0 → 1 with `elastic.out(1, 0.5)`, title card fades |
| **INTERACT** | Variable | — | Player agency: tilt, click, hold. No timeline — `useFrame` driven |
| **RESOLVE** | 2–4s | `resolve` | Outcome plays out: reels stop, ball lands, cards fan. Sound synced to motion |
| **REVEAL** | 2s (exactly) | `reveal` | Vault digits appear large (scale `0 → 1.2 → 1` with overshoot), glow pulse, score update animates, then digits fade to dashes |
| **EXIT** | 1.5s | `exit` | Camera pulls back, game prop scales down, fog thickens, transition to next phase |

### 5.3 Camera choreography

Each game gets a short scripted camera move on ENTER and EXIT. During INTERACT, camera is static (or very subtly breathing — tiny sine oscillation on Y, amplitude 0.02, period 4s).

| Game | Enter Camera | Interact Camera | Exit Camera |
|------|-------------|----------------|-------------|
| Slots | Dolly from z=8 → z=4, slight orbit 10deg right, 1.5s `power3.inOut` | Static with idle breathe | Pull to z=10, fade fog |
| Roulette | High angle drop from y=6 → y=3.5, orbit 15deg, 1.8s `power2.inOut` | Slow drift (0.5deg/s orbit) during spin; snap zoom on ball drop | Pull up + back |
| Blackjack | Push from z=6 → z=3, slight tilt down 5deg, 1.5s `expo.out` | Static overhead angle, slight breathe | Slow pull back + up |

### 5.4 Easing vocabulary

Consistent easing across all games:

| Context | Ease | Rationale |
|---------|------|-----------|
| Mechanical stops (reel land, lever snap, bolt retract) | `power4.out` with 10-15% overshoot | Feels heavy and physical |
| Luxury UI (score counter, digit scale, title fade) | `expo.out` | Snappy entry, long smooth tail |
| Elastic celebration (jackpot text, 21 burst) | `elastic.out(1, 0.4)` | Bouncy energy without being cartoonish |
| Camera moves | `power2.inOut` or `power3.inOut` | Cinematic — smooth acceleration and deceleration |
| Urgent/dramatic (bust scatter, laser hit flash) | `power4.in` | Aggressive ramp, feels like impact |

---

## 6. Shared UI components

### 6.1 `<HUD />`

HTML overlay (drei `<Html>` or raw DOM) pinned to screen corners. Stays across all phases.

| Element | Position | Visual |
|---------|----------|--------|
| Score | Top-right | JetBrains Mono, `#c9a84c`, counter animates with GSAP `snap` on change |
| Vault dashes | Top-center | 7 monospace characters, filled digits glow briefly then become `—`, unfilled are dim `—` |
| Phase indicator | Bottom-left | Subtle small text, fades between phases |

Score counter: on change, animate from old → new value using `gsap.to(ref, { innerText: newVal, snap: { innerText: 1 }, duration: 0.6 })` so digits visibly roll.

### 6.2 `<VaultDigitFlash />`

The critical 2-second memorization moment after each game. This is a **3D element**, not HUD:

1. **Appear** (0–0.3s): Digits materialize at camera-center, scale `0 → 1.3` with `elastic.out`, emissive gold, bloom ramps to `intensity: 1.0`
2. **Hold** (0.3–1.7s): Digits gently pulse (emissive intensity oscillates 1.5–2.0 on a sine wave), subtle particle motes drift around them
3. **Burn** (1.7–2.0s): Digits flash white, chromatic aberration spikes, then scale to 0 with `power4.in` — feels like they're being seared into memory
4. Audio: A resonant chime on appear, a rising tone during hold, a sharp whoosh on burn

### 6.3 `<CountdownOverlay />`

Between mini-games and laser re-entry:

- **3... 2... 1...** as 3D `<Text3D>` at center-screen
- Each number: scale up from 0 with `back.out(3)`, hold 0.6s, collapse with `power4.in`, bass pulse audio on each
- On "0" / "GO": Screen flash, all lights spike for 1 frame, transition fires

### 6.4 `<MiniGameTitle />`

On entering each game: "SLOTS" / "ROULETTE" / "BLACKJACK" in 3D Playfair Display, gold, positioned above the game prop.

- Fade in + drift down (y+0.5 → y+0) over 0.8s with `expo.out`
- Hold 1.0s
- Fade out + drift up over 0.5s
- Slight emissive glow, catches the key light

---

## 7. Mini-Game 1 — Slots

### Component tree

```
<CasinoStage>
  <MiniGameTitle text="SLOTS" />
  <SlotMachine>
    ├─ <MachineBody />        chrome + gold, velvet trim (chromeMat, goldMat, velvetMat)
    ├─ <GlassPanel />         MeshPhysicalMaterial transmission (glassMat)
    ├─ <Reel index={0} />     cylinder geometry, symbol texture atlas UV-mapped
    ├─ <Reel index={1} />
    ├─ <Reel index={2} />
    ├─ <Lever />              hinged arm, spring return
    ├─ <SymbolHighlights />   drei RectAreaLight per reel, activate on stop
    └─ <JackpotLights />      instanced small bulbs around frame, chase pattern on 777
  </SlotMachine>
  <VaultDigitFlash digits={vaultDigits.slice(0,3)} />
</CasinoStage>
```

### Reel design (the hero element)

Each reel is a `CylinderGeometry` (radiusTop=0.6, radiusBottom=0.6, height=0.8, radialSegments=5, heightSegments=1, openEnded=false).

- 5 symbol faces around the circumference, each face a textured quad from a sprite atlas
- Symbol atlas: single 512x512 PNG with 5 symbols in a row, UV-mapped per face
- Visible through glass panel — only the front-facing symbol is "active"
- Spin axis: local Y rotation

### Lever mechanics

- **Idle:** Lever mesh at rest angle (30deg from vertical)
- **Pull detection:** `useDeviceOrientation` beta spike > threshold within 300ms window
- **Animation:** On pull, GSAP tweens lever to 60deg over 0.2s (`power2.in`), then spring return to 30deg over 0.4s with overshoot ease (`elastic.out(1, 0.6)`)
- **Haptic feel:** Machine body does a micro-shake (position jitter ±0.01 over 0.15s) on lever pull

### Spin → Stop animation sequence

```
[PULL]
  t=0.0   Lever yanks, machine shakes, spin sound starts
  t=0.0   All 3 reels begin spinning (useFrame: rotation.y += velocity * dt)
           Initial velocity proportional to tilt commitment
           Velocity decays per frame: v *= 0.995 (fast spin lasts ~3s)

[REEL 1 STOP]
  t=2.5   Reel 0 velocity drops below threshold → snap to nearest symbol
           Overshoot: rotate 5deg past target, spring back over 0.3s
           CLUNK sound + symbol backlight flashes on
           Machine body micro-bounce (y += 0.015, spring back)

[REEL 2 STOP]
  t=3.5   Same sequence for Reel 1, 1s after Reel 0

[REEL 3 STOP]
  t=4.5   Same for Reel 2
           If matching symbols detected → hold 0.5s beat before celebration

[JACKPOT / RESULT]
  t=5.0   777: Chase lights fire, coin particle burst (instanced gold discs,
           gravity + random horizontal velocity, 200 particles, 2s lifetime),
           bloom intensity spikes to 1.5, jackpot fanfare, score +300
           Two match: lights pulse twice, chime, score +50
           No match: quiet settle, ambient returns

[VAULT DIGITS]
  t=6.5   VaultDigitFlash fires (2s total), then exit beat
```

### Animation quality targets

- **Motion blur fake:** While `|velocity| > threshold`, reel faces get a UV scroll effect (slight vertical smear on the symbol texture) — cheaper than real motion blur, reads as speed
- **Glass reflections:** `glassMat` catches the key light and symbol backlights — subtle caustic shimmer as reels spin behind it
- **Ambient machine life:** Even before pull, a subtle idle hum, faint vibration on the body (sine position offset, amplitude 0.002), one light on the frame does a slow chase

---

## 8. Mini-Game 2 — Roulette

### Component tree

```
<CasinoStage>
  <MiniGameTitle text="ROULETTE" />
  <RouletteTable>
    ├─ <Wheel>
    │   ├─ <WheelBase />        outer chrome ring (chromeMat), inner wood
    │   ├─ <PocketRing />       instanced wedges, alternating red/black/green(0)
    │   ├─ <WheelCenter />      gold hub with decorative spokes
    │   ├─ <Ball />             small shiny sphere, animated along rim → spiral → pocket
    │   └─ <SpokeDividers />    thin chrome fins between pockets
    ├─ <FeltTable />            feltMat, green, extends to camera-left
    ├─ <BettingGrid />          drei <Html> overlay for click targets (CSS-styled)
    ├─ <TimerBar />             HTML overlay, 15s countdown, gold fill depleting
    └─ <ChipStack />            3D chip at player's bet position (goldMat)
  </RouletteTable>
  <VaultDigitFlash digits={vaultDigits.slice(3,5)} />
</CasinoStage>
```

### Betting phase (15s) — the calm moment

This is the only mouse-driven phase. It should feel unhurried and luxurious:

- **Grid layout:** drei `<Html>` positioned above the felt plane, styled with CSS variables from `index.css`. Numbers 0–36 in standard roulette layout. Red/black chips as toggle.
- **Hover:** Number cell background shifts to translucent gold, slight scale bump (CSS `transform: scale(1.05)`, 0.15s transition)
- **Select:** Gold border, chip mesh spawns at the 3D position corresponding to the selected number (GSAP scale 0→1 with `back.out(2)`, 0.3s). If selection changes, chip slides to new position (0.4s `power2.inOut`)
- **Timer bar:** Horizontal bar at top of grid, starts full gold, depletes left-to-right over 15s. Last 5s: bar pulses amber (`#ff8c00`), soft tick-tock audio fades in
- **Auto-lock:** At 0s, bet locks. If no bet placed, random fallback (highlighted briefly so player sees it)

### Spin phase — physical spectacle

- **Trigger:** "Tilt to spin" prompt (3D text, pulsing gently). Player rotates laptop (alpha axis). `useDeviceOrientation` maps alpha delta to angular velocity
- **Wheel rotation:** `useFrame` — `wheel.rotation.y += angularVelocity * dt`. Velocity builds while player rotates, caps at max. On release (alpha stable for 500ms), velocity begins decaying
- **Ball release:** Once spin velocity crosses minimum threshold, ball releases from rim:
  1. **Rim orbit** (1.5s): Ball travels along outer rim, speed matched to wheel + slight relative velocity. Audio: rhythmic click as ball crosses each spoke (Howler sprite, rate-shifted to match speed)
  2. **Spiral descent** (1.5s): Ball path radius decreases on a logarithmic curve, speed fluctuating. Camera does a slow zoom toward the wheel center
  3. **Pocket capture** (0.5s): Ball drops into final pocket. Micro-bounce (2 bounces, decreasing amplitude). Sharp click on each bounce. Final rest.

- **Ball path math (no physics engine):** Parametric curve in `useFrame`. Angle advances based on velocity. Radius shrinks per frame: `r = r0 * e^(-k*t)`. Final pocket index determined by weighted PRNG seeded from initial spin speed — visually "unpredictable" without rigid body simulation.

### Result reveal

- **Win:** Pocket glows (emissive ramp on the wedge material), confetti burst (instanced gold/red quads, 150 particles, fountain trajectory), score animates, camera holds on the winning number for 1s
- **Color-only win:** Pocket glows, smaller chime, moderate celebration
- **Miss:** Wheel settles, brief silence, ambient returns. No punishment — just quiet

### Animation quality targets

- **Wheel wobble:** As spin decays below a threshold, add a subtle rotational wobble (sin wave on X rotation, amplitude 0.5deg, increasing period) — feels like real physical deceleration
- **Ball click cadence:** The spoke-crossing clicks speed up and slow down with the ball. This is the audio signature of roulette — get it right and the scene sells itself
- **Felt texture:** Subtle normal map on the felt material — even without a texture file, a noise-based bump gives it physical presence under the key light

---

## 9. Mini-Game 3 — Blackjack

### Component tree

```
<CasinoStage>
  <MiniGameTitle text="BLACKJACK" />
  <BlackjackTable>
    ├─ <FeltSurface />       feltMat, rounded rectangle, gold trim border
    ├─ <DeckStack />         8-card-thick box mesh, top card slightly offset
    ├─ <PlayerHand>
    │   └─ <Card /> × n     instanced mesh, front/back textures, thickness=0.02
    ├─ <HandTotal />         large 3D text above cards, updates live
    ├─ <TiltPrompt />        "FORWARD = HIT  |  BACKWARD = STAND" pulsing 3D text
    ├─ <CommitIndicator />   radial fill ring around HandTotal, fills over 500ms hold
    └─ <HeartbeatPulse />    ambient PointLight that pulses with heartbeat audio
  </BlackjackTable>
  <VaultDigitFlash digits={vaultDigits.slice(5,7)} />
</CasinoStage>
```

### Card design (the hero element)

Each card is a `BoxGeometry(0.7, 1.0, 0.02)` with 6-material array:

- **Front face:** Canvas texture generated at runtime — white background, suit symbol, rank text, corner indices. Generated once per unique card into a texture cache
- **Back face:** Repeating diamond pattern in `#2a0a0a` / `#c9a84c` (velvet + gold)
- **Edges:** Dark grey (`#1a1a1a`), slight roughness — reads as card stock thickness

Cards cast shadows onto the felt. When stacked, the slight offset (each card 0.025 above the previous + 0.3 units to the right) creates a natural fan.

### Deal animation

Each card follows an arc path from deck to hand position:

1. **Lift** (0–0.15s): Card rises from deck stack (y += 0.3, `power2.out`)
2. **Arc** (0.15–0.5s): Bezier curve from deck position to hand slot, with a peak y offset of 0.5 above the table. Slight Z-rotation (twist ±15deg during flight, settling to 0). Uses GSAP `motionPath` or manual bezier in timeline
3. **Land** (0.5–0.7s): Card arrives at position, micro-bounce (y overshoot 0.03, spring back). Shadow sharpens as card approaches felt. Crisp "card slide" audio on land

Two cards dealt in staggered sequence: card 1 at t=0, card 2 at t=0.5. Hand total appears after card 2 lands (scale up from 0, `back.out(2)`, 0.3s).

### Hit / Stand interaction

**500ms commit hold** is critical to prevent accidental triggers:

- **Tilt detection:** Forward beta below threshold = "hit intent", backward beta above threshold = "stand intent"
- **Commit ring:** A radial progress ring (torus geometry or shader) appears around the hand total, filling clockwise over 500ms while the tilt is held. If player releases early, ring resets (fast fade, 0.15s)
- **Trigger:** Ring completes → action fires. Ring flashes gold and disappears
- **Hit:** New card deals from deck (same arc animation). Total updates with a number-roll animation (old value → new value, 0.3s). If new total > 21, auto-trigger bust
- **Stand:** Cards fan out slightly (each card rotates 3deg outward, stagger 0.1s). Total freezes, gold glow

### Result animations

**21 — the hero moment:**
1. Hand total text scales to 1.5x, color shifts to pure gold
2. All cards flip simultaneously (rotate X 180deg, 0.4s, `back.out(2)`) — dramatic even though they're already face-up, it's a victory lap
3. Gold wash: a `RectAreaLight` above the table ramps from 0 to 2 intensity over 0.3s, then slowly fades over 1.5s
4. Bloom spikes to 1.5, chromatic aberration pulses
5. Triumphant brass hit audio
6. Score +500 counter rolls

**Bust (> 21):**
1. Total text flashes red (`#ff2d4b`), shakes (position jitter ±0.05 over 0.3s)
2. Cards scatter: each card gets a random velocity vector (GSAP `to` on position + rotation, `power4.in` ease, 0.5s) — they slide off the table edges
3. Red neon accent light pulses twice
4. Low thud audio
5. Score -150 counter rolls (red flash on HUD)
6. Brief beat, then total stabilizes for vault digit reveal

**Stand (under 21):**
1. Cards settle, total holds
2. Quiet moment — ambient casino sound fills the gap
3. Transition directly to vault digit reveal

### Animation quality targets

- **Card edge lighting:** The 0.02 thickness edge catches the rim light — this small detail makes cards feel like real objects, not flat planes
- **Heartbeat lighting:** A `PointLight` near the table pulses in sync with the heartbeat audio (intensity oscillates 0.1–0.3 on a sine wave matched to BPM). Gets slightly faster if player total is 18–20 (close to bust territory)
- **Deck depletion:** As cards are dealt, the deck stack mesh height decreases visibly. Small detail, big immersion

---

## 10. Particle systems

Two particle effects shared across games, pooled and reused:

### 10.1 Gold coin burst (Slots jackpot, Vault reveal)

- **Tech:** Instanced `CylinderGeometry(0.08, 0.08, 0.02, 8)` with `goldMat`
- **Count:** 200
- **Behavior:** Fountain emission from machine top, random XZ spread (±2 units), initial Y velocity 3–6 (randomized), gravity -9.8. Each coin rotates on a random axis. Fade alpha over last 30% of lifetime
- **Lifetime:** 2.5s
- **Audio:** Cascading coin-clink sprite (randomized pitch ±0.2)

### 10.2 Confetti (Roulette win, 21, Vault reveal)

- **Tech:** Instanced `PlaneGeometry(0.06, 0.1)` with emissive materials, alternating gold (`#c9a84c`) and red (`#ff2d4b`)
- **Count:** 150
- **Behavior:** Burst from center-top of scene, random XZ, slower gravity (-3), flutter effect (sine wave on X rotation, random phase/frequency per instance)
- **Lifetime:** 3s
- **Audio:** Soft "rush" whoosh on burst

---

## 11. Audio architecture (Howler)

### 11.1 Sound map

```js
const SOUNDS = {
  // Ambient
  casinoAmbience:  { src: 'casino-ambience.mp3', loop: true, volume: 0.15 },
  heartbeat:       { src: 'heartbeat.mp3', loop: true, volume: 0.3 },

  // Slots
  leverPull:       { src: 'lever-pull.mp3', volume: 0.8 },
  reelSpin:        { src: 'reel-spin.mp3', loop: true, volume: 0.5 },
  reelStop:        { src: 'reel-stop.mp3', volume: 0.9 },
  jackpotFanfare:  { src: 'jackpot.mp3', volume: 1.0 },
  coinShower:      { src: 'coins.mp3', volume: 0.7 },
  smallWin:        { src: 'small-win.mp3', volume: 0.6 },

  // Roulette
  wheelSpin:       { src: 'wheel-spin.mp3', loop: true, volume: 0.5 },
  ballClick:       { src: 'ball-click.mp3', volume: 0.4 },   // sprite, rate-shifted
  ballDrop:        { src: 'ball-drop.mp3', volume: 0.8 },
  rouletteWin:     { src: 'roulette-win.mp3', volume: 0.9 },

  // Blackjack
  cardSlide:       { src: 'card-slide.mp3', volume: 0.7 },
  cardFlip:        { src: 'card-flip.mp3', volume: 0.5 },
  bjWin:           { src: 'bj-21.mp3', volume: 1.0 },
  bjBust:          { src: 'bj-bust.mp3', volume: 0.8 },

  // Shared
  digitReveal:     { src: 'digit-reveal.mp3', volume: 0.9 },
  digitBurn:       { src: 'digit-burn.mp3', volume: 0.8 },
  countdown:       { src: 'countdown-pulse.mp3', volume: 1.0 },
  scoreUp:         { src: 'score-up.mp3', volume: 0.5 },
  scorePenalty:     { src: 'score-penalty.mp3', volume: 0.5 },
}
```

### 11.2 Ducking rules

- During vault digit reveal: duck all ambient/game audio to 20% volume over 0.2s, restore after reveal completes
- During countdown: duck ambient to 30%
- Heartbeat: volume scales with tension (proximity to danger in laser, high totals in blackjack)

---

## 12. Implementation sequence (milestones)

### M1 — Foundation (prerequisite for everything)

- [ ] Zustand store: `phase`, `score`, `vaultDigits[]`, `laserSection`, `appendVaultDigits`, `addScore`
- [ ] Phase router in `App.jsx` (switch on `phase`, mount/unmount components)
- [ ] `useDeviceOrientation` hook with permission request UX
- [ ] Download Playfair Display Black + JetBrains Mono `.ttf` to `public/fonts/`
- [ ] `materials.js` shared materials module
- [ ] `CasinoStage` wrapper (lighting, fog, floor, environment)
- [ ] `HUD` component (score + vault dashes)
- [ ] `VaultDigitFlash` component (the 2s reveal)
- [ ] Post-processing pipeline (bloom, vignette, noise)
- [ ] Howler sound manager skeleton

### M2 — Slots

- [ ] `SlotMachine` component: body, glass, 3 reels, lever
- [ ] Reel spin/stop with `useFrame` velocity + GSAP stop sequence
- [ ] Lever tilt detection + animation
- [ ] Symbol → digit mapping + vault digit push
- [ ] Jackpot detection + coin particle burst
- [ ] Enter/exit camera choreography
- [ ] Audio: lever, spin loop, stop clunks, jackpot fanfare

### M3 — Roulette

- [ ] `RouletteTable` component: wheel, pockets, ball, felt, betting grid
- [ ] Betting phase: HTML overlay grid, chip placement, 15s timer
- [ ] Spin phase: alpha rotation → wheel velocity, ball release + parametric path
- [ ] Ball spoke-click audio synced to crossing rate
- [ ] Result detection + pocket highlight
- [ ] Confetti particle burst on win
- [ ] Enter/exit camera choreography
- [ ] Audio: wheel spin, ball clicks, drop, win fanfare

### M4 — Blackjack

- [ ] `BlackjackTable` component: felt, deck, card instances
- [ ] Card texture generation (canvas → texture cache)
- [ ] Deck shuffle + deal animation (arc path)
- [ ] Hit/Stand tilt detection with 500ms commit ring
- [ ] Hand total display + live update
- [ ] 21/bust/stand result animations
- [ ] Enter/exit camera choreography
- [ ] Audio: card slide, flip, 21 brass hit, bust thud, heartbeat

### M5 — Integration + polish

- [ ] Wire all mini-games into phase router with transitions
- [ ] `CountdownOverlay` between games and laser re-entry
- [ ] `MiniGameTitle` enter/exit animations
- [ ] Full audio pass: ducking, volume balancing, sprite timing
- [ ] Chromatic aberration triggers on jackpot/21/bust
- [ ] Performance profiling: ensure 60fps on target hardware
- [ ] HTTPS device testing on real laptop

---

## 13. Definition of done (mini-games vertical slice)

- [ ] Each game lives in **3D** as the primary view; palette matches CSS tokens
- [ ] Shared `CasinoStage` lighting/materials used across all three games
- [ ] Post-processing active: bloom, vignette, noise, chromatic aberration on triggers
- [ ] Vault contributions match GDD; **2-second** memorization flash with full animation sequence
- [ ] Scoring hooks match `project.md` tables (wired to store)
- [ ] GSAP timelines for all 5 beats (enter/interact/resolve/reveal/exit) per game
- [ ] Camera choreography on enter/exit; no jarring snap cuts
- [ ] Particle systems: coin burst + confetti, pooled and reusable
- [ ] Core sounds for every interaction; ducking during vault digit reveal
- [ ] Score counter rolls on change; HUD updates smoothly
- [ ] 500ms commit hold on blackjack prevents accidental triggers
- [ ] 60fps on a 2020+ laptop with discrete/integrated GPU
- [ ] HTTPS dev tested on a real laptop for orientation input

---

## 14. References

- Full mechanics & narrative: `project.md`
- Repo conventions & store shape: `CLAUDE.md`
