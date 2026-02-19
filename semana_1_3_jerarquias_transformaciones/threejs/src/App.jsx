import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useControls, Leva } from "leva";

function Hierarchy() {
  const parentRef = useRef();
  const childRef = useRef();
  const grandChildRef = useRef();

  // Controles en tiempo real
  const { posX, posY, posZ, rotX, rotY, rotZ } = useControls("Parent Transform", {
    posX: { value: 0, min: -5, max: 5, step: 0.1 },
    posY: { value: 0, min: -5, max: 5, step: 0.1 },
    posZ: { value: 0, min: -5, max: 5, step: 0.1 },

    rotX: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
    rotY: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
    rotZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 }
  });

  return (
    <group
      ref={parentRef}
      position={[posX, posY, posZ]}
      rotation={[rotX, rotY, rotZ]}
    >
      {/* PADRE */}
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" />
      </mesh>

      {/* HIJO */}
      <group ref={childRef} position={[2, 0, 0]}>
        <mesh>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="green" />
        </mesh>

        {/* NIETO (BONUS tercer nivel) */}
        <group ref={grandChildRef} position={[1.5, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.4, 0.4, 0.4]} />
            <meshStandardMaterial color="blue" />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export default function App() {
  return (
    <>
      <Leva />

      <Canvas camera={{ position: [5, 5, 5], fov: 60 }} style={{width: '100vw', height: '100vh'}}>
        
        {/* Luz */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} />

        {/* Jerarquía */}
        <Hierarchy />

        {/* Grid */}
        <gridHelper args={[10, 10]} />

        {/* Controles */}
        <OrbitControls />

      </Canvas>
    </>
  );
}
