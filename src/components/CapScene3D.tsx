"use client";

import { Canvas } from "@react-three/fiber";
import { useGLTF, Center, Html } from "@react-three/drei";
import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Group } from "three";
import gsap from "gsap";
import {
  CAP_MODEL_CDN,
  CAP_MODEL_LOCAL,
  DRACO_DECODER,
  getCapModelUrl,
} from "@/lib/capModel";

const DEG = Math.PI / 180;
const FINISH_ROTATION_Y = 332 * DEG;
const FINISH_ROTATION_X = -0.7;
const MID_ROTATION_Y = 285 * DEG;

type CapModelProps = {
  timeline: gsap.core.Timeline | null;
  modelUrl: string;
};

function CapModel({ timeline, modelUrl }: CapModelProps) {
  const { scene } = useGLTF(modelUrl, DRACO_DECODER);
  const meshRef = useRef<Group>(null);
  const model = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    if (!meshRef.current || !timeline) return;

    const rotation = meshRef.current.rotation;

    timeline.to(
      rotation,
      {
        y: MID_ROTATION_Y,
        duration: 0.25,
        ease: "none",
      },
      0.5,
    );

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
        <primitive object={model} scale={0.09} />
      </Center>
    </group>
  );
}

type ModelErrorBoundaryProps = {
  children: ReactNode;
  onFallback: () => void;
};

type ModelErrorBoundaryState = {
  hasError: boolean;
};

class ModelErrorBoundary extends Component<
  ModelErrorBoundaryProps,
  ModelErrorBoundaryState
> {
  state: ModelErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ModelErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("[CapScene3D] Failed to load cap model:", error);
    this.props.onFallback();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function CapModelLoader({ timeline }: { timeline: gsap.core.Timeline | null }) {
  const [modelUrl, setModelUrl] = useState(getCapModelUrl);
  const [usingFallback, setUsingFallback] = useState(false);

  const activateFallback = () => {
    if (usingFallback || modelUrl !== CAP_MODEL_LOCAL) return;
    setUsingFallback(true);
    setModelUrl(CAP_MODEL_CDN);
  };

  return (
    <ModelErrorBoundary key={modelUrl} onFallback={activateFallback}>
      <Suspense
        fallback={
          <Html center>
            <span className="text-[10px] uppercase tracking-[0.35em] text-white/25">
              Loading
            </span>
          </Html>
        }
      >
        <CapModel timeline={timeline} modelUrl={modelUrl} />
      </Suspense>
    </ModelErrorBoundary>
  );
}

export default function CapScene3D({ timeline }: { timeline: gsap.core.Timeline | null }) {
  return (
    <div className="absolute inset-0 h-full w-full">
      <Canvas
        className="h-full w-full"
        style={{ width: "100%", height: "100%" }}
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
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

        <CapModelLoader timeline={timeline} />
      </Canvas>
    </div>
  );
}

useGLTF.preload(getCapModelUrl(), DRACO_DECODER);
useGLTF.preload(CAP_MODEL_CDN, DRACO_DECODER);
