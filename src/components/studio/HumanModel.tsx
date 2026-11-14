
import { useAnimations, useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";
const FEMALE_MODEL_URL = "/models/woman-base-character-1.glb";
import maleAsset from "@/assets/models/male-fashion.glb.asset.json";
import {
  modelFor,
  type ModelId,
  type ModelPose,
} from "@/lib/fashion-models";

export const MODEL_ASSETS = {
  female: femaleAsset.url,
  male: maleAsset.url,
};

type HumanModelProps = {
  modelId: ModelId;
  pose: ModelPose;
  onReady: () => void;
};

function improveMaterials(root: THREE.Object3D) {
  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;

    node.castShadow = true;
    node.receiveShadow = true;

    const materials = Array.isArray(node.material)
      ? node.material
      : [node.material];

    const updated = materials.map((material) => {
      const copy = material.clone();

      if (copy instanceof THREE.MeshStandardMaterial) {
        copy.roughness = Math.max(copy.roughness, 0.48);
        copy.metalness = 0;
        copy.envMapIntensity = 1;
      }

      if (copy instanceof THREE.MeshPhysicalMaterial) {
        copy.clearcoat = Math.min(copy.clearcoat, 0.15);
        copy.clearcoatRoughness = 0.4;
      }

      return copy;
    });

    node.material = Array.isArray(node.material)
      ? updated
      : updated[0] ?? node.material;
  });
}

export function HumanModel({
  modelId,
  pose,
  onReady,
}: HumanModelProps) {
  const model = modelFor(modelId);
  const group = useRef<THREE.Group>(null);
  const readyRef = useRef(false);

  const { scene, animations } = useGLTF(
    MODEL_ASSETS[modelId],
    false,
    true
  );

  const human = useMemo(() => {
    const object = clone(scene);

    object.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(object);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());

    const scale = model.height / Math.max(size.y, 0.001);

    const root = new THREE.Group();
    root.scale.setScalar(scale);

    object.position.set(
      object.position.x - center.x,
      object.position.y - bounds.min.y,
      object.position.z - center.z
    );

    improveMaterials(object);
    root.add(object);

    return root;
  }, [scene, model.height]);

  const { actions, names } = useAnimations(animations, group);

  useEffect(() => {
    Object.values(actions).forEach((action) => {
      action?.stop();
    });

    if (pose === "runway") {
      const walkName = names.find((name) =>
        name.toLowerCase().includes("walk")
      );

      const action = walkName ? actions[walkName] : undefined;

      if (action) {
        action.reset();
        action.fadeIn(0.35);
        action.timeScale = 0.8;
        action.play();
      }
    }

    return () => {
      Object.values(actions).forEach((action) => {
        action?.stop();
      });
    };
  }, [pose, actions, names]);

  useEffect(() => {
    readyRef.current = false;
  }, [modelId]);

  useFrame(() => {
    if (!readyRef.current) {
      readyRef.current = true;
      onReady();
    }
  });

  return (
    <group ref={group}>
      <primitive object={human} />
    </group>
  );
}

useGLTF.preload(MODEL_ASSETS.female);
useGLTF.preload(MODEL_ASSETS.male);
