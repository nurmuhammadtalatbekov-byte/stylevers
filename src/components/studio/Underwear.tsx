import { useMemo } from "react";
import * as THREE from "three";

/**
 * STYLEVERSE boshlang‘ich fitting kiyimi.
 * Neytral, yopiq va odobli dizayn.
 */
export function Underwear() {
  const fabric = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#d8c9bd",
        roughness: 0.82,
        metalness: 0,
        side: THREE.DoubleSide,
      }),
    [],
  );

  const trim = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#b9a597",
        roughness: 0.75,
        side: THREE.DoubleSide,
      }),
    [],
  );

  return (
    <group>
      {/* Lifçikning ikki kosasi */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.095, 1.285, 0.155]}>
          <mesh scale={[0.092, 0.075, 0.045]} material={fabric}>
            <sphereGeometry args={[1, 32, 24]} />
          </mesh>

          {/* Yelka bog‘ichi */}
          <mesh
            position={[side * 0.015, 0.105, -0.005]}
            rotation={[0, 0, side * -0.24]}
            material={trim}
          >
            <cylinderGeometry args={[0.009, 0.009, 0.19, 12]} />
          </mesh>
        </group>
      ))}

      {/* Lifçikning orqa va old bog‘lovchi tasmasi */}
      <mesh position={[0, 1.245, 0]} material={trim}>
        <torusGeometry args={[0.17, 0.012, 8, 48]} />
      </mesh>

      {/* Tursikning old qismi */}
      <mesh position={[0, 0.965, 0.105]} scale={[0.19, 0.115, 0.045]} material={fabric}>
        <sphereGeometry args={[1, 32, 24]} />
      </mesh>

      {/* Bel tasmasi */}
      <mesh position={[0, 1.055, 0]} material={trim}>
        <torusGeometry args={[0.19, 0.012, 8, 48]} />
      </mesh>

      {/* Yon tasmalari */}
      {[-1, 1].map((side) => (
        <mesh
          key={`side-${side}`}
          position={[side * 0.16, 1.015, 0]}
          rotation={[0, 0, side * 0.18]}
          material={fabric}
        >
          <boxGeometry args={[0.045, 0.075, 0.035]} />
        </mesh>
      ))}
    </group>
  );
}
