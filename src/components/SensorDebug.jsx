import { useState, useEffect } from 'react'
import usePlayerInput from '../hooks/usePlayerInput'

const STYLE = {
  position: 'fixed',
  top: 8,
  left: 8,
  background: 'rgba(0,0,0,0.8)',
  color: '#c9a84c',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  padding: '8px 12px',
  borderRadius: 6,
  zIndex: 9999,
  pointerEvents: 'none',
  border: '1px solid rgba(201,168,76,0.3)',
  lineHeight: 1.6,
}

export default function SensorDebug() {
  const [visible, setVisible] = useState(false)
  const [vals, setVals] = useState(null)
  const input = usePlayerInput()

  useEffect(() => {
    const toggle = (e) => {
      if (e.key === '`') setVisible((v) => !v)
    }
    window.addEventListener('keydown', toggle)
    return () => window.removeEventListener('keydown', toggle)
  }, [])

  useEffect(() => {
    if (!visible) return
    let raf
    const loop = () => {
      setVals(input.poll())
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [visible, input])

  if (!visible || !vals) return null

  return (
    <div style={STYLE}>
      <div style={{ color: '#ff8c00', marginBottom: 4 }}>
        {input.isUsingFallback ? 'KEYBOARD' : 'SENSOR'}
        {input.isAvailable === null && ' (detecting...)'}
      </div>
      <div>fwd: {vals.forward.toFixed(2)}</div>
      <div>bwd: {vals.backward.toFixed(2)}</div>
      <div>pull: {vals.sharpPull ? 'YES' : '-'}</div>
      <div>spin: {vals.spinRate.toFixed(1)}</div>
      <div>
        commit: {vals.commitForward ? 'FWD' : vals.commitBackward ? 'BWD' : '-'}
      </div>
    </div>
  )
}
