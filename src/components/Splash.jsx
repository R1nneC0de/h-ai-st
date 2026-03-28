import { useRef, useEffect } from 'react'
import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import gsap from 'gsap'
import useGameStore from '../store/useGameStore'
import usePlayerInput from '../hooks/usePlayerInput'

function FloatingTitle() {
  const ref = useRef()

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = 0.5 + Math.sin(clock.elapsedTime * 0.8) * 0.08
    }
  })

  return (
    <Text
      ref={ref}
      fontSize={1.4}
      color="#c9a84c"
      anchorX="center"
      anchorY="middle"
      position={[0, 0.5, 0]}
      letterSpacing={0.15}
    >
      HEIST
    </Text>
  )
}

function Particles() {
  const ref = useRef()
  const count = 60
  const positions = useRef(
    Float32Array.from({ length: count * 3 }, () => (Math.random() - 0.5) * 8)
  )

  useFrame(({ clock }) => {
    if (!ref.current) return
    const arr = ref.current.geometry.attributes.position.array
    for (let i = 1; i < arr.length; i += 3) {
      arr[i] += 0.002
      if (arr[i] > 4) arr[i] = -4
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
      <pointsMaterial color="#c9a84c" size={0.02} transparent opacity={0.4} />
    </points>
  )
}

export function SplashScene() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 3, 4]} intensity={1.5} color="#c9a84c" />
      <pointLight position={[-3, -1, 2]} intensity={0.5} color="#ff2d4b" />
      <FloatingTitle />
      <Particles />
    </>
  )
}

export function SplashOverlay() {
  const setPhase = useGameStore((s) => s.setPhase)
  const setSensorPermission = useGameStore((s) => s.setSensorPermission)
  const { requestPermission } = usePlayerInput()
  const btnRef = useRef()
  const containerRef = useRef()

  useEffect(() => {
    if (btnRef.current) {
      gsap.fromTo(
        btnRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, delay: 0.5, ease: 'power2.out' }
      )
      gsap.to(btnRef.current, {
        boxShadow: '0 0 20px rgba(201,168,76,0.6)',
        repeat: -1,
        yoyo: true,
        duration: 1.5,
      })
    }
  }, [])

  const handleStart = async () => {
    const granted = await requestPermission()
    setSensorPermission(granted ? 'granted' : 'denied')

    // Fade out then switch phase
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        duration: 0.6,
        onComplete: () => setPhase('laser1'),
      })
    } else {
      setPhase('laser1')
    }
  }

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
        pointerEvents: 'auto',
        zIndex: 50,
      }}
    >
      <button
        ref={btnRef}
        onClick={handleStart}
        style={{
          marginTop: 180,
          padding: '14px 48px',
          background: 'transparent',
          border: '2px solid #c9a84c',
          color: '#c9a84c',
          fontFamily: 'var(--font-mono)',
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: 4,
          cursor: 'pointer',
          textTransform: 'uppercase',
          opacity: 0,
        }}
      >
        Start Heist
      </button>
    </div>
  )
}
