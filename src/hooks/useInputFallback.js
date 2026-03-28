import { useEffect, useRef, useCallback } from 'react'

const KEYS = {
  forward: new Set(['w', 'W', 'ArrowUp']),
  backward: new Set(['s', 'S', 'ArrowDown']),
  sharpPull: new Set([' ']),
}

export default function useInputFallback() {
  const keys = useRef(new Set())
  const holdTimers = useRef({ forward: 0, backward: 0 })
  const mouseRef = useRef({ dragging: false, lastX: 0, deltaX: 0 })
  const stateRef = useRef({
    forward: 0,
    backward: 0,
    sharpPull: false,
    spinRate: 0,
    commitForward: false,
    commitBackward: false,
  })

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.repeat) return
      keys.current.add(e.key)

      // Track hold start time for commit detection
      if (KEYS.forward.has(e.key)) holdTimers.current.forward = performance.now()
      if (KEYS.backward.has(e.key)) holdTimers.current.backward = performance.now()
    }

    const onKeyUp = (e) => {
      keys.current.delete(e.key)

      if (KEYS.forward.has(e.key)) holdTimers.current.forward = 0
      if (KEYS.backward.has(e.key)) holdTimers.current.backward = 0
    }

    const onMouseDown = (e) => {
      mouseRef.current.dragging = true
      mouseRef.current.lastX = e.clientX
      mouseRef.current.deltaX = 0
    }

    const onMouseMove = (e) => {
      if (!mouseRef.current.dragging) return
      mouseRef.current.deltaX = e.clientX - mouseRef.current.lastX
      mouseRef.current.lastX = e.clientX
    }

    const onMouseUp = () => {
      mouseRef.current.dragging = false
      mouseRef.current.deltaX = 0
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  const poll = useCallback(() => {
    const now = performance.now()
    const pressed = keys.current
    const isForward = [...KEYS.forward].some((k) => pressed.has(k))
    const isBackward = [...KEYS.backward].some((k) => pressed.has(k))
    const isSharpPull = [...KEYS.sharpPull].some((k) => pressed.has(k))

    // Commit: held for 500ms+
    const commitForward =
      isForward && holdTimers.current.forward > 0 && now - holdTimers.current.forward > 500
    const commitBackward =
      isBackward && holdTimers.current.backward > 0 && now - holdTimers.current.backward > 500

    // Spin rate from mouse drag
    const spinRate = mouseRef.current.dragging ? mouseRef.current.deltaX * 0.5 : 0
    mouseRef.current.deltaX *= 0.9 // decay

    stateRef.current = {
      forward: isForward ? 1 : 0,
      backward: isBackward ? 1 : 0,
      sharpPull: isSharpPull,
      spinRate,
      commitForward,
      commitBackward,
    }

    return stateRef.current
  }, [])

  return poll
}
