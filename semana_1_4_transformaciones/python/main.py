import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import imageio
import os

script_dir = os.path.dirname(os.path.abspath(__file__))

# ===== Figura base =====
square = np.array([
    [-1, -1],
    [ 1, -1],
    [ 1,  1],
    [-1,  1],
    [-1, -1]
])

# ===== Transformaciones =====
def translation(tx, ty):
    return np.array([
        [1, 0, tx],
        [0, 1, ty],
        [0, 0, 1]
    ])

def rotation(theta):
    return np.array([
        [np.cos(theta), -np.sin(theta), 0],
        [np.sin(theta),  np.cos(theta), 0],
        [0, 0, 1]
    ])

def scale(sx, sy):
    return np.array([
        [sx, 0, 0],
        [0, sy, 0],
        [0, 0, 1]
    ])

def apply_transform(points, matrix):
    ones = np.ones((points.shape[0], 1))
    points_hom = np.hstack([points, ones])
    transformed = (matrix @ points_hom.T).T
    return transformed[:, :2]

frames = []

# ===== Generación =====
for i in range(60):
    t = i / 10

    T = translation(np.cos(t)*2, np.sin(t)*2)
    R = rotation(t)
    S = scale(1 + 0.5*np.sin(t), 1 + 0.5*np.sin(t))

    M = T @ R @ S
    transformed = apply_transform(square, M)

    # Crear figura con 2 paneles
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4))

    # Panel 1 — Transformación
    ax1.plot(transformed[:,0], transformed[:,1])
    ax1.set_xlim(-4, 4)
    ax1.set_ylim(-4, 4)
    ax1.set_title("Transformación Geométrica")
    ax1.grid(True)

    # Panel 2 — Matriz
    ax2.axis("off")

    matrix_text = "\n".join([
        f"[{M[0,0]:.2f}   {M[0,1]:.2f}   {M[0,2]:.2f}]",
        f"[{M[1,0]:.2f}   {M[1,1]:.2f}   {M[1,2]:.2f}]",
        f"[{M[2,0]:.2f}   {M[2,1]:.2f}   {M[2,2]:.2f}]"
    ])

    ax2.text(0.5, 0.5,
             f"Matriz M(t)\n\n t = {t:.2f}\n\n{matrix_text}",
             ha="center", va="center",
             fontsize=14)

    fig.canvas.draw()
    image = np.array(fig.canvas.buffer_rgba())[:, :, :3]
    frames.append(image)
    plt.close(fig)

# Guardar GIF final
imageio.mimsave(os.path.join(script_dir, "animation.gif"), frames, duration=0.1)

print("GIF generado: animation.gif")
