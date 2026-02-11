import { useGLTF, Edges, Html, OrbitControls, Stats } from "@react-three/drei";
import { useLoader } from "@react-three/fiber";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { useControls } from "leva";
import { useMemo, useState, useEffect, Suspense } from "react";
import * as THREE from "three";

export default function ModelViewer() {

  // UI
  const { format, mode } = useControls({
    format: {
      options: {
        GLTF: "gltf",
        OBJ: "obj",
        STL: "stl"
      }
    },
    mode: {
      options: {
        Faces: "faces",
        Wireframe: "wireframe",
        Edges: "edges",
        Vertices: "vertices"
      }
    }
  });

  const [draggingUI, setDraggingUI] = useState(false);

  function normalizeGeometry(geometry, targetHeight = 3) {

    geometry.computeBoundingBox();

    const box = geometry.boundingBox;
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    box.getSize(size);
    box.getCenter(center);

    geometry.translate(-center.x, -center.y, -center.z);

    const scale = targetHeight / size.y;
    geometry.scale(scale, scale, scale);

    geometry.computeBoundingSphere();

    return geometry;
  }

  const gltf = useGLTF("/models/model.glb");
  const obj = useLoader(OBJLoader, "/models/model.obj");
  const stl = useLoader(STLLoader, "/models/model.stl");

  const geometry = useMemo(() => {

    let geo = null;

    if (format === "gltf") {
      gltf.scene.traverse(child => {
        if (child.isMesh && !geo) geo = child.geometry.clone();
      });
    }

    if (format === "obj") {
      obj.traverse(child => {
        if (child.isMesh && !geo) geo = child.geometry.clone();
      });
    }

    if (format === "stl") {
      geo = stl.clone();
    }

    if (!geo) return null;

    return normalizeGeometry(geo, 3);

  }, [format, gltf, obj, stl]);

  const stats = useMemo(() => {
    if (!geometry) return {};

    return {
      vertices: geometry.attributes.position.count,
      faces: geometry.index
        ? geometry.index.count / 3
        : geometry.attributes.position.count / 3
    };
  }, [geometry]);

  const [controls, set] = useControls(() => ({
    format: {
      options: {
        GLTF: "gltf",
        OBJ: "obj",
        STL: "stl"
      }
    },
    mode: {
      options: {
        Faces: "faces",
        Wireframe: "wireframe",
        Edges: "edges",
        Vertices: "vertices"
      }
    },
    vertices: {
      value: 0,
      disabled: true
    },
    faces: {
      value: 0,
      disabled: true
    }
  }));

  useEffect(() => {
    set({
      vertices: stats.vertices || 0,
      faces: stats.faces || 0
    });
  }, [stats, set]);

  if (!geometry) return null;

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 3]} />

      <Suspense fallback={null}>
        <group>

          {mode === "faces" && (
            <mesh geometry={geometry}>
              <meshStandardMaterial color="orange" />
            </mesh>
          )}

          {mode === "wireframe" && (
            <mesh geometry={geometry}>
              <meshStandardMaterial wireframe />
            </mesh>
          )}

          {mode === "edges" && (
            <mesh geometry={geometry}>
              <meshStandardMaterial color="white" />
              <Edges scale={1.01} threshold={15} color="black" />
            </mesh>
          )}

          {mode === "vertices" && (
            <points geometry={geometry}>
              <pointsMaterial size={0.02} color="red" />
            </points>
          )}
        </group>
      </Suspense>

      <OrbitControls enabled={!draggingUI} />
      <Stats />
    </>
  );
}
