import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"

export default function Scene() {
  const meshRef = useRef()
  const radius = 2

  // ===== Trayectoria circular =====
  const circleGeometry = useMemo(() => {
    const points = []
    const segments = 100

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2
      points.push(
        new THREE.Vector3(
          Math.cos(theta) * radius,
          0,
          Math.sin(theta) * radius
        )
      )
    }

    return new THREE.BufferGeometry().setFromPoints(points)
  }, [])

  // ===== Bordes del cubo =====
  const edges = useMemo(() => {
    const geometry = new THREE.BoxGeometry()
    return new THREE.EdgesGeometry(geometry)
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime

    // Movimiento circular
    meshRef.current.position.x = Math.cos(t) * radius
    meshRef.current.position.z = Math.sin(t) * radius

    // Rotación
    meshRef.current.rotation.x += 0.01
    meshRef.current.rotation.y += 0.01

    // Escala
    const scale = 1 + 0.3 * Math.sin(t)
    meshRef.current.scale.set(scale, scale, scale)
  })

  return (
    <>
      {/* Luces */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />

      {/* Cubo sólido */}
      <mesh ref={meshRef}>
        <boxGeometry />
        <meshStandardMaterial color="orange" />
        
        {/* Bordes */}
        <lineSegments geometry={edges}>
          <lineBasicMaterial color="black" />
        </lineSegments>
      </mesh>

      {/* Trayectoria */}
      <line geometry={circleGeometry}>
        <lineBasicMaterial color="blue" />
      </line>

      <OrbitControls />
    </>
  )
}
