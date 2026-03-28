import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const LASER_COLOR = new THREE.Color('#e8f4ff')
const GLOW_COLOR = new THREE.Color('#ff2d4b')

export default function LaserBeam({ config, playerZ }) {
  const meshRef = useRef()
  const glowRef = useRef()
  const visible = useRef(true)

  const beamLength = config.axis === 'x' ? config.range * 2 : config.width
  const beamHeight = config.axis === 'y' ? config.range * 2 : config.width

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.elapsedTime

    if (config.pattern === 'pulse') {
      // Pulse: fade in and out
      const cycle = Math.sin(t * config.speed + config.phase)
      visible.current = cycle > 0
      meshRef.current.visible = visible.current
      if (glowRef.current) glowRef.current.visible = visible.current
      return
    }

    // Sweep: move along the axis
    if (config.axis === 'x') {
      const x = Math.sin(t * config.speed + config.phase) * config.range
      meshRef.current.position.x = x
      if (glowRef.current) glowRef.current.position.x = x
    } else {
      const y = Math.abs(Math.sin(t * config.speed + config.phase)) * config.range + 0.2
      meshRef.current.position.y = y
      if (glowRef.current) glowRef.current.position.y = y
    }
  })

  return (
    <group position={[0, config.restY, -config.z]}>
      {/* Core beam */}
      <mesh ref={meshRef}>
        <boxGeometry args={[
          config.axis === 'x' ? config.width : config.range * 2,
          config.axis === 'y' ? config.width : 0.04,
          0.04,
        ]} />
        <meshBasicMaterial color={LASER_COLOR} transparent opacity={0.9} />
      </mesh>

      {/* Glow */}
      <mesh ref={glowRef}>
        <boxGeometry args={[
          config.axis === 'x' ? config.width * 4 : config.range * 2,
          config.axis === 'y' ? config.width * 4 : 0.15,
          0.15,
        ]} />
        <meshBasicMaterial
          color={GLOW_COLOR}
          transparent
          opacity={0.15}
        />
      </mesh>
    </group>
  )
}

// Returns current world position of the beam for collision detection
export function getBeamWorldPosition(config, time) {
  const base = { x: 0, y: config.restY, z: -config.z }

  if (config.pattern === 'pulse') {
    const cycle = Math.sin(time * config.speed + config.phase)
    return cycle > 0 ? base : null // null = invisible, no collision
  }

  if (config.axis === 'x') {
    base.x = Math.sin(time * config.speed + config.phase) * config.range
  } else {
    base.y = Math.abs(Math.sin(time * config.speed + config.phase)) * config.range + 0.2
  }

  return base
}
