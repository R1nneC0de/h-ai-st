import { forwardRef } from 'react'
import { fadeOut, fadeIn, laserFlash, casinoSweep, getTransitionType } from '../utils/transitions'

const OVERLAY_STYLE = {
  position: 'fixed',
  inset: 0,
  background: '#080808',
  opacity: 0,
  pointerEvents: 'none',
  zIndex: 200,
}

const Transition = forwardRef(function Transition(_, ref) {
  return <div ref={ref} style={OVERLAY_STYLE} />
})

export default Transition

// Call this to play a transition between phases
export async function playTransition(overlayEl, fromPhase, toPhase, swapFn) {
  if (!overlayEl) {
    swapFn()
    return
  }

  const type = getTransitionType(fromPhase, toPhase)
  overlayEl.style.pointerEvents = 'all'

  // Fade to black / flash
  await fadeOut(overlayEl)

  // Swap the phase while screen is covered
  swapFn()

  // Small delay for new scene to mount
  await new Promise((r) => setTimeout(r, 100))

  // Transition in
  if (type === 'laserFlash') {
    await laserFlash(overlayEl)
  } else if (type === 'casinoSweep') {
    await casinoSweep(overlayEl)
  } else {
    await fadeIn(overlayEl)
  }

  overlayEl.style.pointerEvents = 'none'
}
