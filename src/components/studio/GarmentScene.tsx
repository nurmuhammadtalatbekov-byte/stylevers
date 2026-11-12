import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import * as THREE from "three";
import type { ComponentRef } from "react";
type OrbitImpl = ComponentRef<typeof OrbitControls>;
import { MATERIAL_PROPS, SLEEVE_LEN, type Design, type PartStyle } from "@/lib/fashion";

export type View = "front" | "back" | "left" | "right";
export interface SceneHandle { setView: (v: View) => void; reset: () => void; zoom: (f: number) => void; snapshot: () => string; spin: (on: boolean) => void }

const TARGET = new THREE.Vector3(0, 1.05, 0);
const VIEWS: Record<View, [number, number, number]> = {
  front: [0, 1.25, 3.8], back: [0, 1.25, -3.8], left: [-3.8, 1.25, 0], right: [3.8, 1.25, 0],
};

/* ---------- textures ---------- */
const texCache = new Map<string, THREE.Texture>();
function patternTexture(s: PartStyle, weave: number): THREE.Texture {
  const key = `${s.pattern}|${s.color}|${s.accent}|${weave}|${s.pattern === "custom" ? s.customTexture : ""}`;
  const hit = texCache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  if (!g) throw new Error("Fabric textures are unavailable in this browser.");
  g.fillStyle = s.color; g.fillRect(0, 0, 256, 256);
  g.fillStyle = s.accent; g.strokeStyle = s.accent;
  if (s.pattern === "stripes") for (let x = 0; x < 256; x += 32) g.fillRect(x, 0, 12, 256);
  if (s.pattern === "geometric") {
    for (let y = 0; y < 256; y += 64) for (let x = 0; x < 256; x += 64) {
      g.beginPath(); g.moveTo(x + 32, y + 6); g.lineTo(x + 58, y + 58); g.lineTo(x + 6, y + 58); g.closePath(); g.fill();
    }
  }
  if (s.pattern === "floral") {
    for (let y = 32; y < 256; y += 64) for (let x = 32; x < 256; x += 64) {
      const ox = (y / 64) % 2 ? 32 : 0;
      for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; g.beginPath(); g.arc(x + ox + Math.cos(a) * 10, y + Math.sin(a) * 10, 7, 0, 7); g.fill(); }
      g.fillStyle = s.color; g.beginPath(); g.arc(x + ox, y, 4, 0, 7); g.fill(); g.fillStyle = s.accent;
    }
  }
  if (s.pattern === "abstract") {
    g.lineWidth = 10; g.lineCap = "round";
    let seed = 7; const r = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 9; i++) { g.globalAlpha = 0.5 + r() * 0.5; g.beginPath(); g.moveTo(r() * 256, r() * 256); g.bezierCurveTo(r() * 256, r() * 256, r() * 256, r() * 256, r() * 256, r() * 256); g.stroke(); }
    g.globalAlpha = 1;
  }
  // fabric weave noise
  if (weave > 0) {
    g.globalAlpha = weave;
    for (let y = 0; y < 256; y += 2) { g.fillStyle = y % 4 ? "#000" : "#fff"; g.fillRect(0, y, 256, 1); }
    for (let x = 0; x < 256; x += 3) { g.fillStyle = "#000"; g.globalAlpha = weave * 0.5; g.fillRect(x, 0, 1, 256); }
    g.globalAlpha = 1;
  }
  const tex = new THREE.CanvasTexture(c);
  if (s.pattern === "custom" && s.customTexture) {
    const img = new Image();
    img.onload = () => { g.drawImage(img, 0, 0, 256, 256); tex.needsUpdate = true; };
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
      map={map} roughness={m.roughness} metalness={m.metalness} sheen={m.sheen}
      sheenColor={style.color} clearcoat={m.clearcoat} transparent={m.opacity !== undefined} opacity={m.opacity ?? 1} side={THREE.DoubleSide}
    />
  );
}

/* ---------- geometry helpers ---------- */
function lathe(points: [number, number][], segs = 48) {
  return new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), segs);
}

const SKIN = <meshStandardMaterial color="#c9c4bd" roughness={0.55} />;

function Mannequin() {
  const torso = useMemo(() => lathe([[0, 0.9], [0.165, 0.92], [0.175, 1.0], [0.145, 1.12], [0.155, 1.3], [0.185, 1.41], [0.1, 1.5], [0.05, 1.54], [0, 1.55]]), []);
  return (
    <group>
      <mesh geometry={torso} castShadow receiveShadow>{SKIN}</mesh>
      <mesh position={[0, 1.58, 0]} castShadow><cylinderGeometry args={[0.045, 0.05, 0.1, 24]} />{SKIN}</mesh>
      <mesh position={[0, 1.72, 0.01]} scale={[0.9, 1.15, 1]} castShadow><sphereGeometry args={[0.1, 32, 32]} />{SKIN}</mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.205, 1.42, 0]} rotation={[0, 0, s * 0.10]}>
          <mesh position={[0, -0.29, 0]} castShadow><capsuleGeometry args={[0.035, 0.48, 8, 16]} />{SKIN}</mesh>
        </group>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.085, 0.5, 0]} castShadow><capsuleGeometry args={[0.062, 0.8, 8, 16]} />{SKIN}</mesh>
      ))}
      <mesh position={[0, 0.02, 0]} receiveShadow castShadow><cylinderGeometry args={[0.32, 0.36, 0.04, 48]} /><meshStandardMaterial color="#1b1b20" metalness={0.6} roughness={0.3} /></mesh>
    </group>
  );
}

/* ---------- garments ---------- */
function Top({ d, sleeve: baseSleeve, bottom, hood: baseHood, open, collar: baseCollar }: { d: Design; sleeve: number; bottom: number; hood?: boolean; open?: boolean; collar?: boolean }) {
  const f = d.fit;
  const sleeve = d.sleeve && d.sleeve !== "auto" ? SLEEVE_LEN[d.sleeve] : baseSleeve;
  const cs = d.collar ?? "auto";
  const hood = cs === "auto" ? baseHood : cs === "hood";
  const collar = cs === "auto" ? baseCollar : cs === "stand";
  const noCollar = cs === "none";
  const by = 1.5 - (1.5 - bottom) * d.length;
  const flare = bottom < 0.8 ? 0.12 * (0.8 - bottom) * 3 : 0;
  const body = useMemo(() => {
    const pts: [number, number][] = [];
    const prof: [number, number][] = [[0.105, 1.5], [0.2, 1.43], [0.17, 1.3], [0.16, 1.12], [0.185, 1.0], [0.18, 0.9], [0.18, 0.7], [0.18, 0.5], [0.18, 0.3]];
    for (const [r, y] of prof) if (y >= by) pts.push([r + 0.018, y]);
    const last = pts[pts.length - 1] ?? [0.2, by];
    pts.push([last[0] + flare + 0.01, by]);
    return lathe(pts);
  }, [by, flare]);
  const sl = sleeve * Math.min(d.length, 1.1);
  return (
    <group scale={[f, 1, f]}>
      <mesh geometry={body} castShadow><Fabric style={d.parts.body} /></mesh>
      {sl > 0 && [-1, 1].map((s) => (
        <group key={s} position={[s * 0.205, 1.42, 0]} rotation={[0, 0, s * 0.10]}>
          <mesh position={[0, -sl / 2 + 0.02, 0]} castShadow>
            <cylinderGeometry args={[0.058 * f, 0.068 * f, sl, 24, 1, true]} /><Fabric style={d.parts.sleeves} />
          </mesh>
          <mesh position={[0, -sl + 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.058 * f, 0.008, 8, 24]} /><Fabric style={d.parts.trim} />
          </mesh>
        </group>
      ))}
      {!noCollar && <mesh position={[0, 1.495, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.1, collar ? 0.022 : 0.012, 10, 40]} /><Fabric style={d.parts.trim} /></mesh>}
      {collar && <mesh position={[0, 1.53, 0]}><cylinderGeometry args={[0.1, 0.11, 0.07, 40, 1, true]} /><Fabric style={d.parts.trim} /></mesh>}
      <mesh position={[0, by + 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.2 + flare + 0.01, 0.01, 8, 48]} /><Fabric style={d.parts.trim} /></mesh>
      {open && <mesh position={[0, (1.47 + by) / 2, 0.165 + flare / 2]}><boxGeometry args={[0.03, 1.47 - by, 0.02]} /><Fabric style={d.parts.trim} /></mesh>}
      {hood && (
        <mesh position={[0, 1.6, -0.06]} rotation={[-0.35, 0, 0]} castShadow>
          <sphereGeometry args={[0.15, 32, 16, Math.PI * 0.15, Math.PI * 1.7, 0, Math.PI * 0.6]} /><Fabric style={d.parts.sleeves} />
        </mesh>
      )}
    </group>
  );
}

function Lower({ d, kind }: { d: Design; kind: "trousers" | "skirt" | "dress" }) {
  const f = d.fit;
  const geo = useMemo(() => {
    if (kind === "skirt") {
      const by = 1.0 - 0.42 * d.length;
      return lathe([[0.185, 1.0], [0.2, 0.9], [0.25, by + 0.1], [0.28, by]]);
    }
    if (kind === "dress") {
      const by = 1.5 - 1.0 * d.length;
      return lathe([[0.105, 1.5], [0.2, 1.43], [0.17, 1.3], [0.16, 1.12], [0.19, 1.0], [0.24, 0.85], [0.34, by + 0.1], [0.37, by]]);
    }
    return lathe([[0.185, 1.0], [0.19, 0.9], [0.17, 0.82]]);
  }, [kind, d.length]);
  const legLen = 0.82 * Math.min(d.length, 1);
  return (
    <group scale={[f, 1, f]}>
      <mesh geometry={geo} castShadow><Fabric style={d.parts.body} /></mesh>
      <mesh position={[0, 1.0, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[kind === "dress" ? 0.19 : 0.188, 0.014, 10, 48]} /><Fabric style={d.parts.trim} /></mesh>
      {kind === "trousers" && [-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.088, 0.86 - legLen / 2, 0]} castShadow>
          <cylinderGeometry args={[0.085, 0.075 + (f - 1) * 0.1, legLen, 24, 1, true]} /><Fabric style={d.parts.sleeves} />
        </mesh>
      ))}
    </group>
  );
}

function Garment({ d }: { d: Design }) {
  switch (d.garment) {
    case "tshirt": return <Top d={d} sleeve={0.2} bottom={0.84} />;
    case "shirt": return <Top d={d} sleeve={0.56} bottom={0.8} collar open />;
    case "hoodie": return <Top d={d} sleeve={0.58} bottom={0.84} hood />;
    case "jacket": return <Top d={d} sleeve={0.58} bottom={0.88} collar open />;
    case "coat": return <Top d={d} sleeve={0.6} bottom={0.42} collar open />;
    case "dress": return <Lower d={d} kind="dress" />;
    case "skirt": return <Lower d={d} kind="skirt" />;
    case "trousers": return <Lower d={d} kind="trousers" />;
  }
}

/* ---------- camera rig ---------- */
const Rig = forwardRef<SceneHandle>(function Rig(_, ref) {
  const { camera, gl } = useThree();
  const controls = useRef<OrbitImpl>(null);
  useImperativeHandle(ref, () => ({
    setView(v) { camera.position.set(...VIEWS[v]); controls.current?.target.copy(TARGET); controls.current?.update(); },
    reset() { camera.position.set(...VIEWS.front); controls.current?.target.copy(TARGET); controls.current?.update(); },
    zoom(f) { const c = controls.current; if (!c) return; const dir = camera.position.clone().sub(c.target); dir.setLength(THREE.MathUtils.clamp(dir.length() * f, 1.2, 6)); camera.position.copy(c.target).add(dir); c.update(); },
    spin(on) { if (controls.current) { controls.current.autoRotate = on; controls.current.autoRotateSpeed = 3; } },
    snapshot() { return gl.domElement.toDataURL("image/png"); },
  }), [camera, gl]);
  return <OrbitControls ref={controls} target={TARGET} enableDamping dampingFactor={0.08} enablePan minDistance={1.2} maxDistance={6} maxPolarAngle={Math.PI * 0.55} makeDefault />;
});

function Ready({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);
  useFrame(() => { if (++frames.current === 2) onReady(); });
  return null;
}

export const GarmentScene = forwardRef<SceneHandle, { design: Design }>(function GarmentScene({ design }, ref) {
  const wrap = useRef<HTMLDivElement>(null);
  
  return (
    <div ref={wrap} className="h-full w-full">
      <Canvas shadows={{ type: THREE.PCFShadowMap }} dpr={[1, 1.5]} camera={{ position: VIEWS.front, fov: 35 }} gl={{ preserveDrawingBuffer: true, antialias: true }}>
        <Ready onReady={() => wrap.current?.setAttribute("data-scene-ready", "true")} />
        <color attach="background" args={["#e2e5e3"]} />
        <fog attach="fog" args={["#e2e5e3", 6, 12]} />
        <ambientLight intensity={0.65} />
        <directionalLight position={[2.5, 4, 3]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} />
        <spotLight position={[-3, 3, -2]} intensity={25} color="#ffffff" angle={0.6} penumbra={1} />
        <spotLight position={[3, 2, -3]} intensity={15} color="#d9e7eb" angle={0.6} penumbra={1} />
        <Environment resolution={128}>
          <Lightformer intensity={1.6} position={[0, 5, 0]} scale={[10, 10, 1]} rotation-x={Math.PI / 2} />
          <Lightformer intensity={0.8} color="#ffffff" position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 2, 1]} />
          <Lightformer intensity={0.6} color="#d9e7eb" position={[5, 1, 1]} rotation-y={-Math.PI / 2} scale={[20, 2, 1]} />
        </Environment>
        <group>
          <Mannequin />
          <Garment d={design} />
        </group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[6, 64]} /><meshStandardMaterial color="#d6dbd8" roughness={0.9} /></mesh>
        <ContactShadows position={[0, 0.001, 0]} opacity={0.6} scale={4} blur={2.4} far={2} />
        <Rig ref={ref} />
      </Canvas>
    </div>
  );
});
