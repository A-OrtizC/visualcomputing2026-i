import trimesh
import numpy as np
import os

SUPPORTED = [".obj", ".stl", ".glb", ".gltf"]

def load_mesh(path):
    print(f"\nLoading: {path}")
    mesh = trimesh.load(path, force='mesh')
    return mesh


def analyze_mesh(mesh, name):

    vertices = len(mesh.vertices)
    faces = len(mesh.faces)
    edges = len(mesh.edges_unique)
    normals = len(mesh.vertex_normals)

    unique_vertices = len(np.unique(mesh.vertices, axis=0))
    duplicates = vertices - unique_vertices

    print(f"\nModel: {name}")
    print(f"Vertices: {vertices}")
    print(f"Faces: {faces}")
    print(f"Edges: {edges}")
    print(f"Normals: {normals}")
    print(f"Duplicate vertices: {duplicates}")

    return {
        "vertices": vertices,
        "faces": faces,
        "edges": edges,
        "normals": normals,
        "duplicates": duplicates
    }


def convert_mesh(mesh, output_name, output_dir):

    print(f"Converting mesh to multiple formats...")

    base_path = os.path.join(output_dir, output_name)
    mesh.export(base_path + ".obj")
    mesh.export(base_path + ".stl")
    mesh.export(base_path + ".glb")

    print("Conversion complete.")


def visualize(mesh):

    print("Opening visualization window...")
    mesh.show()


def compare_models(paths, output_dir):

    results = {}

    for path in paths:

        mesh = load_mesh(path)
        name = os.path.basename(path)

        stats = analyze_mesh(mesh, name)

        results[name] = stats

        ext = name.split(".")[-1]
        ext_dir = os.path.join(output_dir, ext)
        os.makedirs(ext_dir, exist_ok=True)
        
        convert_mesh(mesh, "converted_" + name.split(".")[0], ext_dir)

        visualize(mesh)

    return results


if __name__ == "__main__":

    base_dir = os.path.join(os.path.dirname(__file__), "..", "threejs", "public", "models")
    output_dir = os.path.dirname(__file__)
    
    paths = [
        os.path.join(base_dir, "model.obj"),
        os.path.join(base_dir, "model.stl"),
        os.path.join(base_dir, "model.glb")
    ]
    
    # Filter to only existing files
    paths = [p for p in paths if os.path.exists(p)]
    
    if not paths:
        print(f"Error: No model files found in {base_dir}")
        exit(1)

    results = compare_models(paths, output_dir)

    print("\nSummary:")
    for name, stats in results.items():
        print(name, stats)
