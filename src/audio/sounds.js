import { Howl, Howler } from 'howler'

// Master volume
Howler.volume(0.8)

// Lazy-load: sounds are created on first access, not on import.
// Audio files go in public/audio/. For now, many paths are placeholders —
// they'll fail silently until actual files are added.
const defs = {
  // Laser corridor
  laserHum: { src: ['/audio/laser-hum.mp3'], loop: true, volume: 0.2 },
  laserHit: { src: ['/audio/laser-hit.mp3'], volume: 0.8 },
  footstep: { src: ['/audio/footstep.mp3'], volume: 0.3 },

  // Ambient
  casinoAmbience: { src: ['/audio/casino-ambience.mp3'], loop: true, volume: 0.15 },
  heartbeat: { src: ['/audio/heartbeat.mp3'], loop: true, volume: 0.3 },

  // Slots
  reelSpin: { src: ['/audio/reel-spin.mp3'], loop: true, volume: 0.5 },
  reelStop: { src: ['/audio/reel-stop.mp3'], volume: 0.9 },
  jackpotFanfare: { src: ['/audio/jackpot.mp3'], volume: 1.0 },

  // Roulette
  wheelSpin: { src: ['/audio/wheel-spin.mp3'], loop: true, volume: 0.5 },
  ballClick: { src: ['/audio/ball-click.mp3'], volume: 0.4 },
  ballDrop: { src: ['/audio/ball-drop.mp3'], volume: 0.8 },

  // Blackjack
  cardSlide: { src: ['/audio/card-slide.mp3'], volume: 0.7 },
  cardFlip: { src: ['/audio/card-flip.mp3'], volume: 0.5 },

  // Vault
  vaultClick: { src: ['/audio/vault-click.mp3'], volume: 0.7 },
  vaultOpen: { src: ['/audio/vault-open.mp3'], volume: 1.0 },
  vaultDenied: { src: ['/audio/vault-denied.mp3'], volume: 0.8 },

  // Shared
  digitReveal: { src: ['/audio/digit-reveal.mp3'], volume: 0.9 },
  scoreUp: { src: ['/audio/score-up.mp3'], volume: 0.5 },
  scoreDown: { src: ['/audio/score-down.mp3'], volume: 0.5 },
  countdown: { src: ['/audio/countdown-pulse.mp3'], volume: 1.0 },
  transition: { src: ['/audio/transition.mp3'], volume: 0.6 },
}

// Lazily instantiated Howl cache
const cache = {}

function getSound(name) {
  if (!cache[name]) {
    const def = defs[name]
    if (!def) return null
    cache[name] = new Howl({
      ...def,
      preload: true,
      onloaderror: () => {}, // silent fail until audio files exist
    })
  }
  return cache[name]
}

export const sounds = {
  play(name) {
    const s = getSound(name)
    if (s) return s.play()
  },
  stop(name) {
    const s = getSound(name)
    if (s) s.stop()
  },
  fade(name, from, to, duration) {
    const s = getSound(name)
    if (s) s.fade(from, to, duration)
  },
  volume(name, vol) {
    const s = getSound(name)
    if (s) s.volume(vol)
  },
  isPlaying(name) {
    const s = cache[name]
    return s ? s.playing() : false
  },
  stopAll() {
    Howler.stop()
  },
  mute(muted) {
    Howler.mute(muted)
  },
}

export default sounds
