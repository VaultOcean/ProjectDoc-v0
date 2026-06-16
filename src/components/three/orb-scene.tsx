"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

/** The ocean orb — a slowly morphing, glossy distorted sphere. Pure WebGL, no assets. */
function Orb() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    m.rotation.y = t * 0.14;
    m.rotation.z = t * 0.04;
    // gentle drift toward the pointer (when the canvas receives events)
    m.position.x = THREE.MathUtils.lerp(m.position.x, state.pointer.x * 0.25, 0.04);
    m.position.y = THREE.MathUtils.lerp(m.position.y, state.pointer.y * 0.25, 0.04);
  });

  return (
    <Sphere ref={ref} args={[1.45, 200, 200]}>
      <MeshDistortMaterial
        color="#0c6b64"
        emissive="#2ee6d6"
        emissiveIntensity={0.16}
        distort={0.42}
        speed={1.6}
        roughness={0.16}
        metalness={0.92}
      />
    </Sphere>
  );
}

export default function OrbScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.2], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 3, 4]} intensity={2.2} color="#cdfdf7" />
      <pointLight position={[-4, -2, -2]} intensity={3.4} color="#2ee6d6" />
      <pointLight position={[2.5, -3, 1.5]} intensity={1.8} color="#3a6bff" />
      <Orb />
    </Canvas>
  );
}
