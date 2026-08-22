/**
 * HolographicOrb3D.tsx
 *
 * Ultron-inspired 3D Holographic Orb for Luci Desktop (Three.js)
 * Features wireframe spheres, rotating neon rings, floating particles,
 * and state-reactive color shifts (Idle, Listening, Thinking, Speaking).
 */

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';

interface Orb3DProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  gestureRotation?: { x: number; y: number };
  gestureZoom?: number;
}

function InnerCore({ state }: { state: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  // State-based dynamic colors
  const colorMap: Record<string, string> = {
    idle: '#3b82f6', // Blue
    listening: '#10b981', // Emerald green
    thinking: '#8b5cf6', // Purple
    speaking: '#f59e0b', // Amber/Gold
  };

  const currentColor = colorMap[state] || '#3b82f6';

  useFrame((_, delta) => {
    const speedMultiplier = state === 'thinking' ? 4 : state === 'speaking' ? 2 : 1;

    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5 * speedMultiplier;
      meshRef.current.rotation.x += delta * 0.3 * speedMultiplier;
    }

    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * 0.8 * speedMultiplier;
      ring1Ref.current.rotation.x += delta * 0.4;
    }

    if (ring2Ref.current) {
      ring2Ref.current.rotation.z -= delta * 0.6 * speedMultiplier;
      ring2Ref.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group>
      {/* Central Holographic Icosahedron */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.2, 2]} />
        <meshBasicMaterial
          color={currentColor}
          wireframe
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Rotating Ring 1 */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.8, 0.02, 16, 100]} />
        <meshBasicMaterial color={currentColor} transparent opacity={0.8} />
      </mesh>

      {/* Rotating Ring 2 */}
      <mesh ref={ring2Ref} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[2.2, 0.015, 16, 100]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

export function HolographicOrb3D({ state, gestureRotation, gestureZoom = 1 }: Orb3DProps) {
  return (
    <div className="relative w-full h-[400px] flex items-center justify-center">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.8}>
          <group scale={gestureZoom} rotation={[gestureRotation?.x || 0, gestureRotation?.y || 0, 0]}>
            <InnerCore state={state} />
          </group>
        </Float>
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>

      {/* HUD State Indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-mono tracking-widest uppercase px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-blue-500/30 text-blue-400">
        Luci STATE: <span className="font-bold text-white">{state}</span>
      </div>
    </div>
  );
}
