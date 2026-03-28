import { useRef, useCallback } from 'react'
import useDeviceOrientation from './useDeviceOrientation'
import useDeviceMotion from './useDeviceMotion'
import useInputFallback from './useInputFallback'

// Beta thresholds for forward/backward (degrees from neutral ~45-60 for laptop)
const BETA_NEUTRAL = 55 // neutral laptop angle
const BETA_RANGE = 25 // degrees of tilt mapped to 0-1
const SHARP_PULL_THRESHOLD = 15 // deg/s beta spike for slot lever

function clamp01(v) {
  return Math.max(0, Math.min(1, v))
}

export default function usePlayerInput() {
  const orientation = useDeviceOrientation()
  const motion = useDeviceMotion()
  const pollFallback = useInputFallback()
  const useFallback = orientation.isAvailable === false
  const prevSharp = useRef(false)

  const poll = useCallback(() => {
    if (useFallback) {
      return { ...pollFallback(), isUsingFallback: true }
    }

    // Beta: lower = tilt screen away = forward
    const betaDelta = BETA_NEUTRAL - orientation.beta
    const forward = clamp01(betaDelta / BETA_RANGE)
    const backward = clamp01(-betaDelta / BETA_RANGE)

    // Sharp pull: sudden beta increase (tilting screen toward you fast)
    const betaRate = Math.abs(motion.rotationRate.beta)
    const sharpPull = betaRate > SHARP_PULL_THRESHOLD && !prevSharp.current
    prevSharp.current = betaRate > SHARP_PULL_THRESHOLD

    // Spin rate from alpha rotation (for roulette)
    const spinRate = motion.rotationRate.alpha

    // Commit forward/backward: sustained tilt beyond 0.8 for 500ms
    // (handled by components that need it — they track timing themselves)
    const commitForward = forward > 0.8
    const commitBackward = backward > 0.8

    return {
      forward,
      backward,
      sharpPull,
      spinRate,
      commitForward,
      commitBackward,
      isUsingFallback: false,
    }
  }, [useFallback, orientation.beta, motion.rotationRate, pollFallback])

  return {
    poll,
    isUsingFallback: useFallback,
    isAvailable: orientation.isAvailable,
    requestPermission: orientation.requestPermission,
  }
}
