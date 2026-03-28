import { Canvas } from '@react-three/fiber'
import { SceneRouter, OverlayRouter } from './components/PhaseRouter'
import HUD from './components/HUD'
import HitFlash from './components/HitFlash'
import SensorDebug from './components/SensorDebug'

export default function App() {
  return (
    <>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        dpr={[1, 2]}
        style={{ background: '#080808' }}
      >
        <SceneRouter />
      </Canvas>
      <OverlayRouter />
      <HUD />
      <HitFlash />
      <SensorDebug />
    </>
  )
}
