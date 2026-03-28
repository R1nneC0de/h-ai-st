import { useRef, useState, useEffect, useCallback } from 'react'
import { Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import useGameStore from '../store/useGameStore'
import { validateVaultCode } from '../utils/vaultCode'
import sounds from '../audio/sounds'

// 3D vault door scene
export default function VaultEntryScene() {
  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 4, 3]} intensity={2} color="#c9a84c" />
      <pointLight position={[-2, 1, 2]} intensity={0.4} color="#ff2d4b" />
      <fog attach="fog" args={['#080808', 5, 20]} />
      <VaultDoor />
    </>
  )
}

function VaultDoor() {
  const doorRef = useRef()
  const wheelRef = useRef()

  // Subtle idle animation on the wheel
  useFrame(({ clock }) => {
    if (wheelRef.current) {
      wheelRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.3) * 0.02
    }
  })

  return (
    <group position={[0, 1.5, -2]}>
      {/* Door frame */}
      <mesh>
        <boxGeometry args={[4, 4, 0.3]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Door face */}
      <mesh ref={doorRef} position={[0, 0, 0.16]}>
        <cylinderGeometry args={[1.6, 1.6, 0.15, 32]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Wheel handle */}
      <group ref={wheelRef} position={[0, 0, 0.35]}>
        <mesh>
          <torusGeometry args={[0.5, 0.04, 8, 32]} />
          <meshStandardMaterial color="#c9a84c" metalness={1} roughness={0.2} />
        </mesh>
        {/* Spokes */}
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <mesh
            key={angle}
            rotation={[0, 0, (angle * Math.PI) / 180]}
            position={[0, 0, 0]}
          >
            <boxGeometry args={[1, 0.03, 0.03]} />
            <meshStandardMaterial color="#c9a84c" metalness={1} roughness={0.2} />
          </mesh>
        ))}
      </group>

      {/* Bolts */}
      {[[-1.2, 1.2], [1.2, 1.2], [-1.2, -1.2], [1.2, -1.2]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.2]}>
          <cylinderGeometry args={[0.08, 0.08, 0.15, 8]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#888" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

// HTML overlay for keyboard input
export function VaultEntryOverlay() {
  const [entered, setEntered] = useState([])
  const [shaking, setShaking] = useState(false)
  const [success, setSuccess] = useState(false)
  const vaultDigits = useGameStore((s) => s.vaultDigits)
  const setPhase = useGameStore((s) => s.setPhase)
  const containerRef = useRef()

  const handleKey = useCallback(
    (e) => {
      if (success) return

      if (e.key === 'Backspace') {
        setEntered((prev) => prev.slice(0, -1))
        return
      }

      if (e.key === 'Enter' && entered.length === 7) {
        const correct = validateVaultCode(entered, vaultDigits)
        if (correct) {
          setSuccess(true)
          sounds.play('vaultOpen')
          // Animate then transition
          if (containerRef.current) {
            gsap.to(containerRef.current, {
              opacity: 0,
              duration: 1.5,
              delay: 1,
              onComplete: () => setPhase('reveal'),
            })
          }
        } else {
          sounds.play('vaultDenied')
          setShaking(true)
          setTimeout(() => setShaking(false), 500)
        }
        return
      }

      // Only accept digits 0-9
      if (/^[0-9]$/.test(e.key) && entered.length < 7) {
        sounds.play('vaultClick')
        setEntered((prev) => [...prev, e.key])
      }
    },
    [entered, vaultDigits, success, setPhase]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

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
        pointerEvents: 'none',
      }}
    >
      {/* Title */}
      <div
        style={{
          fontFamily: 'var(--font-title)',
          fontSize: 28,
          color: '#c9a84c',
          letterSpacing: 8,
          marginBottom: 40,
        }}
      >
        ENTER VAULT CODE
      </div>

      {/* Digit boxes */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          animation: shaking ? 'shake 0.3s ease-in-out' : 'none',
        }}
      >
        {Array.from({ length: 7 }, (_, i) => {
          const digit = entered[i]
          const filled = digit !== undefined
          return (
            <div
              key={i}
              style={{
                width: 52,
                height: 68,
                border: `2px solid ${filled ? '#c9a84c' : 'rgba(201,168,76,0.3)'}`,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: 32,
                fontWeight: 700,
                color: filled ? '#ff8c00' : 'rgba(201,168,76,0.2)',
                background: filled
                  ? 'rgba(201,168,76,0.1)'
                  : 'rgba(0,0,0,0.6)',
                transition: 'all 0.15s ease',
                transform: filled ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              {digit ?? '_'}
            </div>
          )
        })}
      </div>

      {/* Instructions */}
      <div
        style={{
          marginTop: 30,
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          color: 'rgba(201,168,76,0.5)',
          letterSpacing: 2,
        }}
      >
        {success
          ? 'ACCESS GRANTED'
          : entered.length === 7
            ? 'PRESS ENTER TO CONFIRM'
            : 'TYPE YOUR 7-DIGIT CODE'}
      </div>

      {/* Shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}
