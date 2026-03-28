import { useRef, useEffect } from 'react'
import useGameStore from '../store/useGameStore'

const CONTAINER = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  padding: '12px 20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  pointerEvents: 'none',
  zIndex: 100,
  fontFamily: 'var(--font-mono)',
}

const SCORE_STYLE = {
  color: '#c9a84c',
  fontSize: 20,
  fontWeight: 700,
}

const VAULT_ROW = {
  display: 'flex',
  gap: 4,
}

const DIGIT_BOX = {
  width: 28,
  height: 36,
  border: '1px solid rgba(201,168,76,0.4)',
  borderRadius: 4,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 18,
  fontWeight: 700,
  color: '#c9a84c',
  background: 'rgba(0,0,0,0.5)',
}

const FILLED = {
  ...DIGIT_BOX,
  borderColor: '#c9a84c',
  color: '#ff8c00',
  background: 'rgba(201,168,76,0.15)',
}

export default function HUD() {
  const score = useGameStore((s) => s.score)
  const vaultDigits = useGameStore((s) => s.vaultDigits)
  const phase = useGameStore((s) => s.phase)
  const scoreRef = useRef(null)

  // Animate score change
  useEffect(() => {
    if (!scoreRef.current) return
    scoreRef.current.style.transform = 'scale(1.2)'
    scoreRef.current.style.color = '#ff8c00'
    const t = setTimeout(() => {
      if (!scoreRef.current) return
      scoreRef.current.style.transform = 'scale(1)'
      scoreRef.current.style.color = '#c9a84c'
    }, 200)
    return () => clearTimeout(t)
  }, [score])

  if (phase === 'splash' || phase === 'reveal') return null

  return (
    <div style={CONTAINER}>
      <div
        ref={scoreRef}
        style={{ ...SCORE_STYLE, transition: 'transform 0.2s, color 0.2s' }}
      >
        {score}
      </div>
      <div style={VAULT_ROW}>
        {vaultDigits.map((d, i) => (
          <div key={i} style={d === '_' ? DIGIT_BOX : FILLED}>
            {d === '_' ? '' : d}
          </div>
        ))}
      </div>
    </div>
  )
}
