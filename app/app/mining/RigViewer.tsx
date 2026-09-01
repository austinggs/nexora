'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

function RigScene({ heat, overclocked }: { heat: number; overclocked: boolean }) {
  const fan = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (fan.current) fan.current.rotation.z += delta * (overclocked ? 7 : 3)
  })
  const heatScale = Math.min(1, Math.max(0, heat / 100))
  return <>
    <ambientLight intensity={0.7} />
    <directionalLight position={[4,5,3]} intensity={1.1} />
    <mesh position={[0,-0.8,0]}>
      <boxGeometry args={[4,0.25,2.6]} />
      <meshStandardMaterial color="#101827" metalness={0.65} roughness={0.28} />
    </mesh>
    <mesh position={[0,0.2,0]}>
      <boxGeometry args={[3.6,1.8,2.2]} />
      <meshStandardMaterial color="#182235" metalness={0.4} roughness={0.35} transparent opacity={0.92} />
    </mesh>
    <mesh position={[0.1,0.2,0.92]}>
      <boxGeometry args={[2.6,0.15,0.08]} />
      <meshStandardMaterial color={heatScale > 0.8 ? '#ff6b5e' : '#5ce1e6'} emissive={heatScale > 0.8 ? '#ff2416' : '#0d7e88'} emissiveIntensity={1.3} />
    </mesh>
    <mesh position={[0,-0.25,1.08]} ref={fan}>
      <cylinderGeometry args={[0.5,0.5,0.08,32]} />
      <meshStandardMaterial color="#44546b" metalness={0.8} roughness={0.25} />
    </mesh>
    <mesh rotation={[Math.PI/2,0,0]} position={[0,-0.25,1.13]}>
      <torusGeometry args={[0.36,0.055,12,32]} />
      <meshStandardMaterial color={heatScale > 0.8 ? '#ff826e' : '#7be7ff'} emissive={heatScale > 0.8 ? '#ff2d1a' : '#1a7f98'} emissiveIntensity={0.9} />
    </mesh>
  </>
}

export default function RigViewer({ heat, overclocked }: { heat: number; overclocked: boolean }) {
  return <div style={{height:310,width:'100%',borderRadius:18,overflow:'hidden',background:'radial-gradient(circle at 50% 40%, rgba(75,70,180,.22), rgba(3,7,18,.96))',border:'1px solid rgba(255,255,255,.08)'}}><Canvas camera={{position:[5,3.2,5.5],fov:38}}><RigScene heat={heat} overclocked={overclocked} /></Canvas></div>
}
