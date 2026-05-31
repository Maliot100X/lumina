'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

function Orb({ verified, resonance }: { verified: boolean; resonance: number }) {
  const group = useRef<THREE.Group>(null!);
  const glow = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
    if (glow.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.08;
      glow.current.scale.setScalar(scale);
    }
  });

  const resonanceColor = verified ? '#facc15' : '#a5b4fc';

  return (
    <group ref={group}>
      {/* Core */}
      <mesh>
        <sphereGeometry args={[1.0]} />
        <meshBasicMaterial color="#111111" />
      </mesh>

      {/* Inner glow */}
      <mesh ref={glow}>
        <sphereGeometry args={[1.25]} />
        <meshBasicMaterial color={resonanceColor} transparent opacity={0.25} />
      </mesh>

      {/* Verified ring */}
      {verified && (
        <mesh rotation={[1.4, 0, 0]}>
          <torusGeometry args={[1.85, 0.06, 32, 64]} />
          <meshBasicMaterial color="#facc15" transparent opacity={0.9} />
        </mesh>
      )}

      {/* Resonance particles */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[
          Math.cos(i * 1.1) * (1.8 + (resonance % 100) / 400),
          Math.sin(i * 0.7) * 0.9,
          Math.sin(i) * 0.4
        ]}>
          <sphereGeometry args={[0.06]} />
          <meshBasicMaterial color={verified ? '#fef08c' : '#c4b5fd'} />
        </mesh>
      ))}
    </group>
  );
}

export default function PresenceOrb({ verified = false, resonance = 1240 }: { verified?: boolean; resonance?: number }) {
  return (
    <div className="w-64 h-64 mx-auto">
      <Canvas camera={{ position: [0, 0, 6], fov: 42 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1.2} color="#ffffff" />
        <Orb verified={verified} resonance={resonance} />
      </Canvas>
    </div>
  );
}
