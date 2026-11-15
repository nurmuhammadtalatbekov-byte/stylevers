import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import {
  forwardRef,
  Suspense,
  useEffect,
  useLayoutEffect,
  useState,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import * as THREE from "three";
import type { ComponentRef } from "react";

type OrbitImpl = ComponentRef<typeof OrbitControls>;

import { MATERIAL_PROPS, SLEEVE_LEN, type Design, type PartStyle } from "@/lib/fashion";

import { HumanModel } from "./HumanModel";
import { ImportedGarment } from "./ImportedGarment";
import { Underwear } from "./Underwear";

export type View = "front" | "back" | "left" | "right";

export interface SceneHandle {
  setView: (v: View) => void;
  reset: () => void;
  zoom: (f: number) => void;
  snapshot: () => string;
  spin: (on: boolean) => void;
}

const TARGET = new THREE.Vector3(0, 1.05, 0);

const VIEWS: Record<View, [number, number, number]> = {
  front: [0, 1.25, 3.8],
  back: [0, 1.25, -3.8],
  left: [-3.8, 1.25, 0],
  right: [3.8, 1.25, 0],
};

/* ---------- TEXTURES ---------- */

const texCache = new Map<string, THREE.Texture>();

function patternTexture(s: PartStyle, weave: number): THREE.Texture {
  const key = `${s.pattern}|${s.color}|${s.accent}|${weave}|${
    s.pattern === "custom" ? s.customTexture : ""
  }`;

  const hit = texCache.get(key);
  if (hit) return hit;

  const c = document.createElement("canvas");
  c.width = c.height = 256;

  const g = c.getContext("2d");

  if (!g) {
    throw new Error("Fabric textures are unavailable in this browser.");
  }

  g.fillStyle = s.color;
  g.fillRect(0, 0, 256, 256);

  g.fillStyle = s.accent;
  g.strokeStyle = s.accent;

  if (s.pattern === "stripes") {
    for (let x = 0; x < 256; x += 32) {
      g.fillRect(x, 0, 12, 256);
    }
  }

  if (s.pattern === "geometric") {
    for (let y = 0; y < 256; y += 64) {
      for (let x = 0; x < 256; x += 64) {
        g.beginPath();
        g.moveTo(x + 32, y + 6);
        g.lineTo(x + 58, y + 58);
        g.lineTo(x + 6, y + 58);
        g.closePath();
        g.fill();
      }
    }
  }

  if (s.pattern === "floral") {
    for (let y = 32; y < 256; y += 64) {
      for (let x = 32; x < 256; x += 64) {
        const ox = (y / 64) % 2 ? 32 : 0;

        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2;

          g.beginPath();
          g.arc(x + ox + Math.cos(a) * 10, y + Math.sin(a) * 10, 7, 0, 7);
          g.fill();
        }

        g.fillStyle = s.color;
        g.beginPath();
        g.arc(x + ox, y, 4, 0, 7);
        g.fill();

        g.fillStyle = s.accent;
      }
    }
  }

  if (s.pattern === "abstract") {
    g.lineWidth = 10;
    g.lineCap = "round";

    let seed = 7;

    const r = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;

    for (let i = 0; i < 9; i++) {
      g.globalAlpha = 0.5 + r() * 0.5;
      g.beginPath();
      g.moveTo(r() * 256, r() * 256);

      g.bezierCurveTo(r() * 256, r() * 256, r() * 256, r() * 256, r() * 256, r() * 256);

      g.stroke();
    }

    g.globalAlpha = 1;
  }

  if (weave > 0) {
    g.globalAlpha = weave;

    for (let y = 0; y < 256; y += 2) {
      g.fillStyle = y % 4 ? "#000" : "#fff";
      g.fillRect(0, y, 256, 1);
    }

    for (let x = 0; x < 256; x += 3) {
      g.fillStyle = "#000";
      g.globalAlpha = weave * 0.5;
      g.fillRect(x, 0, 1, 256);
    }

    g.globalAlpha = 1;
  }

  const tex = new THREE.CanvasTexture(c);

  if (s.pattern === "custom" && s.customTexture) {
    const img = new Image();

    img.onload = () => {
      g.drawImage(img, 0, 0, 256, 256);
      tex.needsUpdate = true;
    };

    img.src = s.customTexture;
  }

  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;

  texCache.set(key, tex);

  return tex;
}

function Fabric({ style }: { style: PartStyle }) {
  const m = MATERIAL_PROPS[style.material];

  const map = useMemo(() => patternTexture(style, m.weave), [style, m.weave]);

  return (
    <meshPhysicalMaterial
      map={map}
      roughness={m.roughness}
      metalness={m.metalness}
      sheen={m.sheen}
      sheenColor={style.color}
      clearcoat={m.clearcoat}
      transparent={m.opacity !== undefined}
      opacity={m.opacity ?? 1}
      side={THREE.DoubleSide}
    />
  );
}

/* ---------- GEOMETRY HELPERS ---------- */

type GarmentProfilePoint = [width: number, depth: number, height: number];

function garmentShell(profile: GarmentProfilePoint[], segments = 64): THREE.BufferGeometry {
  const rings: GarmentProfilePoint[] = [];

  for (let i = 0; i < profile.length - 1; i++) {
    const start = profile[i];
    const end = profile[i + 1];
    if (!start || !end) continue;

    for (let step = 0; step < 4; step++) {
      const t = step / 4;
      rings.push([
        THREE.MathUtils.lerp(start[0], end[0], t),
        THREE.MathUtils.lerp(start[1], end[1], t),
        THREE.MathUtils.lerp(start[2], end[2], t),
      ]);
    }
  }

  const last = profile.at(-1);
  if (last) rings.push(last);

  const positions = new Float32Array(rings.length * (segments + 1) * 3);
  const uvs = new Float32Array(rings.length * (segments + 1) * 2);
  const indices: number[] = [];

  rings.forEach(([width, depth, height], ring) => {
    const hemWeight = THREE.MathUtils.smoothstep(height, 0.35, 0.9);

    for (let segment = 0; segment <= segments; segment++) {
      const angle = (segment / segments) * Math.PI * 2;
      const pleat =
        1 +
        (1 - hemWeight) *
          (0.018 * Math.sin(angle * 8 + height * 18) + 0.007 * Math.sin(angle * 15 - height * 31));
      const vertex = ring * (segments + 1) + segment;
      positions[vertex * 3] = Math.cos(angle) * width * pleat;
      positions[vertex * 3 + 1] = height;
      positions[vertex * 3 + 2] = Math.sin(angle) * depth * pleat;
      uvs[vertex * 2] = segment / segments;
      uvs[vertex * 2 + 1] = ring / Math.max(rings.length - 1, 1);

      if (ring < rings.length - 1 && segment < segments) {
        const nextRing = vertex + segments + 1;
        indices.push(vertex, nextRing, vertex + 1, vertex + 1, nextRing, nextRing + 1);
      }
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/* ---------- GARMENT TOP ---------- */

function Top({
  d,
  sleeve: baseSleeve,
  bottom,
  hood: baseHood,
  open,
  collar: baseCollar,
}: {
  d: Design;
  sleeve: number;
  bottom: number;
  hood?: boolean;
  open?: boolean;
  collar?: boolean;
}) {
  const f = d.fit;

  const sleeve = d.sleeve && d.sleeve !== "auto" ? SLEEVE_LEN[d.sleeve] : baseSleeve;

  const cs = d.collar ?? "auto";

  const hood = cs === "auto" ? baseHood : cs === "hood";
  const collar = cs === "auto" ? baseCollar : cs === "stand";
  const noCollar = cs === "none";

  const by = 1.5 - (1.5 - bottom) * d.length;

  const flare = bottom < 0.8 ? 0.12 * (0.8 - bottom) * 3 : 0;

  const body = useMemo(() => {
    const base: GarmentProfilePoint[] = [
      [0.18, 0.1, 0.78],
      [0.175, 0.095, 0.96],
      [0.155, 0.09, 1.12],
      [0.17, 0.1, 1.25],
      [0.215, 0.115, 1.37],
      [0.16, 0.09, 1.45],
      [0.105, 0.075, 1.5],
    ];
    const upper = base.findIndex((point) => point[2] >= by);
    const lowerPoint = base[Math.max(upper - 1, 0)];
    const upperPoint = base[Math.max(upper, 0)];
    const t = lowerPoint && upperPoint ? (by - lowerPoint[2]) / (upperPoint[2] - lowerPoint[2]) : 0;
    const hem: GarmentProfilePoint = [
      THREE.MathUtils.lerp(lowerPoint?.[0] ?? 0.18, upperPoint?.[0] ?? 0.18, t) + flare,
      THREE.MathUtils.lerp(lowerPoint?.[1] ?? 0.1, upperPoint?.[1] ?? 0.1, t) + flare * 0.7,
      by,
    ];
    return garmentShell([hem, ...base.filter((point) => point[2] > by)]);
  }, [by, flare]);

  const sl = sleeve * Math.min(d.length, 1.1);

  return (
    <group scale={[f, 1, f]}>
      <mesh geometry={body} castShadow>
        <Fabric style={d.parts.body} />
      </mesh>

      {sl > 0 &&
        [-1, 1].map((s) => (
          <group key={s} position={[s * 0.19, 1.39, 0]} rotation={[0, 0, s * 0.4]}>
            <mesh position={[0, -sl / 2 + 0.02, 0]} castShadow>
              <cylinderGeometry args={[0.058 * f, 0.068 * f, sl, 24, 1, true]} />
              <Fabric style={d.parts.sleeves} />
            </mesh>

            <mesh position={[0, -sl + 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.058 * f, 0.008, 8, 24]} />
              <Fabric style={d.parts.trim} />
            </mesh>
          </group>
        ))}

      {!noCollar && (
        <mesh position={[0, 1.495, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.1, collar ? 0.022 : 0.012, 10, 40]} />
          <Fabric style={d.parts.trim} />
        </mesh>
      )}

      {collar && (
        <mesh position={[0, 1.53, 0]}>
          <cylinderGeometry args={[0.1, 0.11, 0.07, 40, 1, true]} />
          <Fabric style={d.parts.trim} />
        </mesh>
      )}

      <mesh position={[0, by + 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.2 + flare + 0.01, 0.01, 8, 48]} />
        <Fabric style={d.parts.trim} />
      </mesh>

      {open && (
        <mesh position={[0, (1.47 + by) / 2, 0.145 + flare / 2]}>
          <boxGeometry args={[0.012, 1.47 - by, 0.012]} />
          <Fabric style={d.parts.trim} />
        </mesh>
      )}

      {open &&
        Array.from({ length: 6 }, (_, index) => {
          const y = 1.36 - index * 0.14;
          return (
            <mesh key={y} position={[0.018, y, 0.15 + flare / 2]}>
              <sphereGeometry args={[0.012, 12, 8]} />
              <Fabric style={d.parts.trim} />
            </mesh>
          );
        })}

      {hood && (
        <mesh position={[0, 1.53, -0.095]} rotation={[-0.35, 0, 0]} castShadow>
          <sphereGeometry args={[0.15, 32, 16, Math.PI * 0.65, Math.PI * 0.7, 0, Math.PI * 0.6]} />
          <Fabric style={d.parts.sleeves} />
        </mesh>
      )}
    </group>
  );
}

/* ---------- LOWER GARMENTS ---------- */

function Lower({ d, kind }: { d: Design; kind: "trousers" | "skirt" | "dress" }) {
  const f = d.fit;

  const geo = useMemo(() => {
    if (kind === "skirt") {
      const by = 1.0 - 0.42 * d.length;

      return garmentShell([
        [0.29, 0.19, by],
        [0.275, 0.18, by + 0.06],
        [0.24, 0.16, 0.78],
        [0.205, 0.13, 0.9],
        [0.19, 0.115, 1.0],
      ]);
    }

    if (kind === "dress") {
      const by = THREE.MathUtils.clamp(1.0 - 0.7 * d.length, 0.3, 0.46);

      return garmentShell([
        [0.38, 0.245, by],
        [0.34, 0.22, by + 0.12],
        [0.29, 0.19, 0.72],
        [0.23, 0.15, 0.86],
        [0.19, 0.12, 1.0],
      ]);
    }

    return garmentShell([
      [0.19, 0.12, 0.82],
      [0.19, 0.12, 0.9],
      [0.205, 0.135, 1.0],
    ]);
  }, [kind, d.length]);

  const legLen = 0.82 * Math.min(d.length, 1);

  return (
    <group scale={[f, 1, f]}>
      <mesh geometry={geo} castShadow>
        <Fabric style={d.parts.body} />
      </mesh>

      <mesh position={[0, 1.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[kind === "dress" ? 0.19 : 0.188, 0.014, 10, 48]} />
        <Fabric style={d.parts.trim} />
      </mesh>

      {kind === "trousers" &&
        [-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.088, 0.86 - legLen / 2, 0]} castShadow>
            <cylinderGeometry args={[0.085, 0.075 + (f - 1) * 0.1, legLen, 24, 1, true]} />
            <Fabric style={d.parts.sleeves} />
          </mesh>
        ))}
    </group>
  );
}

/* ---------- GARMENT SELECTOR ---------- */

function Garment({ d }: { d: Design }) {
  switch (d.garment) {
    case "tshirt":
      return <Top d={d} sleeve={0.2} bottom={0.84} />;

    case "shirt":
      return <Top d={d} sleeve={0.56} bottom={0.8} collar open />;

    case "hoodie":
      return <Top d={d} sleeve={0.58} bottom={0.84} hood />;

    case "jacket":
      return <Top d={d} sleeve={0.58} bottom={0.88} collar open />;

    case "coat":
      return <Top d={d} sleeve={0.6} bottom={0.42} collar open />;

    case "dress":
      return (
        <group>
          <Top d={d} sleeve={0.2} bottom={0.95} />
          <Lower d={d} kind="dress" />
        </group>
      );

    case "skirt":
      return <Lower d={d} kind="skirt" />;

    case "trousers":
      return <Lower d={d} kind="trousers" />;

    default:
      return null;
  }
}

/* ---------- GARMENT APPEAR ANIMATION ---------- */

function AnimatedGarment({
  d,
  replayKey,
  children,
}: {
  d: Design;
  replayKey: number;
  children: React.ReactNode;
}) {
  const garmentRef = useRef<THREE.Group>(null);
  const startedAt = useRef<number | null>(null);

  useLayoutEffect(() => {
    const garment = garmentRef.current;
    if (!garment) return;

    if (replayKey === 0) {
      garment.visible = false;
      return;
    }

    garment.visible = true;
    garment.scale.setScalar(0.001);
    garment.position.y = 0.2;
    startedAt.current = null;
  }, [d.garment, replayKey]);

  useFrame((state) => {
    const garment = garmentRef.current;
    if (!garment) return;

    startedAt.current ??= state.clock.elapsedTime;
    const elapsed = state.clock.elapsedTime - startedAt.current;
    const progress = THREE.MathUtils.clamp(elapsed / 1.65, 0, 1);
    const eased = progress * progress * (3 - 2 * progress);

    garment.scale.setScalar(THREE.MathUtils.lerp(0.001, 1, eased));
    garment.position.y = THREE.MathUtils.lerp(0.2, 0, eased);
  });

  return (
    <group ref={garmentRef} visible={replayKey > 0} scale={0.001}>
      {children}
    </group>
  );
}

/* ---------- CAMERA RIG ---------- */

const Rig = forwardRef<SceneHandle>(function Rig(_, ref) {
  const { camera, gl } = useThree();
  const controls = useRef<OrbitImpl>(null);

  useImperativeHandle(
    ref,
    () => ({
      setView(v) {
        camera.position.set(...VIEWS[v]);
        controls.current?.target.copy(TARGET);
        controls.current?.update();
      },

      reset() {
        camera.position.set(...VIEWS.front);
        controls.current?.target.copy(TARGET);
        controls.current?.update();
      },

      zoom(f) {
        const c = controls.current;
        if (!c) return;

        const dir = camera.position.clone().sub(c.target);

        dir.setLength(THREE.MathUtils.clamp(dir.length() * f, 1.2, 6));

        camera.position.copy(c.target).add(dir);
        c.update();
      },

      spin(on) {
        if (controls.current) {
          controls.current.autoRotate = on;
          controls.current.autoRotateSpeed = 3;
        }
      },

      snapshot() {
        return gl.domElement.toDataURL("image/png");
      },
    }),
    [camera, gl],
  );

  return (
    <OrbitControls
      ref={controls}
      target={TARGET}
      enableDamping
      dampingFactor={0.08}
      enablePan
      minDistance={1.2}
      maxDistance={6}
      maxPolarAngle={Math.PI * 0.55}
      makeDefault
    />
  );
});

/* ---------- MAIN GARMENT SCENE ---------- */

export const GarmentScene = forwardRef<
  SceneHandle,
  {
    design: Design;
    showOutfit?: boolean;
    dressingKey?: number;
    garmentModelUrl?: string | undefined;
  }
>(function GarmentScene({ design, showOutfit = true, dressingKey = 0, garmentModelUrl }, ref) {
  const wrap = useRef<HTMLDivElement>(null);
  const [colors, setColors] = useState<Record<string, string>>({});

  useEffect(() => {
    const css = getComputedStyle(document.documentElement);

    setColors(
      Object.fromEntries(
        ["light-background", "light-floor", "dark-background", "dark-floor", "key", "fill"].map(
          (name) => [name, css.getPropertyValue(`--studio-${name}`).trim()],
        ),
      ),
    );
  }, []);

  useEffect(() => {
    wrap.current?.removeAttribute("data-scene-ready");
  }, [design.modelId, design.modelPose]);

  const dark = design.studioEnvironment === "dark";
  const showGarment = showOutfit && design.modelPose !== "runway";

  const background = colors[dark ? "dark-background" : "light-background"];

  const floor = colors[dark ? "dark-floor" : "light-floor"];

  const keyColor = colors["key"];
  const fillColor = colors["fill"];

  return (
    <div ref={wrap} className="h-full w-full">
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={[1, 1.5]}
        camera={{
          position: VIEWS.front,
          fov: 35,
        }}
        gl={{
          preserveDrawingBuffer: true,
          antialias: true,
        }}
      >
        {background && <color attach="background" args={[background]} />}

        {background && <fog attach="fog" args={[background, 6, 12]} />}

        <ambientLight intensity={0.65} />

        <directionalLight
          position={[2.5, 4, 3]}
          intensity={2.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />

        {keyColor && (
          <spotLight
            position={[-3, 3, -2]}
            intensity={25}
            color={keyColor}
            angle={0.6}
            penumbra={1}
          />
        )}

        {fillColor && (
          <spotLight
            position={[3, 2, -3]}
            intensity={15}
            color={fillColor}
            angle={0.6}
            penumbra={1}
          />
        )}

        <Environment resolution={128}>
          <Lightformer
            intensity={1.6}
            position={[0, 5, 0]}
            scale={[10, 10, 1]}
            rotation-x={Math.PI / 2}
          />

          {keyColor && (
            <Lightformer
              intensity={0.8}
              color={keyColor}
              position={[-5, 1, -1]}
              rotation-y={Math.PI / 2}
              scale={[20, 2, 1]}
            />
          )}

          {fillColor && (
            <Lightformer
              intensity={0.6}
              color={fillColor}
              position={[5, 1, 1]}
              rotation-y={-Math.PI / 2}
              scale={[20, 2, 1]}
            />
          )}
        </Environment>

        <group>
          <Suspense fallback={null}>
            <HumanModel
              modelId={design.modelId}
              pose={design.modelPose ?? "standing"}
              onReady={() => wrap.current?.setAttribute("data-scene-ready", "true")}
            />
          </Suspense>

          {showGarment && (
            <group scale={[1.08, 0.88, 1.12]}>
              <Suspense fallback={null}>
                <AnimatedGarment d={design} replayKey={dressingKey}>
                  <Underwear />
                  {garmentModelUrl ? (
                    <ImportedGarment src={garmentModelUrl} design={design} />
                  ) : (
                    <Garment d={design} />
                  )}
                </AnimatedGarment>
              </Suspense>
            </group>
          )}
        </group>

        {floor && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[6, 64]} />
            <meshStandardMaterial color={floor} roughness={0.9} />
          </mesh>
        )}

        <ContactShadows position={[0, 0.001, 0]} opacity={0.6} scale={4} blur={2.4} far={2} />

        <Rig ref={ref} />
      </Canvas>
    </div>
  );
});
