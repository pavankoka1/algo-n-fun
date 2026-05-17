'use client'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useGraphStore } from '@/hooks/useGraphStore'

useGLTF.preload('/models/da_vinci_code_cryptex.glb')

export function CryptexModel() {
  const { scene } = useGLTF('/models/da_vinci_code_cryptex.glb')
  const groupRef = useRef<THREE.Group | null>(null)
  const shakeRef = useRef(0)
  const phase = useGraphStore(s => s.phase)
  const setPhase = useGraphStore(s => s.setPhase)
  const opacity = useRef(1)
  const spinSpeed = useRef(0.002)

  useEffect(() => {
    scene.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(0x1a1000),
          metalness: 0.92,
          roughness: 0.18,
          emissive: new THREE.Color(0x100800),
          emissiveIntensity: 0.4,
        })
        mesh.material = mat
        mesh.castShadow = false
      }
    })
  }, [scene])

  useEffect(() => {
    if (phase !== 'cryptex') return
    const t = setTimeout(() => {
      spinSpeed.current = 0.18
      shakeRef.current = 1
      setTimeout(() => {
        spinSpeed.current = 0
        shakeRef.current = 0
        setPhase('dissolve')
      }, 500)
    }, 2500)
    return () => clearTimeout(t)
  }, [phase, setPhase])

  useFrame((_, dt) => {
    if (!groupRef.current) return

    if (phase === 'cryptex') {
      groupRef.current.rotation.y += spinSpeed.current
      if (shakeRef.current > 0) {
        groupRef.current.position.x = (Math.random() - 0.5) * 0.18
        groupRef.current.position.y = (Math.random() - 0.5) * 0.18
      } else {
        groupRef.current.position.x *= 0.85
        groupRef.current.position.y *= 0.85
      }
    }

    if (phase === 'dissolve') {
      opacity.current = Math.max(0, opacity.current - dt * 1.8)
      groupRef.current.traverse(obj => {
        if ((obj as THREE.Mesh).isMesh) {
          const mat = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial
          mat.transparent = true
          mat.opacity = opacity.current
        }
      })
      if (opacity.current <= 0) setPhase('forming')
    }
  })

  if (phase === 'forming' || phase === 'ready') return null

  return (
    <group ref={groupRef} scale={[0.9, 0.9, 0.9]}>
      <pointLight position={[4, 6, 3]} intensity={3.5} color="#FFD700" distance={30} />
      <pointLight position={[-5, -3, -4]} intensity={1.8} color="#00E5FF" distance={25} />
      <ambientLight intensity={0.3} />
      <primitive object={scene} />
    </group>
  )
}
