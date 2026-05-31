'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

function FloatingProfile({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const group = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * 0.2;
      group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.15;
    }
  });

  return (
    <group ref={group} position={position}>
      {/* Core glowing orb */}
      <mesh>
        <sphereGeometry args={[0.6 * scale]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.15} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.42 * scale]} />
        <meshBasicMaterial color="#a5b4fc" transparent opacity={0.6} />
      </mesh>

      {/* Elegant ring */}
      <mesh rotation={[1.2, 0, 0]}>
        <torusGeometry args={[1.1 * scale, 0.015, 16, 64]} />
        <meshBasicMaterial color="#c4b5fd" transparent opacity={0.7} />
      </mesh>

      {/* Small accent points */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[Math.cos(i) * 1.4 * scale, Math.sin(i * 1.7) * 0.6 * scale, 0]}>
          <sphereGeometry args={[0.04 * scale]} />
          <meshBasicMaterial color="#e0e7ff" />
        </mesh>
      ))}
    </group>
  );
}

export default function HeroScene() {
  return (
    <div className="absolute inset-0 -z-10 opacity-60">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[-10, 10, -10]} color="#a5b4fc" intensity={0.8} />
        <pointLight position={[10, -10, 10]} color="#c4b5fd" intensity={0.6} />

        <FloatingProfile position={[-3.2, 0.5, -1]} scale={0.85} />
        <FloatingProfile position={[3.5, -1.2, -2]} scale={1.1} />
        <FloatingProfile position={[0, 2.8, -3.5]} scale={0.7} />
        <FloatingProfile position={[-2.1, -2.5, -4]} scale={0.6} />

        <Stars 
          radius={120} 
          depth={40} 
          count={120} 
          factor={2.5} 
          saturation={0} 
          fade 
          speed={0.6}
        />

        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          enableRotate={true}
          autoRotate
          autoRotateSpeed={0.08}
          maxPolarAngle={Math.PI * 0.85}
          minPolarAngle={Math.PI * 0.15}
        />
      </Canvas>
    </div>
  );
}
