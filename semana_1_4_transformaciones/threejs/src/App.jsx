import { Canvas } from "@react-three/fiber"
import Scene from "./Scene"

export default function App() {
  return (
    <Canvas style={{width: "100vw", height: "100vh"}} camera={{ position: [5, 5, 5] }}>
      <Scene />
    </Canvas>
  )
}
