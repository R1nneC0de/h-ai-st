import { useRef, useCallback } from 'react'
import useTiltBridge from './useTiltBridge'
import useDeviceOrientation from './useDeviceOrientation'
import useDeviceMotion from './useDeviceMotion'
import useInputFallback from './useInputFallback'

// Pitch thresholds (degrees from neutral ~0 for bridge, ~55 for DeviceOrientation beta)
const BRIDGE_NEUTRAL = 0
const BRIDGE_RANGE = 20     // ±20deg from neutral maps to 0–1
const BETA_NEUTRAL = 55     // neutral laptop angle for DeviceOrientation
const BETA_RANGE = 25

const SHARP_TILT_THRESHOLD = 8  // deg pitch change between polls = "sharp" tilt for slots

function clamp01(v) {
  return Math.max(0, Math.min(1, v))
}

/**
 * Unified input hook. Three-tier fallback:
 *   1. WebSocket bridge (MacBook accelerometer via macimu)
 *   2. DeviceOrientation/Motion APIs (mobile/tablet)
 *   3. Keyboard + trackpad (dev/debug)
 *
 * Returns { poll, source, bridgeStatus } where poll() gives:
 *   { forward, backward, sharpTilt, spinRate, commitForward, commitBackward }
 */
export default function usePlayerInput() {
  const pollBridge = useTiltBridge()
  const orientation = useDeviceOrientation()
  const motion = useDeviceMotion()
  const pollFallback = useInputFallback()

  const prevPitch = useRef(null)
  const prevSharp = useRef(false)

  const getSource = useCallback(() => {
    const bridge = pollBridge()
    if (bridge.connected) return 'bridge'
    if (orientation.isAvailable === true) return 'device'
    return 'keyboard'
  }, [pollBridge, orientation.isAvailable])

  const poll = useCallback(() => {
    const bridge = pollBridge()

    // --- Tier 1: WebSocket bridge (MacBook accelerometer) ---
    if (bridge.connected) {
      const pitchDelta = bridge.pitch - BRIDGE_NEUTRAL
      const forward = clamp01(pitchDelta / BRIDGE_RANGE)
      const backward = clamp01(-pitchDelta / BRIDGE_RANGE)

      // Sharp tilt detection for slots: rapid pitch change between polls
      const pitchRate = prevPitch.current !== null
        ? Math.abs(bridge.pitch - prevPitch.current)
        : 0
      const sharpTilt = pitchRate > SHARP_TILT_THRESHOLD && !prevSharp.current
      prevSharp.current = pitchRate > SHARP_TILT_THRESHOLD
      prevPitch.current = bridge.pitch

      // Yaw delta for roulette spin
      const spinRate = bridge.yawDelta

      // Commit: sustained tilt beyond threshold (components track the 500ms timing)
      const commitForward = forward > 0.8
      const commitBackward = backward > 0.8

      return {
        forward,
        backward,
        sharpTilt,
        spinRate,
        commitForward,
        commitBackward,
        source: 'bridge',
      }
    }

    // --- Tier 2: DeviceOrientation + DeviceMotion (mobile/tablet) ---
    if (orientation.isAvailable === true) {
      const betaDelta = BETA_NEUTRAL - orientation.beta
      const forward = clamp01(betaDelta / BETA_RANGE)
      const backward = clamp01(-betaDelta / BETA_RANGE)

      const betaRate = Math.abs(motion.rotationRate.beta)
      const sharpTilt = betaRate > 15 && !prevSharp.current
      prevSharp.current = betaRate > 15

      const spinRate = motion.rotationRate.alpha

      const commitForward = forward > 0.8
      const commitBackward = backward > 0.8

      return {
        forward,
        backward,
        sharpTilt,
        spinRate,
        commitForward,
        commitBackward,
        source: 'device',
      }
    }

    // --- Tier 3: Keyboard + trackpad (dev/debug) ---
    const fb = pollFallback()
    return {
      forward: fb.forward,
      backward: fb.backward,
      sharpTilt: fb.sharpPull,
      spinRate: fb.spinRate,
      commitForward: fb.commitForward,
      commitBackward: fb.commitBackward,
      source: 'keyboard',
    }
  }, [pollBridge, orientation, motion, pollFallback])

  const bridgeStatus = useCallback(() => pollBridge().status, [pollBridge])

  return {
    poll,
    getSource,
    bridgeStatus,
    isAvailable: orientation.isAvailable,
    requestPermission: orientation.requestPermission,
  }
}
