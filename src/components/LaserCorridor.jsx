import { useMemo, useRef, useEffect, useState } from 'react'
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
  // This is a 3D text that shows "MOVE!" when idle too long
  // Handled in CorridorCamera via idleTime — this is the visual cue
  // For now, we use the HitFlash overlay in the DOM layer instead
  return null
}
