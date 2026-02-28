"use client";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface HolographicSphereProps {
  isDeploying?: boolean;
}

export default function HolographicSphere({
  isDeploying = false,
}: HolographicSphereProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = containerRef.current.clientWidth || 300;
    const height = containerRef.current.clientHeight || 300;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 2.5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0.1);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Holographic Sphere Geometry
    const geometry = new THREE.IcosahedronGeometry(1, 5);

    // Iridescent Material with multiple colors
    const material = new THREE.MeshPhongMaterial({
      color: 0x00ffff,
      emissive: 0x00ff99,
      shininess: 100,
      wireframe: false,
    });

    const sphere = new THREE.Mesh(geometry, material);
    sphereRef.current = sphere;
    scene.add(sphere);

    // Particle system for mycelial connections
    const particleCount = 50;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 5;
      particlePositions[i + 1] = (Math.random() - 0.5) * 5;
      particlePositions[i + 2] = (Math.random() - 0.5) * 5;
    }

    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      color: 0x00ff99,
      size: 0.05,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Lighting
    const light1 = new THREE.PointLight(0x00ffff, 1, 100);
    light1.position.set(5, 5, 5);
    scene.add(light1);

    const light2 = new THREE.PointLight(0xff00ff, 0.8, 100);
    light2.position.set(-5, -5, 5);
    scene.add(light2);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (sphere) {
        sphere.rotation.x += 0.003;
        sphere.rotation.y += 0.005;

        // Pulsing effect during deployment
        if (isDeploying) {
          const scale = 1 + Math.sin(Date.now() * 0.005) * 0.2;
          sphere.scale.set(scale, scale, scale);
          material.emissive.setHex(0xff00ff);
        } else {
          sphere.scale.set(1, 1, 1);
          material.emissive.setHex(0x00ff99);
        }
      }

      // Particle animation
      if (particles) {
        particles.rotation.x += 0.0005;
        particles.rotation.y += 0.001;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const newWidth = containerRef.current.clientWidth || 300;
      const newHeight = containerRef.current.clientHeight || 300;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [isDeploying]);

  return (
    <div
      ref={containerRef}
      className="w-full h-48 rounded-2xl overflow-hidden border-2 border-purple-500/50 shadow-lg shadow-purple-500/30 bg-black/50"
    />
  );
}
