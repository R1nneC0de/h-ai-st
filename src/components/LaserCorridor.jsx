import { useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import useGameStore from '../store/useGameStore'
import { generateBeams, CORRIDOR_LENGTH } from '../utils/laserPatterns'
import Corridor from './laser/Corridor'
import LaserBeam from './laser/LaserBeam'
import CorridorCamera from './laser/CorridorCamera'
import PlayerCollider from './laser/PlayerCollider'

export default function LaserCorridor() {
  const section = useGameStore((s) => s.laserSection)
  const nextPhase = useGameStore((s) => s.nextPhase)
  const length = CORRIDOR_LENGTH[section]
  const beams = useMemo(() => generateBeams(section), [section])

  return (
    <>
      <ambientLight intensity={0.08} />
      <fog attach="fog" args={['#080808', 1, length * 0.8]} />
      <Corridor length={length} />
      {beams.map((beam) => (
        <LaserBeam key={beam.id} config={beam} />
      ))}
      <CorridorCamera corridorLength={length} onReachEnd={nextPhase} />
      <PlayerCollider beams={beams} />
      <AutoDriftPrompt />
    </>
  )
}

function AutoDriftPrompt() {
  const { camera } = useThree()
  const [visible, setVisible] = useState(false)
  const idleTime = useRef(0)
  const lastZ = useRef(0)

  useFrame((_, delta) => {
    const moved = Math.abs(camera.position.z - lastZ.current) > 0.01
    lastZ.current = camera.position.z

    if (moved) {
      idleTime.current = 0
      if (visible) setVisible(false)
    } else {
      idleTime.current += delta
      if (idleTime.current > 2 && !visible) setVisible(true)
    }
  })

  if (!visible) return null

  return (
    <Text
      position={[0, 1.8, camera.position.z - 3]}
      fontSize={0.25}
      color="#ff8c00"
      anchorX="center"
      anchorY="middle"
      fillOpacity={0.7 + Math.sin(Date.now() * 0.005) * 0.3}
    >
      MOVE!
    </Text>
  )
}
