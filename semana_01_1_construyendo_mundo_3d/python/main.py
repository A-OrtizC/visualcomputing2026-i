import trimesh
import numpy as np
import vedo
from vedo import Plotter, Points, Mesh
import os
from tkinter import filedialog, Tk

# ==============================
# CONFIGURACIÓN
# ==============================
EXTENSIONES_VALIDAS = [".obj", ".stl", ".gltf", ".glb"]
GENERAR_GIF = True
GIF_NAME = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rotacion.gif")

# ==============================
# 0. SELECCIONAR ARCHIVO
# ==============================
def seleccionar_archivo():
    """Solicita al usuario seleccionar un archivo válido (OBJ, STL o GLTF)"""
    while True:
        # Crear ventana invisible de Tkinter
        root = Tk()
        root.withdraw()
        
        # Abrir diálogo de selección
        archivo = filedialog.askopenfilename(
            title="Selecciona un modelo 3D",
            filetypes=[
                ("Archivos 3D", "*.obj *.stl *.gltf *.glb"),
                ("OBJ files", "*.obj"),
                ("STL files", "*.stl"),
                ("GLTF files", "*.gltf"),
                ("GLB files", "*.glb"),
                ("Todos los archivos", "*.*")
            ]
        )
        
        root.destroy()
        
        # Validar si el usuario seleccionó algo
        if not archivo:
            print("⚠️  No se seleccionó ningún archivo. Intenta de nuevo.")
            continue
        
        # Validar extensión
        _, extension = os.path.splitext(archivo)
        if extension.lower() not in EXTENSIONES_VALIDAS:
            print(f"Extensión no válida: {extension}")
            print(f"Extensiones aceptadas: {', '.join(EXTENSIONES_VALIDAS)}")
            continue
        
        print(f"Archivo seleccionado: {archivo}")
        return archivo

FILE_PATH = seleccionar_archivo()

# ==============================
# 1. CARGAR MODELO
# ==============================

mesh = trimesh.load(FILE_PATH)

# Si es una escena (GLTF / GLB), combinar geometrías
if isinstance(mesh, trimesh.Scene):
    mesh = trimesh.util.concatenate(
        tuple(mesh.geometry.values())
    )

vertices = mesh.vertices
faces = mesh.faces
edges = mesh.edges_unique

print("==== INFORMACIÓN DEL MODELO ====")
print("Vértices:", len(vertices))
print("Aristas:", len(edges))
print("Caras:", len(faces))

# ==============================
# 2. VISUALIZACIÓN
# ==============================

vedo_mesh = Mesh([vertices, faces]).c("lightgray")

# Aristas usando wireframe (MUCHO más rápido)
vedo_edges = vedo_mesh.clone().wireframe().c("black")

# Limitar puntos si son demasiados
MAX_POINTS = 5000

if len(vertices) > MAX_POINTS:
    sample = vertices[np.random.choice(len(vertices), MAX_POINTS, replace=False)]
else:
    sample = vertices

vedo_vertices = Points(sample, r=5).c("red")

plotter = Plotter(title="Visualización 3D")
plotter.show(vedo_mesh, vedo_edges, vedo_vertices, axes=1)
plotter.close()

# ==============================
# 3. GENERAR ANIMACIÓN
# ==============================

if GENERAR_GIF:
    print("Generando animación con vedo...")

    # Crear ventana nueva para grabación
    plotter = Plotter(offscreen=True)

    plotter.show(vedo_mesh, vedo_edges, vedo_vertices, axes=1)

    # Crear video (puede ser .mp4 o .gif)
    video = vedo.Video(GIF_NAME, fps=20)

    for i in range(72):  # 72 * 5° = 360°
        vedo_mesh.rotate_y(5)
        vedo_edges.rotate_y(5)
        vedo_vertices.rotate_y(5)

        plotter.render()
        video.add_frame()

    video.close()
    plotter.close()

    print(f"✅ Animación guardada como: {GIF_NAME}")