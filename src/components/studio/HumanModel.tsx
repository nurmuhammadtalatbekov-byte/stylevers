import { useAnimations } from "@react-three/drei";
import { useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { modelFor, type ModelPose } from "@/lib/fashion-models";

const MODEL_URL = "/models/athletic-test.fbx";

type HumanModelProps = {
  pose: ModelPose;
  onReady: () => void;
};

export function HumanModel({ pose, onReady }: HumanModelProps) {
  const group = useRef<THREE.Group>(null);
  const fbx = useLoader(FBXLoader, MODEL_URL);

  const human = useMemo(() => {
    const object = clone(fbx);
    object.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(object);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = modelFor("female").height / Math.max(size.y, 0.001);

    const root = new THREE.Group();
    root.scale.setScalar(scale);

    object.position.set(
      -center.x,
      -bounds.min.y,
      -center.z
    );

    object.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.castShadow = true;
        node.receiveShadow = true;

        const materials = Array.isArray(node.material)
          ? node.material
          : [node.material];

        const updated = materials.map((material) => {
          const copy = material.clone();
          if (copy instanceof THREE.MeshStandardMaterial) {
            copy.roughness = 0.55;
            copy.metalness = 0;
          }
          return copy;
        });

        node.material = Array.isArray(node.material)
          ? updated
          : updated[0];
      }
    });

    root.add(object);
    return root;
  }, [fbx]);

  const { actions, names } = useAnimations(fbx.animations, group);

  useEffect(() => {
    Object.values(actions).forEach((action) => action?.stop());

    if (pose === "runway") {
      const walkName = names.find((name) =>
        name.toLowerCase().includes("walk")
      );
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
