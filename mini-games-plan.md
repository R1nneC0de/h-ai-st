# HEIST — Mini-Games Implementation Plan

Focused plan for **Slots**, **Roulette**, and **Blackjack**: what the repo has today, what to build first, and how to target **top-tier 3D UI and motion** (R3F + GSAP + audio).

---

## 1. Codebase snapshot (as of now)

| Area | Status |
|------|--------|
| **Stack** | React 19, Vite 8, `@react-three/fiber` + `drei`, Three.js, GSAP, Howler, Zustand — all in `package.json`, not yet wired for gameplay |
| **App** | Single `Canvas` with ambient + gold point light, `drei` `<Text>` (“HEIST” / “scaffold loaded”), background `#080808` |
| **Dev HTTPS** | `@vitejs/plugin-basic-ssl` — good for later `DeviceOrientation` / `DeviceMotion` |
| **Design tokens** | `src/index.css` defines palette (felt, gold, neon red, laser, amber) + Playfair / JetBrains Mono (HTML fonts) |
| **GDD** | `project.md` — full mechanics, scoring, transitions |
| **Missing for mini-games** | Zustand store, phase router, `useDeviceOrientation` / motion hooks, `public/` assets (e.g. `App.jsx` references `/fonts/PlayfairDisplay-Black.ttf` but no `public/fonts` yet), Howler sound map, shared HUD (score + vault dashes), mini-game components |

**Implication:** Mini-games should be built **after** a thin global layer exists: `phase`, `score`, `vaultDigits[]`, and sensor hooks. Otherwise each mini-game will re-implement state and be hard to integrate with lasers and vault later.

---

## 2. Design doc vs implementation guide (`CLAUDE.md`)

Resolve these **before** coding blackjack / laser movement so controls stay consistent:

| Topic | `project.md` | `CLAUDE.md` (repo rule) |
|--------|----------------|-------------------------|
| Laser lateral movement | Gamma — sidestep | **No left/right** — forward/back only |
| Blackjack actions | Tilt **left** = Hit, **right** = Stand | **Beta forward** (held) = Hit, **beta backward** (held) = Stand |

**Recommendation for this plan:** Implement **CLAUDE.md** mapping for shipped build (laptop-first). If you want `project.md`’s left/right blackjack, treat it as an alternate profile (e.g. tablet).

---

## 3. Cross-cutting: top-tier UI and animation

These apply to all three mini-games so they feel like one expensive casino, not three demos.

### 3.1 Visual hierarchy

- **Environment:** Shared “casino pocket” — dim fill, single hero key light, subtle fog, gold rim light on props. Reuse one `CasinoStage` wrapper (floor plane, velvet rope hints, distant bokeh as low-cost quads or `drei` `Environment` preset tuned dark).
- **Materials:** `MeshStandardMaterial` with clear metal/roughness; **anisotropy** on chrome slots; **slight emissive** on neon accents (`#ff2d4b`, `#e8f4ff` sparingly).
- **Typography:** Titles in-scene with `drei` `Text` or MSDF; **vault digits** monospace, huge during the 2s flash, then HUD updates to dashes.

### 3.2 Motion design (GSAP + R3F)

- **Principle:** GSAP drives **timelines** (intro, phase changes, digit flash, outro); R3F `useFrame` drives **continuous** spin, ball orbit, card lerp, lever spring.
- **Easing:** Mechanical stops = `power4.out` or custom overshoot for reels; UI = `expo.out` for luxury snap.
- **Orchestration:** One mini-game = one `gsap.timeline({ defaults: { ease: 'power2.inOut' } })` per “round,” with labels (`spin`, `land`, `reveal`) so audio fires via `call()` or synced Howler sprites.
- **Camera:** Short scripted moves on enter (dolly + slight orbit) — same duration family (e.g. 1.2–1.8s) across games for rhythm.

### 3.3 Polish layer (optional but “top tier”)

- **Post-processing:** `drei` `EffectComposer` + bloom (subtle) + vignette + slight chromatic aberration on jackpot / 21.
- **Particles:** `@react-three/drei` `Points` / instanced meshes for coins (slots jackpot) and confetti (roulette perfect bet); pool and reuse for performance.
- **Screen-space UI:** Minimal HTML overlay only where precision matters (roulette **click** targets, timers); keep **identity** in 3D.

### 3.4 Audio (Howler)

- Per mini-game: spin loop, land thunks, win stingers, fail thuds. **Howl.volume()** ducking during vault digit flash so the read is legible.

### 3.5 Shared outcomes

- **Vault digits:** After each game, compute digits per `project.md`, call `appendVaultDigits`, trigger **2s** full-screen or large floating numerals, then replace with dashes in HUD.
- **Scoring:** Centralize in `utils/scoring.js` (or equivalent) so laser penalties and mini-game bonuses stay consistent with the GDD tables.

---

## 4. Mini-Game 1 — Slots

### Goals (from GDD)

- 3D machine: chrome/gold, velvet trim, glass panel, **3 cylindrical reels**, symbol texture strips.
- **Sharp backward tilt** pulls lever → spin speed tied to tilt “commitment”; lever animates.
- Reels stop **left → center → right** with clunk + symbol flash.
- Symbol → digit map: Cherry 1, Bell 2, Bar 3, Diamond 4, Seven 7 → **vault positions 1–3**.
- Scoring: 777 → +300 + spectacle; two of a kind → +50; else 0.
- Whole beat **under ~60s**.

### Build order

1. **Reel primitive:** Cylinder geometry + UV strip or merged planes with symbol atlas; single component `Reel` with `spinVelocity`, `targetAngle`, `stopped` state.
2. **Lever:** Hinged mesh + quaternion lerp driven by tilt spike from orientation hook.
3. **Tilt → spin:** Detect backward impulse above threshold; map impulse magnitude to peak `spinVelocity` and decay curve.
4. **Stop sequence:** GSAP timeline or staged timeouts: reel1 stop → sound → reel2 → reel3; read final sector index from angle.
5. **Jackpot:** Timeline triggers particle burst, light flash, fanfare; score update.

### Animation quality bar

- Motion blur fake: brief `emissiveIntensity` pulse or scroll UV on reels while `|velocity|` high.
- Each stop: micro **overshoot** (tiny bounce back) then settle.

---

## 5. Mini-Game 2 — Roulette

### Goals (from GDD)

- Angled wheel + green felt; numbered pockets; ball visible.
- **Phase A — Betting (15s max):** Mouse: pick number 0–36 + red/black chip; gold highlight on selection; only place in game that **requires** pointer.
- **Phase B — Spin:** “Tilt to spin” — **alpha** rotation drives wheel speed; after minimum spin, release ball; **one** spin, deterministic result from physics or blended analytic model.
- Result → **two digits** for vault positions 4–5 (0–9 → `0` + digit).
- Scoring: number + color +400; number only +200; color only +100; else 0.

### Build order

1. **Table + wheel mesh** (or procedural torus + pocket instancing); optional simplified collision mesh for ball.
2. **Betting UI:** HTML overlay or `Html` from `drei` above felt for crisp hit targets; 15s countdown bar (styling per CSS variables).
3. **Wheel spin:** `useFrame` integration of angular velocity from device alpha delta; cap and decay.
4. **Ball:** Rim motion → falling inward → pocket resolution (Cannon-es if you add a physics lib later; v1 can be **curated curve** + final pocket index from PRNG weighted by speed for “unpredictable” feel without full rigid body).
5. **Reveal + scoring:** Compare bet vs result; trigger confetti tier; vault flash.

### Animation quality bar

- Wheel: subtle wobble on decay; ball: **click** cadence audio synced to crossing spokes.
- Camera: slight zoom on ball drop phase.

---

## 6. Mini-Game 3 — Blackjack

### Goals (from GDD)

- Felt table, 3D cards with thickness; two cards up to start; total always visible.
- **Hit / Stand** via deliberate tilt (**per CLAUDE.md:** forward hold vs backward hold) with **~500ms** commit to avoid accidents.
- No hard time limit; soft heartbeat under mix.
- Final total → **two digits** for vault positions 6–7 (e.g. 8 → `08`, bust 23 → `2`,`3`).
- Scoring: 21 → +500 + hero moment; bust → −150; stand under 21 → 0.

### Build order

1. **Deck model** (stack mesh) + `Card` component (instanced mesh optional for performance).
2. **Game state:** Standard 52-card deck shuffle; player hand array; simple house rules (dealer can be auto-hit to 17 if you add dealer later — GDD says solo; **player-only** is enough for vault digit).
3. **Deal animation:** GSAP stagger from deck position to slots.
4. **Hit:** Fly-in card; update total; bust detection.
5. **Stand:** Fan cards; freeze total; vault flash; score rules.

### Animation quality bar

- Card deal: arc path + slight twist; **21** — gold wash + simultaneous flip; bust — red pulse + scatter tween.

---

## 7. Suggested implementation sequence (milestones)

1. **Foundation (short):** Zustand store + phase enum + `appendVaultDigits` + `addScore`; `useDeviceOrientation` with permission UX; fix or add **local font** under `public/fonts` for `Text`.
2. **Slots** — smallest interaction surface (one impulse → three stops); proves tilt → vault pipeline.
3. **Roulette** — adds **mouse** phase + two-phase state machine + richer timing.
4. **Blackjack** — most **state**; reuses digit flash and GSAP patterns from earlier games.

---

## 8. Definition of done (mini-games vertical slice)

- [ ] Each game lives in **3D** as the primary view; palette matches CSS tokens.
- [ ] Vault contributions match **GDD**; **2-second** memorization flash; HUD dashes update.
- [ ] Scoring hooks match **project.md** tables (wired to store).
- [ ] GSAP timelines for enter / resolve / exit; no jarring snap cuts.
- [ ] Core sounds for spin, win, lose; HTTPS dev tested on a real laptop for orientation.

---

## 9. References

- Full mechanics & narrative: `project.md`
- Repo conventions & store shape: `CLAUDE.md`
