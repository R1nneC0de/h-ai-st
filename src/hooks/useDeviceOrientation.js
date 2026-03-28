import { useState, useEffect, useCallback, useRef } from 'react'

const SMOOTHING = 0.15

function lerp(prev, next, factor) {
  if (prev === null) return next
  return prev + (next - prev) * factor
}

export default function useDeviceOrientation() {
  const [orientation, setOrientation] = useState({
    alpha: 0,
    beta: 0,
    gamma: 0,
  })
  const [isAvailable, setIsAvailable] = useState(null)
  const smoothed = useRef({ alpha: null, beta: null, gamma: null })

  const handleOrientation = useCallback((e) => {
    if (e.alpha === null && e.beta === null && e.gamma === null) return

    setIsAvailable(true)
    smoothed.current = {
      alpha: lerp(smoothed.current.alpha, e.alpha ?? 0, SMOOTHING),
      beta: lerp(smoothed.current.beta, e.beta ?? 0, SMOOTHING),
      gamma: lerp(smoothed.current.gamma, e.gamma ?? 0, SMOOTHING),
    }
    setOrientation({ ...smoothed.current })
  }, [])

  const requestPermission = useCallback(async () => {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      try {
        const result = await DeviceOrientationEvent.requestPermission()
        if (result === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation)
          return true
        }
        setIsAvailable(false)
        return false
      } catch {
        setIsAvailable(false)
        return false
      }
    }
    // Non-iOS: permission not needed, just start listening
    return true
  }, [handleOrientation])

  useEffect(() => {
    // Check if API exists
    if (typeof DeviceOrientationEvent === 'undefined') {
      setIsAvailable(false)
      return
    }

    // On non-iOS, start listening immediately
    if (typeof DeviceOrientationEvent.requestPermission !== 'function') {
      window.addEventListener('deviceorientation', handleOrientation)

      // If no event fires within 500ms, sensors aren't available
      const timeout = setTimeout(() => {
        if (isAvailable === null) setIsAvailable(false)
      }, 500)

      return () => {
        clearTimeout(timeout)
        window.removeEventListener('deviceorientation', handleOrientation)
      }
    }
  }, [handleOrientation, isAvailable])

  return { ...orientation, isAvailable, requestPermission }
}
