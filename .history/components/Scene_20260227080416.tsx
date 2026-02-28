'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';

export default function Scene() {
  return (
    <Canvas className="absolute inset-0 z-0">
      <Stars radius={400} count={25000} />
      <OrbitControls enablePan={false} />
    </Canvas>
  );
}
