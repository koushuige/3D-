import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { HandData, GestureState } from '../types';

// Fix for missing R3F JSX types
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      instancedMesh: any;
      dodecahedronGeometry: any;
      meshStandardMaterial: any;
      ambientLight: any;
      pointLight: any;
      color: any;
    }
  }
}

interface SceneProps {
  handData: HandData | null;
}

const PARTICLE_COUNT = 4000;

const Particles: React.FC<{ handData: HandData | null }> = ({ handData }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  // Stable references for smoothing values (Lerping)
  const targetScale = useRef(1);
  const currentScale = useRef(1);
  
  const targetRotation = useRef(new THREE.Euler(0, 0, 0));
  const currentRotation = useRef(new THREE.Euler(0, 0, 0));
  
  const initialZAngle = useRef<number | null>(null);
  const accumulatedZRotation = useRef(0);

  // Generate initial random positions
  const { positions, randoms, colors } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const rnd = new Float32Array(PARTICLE_COUNT * 3);
    const col = new Float32Array(PARTICLE_COUNT * 3);
    const color = new THREE.Color();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Sphere distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const r = 2 + Math.random() * 1.5;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      rnd[i * 3] = Math.random(); // Random speed factor
      rnd[i * 3 + 1] = Math.random(); // Random offset
      rnd[i * 3 + 2] = Math.random(); 

      // Initial Cyan/Blue Palette
      color.setHSL(0.5 + Math.random() * 0.1, 0.8, 0.6);
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }
    return { positions: pos, randoms: rnd, colors: col };
  }, []);

  // Update loop
  useFrame((state) => {
    if (!meshRef.current || !groupRef.current) return;

    const time = state.clock.getElapsedTime();
    const gesture = handData?.gesture || GestureState.IDLE;

    // --- 1. HANDLE ROTATION ---
    if (gesture === GestureState.ROTATE_XY && handData) {
        // Map hand X/Y (-1 to 1) to rotation speed or absolute rotation
        // Let's do absolute tilt for better "feeling"
        const tiltMax = Math.PI / 1.5;
        targetRotation.current.x = handData.values.rotationX * tiltMax;
        targetRotation.current.y = handData.values.rotationY * tiltMax;
    } 
    else if (gesture === GestureState.ROTATE_Z && handData) {
        // Calculate delta for 1:1 mapping
        if (initialZAngle.current === null) {
            initialZAngle.current = handData.values.rotationZ;
        } else {
            const delta = handData.values.rotationZ - initialZAngle.current;
            accumulatedZRotation.current += delta; // Accumulate change
            initialZAngle.current = handData.values.rotationZ; // Reset baseline
        }
        targetRotation.current.z = accumulatedZRotation.current;
    } else {
        // IDLE or ZOOM: Reset initial Z anchor, drift back slowly or keep last
        initialZAngle.current = null;
        // Optionally auto-rotate slowly when idle
        if (gesture === GestureState.IDLE) {
            targetRotation.current.y += 0.002; 
        }
    }

    // Apply Rotation Lerp
    currentRotation.current.x = THREE.MathUtils.lerp(currentRotation.current.x, targetRotation.current.x, 0.1);
    currentRotation.current.y = THREE.MathUtils.lerp(currentRotation.current.y, targetRotation.current.y, 0.1);
    currentRotation.current.z = THREE.MathUtils.lerp(currentRotation.current.z, targetRotation.current.z, 0.1);

    groupRef.current.rotation.x = currentRotation.current.x;
    groupRef.current.rotation.y = currentRotation.current.y;
    groupRef.current.rotation.z = currentRotation.current.z;


    // --- 2. HANDLE EXPANSION (ZOOM) & COLOR ---
    if (gesture === GestureState.ZOOM_EXPLODE && handData) {
        // Map 0..1 to Scale 0.2..3
        const zoomFactor = handData.values.expansion;
        targetScale.current = 0.5 + (zoomFactor * 3.5);
    } else {
        targetScale.current = 1.0;
    }
    
    // Smooth scale
    currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale.current, 0.1);

    // --- 3. UPDATE PARTICLES ---
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    
    // Base color
    const hueBase = 0.55; // Blue/Cyan
    // Explode color (Shift to Red/Orange/Pink at high expansion)
    const hueExplode = 0.95; 

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const x = positions[i * 3];
        const y = positions[i * 3 + 1];
        const z = positions[i * 3 + 2];
        
        // Add organic noise movement
        const noiseFreq = 0.5;
        const noiseAmp = 0.2;
        const noiseX = Math.sin(time * randoms[i * 3] + x * noiseFreq) * noiseAmp;
        const noiseY = Math.cos(time * randoms[i * 3 + 1] + y * noiseFreq) * noiseAmp;
        const noiseZ = Math.sin(time * randoms[i * 3 + 2] + z * noiseFreq) * noiseAmp;

        // Apply Expansion
        // We push particles out from center (0,0,0)
        dummy.position.set(
            (x + noiseX) * currentScale.current,
            (y + noiseY) * currentScale.current,
            (z + noiseZ) * currentScale.current
        );

        dummy.rotation.set(0, 0, 0);
        // Scale individual particles slightly based on overall scale for dramatic effect
        const pScale = 1 + (currentScale.current * 0.2); 
        dummy.scale.set(pScale, pScale, pScale);
        
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);

        // Update Color based on expansion
        // If expanded (scale > 1.5), shift hue
        const colorMix = Math.max(0, (currentScale.current - 1.2) / 2); 
        const h = THREE.MathUtils.lerp(hueBase, hueExplode, colorMix);
        const s = 0.8;
        const l = 0.6 + (Math.sin(time * 5 + i) * 0.1); // Shimmer
        
        color.setHSL(h, s, l);
        meshRef.current.setColorAt(i, color);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;

  });

  return (
    <group ref={groupRef}>
        <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
        <dodecahedronGeometry args={[0.08, 0]} />
        <meshStandardMaterial toneMapped={false} />
        </instancedMesh>
    </group>
  );
};

const ParticleScene: React.FC<SceneProps> = ({ handData }) => {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
        <color attach="background" args={['#050505']} />
        
        {/* Cinematic Lighting */}
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#00ffff" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#ff00ff" />
        
        <Particles handData={handData} />
        
        <Environment preset="city" />
        {/* Post-processing Bloom via components/overlay could be added here but keeping it performant */}
      </Canvas>
    </div>
  );
};

export default ParticleScene;