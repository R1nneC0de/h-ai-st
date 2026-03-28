import { Canvas } from '@react-three/fiber'
import { Text } from '@react-three/drei'

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 2, 4]} intensity={1} color="#c9a84c" />
      <Text
        fontSize={1.2}
        color="#c9a84c"
        font="/fonts/PlayfairDisplay-Black.ttf"
        anchorX="center"
        anchorY="middle"
        position={[0, 0.3, 0]}
      >
        HEIST
      </Text>
      <Text
        fontSize={0.15}
        color="#ff8c00"
        anchorX="center"
        anchorY="middle"
        position={[0, -0.6, 0]}
      >
        scaffold loaded
      </Text>
    </>
  )
}

export default function App() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      dpr={[1, 2]}
      style={{ background: '#080808' }}
    >
      <Scene />
    </Canvas>
  )
}
