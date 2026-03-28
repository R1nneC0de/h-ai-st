import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

const WALL_COLOR = '#0a0a0a'
const EDGE_COLOR = '#ff2d4b'

export default function Corridor({ length }) {
  const width = 4
  const height = 3

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -length / 2]}>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color="#0c0c0c" roughness={0.8} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, -length / 2]}>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.9} />
      </mesh>

      {/* Left wall */}
      <mesh
        rotation={[0, Math.PI / 2, 0]}
        position={[-width / 2, height / 2, -length / 2]}
      >
        <planeGeometry args={[length, height]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.9} />
      </mesh>

      {/* Right wall */}
      <mesh
        rotation={[0, -Math.PI / 2, 0]}
        position={[width / 2, height / 2, -length / 2]}
      >
        <planeGeometry args={[length, height]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.9} />
      </mesh>

      {/* Edge lights along floor — left */}
      <EdgeLights side={-1} length={length} width={width} />
      {/* Edge lights along floor — right */}
      <EdgeLights side={1} length={length} width={width} />
    </group>
  )
}

function EdgeLights({ side, length, width }) {
  const count = Math.floor(length / 5)
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <pointLight
          key={i}
          position={[side * (width / 2 - 0.1), 0.1, -(i * 5 + 2.5)]}
          intensity={0.3}
          distance={4}
          color={EDGE_COLOR}
        />
      ))}
    </>
  )
}
