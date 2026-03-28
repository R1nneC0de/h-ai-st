import { useRef, useEffect, useState } from 'react'
import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import gsap from 'gsap'
import useGameStore from '../store/useGameStore'

// 3D scene inside the vault
export default function VaultRevealScene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 4, 2]} intensity={3} color="#c9a84c" />
      <pointLight position={[-3, 1, 0]} intensity={0.5} color="#ff8c00" />
      <pointLight position={[3, 1, 0]} intensity={0.5} color="#ff8c00" />
      <fog attach="fog" args={['#080808', 8, 25]} />
      <GoldBars />
      <Particles />
    </>
  )
}

function GoldBars() {
  const ref = useRef()

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.2) * 0.05
    }
  })

  return (
    <group ref={ref} position={[0, -0.5, -2]}>
      {/* Stack of gold bars */}
      {[
        [0, 0, 0], [-0.5, 0, 0.1], [0.5, 0, -0.1],
        [-0.25, 0.25, 0.05], [0.25, 0.25, -0.05],
        [0, 0.5, 0],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[0.6, 0.2, 0.3]} />
          <meshStandardMaterial
            color="#c9a84c"
            metalness={0.95}
            roughness={0.15}
          />
        </mesh>
      ))}
    </group>
  )
}

function Particles() {
  const ref = useRef()
  const count = 80
  const positions = useRef(
    Float32Array.from({ length: count * 3 }, () => (Math.random() - 0.5) * 10)
  )

  useFrame(() => {
    if (!ref.current) return
    const arr = ref.current.geometry.attributes.position.array
    for (let i = 1; i < arr.length; i += 3) {
      arr[i] -= 0.003
      if (arr[i] < -5) arr[i] = 5
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions.current}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#c9a84c" size={0.03} transparent opacity={0.6} />
    </points>
  )
}

// HTML overlay with score breakdown
export function VaultRevealOverlay() {
  const score = useGameStore((s) => s.score)
  const vaultDigits = useGameStore((s) => s.vaultDigits)
  const resetGame = useGameStore((s) => s.resetGame)
  const containerRef = useRef()
  const [displayScore, setDisplayScore] = useState(0)

  useEffect(() => {
    // Animate score counter rolling up
    const obj = { val: 0 }
    gsap.to(obj, {
      val: score,
      duration: 2,
      delay: 0.5,
      ease: 'power2.out',
      onUpdate: () => setDisplayScore(Math.round(obj.val)),
    })

    // Fade in
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 1, delay: 0.3 }
      )
    }
  }, [score])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        opacity: 0,
      }}
    >
      {/* Title */}
      <div
        style={{
          fontFamily: 'var(--font-title)',
          fontSize: 36,
          color: '#c9a84c',
          letterSpacing: 10,
          marginBottom: 16,
        }}
      >
        YOUR VAULT
      </div>

      {/* Vault code */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 32,
        }}
      >
        {vaultDigits.map((d, i) => (
          <div
            key={i}
            style={{
              width: 40,
              height: 52,
              border: '2px solid #c9a84c',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: 24,
              fontWeight: 700,
              color: '#ff8c00',
              background: 'rgba(201,168,76,0.1)',
            }}
          >
            {d === '_' ? '-' : d}
          </div>
        ))}
      </div>

      {/* Score */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 64,
          fontWeight: 700,
          color: '#c9a84c',
          lineHeight: 1,
          marginBottom: 24,
        }}
      >
        {displayScore.toLocaleString()}
      </div>

      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 14,
          color: 'rgba(201,168,76,0.5)',
          letterSpacing: 4,
          marginBottom: 48,
        }}
      >
        FINAL SCORE
      </div>

      {/* Play again */}
      <button
        onClick={resetGame}
        style={{
          padding: '12px 40px',
          background: 'transparent',
          border: '2px solid #c9a84c',
          color: '#c9a84c',
          fontFamily: 'var(--font-mono)',
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: 4,
          cursor: 'pointer',
          textTransform: 'uppercase',
          transition: 'all 0.2s',
          pointerEvents: 'auto',
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(201,168,76,0.15)'
          e.target.style.boxShadow = '0 0 20px rgba(201,168,76,0.4)'
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'transparent'
          e.target.style.boxShadow = 'none'
        }}
      >
        Play Again
      </button>
    </div>
  )
}
