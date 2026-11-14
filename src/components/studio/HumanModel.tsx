
import { useAnimations, useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";

import femaleAsset from "@/assets/models/female-fashion.glb.asset.json";
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

function enhanceSkin(material: THREE.Material) {
  const copy = material.clone();

  if (copy instanceof THREE.MeshStandardMaterial) {
    copy.roughness = 0.72;
    copy.metalness = 0;
    copy.envMapIntensity = 0.8;
  }

  return copy;
}

function prepareHuman(scene: THREE.Object3D, height: number) {
  const object = clone(scene);

  object.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const scale = height / Math.max(size.y, 0.001);

  const root = new THREE.Group();

  root.scale.setScalar(scale);

  object.position.set(
    -center.x,
    -box.min.y,
    -center.z
  );

  object.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;

    node.castShadow = true;
    node.receiveShadow = true;

    const materials = Array.isArray(node.material)
      ? node.material
      : [node.material];

    const copies = materials.map(enhanceSkin);

    node.material = Array.isArray(node.material)
      ? copies
      : copies[0];
  });

  root.add(object);

  return root;
}

export function HumanModel({
  modelId,
  pose,
  onReady,
}: HumanModelProps) {
  const model = modelFor(modelId);

  const { scene, animations } = useGLTF(
    MODEL_ASSETS[modelId],
    false,
    true
  );

  const group = useRef<THREE.Group>(null);

  const human = useMemo(
    () => prepareHuman(scene, model.height),
    [scene, model.height]
  );

  const { actions, names } = useAnimations(
    animations,
    group
  );

  useEffect(() => {
    const walkName = names.find((name) =>
      name.toLowerCase().includes("walk")
    );

    const idleName = names.find((name) =>
      name.toLowerCase().includes("idle")
    );

    const selectedName =
      pose === "runway" ? walkName : idleName;

    Object.values(actions).forEach((action) => {
      action?.stop();
    });

    if (selectedName && actions[selectedName]) {
      const action = actions[selectedName];

      action.reset();
      action.fadeIn(0.35);
      action.play();

      action.timeScale = pose === "runway" ? 0.75 : 1;
    }

    return () => {
      Object.values(actions).forEach((action) => {
        action?.fadeOut(0.2);
      });
    };
  }, [pose, actions, names]);

  const frames = useRef(0);

  useFrame(() => {
    if (frames.current < 3) {
      frames.current += 1;

      if (frames.current === 3) {
        onReady();
      }
    }
  });

  useEffect(() => {
    frames.current = 0;
  }, [modelId, pose]);

  return (
    <group ref={group}>
      <primitive object={human} />
    </group>
  );
}
