import { useAnimations } from "@react-three/drei";
import { useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { modelFor, type ModelId, type ModelPose } from "@/lib/fashion-models";

type HumanModelProps = {
  modelId: ModelId | undefined;
  pose: ModelPose;
  onReady: () => void;
};

export function HumanModel({ modelId, pose, onReady }: HumanModelProps) {
  const group = useRef<THREE.Group>(null);
  const model = modelFor(modelId);
  const gltf = useLoader(GLTFLoader, model.assetUrl);

  const human = useMemo(() => {
    // Never normalize a loader-cached scene: changing models reuses that cache.
    const object = clone(gltf.scene);
    object.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(object);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = model.height / Math.max(size.y, 0.001);

    const root = new THREE.Group();
    root.scale.setScalar(scale);

    object.position.set(-center.x, -bounds.min.y, -center.z);

    object.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.castShadow = true;
        node.receiveShadow = true;

        const materials = Array.isArray(node.material) ? node.material : [node.material];

        const updated = materials.map((material) => {
          const copy = material.clone();
          if (copy instanceof THREE.MeshStandardMaterial) {
            copy.roughness = 0.55;
            copy.metalness = 0;
          }
          return copy;
        });

        node.material = Array.isArray(node.material) ? updated : updated[0];
      }
    });

    root.add(object);
    return root;
  }, [gltf.scene, model.height]);

  const { actions, names } = useAnimations(gltf.animations, group);

  useEffect(() => {
    Object.values(actions).forEach((action) => action?.stop());

    if (pose === "runway") {
      const walkName = names.find((name) => name.toLowerCase().includes("walk"));
      const action = walkName ? actions[walkName] : undefined;

      if (action) {
        action.reset();
        action.fadeIn(0.35);
        action.play();
      }
    }

    return () => {
      Object.values(actions).forEach((action) => action?.stop());
    };
  }, [pose, actions, names]);

  useEffect(() => {
    onReady();
  }, [onReady]);

  useFrame(() => {
    if (group.current) {
      group.current.rotation.y = 0;
    }
  });

  return (
    <group ref={group}>
      <primitive object={human} />
    </group>
  );
}
