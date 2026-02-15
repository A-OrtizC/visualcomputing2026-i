import { useGLTF, Edges, OrbitControls, Stats } from "@react-three/drei";
import { useLoader } from "@react-three/fiber";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { useControls } from "leva";
import { useMemo, useEffect, useState, Suspense } from "react";
import * as THREE from "three";

export default function ModelViewer() {

  // =============================
  // UI CONTROLS
  // =============================
  const [controls, set] = useControls(() => ({
    format: {
      value: "gltf",
      options: {
        GLTF: "gltf",
        OBJ: "obj",
        STL: "stl"
      },
      label: "Formato"
    },
    mode: {
      value: "faces",
      options: {
        Faces: "faces",
        Wireframe: "wireframe",
        Edges: "edges",
        Vertices: "vertices"
      },
      label: "Modo"
    },
    vertices: { value: 0, disabled: true, label: "Vértices" },
    edges: { value: 0, disabled: true, label: "Aristas" },
    faces: { value: 0, disabled: true, label: "Caras" }
  }));

  const { format, mode } = controls;

  // =============================
  // LOADERS
  // =============================
  const gltf = useGLTF("/models/model.glb");
  const obj = useLoader(OBJLoader, "/models/model.obj");
  const stl = useLoader(STLLoader, "/models/model.stl");

  // =============================
  // NORMALIZAR GEOMETRÍA
  // =============================
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

  // =============================
  // EXTRAER GEOMETRÍA
  // =============================
  const geometry = useMemo(() => {

  // STL se queda igual
  if (format === "stl") {
    return normalizeGeometry(stl.clone(), 3);
  }

  // SOLO para OBJ y GLTF combinamos todo
  const geometries = [];

  function collect(object) {
    object.traverse(child => {
      if (child.isMesh && child.geometry) {
        geometries.push(child.geometry.clone());
      }
    });
  }

  if (format === "gltf") collect(gltf.scene);
  if (format === "obj") collect(obj);

  if (!geometries.length) return null;

  const merged = THREE.BufferGeometryUtils
    ? THREE.BufferGeometryUtils.mergeGeometries(geometries, true)
    : geometries[0];

  return normalizeGeometry(merged, 3);

}, [format, gltf, obj, stl]);

  // =============================
  // ESTADÍSTICAS
  // =============================
  const stats = useMemo(() => {

  if (!geometry) return { vertices: 0, edges: 0, faces: 0 };

  // STL sigue usando tu método anterior
  if (format === "stl") {

    const pos = geometry.attributes.position.array;
    const faceCount = pos.length / 9;

    const vertexMap = new Map();
    const uniqueVertices = [];
    const reconstructedFaces = [];

    let index = 0;

    for (let i = 0; i < pos.length; i += 3) {

      const key = `${pos[i]}_${pos[i+1]}_${pos[i+2]}`;

      if (!vertexMap.has(key)) {
        vertexMap.set(key, index++);
        uniqueVertices.push(key);
      }

      reconstructedFaces.push(vertexMap.get(key));
    }

    const edgeSet = new Set();

    for (let i = 0; i < reconstructedFaces.length; i += 3) {

      const a = reconstructedFaces[i];
      const b = reconstructedFaces[i + 1];
      const c = reconstructedFaces[i + 2];

      [[a,b],[b,c],[c,a]].forEach(([v1,v2]) => {
        const key = v1 < v2 ? `${v1}-${v2}` : `${v2}-${v1}`;
        edgeSet.add(key);
      });
    }

    return {
      vertices: uniqueVertices.length,
      edges: edgeSet.size,
      faces: faceCount
    };
  }

  // OBJ y GLTF: contar vértices únicos cuando la geometría no está indexada

  // Si la geometría tiene índices, usamos esos índices (conteo exacto de vértices únicos).
  // Si no tiene índices (geometría no indexada), reconstruimos un índice único
  // a partir de las posiciones para obtener el mismo resultado que herramientas como trimesh.

  let indexArray;
  let vertexCount;

  if (geometry.index) {
    indexArray = geometry.index.array;
    vertexCount = geometry.attributes.position.count;
  } else {
    const pos = geometry.attributes.position.array;
    const vertexMap = new Map();
    const reconstructed = [];
    let idx = 0;

    for (let i = 0; i < pos.length; i += 3) {
      const key = `${pos[i]}_${pos[i+1]}_${pos[i+2]}`;
      if (!vertexMap.has(key)) {
        vertexMap.set(key, idx++);
      }
      reconstructed.push(vertexMap.get(key));
    }

    indexArray = reconstructed;
    vertexCount = vertexMap.size;
  }

  const faceCount = indexArray.length / 3;

  const edgeSet = new Set();

  for (let i = 0; i < indexArray.length; i += 3) {
    const a = indexArray[i];
    const b = indexArray[i+1];
    const c = indexArray[i+2];

    [[a,b],[b,c],[c,a]].forEach(([v1,v2]) => {
      const key = v1 < v2 ? `${v1}-${v2}` : `${v2}-${v1}`;
      edgeSet.add(key);
    });
  }

  return {
    vertices: vertexCount,
    edges: edgeSet.size,
    faces: faceCount
  };

}, [geometry, format]);

// =============================
// OBJ
// =============================
const [rawObjStats, setRawObjStats] = useState(null);

useEffect(() => {
  if (format !== "obj") {
    setRawObjStats(null);
    return;
  }

  let cancelled = false;

  fetch("/models/model.obj")
    .then(res => {
      if (!res.ok) throw new Error("Failed to fetch OBJ");
      return res.text();
    })
    .then(text => {
      if (cancelled) return;

      const lines = text.split(/\r?\n/);
      let vCount = 0;
      let triCount = 0;
      const edgeSet = new Set();

      for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;

        if (line.startsWith("v ")) {
          vCount += 1;
        } else if (line.startsWith("f ")) {
          const parts = line.split(/\s+/).slice(1).map(tok => {
            const idx = tok.split("/")[0];
            return parseInt(idx, 10);
          }).filter(n => !Number.isNaN(n));

          if (parts.length < 3) continue;

          // triangulate polygon face as fan
          for (let i = 1; i < parts.length - 1; i++) {
            const a = parts[0];
            const b = parts[i];
            const c = parts[i + 1];

            [[a,b],[b,c],[c,a]].forEach(([v1,v2]) => {
              const va = Math.min(v1, v2);
              const vb = Math.max(v1, v2);
              edgeSet.add(`${va}-${vb}`);
            });

            triCount += 1;
          }
        }
      }

      setRawObjStats({ vertices: vCount, edges: edgeSet.size, faces: triCount });
    })
    .catch(() => setRawObjStats(null));

  return () => { cancelled = true; };
}, [format]);

useEffect(() => {
  if (format === "obj" && rawObjStats) {
    set({ vertices: rawObjStats.vertices, edges: rawObjStats.edges, faces: rawObjStats.faces });
  }
}, [format, rawObjStats, set]);

  // =============================
  // ACTUALIZAR UI
  // =============================
  useEffect(() => {
    set({
      vertices: stats.vertices,
      edges: stats.edges,
      faces: stats.faces
    });
  }, [stats, set]);

  if (!geometry) return null;

  // =============================
  // RENDER
  // =============================
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

      <OrbitControls />
      <Stats />
    </>
  );
}
