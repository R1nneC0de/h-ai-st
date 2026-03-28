# HEIST — Full Game Design Document

---

## Concept

You are a casino thief. Tonight you're cracking the most secure vault in the city, buried beneath the casino floor. Between you and it: three laser corridors, three casino mini-games, and seven numbers you need to memorize under pressure. The laptop is your body. The tilt is your movement. The casino is your obstacle. The vault is your prize.

This is a single-session, single-player browser game built entirely in React + Three.js, controlled almost entirely through the laptop's accelerometer and gyroscope. No mouse required except for one moment in roulette. No keyboard except the vault code entry at the very end. The physical commitment of tilting, rotating, and holding your laptop still *is* the experience — from the outside, watching someone play this looks unhinged. That's the point.

---

## Narrative Structure

The game is broken into seven acts that flow into each other seamlessly:

```
Splash Screen
    → Laser Section 1 (tutorial pace)
        → Mini-Game 1: Slots
            → Countdown
    → Laser Section 2 (medium difficulty)
        → Mini-Game 2: Roulette
            → Countdown
    → Laser Section 3 (maximum chaos)
        → Mini-Game 3: Blackjack
            → Vault Code Entry
                → Vault Reveal
```

Each transition is a cinematic moment. The corridor doesn't just cut to black — it transforms. The camera pulls back, the casino aesthetic bleeds in, the music shifts. Going back into the laser after a mini-game feels like snapping back to reality after a brief, surreal detour.

---

## Visual Identity

The entire game lives in one aesthetic universe: **deep casino noir**. Think the Bellagio at 3am. Rich, dark, expensive, slightly dangerous.

**Color palette:**
- Background black: `#080808`
- Felt green: `#0a3d2e`
- Gold accent: `#c9a84c`
- Neon red: `#ff2d4b`
- Cool white laser: `#e8f4ff`
- Amber warning: `#ff8c00`

**Typography:** Something between a casino marquee and a spy thriller. Heavy serif for titles, monospace for numbers and the vault code. Everything feels like it belongs on a vintage slot machine or a classified document.

**Three.js rendering throughout.** No flat 2D screens — even the mini-games live in a 3D space. The slots machine is a real 3D object. The roulette wheel has real depth and spin physics. The vault door is massive and mechanical. The laser corridor has perspective and fog. Everything has weight.

---

## Splash Screen

A dark screen. The camera slowly pushes toward a massive vault door in the distance, lit by a single spotlight from above. Gold filigree around the edges. A heartbeat sound, low and slow.

Text fades in: **"THE HEIST"**

Below it, smaller: *"Tilt your laptop to begin."*

The moment the player tilts forward past a threshold — the vault door slams shut, an alarm blares for one beat, then cuts to silence, and the laser corridor loads in. The game has started.

A brief overlay appears in the corner: current score (**1000** to start), and a small empty row of **7 dashes** representing the vault code slots they need to fill. These dashes stay visible as a HUD element for the rest of the game as a constant reminder that numbers are coming.

---

## The Laser Corridor — Core Game Loop

### What It Looks Like

A first-person Three.js corridor stretching into the distance. The walls, floor and ceiling are dark brushed metal with subtle gold trim. Perspective lines converge at a vanishing point straight ahead, giving the illusion of depth and forward momentum. Red laser beams cut across the corridor horizontally, vertically, and diagonally — some static, some sweeping, some pulsing on and off in rhythmic patterns.

The player's "body" is invisible — this is pure FPS perspective. The only thing that exists is the view through the corridor and the lasers between the player and the checkpoint.

A faint heartbeat plays constantly in the background. It speeds up as the player gets closer to lasers and slows when they have clear space. The lasers hum with a low electric frequency. The sound design does half the tension work.

At the far end of each corridor section, a faint gold glow pulses — the checkpoint. It gets brighter and larger as the player gets closer, acting as a visual progress indicator without a traditional progress bar.

### How Movement Works

The player tilts the physical laptop to control their in-corridor position:

- **Tilt forward (beta axis decreases):** Move forward through the corridor — the vanishing point rushes toward you, the checkpoint gets closer
- **Tilt backward (beta axis increases):** Move backward — useful for retreating from an oncoming laser sweep
- **Tilt left (gamma axis negative):** Sidestep left — character shifts laterally in the corridor
- **Tilt right (gamma axis positive):** Sidestep right

The movement is fluid, not grid-based. The player exists in a continuous 2D space mapped onto the corridor floor, and their Three.js camera shifts to match their position. The corridor walls and laser geometry stay fixed — the player moves through the world, the world doesn't move around them.

Forward momentum is required to reach the checkpoint. You can't just sit still and wait out the lasers — the game gently pushes you forward with a slow automatic drift if you've been stationary too long.

### Laser Patterns

**Section 1 — Tutorial:**
- Mostly horizontal sweepers moving left to right at slow, predictable intervals
- One or two static diagonal beams that require committed lateral movement to avoid
- Generous gaps. Designed to teach the tilt mechanic, not punish the player
- Duration: approximately 60 seconds at a comfortable pace

**Section 2 — Pressure:**
- Horizontal sweepers now come from both directions simultaneously
- Vertical beams that pulse on/off require timing, not just positioning
- Diagonal cross-patterns create brief windows the player must thread through
- Speed increased by roughly 40% from section one
- Duration: approximately 90 seconds

**Section 3 — Chaos:**
- All of the above, plus rotating laser arms that sweep in arcs
- Multiple simultaneous patterns layered on top of each other
- Some beams that track the player's horizontal position (evasion required, not just static avoidance)
- Speed at roughly double section one
- Duration: approximately 90 seconds

### Scoring in the Laser

The player begins with **1000 points**. Every laser contact deducts points. The deduction isn't fixed — it scales with the section:

- **Section 1 hit:** -20 points
- **Section 2 hit:** -35 points
- **Section 3 hit:** -50 points

There's a brief invincibility window of 1.5 seconds after each hit to prevent chain punishment from a single moment of bad luck. On contact: the screen flashes red, a sharp electric buzz plays, and the laser beam the player touched pulses brighter for a moment. It stings without being catastrophic. The player keeps moving.

The score is always visible in the top right corner. Watching it tick down is psychological warfare.

### Checkpoint Moment

When the player reaches the checkpoint — the gold glow fills the screen for one beat. The heartbeat stops. A single clean chime plays. The corridor's lasers all switch off simultaneously. The camera holds still for half a second.

Then the screen transitions.

---

## Mini-Game Transitions

Each transition from laser corridor to mini-game is a deliberate cinematic break:

The corridor camera pulls back and rotates to reveal the corridor was inside a casino the whole time. The camera sweeps outward and settles on the casino game setup — a slot machine, a roulette table, a card table — positioned in a grand, dimly lit casino floor. Velvet ropes, chandeliers, the ambient sound of a distant casino floor bleeding in.

An overlay text fades in identifying the mini-game: **"SLOTS"** / **"ROULETTE"** / **"BLACKJACK"** — gold lettering, brief hold, then fades out.

The mini-game begins.

---

## Mini-Game 1 — Slots

### Setting

A single, imposing 3D slot machine rendered in Three.js. Chrome and gold finish, red velvet trim around the display window. Three physical reels visible through a glass panel — each reel a 3D cylinder with symbols mapped around its circumference: cherries, bars, sevens, diamonds, bells. The machine has presence and weight.

### How It Works

The player tilts the laptop backward sharply — mimicking the physical act of pulling a lever. The speed and commitment of the tilt determines how fast the reels spin: a lazy tilt gives a slow lazy spin, a sharp committed yank sends the reels blurring. A 3D lever on the right side of the machine animates in response to the tilt.

Once the tilt threshold is crossed, the reels commit to spinning. They slow down one at a time — left reel first, then center, then right — each landing with a satisfying mechanical clunk sound and a brief flash on the landed symbol.

### The Numbers

Whatever symbol each reel lands on maps to a digit:
- Cherry → 1
- Bell → 2
- Bar → 3
- Diamond → 4
- Seven → 7

These three digits become the **first three numbers of the vault code.** They flash on screen for exactly **2 seconds** in large, dramatic numerals before being replaced by three dashes in the HUD — gone forever. The player must remember them.

### Scoring

- **Jackpot (three 7s):** +300 bonus points. The machine erupts — gold coins rain down in a Three.js particle system, alarm lights flash, a jackpot fanfare plays
- **Two matching symbols:** +50 bonus points. Small celebration
- **Anything else:** No change to score. The machine just settles quietly

### Duration

The whole thing takes under 60 seconds. Tilt, spin, land, see the numbers, they're gone.

---

## Mini-Game 2 — Roulette

### Setting

A top-down slightly angled Three.js roulette wheel, rich green felt table extending outward. The wheel itself is detailed — alternating red and black numbered pockets, the silver ball visible resting at the top. A betting grid is laid out on the felt to one side: numbers 0–36 in their standard roulette layout, red/black clearly marked.

### How It Works

**Phase 1 — Betting (mouse/click):**
This is the one moment in the game where the mouse is used. The player clicks on a number (0–36) on the betting grid, then clicks either a red or black chip indicator. Their selection highlights gold. They have 15 seconds to place their bet before the phase locks in. This is intentionally unhurried — a moment of quiet strategy after the laser chaos.

**Phase 2 — Spinning (tilt):**
Once the bet is placed, an overlay prompt appears: *"Tilt to spin."* The player rotates the laptop — any direction, any speed — and the roulette wheel begins spinning in response. The faster and more committed the rotation, the faster the wheel spins. Once a minimum spin threshold is hit, the ball releases from the edge of the wheel and begins its physics-driven arc around the rim, gradually losing speed and dropping inward toward the numbered pockets.

The ball's final landing position is calculated from the initial spin speed — faster spin = more unpredictable landing. But importantly, **the spin only happens once.** No retries. No second chances. Whatever the ball lands on is final.

### The Numbers

The roulette result is a number between 0 and 36. If it's a two-digit number (10–36) it contributes 2 digits. If it's a single-digit number (0–9) it contributes a 0 followed by the digit — always exactly **2 digits for the vault code.** These become digits 4 and 5.

They flash on screen for 2 seconds. Then they're gone.

### Scoring

- **Correct number AND correct color:** +400 bonus points. Confetti burst, the dealer (an animated silhouette) slow claps. This is the rarest outcome and deserves maximum celebration
- **Correct color only:** +100 bonus points. Small chime
- **Correct number only:** +200 bonus points (harder to get than correct color)
- **Neither:** No change. The wheel settles silently

### Duration

Betting phase: up to 15 seconds. Spin and result: about 20 seconds. Total under 45 seconds.

---

## Mini-Game 3 — Blackjack

### Setting

A Three.js card table, green felt, gold trim. Cards rendered as actual 3D objects with thickness and shadow. No dealer chair — the table is empty across from the player. This is a solo game. Just you and the deck.

### How It Works

The player starts with two cards dealt face up. Their total is displayed prominently above the hand. The hand value in large text is their constant companion — the number they're racing toward or fleeing from.

**Tilt left → Hit:** A new card slides across the table from the deck. The total updates. If they're at 20, this is terrifying. If they're at 12, it's reckless confidence.

**Tilt right → Stand:** The hand locks. Cards fan out, the final total freezes on screen.

The tilt threshold for both directions is deliberate — not too sensitive. A slight lean doesn't trigger it. The player has to commit to the direction to trigger the action. This prevents accidental hits when stabilizing the laptop.

There's no time pressure on the hit/stand decision — the player can hold the laptop steady and think. But the heartbeat audio returns softly in the background, gently escalating pressure without a visible timer.

### The Numbers

The final hand total — whatever number they stand on or bust at — becomes a two-digit number for the vault code. If they stand at 17, the digits are **1 and 7**. If they bust at 23, the digits are **2 and 3**. If they stand at 8, it's **0 and 8**. Always exactly 2 digits — positions 6 and 7 of the vault code.

These flash for 2 seconds. Then they're gone.

### Scoring

- **Hit exactly 21:** +500 bonus points. The biggest bonus in the game. Cards flip dramatically, gold light floods the table, a triumphant sound plays
- **Bust (over 21):** -150 points. Cards scatter with a thud, a low failure sound plays, the bust total flashes red before becoming the vault digits
- **Stand under 21:** No change. Hand freezes, digits appear, the game moves on

### Duration

Entirely player-controlled. Fast players can complete this in 20 seconds. Careful players might take a minute. No time limit.

---

## Countdown — Back Into the Laser

After each mini-game, before the laser resumes:

The casino environment pulls back. The corridor reappears in the background. The camera drifts slowly back into position as if the player is walking back into the hallway.

A large countdown appears center screen: **3... 2... 1...**

Each number hits with a deep bass pulse. The heartbeat returns. The countdown reaches zero — the lasers snap back on simultaneously, the sound hits full volume, and the player is thrown back into the action.

The first few seconds after the countdown are always slightly overwhelming by design — the shock of re-entry is part of the experience.

---

## Vault Code Entry

After the third mini-game, there is no countdown. Instead:

The camera glides forward through the end of the final corridor and arrives at the vault door. Massive. Round. Mechanical. Gold and steel. It fills the entire screen.

A keypad appears — 7 digit slots, each represented as a physical tumbler dial on the vault surface. The player uses the keyboard (the one deliberate keyboard moment) to type their 7-digit code.

As each digit is entered, the corresponding tumbler rotates into position with a satisfying mechanical click. If the player has forgotten a digit they can use backspace and try again — there's no penalty for wrong attempts at this stage. The vault is patient.

Once all 7 digits are entered, a **CONFIRM** button appears. The player presses Enter.

---

## The Vault Opens

The screen holds for one breath.

Then: the vault door mechanism engages. Massive internal bolts retract one by one — each one a deep mechanical thunk. The wheel in the center of the door spins. The door swings outward, slowly, heavily, toward the camera.

Light floods out from inside — warm gold light. The camera pushes through the opening vault door.

Inside: a clean dark chamber. In the center, lit by a single spotlight:

**YOUR VAULT**

```
TIME:     04:32
SCORE:    1,247
CODE:     7 3 2 1 7 1 4
```

Below the score, a breakdown:
- Base score
- Laser penalties
- Mini-game bonuses
- Final total

Confetti falls as Three.js particles — gold and red. Casino jackpot sounds layer over each other. The heartbeat is completely gone. The music swells into something triumphant.

A small prompt at the bottom: *"Tilt to play again."*

---

## Audio Design

| Moment | Sound |
|---|---|
| Throughout laser | Escalating heartbeat + laser hum |
| Laser hit | Sharp electric crack |
| Approaching checkpoint | Heartbeat slows, gold shimmer tone |
| Checkpoint reached | Single clean chime, silence |
| Slot machine spin | Mechanical whirr, reel clunks |
| Jackpot | Classic jackpot fanfare, coins |
| Roulette spin | Ball clicking around the wheel |
| Card deal | Crisp card slide |
| Blackjack 21 | Triumphant brass hit |
| Blackjack bust | Low thud, scatter sound |
| Countdown | Three deep bass pulses |
| Vault bolts | Sequential mechanical thuds |
| Vault open | Orchestral swell, confetti rush |

---

## Technical Notes

- **Framework:** React + Vite
- **3D Rendering:** Three.js via `@react-three/fiber` and `@react-three/drei`
- **Animations:** GSAP for timeline sequences (vault door, transitions, countdowns)
- **Sensor Input:** Raw `DeviceOrientation` and `DeviceMotion` API — requires HTTPS
- **Audio:** Howler.js
- **State Management:** Zustand — tracks current game phase, score, vault digits, laser section
- **Deploy:** Vercel (handles HTTPS automatically, required for sensor permissions)
- **No backend.** Everything lives client-side. The vault code is assembled in memory and validated locally.

---

That's the complete game. Every mechanic defined, every transition described, every number accounted for. Ready to build?