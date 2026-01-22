
import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { ShapeConfig } from '../types';

interface ThreeViewProps {
  shapes: ShapeConfig[];
  onSceneUpdate?: (scene: THREE.Scene) => void;
}

const ShapeRenderer: React.FC<{ config: ShapeConfig }> = ({ config }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { params } = config;

  return (
    <mesh ref={meshRef} position={config.position} castShadow receiveShadow>
      {config.type === 'box' && (
        <boxGeometry args={[params.width || 1, params.height || 1, params.depth || 1]} />
      )}
      {config.type === 'sphere' && (
        <sphereGeometry args={[params.radius || 1, 32, 32]} />
      )}
      {config.type === 'cylinder' && (
        <cylinderGeometry args={[params.radius || 1, params.radius || 1, params.height || 1, 32]} />
      )}
      {config.type === 'cone' && (
        <coneGeometry args={[params.radius || 1, params.height || 1, 32]} />
      )}
      {config.type === 'torus' && (
        <torusGeometry args={[params.radius || 1, params.tube || 0.4, 16, 100]} />
      )}
      <meshStandardMaterial 
        color={config.color} 
        roughness={0.2} 
        metalness={0.8} 
        envMapIntensity={1}
      />
    </mesh>
  );
};

const SceneTracker: React.FC<{ onUpdate: (scene: THREE.Scene) => void }> = ({ onUpdate }) => {
  useFrame(({ scene }) => {
    onUpdate(scene);
  });
  return null;
};

export const ThreeView: React.FC<ThreeViewProps> = ({ shapes, onSceneUpdate }) => {
  const handleUpdate = (scene: THREE.Scene) => {
    if (onSceneUpdate) onSceneUpdate(scene);
  };

  return (
    <div className="w-full h-full bg-slate-950 rounded-2xl overflow-hidden relative border border-white/5 shadow-2xl">
      <Canvas shadows gl={{ antialias: true }}>
        <PerspectiveCamera makeDefault position={[20, 20, 20]} fov={40} />
        
        {/* Static Lighting to prevent 'plane movement' */}
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize={[2048, 2048]} 
        />
        <pointLight position={[-10, 10, -10]} intensity={0.5} />

        <Suspense fallback={null}>
          <group>
            {shapes.map(shape => (
              <ShapeRenderer key={shape.id} config={shape} />
            ))}
          </group>
          
          <SceneTracker onUpdate={handleUpdate} />
          <Environment preset="city" />
          
          {/* Soft ground shadows */}
          <ContactShadows 
            position={[0, -0.01, 0]} 
            opacity={0.4} 
            scale={40} 
            blur={2} 
            far={10} 
            resolution={512} 
            color="#000000" 
          />
        </Suspense>

        {/* Stable Grid fixed at Y=0 */}
        <Grid 
          infiniteGrid 
          cellSize={1} 
          sectionSize={5} 
          fadeDistance={60} 
          sectionColor="#3b82f6" 
          cellColor="#1e293b" 
          position={[0, 0, 0]}
        />

        <OrbitControls 
          makeDefault 
          minPolarAngle={0} 
          maxPolarAngle={Math.PI / 2.1} 
          enableDamping 
          dampingFactor={0.05} 
        />
      </Canvas>
      
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <div className="px-3 py-1 bg-blue-600/10 backdrop-blur-md rounded-lg text-[9px] text-blue-400 border border-blue-500/20 uppercase tracking-[0.2em] font-black">
          Fixed Coordinate Space
        </div>
      </div>
    </div>
  );
};
