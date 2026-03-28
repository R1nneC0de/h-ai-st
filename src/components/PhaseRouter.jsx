import { lazy, Suspense, useRef, useEffect } from 'react'
import useGameStore from '../store/useGameStore'
import { SplashScene, SplashOverlay } from './Splash'
import VaultEntryScene, { VaultEntryOverlay } from './VaultEntry'
import VaultRevealScene, { VaultRevealOverlay } from './VaultReveal'
import { playTransition } from './Transition'

const LaserCorridor = lazy(() => import('./LaserCorridor'))

// Placeholders for teammate's mini-games
function Placeholder({ name }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ff8c00" />
      </mesh>
    </>
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
  vault: VaultEntryScene,
  reveal: VaultRevealScene,
}

const OVERLAY_MAP = {
  splash: SplashOverlay,
  vault: VaultEntryOverlay,
  reveal: VaultRevealOverlay,
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

// Transition-aware phase change hook
export function useTransitionedPhaseChange(transitionRef) {
  const prevPhase = useRef(null)
  const phase = useGameStore((s) => s.phase)
  const setPhase = useGameStore((s) => s.setPhase)

  useEffect(() => {
    if (prevPhase.current !== null && prevPhase.current !== phase) {
      // Phase just changed — we could trigger transition here
      // For now transitions are triggered by the component calling setPhase
    }
    prevPhase.current = phase
  }, [phase])
}
