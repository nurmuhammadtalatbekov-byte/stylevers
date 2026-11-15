import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import type { Design } from "@/lib/fashion";

export function ImportedGarment({ src, design }: { src: string; design: Design }) {
  const gltf = useGLTF(src);
  const garment = useMemo(() => {
    const object = clone(gltf.scene);
    object.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(object);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const targetWidth = design.garment === "dress" ? 0.5 : 0.44;
    const targetHeight = design.garment === "dress" ? 1.25 : 0.78;
    const scale = Math.min(
      targetWidth / Math.max(size.x, size.z, 0.001),
      targetHeight / Math.max(size.y, 0.001),
    );

    object.scale.setScalar(scale);
    object.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);

    object.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    return object;
  }, [gltf.scene, design.garment]);

  const baseHeight =
    design.garment === "dress"
      ? 0.22
      : design.garment === "trousers" || design.garment === "skirt"
        ? 0.78
        : 0.88;

  return <primitive object={garment} position={[0, baseHeight, 0]} scale={design.fit} />;
}
