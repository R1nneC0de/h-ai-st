import { lazy, Suspense } from 'react'
import useGameStore from '../store/useGameStore'
import { SplashScene, SplashOverlay } from './Splash'

const LaserCorridor = lazy(() => import('./LaserCorridor'))

// Placeholders for teammate's mini-games
function Placeholder({ name }) {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ff8c00" />
    </mesh>
  )
}

const SCENE_MAP = {
  splash: SplashScene,
  laser1: LaserCorridor,
  slots: () => <Placeholder name="Slots" />,
  laser2: LaserCorridor,
  roulette: () => <Placeholder name="Roulette" />,
  laser3: LaserCorridor,
  blackjack: () => <Placeholder name="Blackjack" />,
  vault: () => <Placeholder name="Vault" />,
  reveal: () => <Placeholder name="Reveal" />,
}

const OVERLAY_MAP = {
  splash: SplashOverlay,
}

export function SceneRouter() {
  const phase = useGameStore((s) => s.phase)
  const Scene = SCENE_MAP[phase]
  if (!Scene) return null

  return (
    <Suspense fallback={null}>
      <Scene />
    </Suspense>
  )
}

export function OverlayRouter() {
  const phase = useGameStore((s) => s.phase)
  const Overlay = OVERLAY_MAP[phase]
  if (!Overlay) return null
  return <Overlay />
}
