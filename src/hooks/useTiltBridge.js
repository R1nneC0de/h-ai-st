import { useEffect, useRef, useCallback } from 'react'

const DEFAULT_URL = 'ws://127.0.0.1:8765'
const RECONNECT_INTERVAL = 2000
const STALE_THRESHOLD = 500

export default function useTiltBridge(url = DEFAULT_URL) {
  const ws = useRef(null)
  const data = useRef({ pitch: 0, roll: 0, yaw: 0, ts: 0 })
  const prevYaw = useRef(null)
  const yawDelta = useRef(0)
  const status = useRef('disconnected') // 'disconnected' | 'connecting' | 'connected'
  const reconnectTimer = useRef(null)

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN || ws.current?.readyState === WebSocket.CONNECTING) {
      return
    }

    status.current = 'connecting'

    const socket = new WebSocket(url)

    socket.onopen = () => {
      status.current = 'connected'
    }

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data)
        const prevData = data.current

        // Compute yaw delta (rotation speed) for roulette spin
        if (prevYaw.current !== null) {
          let delta = parsed.yaw - prevYaw.current
          // Handle wrap-around at ±180
          if (delta > 180) delta -= 360
          if (delta < -180) delta += 360
          yawDelta.current = delta
        }
        prevYaw.current = parsed.yaw

        data.current = {
          pitch: parsed.pitch ?? 0,
          roll: parsed.roll ?? 0,
          yaw: parsed.yaw ?? 0,
          ts: parsed.ts ?? Date.now() / 1000,
        }
      } catch {
        // malformed message, ignore
      }
    }

    socket.onclose = () => {
      status.current = 'disconnected'
      ws.current = null
      scheduleReconnect()
    }

    socket.onerror = () => {
      socket.close()
    }

    ws.current = socket
  }, [url])

  const scheduleReconnect = useCallback(() => {
    clearTimeout(reconnectTimer.current)
    reconnectTimer.current = setTimeout(connect, RECONNECT_INTERVAL)
  }, [connect])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      if (ws.current) {
        ws.current.onclose = null
        ws.current.close()
      }
    }
  }, [connect])

  const poll = useCallback(() => {
    const now = Date.now() / 1000
    const stale = (now - data.current.ts) > (STALE_THRESHOLD / 1000)

    return {
      pitch: stale ? 0 : data.current.pitch,
      roll: stale ? 0 : data.current.roll,
      yaw: stale ? 0 : data.current.yaw,
      yawDelta: stale ? 0 : yawDelta.current,
      connected: status.current === 'connected' && !stale,
      status: status.current,
    }
  }, [])

  return poll
}
