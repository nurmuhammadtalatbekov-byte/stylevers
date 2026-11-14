
import bpy
import math
import os
from mathutils import Vector

# ==========================================
# STYLEVERSE - FEMALE FASHION MODEL
# Version 1.0
# ==========================================

OUTPUT = os.path.abspath(
    "public/models/female-fashion.glb"
)

# Clean scene
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

# Materials
def material(name, color, roughness=0.55, metallic=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bs = mat.node_tree.nodes.get("Principled BSDF")
    bs.inputs["Base Color"].default_value = (*color, 1)
    bs.inputs["Roughness"].default_value = roughness
    bs.inputs["Metallic"].default_value = metallic
    return mat

skin = material("Natural warm skin", (0.62, 0.36, 0.25), 0.48)
hair = material("Deep brown hair", (0.045, 0.018, 0.012), 0.32)
eyes = material("Dark brown eyes", (0.025, 0.012, 0.008), 0.2)
white = material("Eye whites", (0.85, 0.78, 0.69), 0.35)
lips = material("Natural rose lips", (0.48, 0.12, 0.13), 0.4)
fabric = material("Luxury black satin", (0.025, 0.025, 0.035), 0.25)
fabric2 = material("Ivory fabric", (0.88, 0.78, 0.66), 0.38)

# Smooth sphere helper
def sphere(name, location, scale, mat, segments=32):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=segments,
        ring_count=24,
        location=location
    )
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(
        location=False,
        rotation=False,
        scale=True
    )
    obj.data.materials.append(mat)

    for p in obj.data.polygons:
        p.use_smooth = True

    return obj

# Create a tapered body section
def body_section(name, rings, mat, sides=48):
    verts = []
    faces = []

    for z, rx, ry in rings:
        for i in range(sides):
            angle = 2 * math.pi * i / sides
            verts.append((
                rx * math.cos(angle),
                ry * math.sin(angle),
                z
            ))

    for j in range(len(rings) - 1):
        for i in range(sides):
            a = j * sides + i
            b = j * sides + (i + 1) % sides
            c = (j + 1) * sides + (i + 1) % sides
            d = (j + 1) * sides + i
            faces.append((a, b, c, d))

    mesh = bpy.data.meshes.new(name + "Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)

    for p in mesh.polygons:
        p.use_smooth = True

    return obj

# ==========================================
# BODY
# Approximate adult female proportions
# Height: approximately 1.72 m
# ==========================================

body_section(
    "Torso",
    [
        (0.91, 0.15, 0.105),
        (1.02, 0.19, 0.12),
        (1.15, 0.17, 0.105),
        (1.29, 0.13, 0.09),
        (1.40, 0.18, 0.105),
        (1.49, 0.22, 0.11),
        (1.55, 0.19, 0.095),
    ],
    skin
)

# Neck
sphere("Neck", (0, 0, 1.59), (0.065, 0.065, 0.14), skin)

# Head and jaw
sphere("Head", (0, 0, 1.76), (0.115, 0.105, 0.155), skin)

# Chin
sphere("Chin", (0, -0.015, 1.665), (0.075, 0.075, 0.055), skin)

# Ears
for side in [-1, 1]:
    sphere(
        "Ear",
        (side * 0.115, 0, 1.76),
        (0.025, 0.035, 0.055),
        skin
    )

# Eyes, facing front (-Y)
for side in [-1, 1]:
    sphere(
        "Eye white",
        (side * 0.045, -0.095, 1.795),
        (0.025, 0.012, 0.016),
        white
    )
    sphere(
        "Iris",
        (side * 0.045, -0.108, 1.795),
        (0.012, 0.008, 0.012),
        eyes
    )

# Nose
sphere("Nose bridge", (0, -0.105, 1.765), (0.018, 0.025, 0.045), skin)
sphere("Nose tip", (0, -0.125, 1.745), (0.025, 0.022, 0.018), skin)

# Lips
sphere("Upper lip", (0, -0.105, 1.705), (0.035, 0.012, 0.009), lips)
sphere("Lower lip", (0, -0.108, 1.692), (0.032, 0.012, 0.009), lips)

# Eyebrows
for side in [-1, 1]:
    sphere(
        "Eyebrow",
        (side * 0.045, -0.105, 1.825),
        (0.035, 0.008, 0.009),
        hair
    )

# Hair cap
sphere("Hair cap", (0, 0.012, 1.835), (0.12, 0.11, 0.105), hair)

# Long hair behind head
sphere("Long hair back", (0, 0.075, 1.68), (0.12, 0.07, 0.19), hair)

# Side hair
for side in [-1, 1]:
    sphere(
        "Side hair",
        (side * 0.105, 0.025, 1.73),
        (0.035, 0.06, 0.16),
        hair
    )

# Arms
for side in [-1, 1]:
    sphere(
        "Upper arm",
        (side * 0.235, 0, 1.39),
        (0.065, 0.065, 0.16),
        skin
    )
    sphere(
        "Forearm",
        (side * 0.255, -0.005, 1.16),
        (0.045, 0.05, 0.15),
        skin
    )
    sphere(
        "Hand",
        (side * 0.26, -0.01, 1.01),
        (0.045, 0.035, 0.075),
        skin
    )

# Legs
for side in [-1, 1]:
    x = side * 0.105

    sphere(
        "Thigh",
        (x, 0, 0.68),
        (0.095, 0.105, 0.30),
        skin
    )
    sphere(
        "Knee",
        (x, -0.005, 0.38),
        (0.065, 0.075, 0.075),
        skin
    )
    sphere(
        "Lower leg",
        (x, 0, 0.20),
        (0.055, 0.065, 0.20),
        skin
    )
    sphere(
        "Foot",
        (x, -0.055, 0.045),
        (0.065, 0.12, 0.045),
        skin
    )

# ==========================================
# TASTEFUL FASHION UNDERWEAR
# ==========================================

# Bra cups
for side in [-1, 1]:
    sphere(
        "Satin bra cup",
        (side * 0.105, -0.108, 1.445),
        (0.085, 0.045, 0.065),
        fabric
    )

# Bra center
sphere(
    "Bra center",
    (0, -0.11, 1.44),
    (0.025, 0.025, 0.035),
    fabric
)

# Underwear bottom
sphere(
    "Fashion underwear",
    (0, -0.005, 0.99),
    (0.19, 0.125, 0.075),
    fabric
)

# ==========================================
# LIGHTING AND CAMERA
# ==========================================

bpy.ops.object.camera_add(
    location=(3.4, -5.5, 1.45)
)
camera = bpy.context.object
camera.name = "STYLEVERSE Camera"
camera.rotation_euler = (
    math.radians(82),
    0,
    math.radians(32)
)
bpy.context.scene.camera = camera

bpy.ops.object.light_add(
    type="AREA",
    location=(0, -3, 3)
)
light = bpy.context.object
light.name = "Studio softbox"
light.data.energy = 450
light.data.shape = "DISK"
light.data.size = 4

# World
world = bpy.context.scene.world
world.color = (0.16, 0.16, 0.16)

# ==========================================
# EXPORT GLB
# ==========================================

os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)

bpy.ops.object.select_all(action="SELECT")

bpy.ops.export_scene.gltf(
    filepath=OUTPUT,
    export_format="GLB",
    use_selection=True,
    export_apply=True
)

print("STYLEVERSE FEMALE MODEL EXPORTED:")
print(OUTPUT)
