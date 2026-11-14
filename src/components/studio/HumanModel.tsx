import { useAnimations, useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import femaleAsset from "@/assets/models/female-fashion.glb.asset.json";
import maleAsset from "@/assets/models/male-fashion.glb.asset.json";
import { modelFor, type ModelId, type ModelPose } from "@/lib/fashion-models";

export const MODEL_ASSETS = { female: femaleAsset.url, male: maleAsset.url };

export function HumanModel({ modelId, pose, onReady }: { modelId: ModelId; pose: ModelPose; onReady: () => void }) {
  const model = modelFor(modelId);
  const { scene, animations } = useGLTF(MODEL_ASSETS[modelId], false, true);
  const group = useRef<THREE.Group>(null);
  const human = useMemo(() => {
    const object = clone(scene);
    object.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = model.height / Math.max(size.y, 0.001);
    const root = new THREE.Group();
    root.scale.setScalar(scale);
    object.position.x -= center.x;
    object.position.y -= box.min.y;
    object.position.z -= center.z;
    object.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      node.castShadow = true; node.receiveShadow = true;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      const copies = materials.map((material) => {
        const copy = material.clone();
        if (copy instanceof THREE.MeshStandardMaterial) { copy.roughness = Math.max(copy.roughness, 0.6); copy.metalness = 0; }
        return copy;
      });
      node.material = Array.isArray(node.material) ? copies : copies[0] ?? node.material;
    });
    root.add(object);
    return root;
  }, [scene, model.height]);
  const { actions, names } = useAnimations(animations, group);
  useEffect(() => {
    const walkName = names.find((name) => name.toLowerCase() === "walk");
    const action = walkName ? actions[walkName] : undefined;
    if (pose === "runway" && action) { action.reset().fadeIn(0.3).play(); action.timeScale = 0.75; }
    else { Object.values(actions).forEach((clip) => clip?.stop()); }
    return () => { action?.stop(); };
  }, [pose, actions, names]);
  const frames = useRef(0);
  useFrame(() => { if (++frames.current === 3) onReady(); });
  useEffect(() => { frames.current = 0; }, [modelId, pose]);
  return <group ref={group}><primitive object={human} /></group>;
}