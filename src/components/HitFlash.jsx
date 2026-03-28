import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import useGameStore from '../store/useGameStore'

export default function HitFlash() {
  const isInvincible = useGameStore((s) => s.isInvincible)
  const ref = useRef()

  useEffect(() => {
    if (!isInvincible || !ref.current) return
    gsap.fromTo(
      ref.current,
      { opacity: 0.5 },
      { opacity: 0, duration: 0.4, ease: 'power2.out' }
    )
  }, [isInvincible])

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#ff2d4b',
        opacity: 0,
        pointerEvents: 'none',
        zIndex: 90,
      }}
    />
  )
}
