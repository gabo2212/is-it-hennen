"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { cn } from "@/lib/utils";

const RECORD = 16;
const INK = "#070708";
const LIME = new THREE.Color("#adfa1e");
const CORAL = new THREE.Color("#ed40b3");

type SomaCloud = {
  n: number;
  positions: Float32Array;
};

type Meta = {
  n?: number;
  citation?: string;
  mb?: { pn?: number; kc?: number; mbon?: number };
};

export type FlyBrain3DProps = {
  lit?: number[];
  yes?: boolean | null;
  className?: string;
};

function idleTint(klass: number): [number, number, number] {
  if (klass === 0) return [0.16, 0.38, 0.36];
  if (klass === 1) return [0.38, 0.42, 0.5];
  return [0.16, 0.17, 0.2];
}

function parseSomas(buf: ArrayBuffer): SomaCloud & { idle: Float32Array } {
  const n = Math.floor(buf.byteLength / RECORD);
  const view = new DataView(buf);
  const positions = new Float32Array(n * 3);
  const idle = new Float32Array(n * 3);
  for (let i = 0; i < n; i += 1) {
    const o = i * RECORD;
    const p = i * 3;
    positions[p] = view.getFloat32(o, true);
    positions[p + 1] = view.getFloat32(o + 4, true);
    positions[p + 2] = view.getFloat32(o + 8, true);
    const [r, g, b] = idleTint(view.getUint8(o + 12));
    idle[p] = r;
    idle[p + 1] = g;
    idle[p + 2] = b;
  }
  return { n, positions, idle };
}

function IdleCloud({ cloud }: { cloud: SomaCloud & { idle: Float32Array } }) {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(cloud.positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(cloud.idle, 3));
    g.computeBoundingSphere();
    return g;
  }, [cloud]);

  useEffect(() => () => geom.dispose(), [geom]);

  return (
    <points geometry={geom} frustumCulled={false}>
      <pointsMaterial
        size={1.55}
        sizeAttenuation={false}
        vertexColors
        transparent
        opacity={0.7}
        depthWrite={false}
      />
    </points>
  );
}

function LitFlare({
  cloud,
  lit,
  yes,
  size,
  opacity,
}: {
  cloud: SomaCloud;
  lit: number[];
  yes: boolean | null;
  size: number;
  opacity: number;
}) {
  const matRef = useRef<THREE.PointsMaterial>(null);
  const color = yes === false ? CORAL : LIME;

  const geom = useMemo(() => {
    const n = lit.length;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i += 1) {
      const idx = lit[i] | 0;
      const s = idx * 3;
      if (s + 2 >= cloud.positions.length) continue;
      pos[i * 3] = cloud.positions[s];
      pos[i * 3 + 1] = cloud.positions[s + 1];
      pos[i * 3 + 2] = cloud.positions[s + 2];
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeBoundingSphere();
    return g;
  }, [cloud, lit, color.r, color.g, color.b]);

  useEffect(() => () => geom.dispose(), [geom]);

  useFrame(({ clock }) => {
    const mat = matRef.current;
    if (!mat) return;
    mat.opacity = opacity * (0.62 + 0.38 * Math.sin(clock.elapsedTime * 6.2));
    mat.size = size * (0.88 + 0.22 * Math.sin(clock.elapsedTime * 4.1));
  });

  if (lit.length === 0) return null;

  return (
    <points geometry={geom} frustumCulled={false}>
      <pointsMaterial
        ref={matRef}
        size={size}
        sizeAttenuation={false}
        vertexColors
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function FlyBrain3D({ lit = [], yes = null, className }: FlyBrain3DProps) {
  const [cloud, setCloud] = useState<(SomaCloud & { idle: Float32Array }) | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [binRes, metaRes] = await Promise.all([
          fetch("/fly/somas.bin", { cache: "force-cache" }),
          fetch("/fly/somas.json", { cache: "force-cache" }),
        ]);
        if (!binRes.ok) {
          throw new Error("missing");
        }
        const buf = await binRes.arrayBuffer();
        if (cancelled) return;
        setCloud(parseSomas(buf));
        if (metaRes.ok) {
          setMeta((await metaRes.json()) as Meta);
        }
      } catch {
        if (!cancelled) {
          setError("Cerveau FlyWire pas encore construit. Lance python -m cnn fly_build");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const n = cloud?.n ?? meta?.n ?? 0;
  const citation =
    meta?.citation ?? "Dorkenwald et al. Nature 634, 124–138 (2024). FlyWire · CC BY-NC 4.0.";

  return (
    <div
      className={cn(
        "relative min-h-[22rem] overflow-hidden rounded-2xl bg-black ring-1 ring-white/10",
        className,
      )}
    >
      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-6 text-center text-sm text-ink-400">
          {error}
        </div>
      )}
      {!error && !cloud && (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-ink-400">
          Chargement du cerveau…
        </div>
      )}
      {cloud && (
        <Canvas
          className="h-full min-h-[22rem] w-full"
          camera={{ position: [0, -1.2, 14], fov: 45, near: 0.1, far: 90 }}
          dpr={[1, 1.5]}
          gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
          onCreated={({ scene, gl }) => {
            scene.background = new THREE.Color(INK);
            gl.setClearColor(INK, 1);
          }}
        >
          <fog attach="fog" args={[INK, 30, 58]} />
          <IdleCloud cloud={cloud} />
          <LitFlare cloud={cloud} lit={lit} yes={yes} size={22} opacity={0.35} />
          <LitFlare cloud={cloud} lit={lit} yes={yes} size={8.5} opacity={1} />
          <OrbitControls
            enableDamping
            dampingFactor={0.08}
            autoRotate
            autoRotateSpeed={0.42}
            enablePan={false}
            minDistance={8}
            maxDistance={36}
          />
        </Canvas>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-10">
        <p className="text-[11px] uppercase tracking-[0.16em] text-ink-400">
          {n ? `${n.toLocaleString("fr-FR")} neurones` : "FlyWire FAFB v783"}
          {meta?.mb?.kc != null ? ` · ${meta.mb.kc} Kenyon` : ""}
          {lit.length ? ` · ${lit.length} allumés` : ""}
        </p>
        <p className="mt-1 text-[11px] leading-snug text-ink-500">{citation}</p>
      </div>
    </div>
  );
}
