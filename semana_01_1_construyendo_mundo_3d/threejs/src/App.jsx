import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import ModelViewer from "./ModelViewer";

export default function App() {
  return (
    <>
      <Leva
          theme={{
            fontSizes: {
              root: "16px"
            }
          }}
        />
      <Canvas style={{width: "100vw", height: "100vh"}} camera={{ position: [4, 4, 4] }}>
          <ModelViewer  />
      </Canvas>
    </>
  );
}
