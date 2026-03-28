import { useState, useEffect, useCallback, useRef } from 'react'

const NOISE_THRESHOLD = 0.5

export default function useDeviceMotion() {
  const [motion, setMotion] = useState({
    acceleration: { x: 0, y: 0, z: 0 },
    rotationRate: { alpha: 0, beta: 0, gamma: 0 },
  })
  const prev = useRef(motion)

  const handleMotion = useCallback((e) => {
    const acc = e.accelerationIncludingGravity || { x: 0, y: 0, z: 0 }
    const rot = e.rotationRate || { alpha: 0, beta: 0, gamma: 0 }

    const next = {
      acceleration: {
        x: Math.abs(acc.x ?? 0) > NOISE_THRESHOLD ? acc.x : 0,
        y: Math.abs(acc.y ?? 0) > NOISE_THRESHOLD ? acc.y : 0,
        z: Math.abs(acc.z ?? 0) > NOISE_THRESHOLD ? acc.z : 0,
      },
      rotationRate: {
        alpha: Math.abs(rot.alpha ?? 0) > NOISE_THRESHOLD ? rot.alpha : 0,
        beta: Math.abs(rot.beta ?? 0) > NOISE_THRESHOLD ? rot.beta : 0,
        gamma: Math.abs(rot.gamma ?? 0) > NOISE_THRESHOLD ? rot.gamma : 0,
      },
    }
    prev.current = next
    setMotion(next)
  }, [])

  useEffect(() => {
    if (typeof DeviceMotionEvent === 'undefined') return

    window.addEventListener('devicemotion', handleMotion)
    return () => window.removeEventListener('devicemotion', handleMotion)
  }, [handleMotion])

  return motion
}
