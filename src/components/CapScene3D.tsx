"use client";

import { Canvas } from "@react-three/fiber";
import { useGLTF, Center } from "@react-three/drei";
import { Suspense, useRef, useEffect } from "react";
import type { Group } from "three";
import gsap from "gsap";

const DEG = Math.PI / 180;
/** Stops ~28° shy of 2π so the cap finishes face-forward, not back to the rear shell */
const FINISH_ROTATION_Y = 332 * DEG;
/** Tilts cap backward — brim lifts up, underbrim faces camera */
const FINISH_ROTATION_X = -0.7;
const MID_ROTATION_Y = 285 * DEG;

function CapModel({ timeline }: { timeline: gsap.core.Timeline | null }) {
  const { scene } = useGLTF("/models/hapebeast-cap.glb");
  const meshRef = useRef<Group>(null);

  useEffect(() => {
    if (!meshRef.current || !timeline) return;

    const rotation = meshRef.current.rotation;

    // 50% → 75%: scroll-scrubbed Y spin toward front quarter
    timeline.to(
      rotation,
      {
        y: MID_ROTATION_Y,
        duration: 0.25,
        ease: "none",
      },
      0.5,
    );

    // 75% → 100%: final yaw + brim tilt — underbrim climax
    timeline.to(
      rotation,
      {
        y: FINISH_ROTATION_Y,
        x: FINISH_ROTATION_X,
        duration: 0.25,
        ease: "none",
      },
      0.75,
    );
  }, [timeline]);

  return (
    <group ref={meshRef}>
      <Center top>
        <primitive object={scene} scale={0.09} />
      </Center>
    </group>
  );
}

export default function CapScene3D({ timeline }: { timeline: gsap.core.Timeline | null }) {
  return (
    <div className="absolute inset-0 h-full w-full">
      <Canvas
        className="h-full w-full"
        style={{ width: "100%", height: "100%" }}
        camera={{ position: [0, 0, 5], fov: 45 }}
      >
        <color attach="background" args={["#050505"]} />
        <ambientLight intensity={0.3} />
        <directionalLight position={[8, 6, 4]} intensity={2.2} />
        <directionalLight position={[0, 1, 7]} intensity={1.6} />
        <spotLight
          position={[-6, 10, 3]}
          angle={0.35}
          penumbra={0.85}
          intensity={2.0}
          castShadow
        />
        <pointLight position={[0, -3, 4]} intensity={2.0} color="#FF5A00" distance={14} decay={2} />

        <Suspense fallback={null}>
          <CapModel timeline={timeline} />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/hapebeast-cap.glb");
