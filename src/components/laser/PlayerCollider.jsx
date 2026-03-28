import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { getBeamWorldPosition } from './LaserBeam'
import useGameStore from '../../store/useGameStore'
import { laserHitPenalty } from '../../utils/scoring'

const HIT_RADIUS_Z = 0.6 // how close in Z the player must be to a beam
const HIT_RADIUS_XY = 1.2 // generous: beam must be near player's lane

export default function PlayerCollider({ beams }) {
  const { camera } = useThree()
  const subtractScore = useGameStore((s) => s.subtractScore)
  const isInvincible = useGameStore((s) => s.isInvincible)
  const setInvincible = useGameStore((s) => s.setInvincible)
  const laserSection = useGameStore((s) => s.laserSection)
  const invTimer = useRef(null)

  useFrame(({ clock }) => {
    if (isInvincible) return

    const pz = camera.position.z
    const time = clock.elapsedTime

    for (const beam of beams) {
      const pos = getBeamWorldPosition(beam, time)
      if (!pos) continue // beam invisible (pulse off)

      // Check Z proximity
      const dz = Math.abs(pz - pos.z)
      if (dz > HIT_RADIUS_Z) continue

      // For X-axis sweeping beams, check if beam is near center (player is always x=0)
      if (beam.axis === 'x') {
        if (Math.abs(pos.x) > HIT_RADIUS_XY) continue
      }

      // Hit!
      subtractScore(laserHitPenalty(laserSection))
      setInvincible(true)

      // Vibrate if available
      if (navigator.vibrate) navigator.vibrate(200)

      // Clear invincibility after 1.5s
      if (invTimer.current) clearTimeout(invTimer.current)
      invTimer.current = setTimeout(() => setInvincible(false), 1500)

      break // only one hit per frame
    }
  })

  return null
}
