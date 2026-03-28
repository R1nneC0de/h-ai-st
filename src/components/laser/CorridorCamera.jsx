import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import usePlayerInput from '../../hooks/usePlayerInput'

const MOVE_SPEED = 6
const AUTO_DRIFT_SPEED = 1.5
const AUTO_DRIFT_DELAY = 3 // seconds
const LERP_FACTOR = 0.1
const BOB_AMPLITUDE = 0.03
const BOB_FREQUENCY = 2.5
const EYE_HEIGHT = 1.4

export default function CorridorCamera({ corridorLength, onReachEnd }) {
  const { camera } = useThree()
  const input = usePlayerInput()
  const posZ = useRef(0)
  const targetZ = useRef(0)
  const idleTime = useRef(0)
  const reachedEnd = useRef(false)

  useFrame(({ clock }, delta) => {
    const state = input.poll()

    const moving = state.forward > 0.1 || state.backward > 0.1

    if (moving) {
      idleTime.current = 0
      const netMove = (state.forward - state.backward) * MOVE_SPEED * delta
      targetZ.current -= netMove // negative Z = forward into corridor
    } else if (!state.isUsingFallback) {
      // Auto-drift only in sensor mode — keyboard players control their own pace
      idleTime.current += delta
      if (idleTime.current > AUTO_DRIFT_DELAY) {
        targetZ.current -= AUTO_DRIFT_SPEED * delta
      }
    }

    // Clamp: can't go behind start or past corridor end
    targetZ.current = Math.max(-corridorLength, Math.min(0, targetZ.current))

    // Smooth camera movement
    posZ.current += (targetZ.current - posZ.current) * LERP_FACTOR

    // Camera bob when moving
    const bobOffset = moving
      ? Math.sin(clock.elapsedTime * BOB_FREQUENCY * Math.PI * 2) * BOB_AMPLITUDE
      : 0

    camera.position.set(0, EYE_HEIGHT + bobOffset, posZ.current)
    camera.lookAt(0, EYE_HEIGHT, posZ.current - 10)

    // Check if reached end
    if (posZ.current <= -(corridorLength - 2) && !reachedEnd.current) {
      reachedEnd.current = true
      onReachEnd()
    }
  })

  return null
}
