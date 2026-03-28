import gsap from 'gsap'

export function fadeOut(el) {
  return gsap.to(el, {
    opacity: 1,
    duration: 0.5,
    ease: 'power2.in',
  })
}

export function fadeIn(el) {
  return gsap.to(el, {
    opacity: 0,
    duration: 0.5,
    ease: 'power2.out',
  })
}

export function laserFlash(el) {
  const tl = gsap.timeline()
  tl.set(el, { opacity: 0, background: '#e8f4ff' })
  tl.to(el, { opacity: 1, duration: 0.08 })
  tl.to(el, { opacity: 0, duration: 0.4, ease: 'power2.out' })
  tl.set(el, { background: '#080808' })
  return tl
}

export function casinoSweep(el) {
  const tl = gsap.timeline()
  tl.set(el, {
    opacity: 1,
    background: 'linear-gradient(90deg, #c9a84c 0%, transparent 5%)',
    backgroundSize: '200% 100%',
    backgroundPosition: '-100% 0',
  })
  tl.to(el, {
    backgroundPosition: '200% 0',
    duration: 0.8,
    ease: 'power2.inOut',
  })
  tl.to(el, { opacity: 0, duration: 0.3 })
  return tl
}

// Determines which transition to use between phases
export function getTransitionType(from, to) {
  if (to?.startsWith('laser')) return 'laserFlash'
  if (['slots', 'roulette', 'blackjack'].includes(to)) return 'casinoSweep'
  if (to === 'vault' || to === 'reveal') return 'fade'
  return 'fade'
}
