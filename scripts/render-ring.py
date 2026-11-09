import bpy, json, math, os, sys
from mathutils import Matrix, Vector
import bmesh

ROOT = os.path.abspath(os.getcwd())
OUT = os.path.join(ROOT, '.preview', 'ring-render-v3')
os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.cycles.use_denoising = True
scene.cycles.denoiser = 'OPTIX'
scene.cycles.seed = 0
scene.cycles.use_animated_seed = False
scene.cycles.adaptive_threshold = .035
scene.cycles.max_bounces = 24
scene.cycles.transmission_bounces = 16
scene.cycles.glossy_bounces = 12
scene.cycles.transparent_max_bounces = 16
scene.cycles.use_light_tree = True
scene.render.resolution_x = 960
scene.render.resolution_y = 800
scene.render.resolution_percentage = 100
scene.render.fps = 60
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.film_transparent = True
scene.render.use_persistent_data = True
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.view_settings.exposure = 0
scene.view_settings.gamma = 1
scene.render.threads_mode = 'FIXED'
scene.render.threads = 8

try:
    preferences = bpy.context.preferences.addons['cycles'].preferences
    preferences.compute_device_type = 'OPTIX'
    preferences.get_devices()
    for device in preferences.devices:
        device.use = device.type == 'OPTIX'
        print('RENDER DEVICE', device.name, device.type, device.use, flush=True)
    scene.cycles.device = 'GPU'
except Exception as error:
    print('GPU SETUP', str(error), flush=True)

silver = bpy.data.materials.new('Polished platinum')
silver.use_nodes = True
p = silver.node_tree.nodes.get('Principled BSDF')
p.inputs['Base Color'].default_value = (.80,.76,.81,1)
p.inputs['Metallic'].default_value = 1
p.inputs['Roughness'].default_value = .13

diamond = bpy.data.materials.new('Reference brilliant facets')
diamond.use_nodes = True
nodes = diamond.node_tree.nodes
nodes.clear()
# Project the selected photographic diamond onto the solid cut. Its dark arrows
# stay visible under rotation; the PBR coat supplies changing studio highlights.
texture = nodes.new('ShaderNodeTexImage')
texture.image = bpy.data.images.load(os.path.join(ROOT,'public','images','ring-reference-angular.png'))
texture.image.pack()
coordinates = nodes.new('ShaderNodeTexCoord')
separate = nodes.new('ShaderNodeSeparateXYZ')
diamond.node_tree.links.new(coordinates.outputs['Generated'],separate.inputs[0])
u = nodes.new('ShaderNodeMath')
u.operation = 'MULTIPLY_ADD'
u.inputs[1].default_value = -.21
u.inputs[2].default_value = .261
v = nodes.new('ShaderNodeMath')
v.operation = 'MULTIPLY_ADD'
v.inputs[1].default_value = .46
v.inputs[2].default_value = .30
diamond.node_tree.links.new(separate.outputs['X'],u.inputs[0])
diamond.node_tree.links.new(separate.outputs['Z'],v.inputs[0])
uv = nodes.new('ShaderNodeCombineXYZ')
diamond.node_tree.links.new(u.outputs[0],uv.inputs['X'])
diamond.node_tree.links.new(v.outputs[0],uv.inputs['Y'])
diamond.node_tree.links.new(uv.outputs[0],texture.inputs['Vector'])
gem = nodes.new('ShaderNodeBsdfPrincipled')
diamond.node_tree.links.new(texture.outputs['Color'],gem.inputs['Base Color'])
diamond.node_tree.links.new(texture.outputs['Color'],gem.inputs['Emission Color'])
gem.inputs['Emission Strength'].default_value = .04
gem.inputs['Metallic'].default_value = .15
gem.inputs['Roughness'].default_value = .09
gem.inputs['IOR'].default_value = 2.42
gem.inputs['Coat Weight'].default_value = .45
gem.inputs['Coat Roughness'].default_value = .035
glass = nodes.new('ShaderNodeBsdfGlass')
glass.inputs['Roughness'].default_value = .008
glass.inputs['IOR'].default_value = 2.42
facet_mix = nodes.new('ShaderNodeMixShader')
cut_depth = nodes.new('ShaderNodeMapRange')
cut_depth.inputs['From Min'].default_value = .70
cut_depth.inputs['From Max'].default_value = .85
cut_depth.inputs['To Min'].default_value = .65
cut_depth.inputs['To Max'].default_value = .16
diamond.node_tree.links.new(separate.outputs['Y'],cut_depth.inputs['Value'])
diamond.node_tree.links.new(cut_depth.outputs[0],facet_mix.inputs[0])
diamond.node_tree.links.new(gem.outputs['BSDF'],facet_mix.inputs[1])
diamond.node_tree.links.new(glass.outputs[0],facet_mix.inputs[2])
output = nodes.new('ShaderNodeOutputMaterial')
diamond.node_tree.links.new(facet_mix.outputs[0], output.inputs['Surface'])

def reflection_material(original):
    material = original.copy()
    material.name = original.name + ' reflection'
    # Fade the finished reflection in the alpha pass, keeping the ring solid here.
    return material

ref_silver = reflection_material(silver)
ref_diamond = reflection_material(diamond)
with open(os.path.join(ROOT,'.preview','ring-geometry.json'), encoding='utf-8') as source:
    geometry_data = json.load(source)
convert = Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)))
turntable = bpy.data.objects.new('Jewelry turntable', None)
scene.collection.objects.link(turntable)
geometry_cache = {}
mirror_cache = {}
for index, record in enumerate(geometry_data['meshes']):
    key = (record['geometry'], record['diamond'])
    if key not in geometry_cache:
        raw = geometry_data['geometries'][record['geometry']]
        vertices = [raw['positions'][i:i+3] for i in range(0,len(raw['positions']),3)]
        indices = raw['indices'] if raw['indices'] else list(range(len(vertices)))
        faces = [indices[i:i+3] for i in range(0,len(indices),3)]
        mesh = bpy.data.meshes.new(('Brilliant' if record['diamond'] else raw['type']) + str(record['geometry']))
        mesh.from_pydata(vertices, [], faces)
        if raw['type'] == 'BoxGeometry':
            welded = bmesh.new()
            welded.from_mesh(mesh)
            bmesh.ops.remove_doubles(welded,verts=list(welded.verts),dist=.00001)
            welded.to_mesh(mesh)
            welded.free()
        mesh.materials.append(diamond if record['diamond'] else silver)
        for polygon in mesh.polygons:
            polygon.use_smooth = not record['diamond'] and raw['type'] != 'BoxGeometry'
        mesh.update()
        geometry_cache[key] = mesh
    mesh = geometry_cache[key]
    obj = bpy.data.objects.new(('Diamond ' if record['diamond'] else 'Platinum ') + str(index), mesh)
    scene.collection.objects.link(obj)
    obj.parent = turntable
    # Keep the shank from appearing as a second ring through the centre stone.
    obj.visible_transmission = record['diamond']
    values = record['matrix']
    matrix = Matrix([[values[col*4+row] for col in range(4)] for row in range(4)])
    local_matrix = convert @ matrix
    local_matrix.translation.z -= geometry_data['floor']
    obj.matrix_local = local_matrix
    geometry_type = geometry_data['geometries'][record['geometry']]['type']
    if geometry_type in ('LatheGeometry','BoxGeometry'):
        bevel = obj.modifiers.new('Soft jewellery bevels','BEVEL')
        bevel.width = .020 if geometry_type == 'BoxGeometry' else .008
        bevel.segments = 6 if geometry_type == 'BoxGeometry' else 3
        bevel.harden_normals = True
        if geometry_type == 'BoxGeometry':
            obj.modifiers.new('Polished claw normals','WEIGHTED_NORMAL')
    mirror = obj.copy()
    if key not in mirror_cache:
        mirrored_mesh = obj.data.copy()
        mirrored_mesh.materials.clear()
        mirrored_mesh.materials.append(ref_diamond if record['diamond'] else ref_silver)
        mirror_cache[key] = mirrored_mesh
    mirror.data = mirror_cache[key]
    mirror.name = obj.name + ' mirrored'
    mirror.visible_glossy = False
    mirror.visible_diffuse = False
    mirror.visible_transmission = False
    mirror.visible_shadow = False
    scene.collection.objects.link(mirror)
    mirror.parent = turntable
    reflected = Matrix.Diagonal((1,1,-1,1)) @ local_matrix
    mirror.matrix_local = reflected

# Only the legible purity mark is reproduced; the unreadable brand is not invented.
hallmark = silver.copy()
hallmark.name = 'Recessed 18K purity mark'
hallmark_bsdf = hallmark.node_tree.nodes.get('Principled BSDF')
hallmark_bsdf.inputs['Base Color'].default_value = (.035,.025,.035,1)
hallmark_bsdf.inputs['Roughness'].default_value = .22
for index, letter in enumerate('18K'):
    angle = math.pi + .075 - index * .075
    radial = Vector((math.cos(angle),math.sin(angle),0))
    tangent = Vector((math.sin(angle),-math.cos(angle),0))
    orientation = Matrix((tangent,Vector((0,0,1)),-radial)).transposed().to_4x4()
    orientation.translation = radial * .983 + Vector((0,0,geometry_data['floor'] * -1 + .005))
    text_data = bpy.data.curves.new('18K purity letter '+letter,'FONT')
    text_data.body = letter
    text_data.align_x = 'CENTER'
    text_data.align_y = 'CENTER'
    text_data.size = .085
    text_data.extrude = .0005
    text_data.materials.append(hallmark)
    letter_obj = bpy.data.objects.new('Purity '+str(index),text_data)
    scene.collection.objects.link(letter_obj)
    letter_obj.parent = turntable
    letter_obj.matrix_local = orientation

# Real studio softboxes illuminate and refract through the same fixed geometry.
def aim(obj, point):
    obj.rotation_euler = (Vector(point)-obj.location).to_track_quat('-Z','Y').to_euler()

def softbox(name, location, power, size, size_y, color=(1,1,1)):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = power
    data.shape = 'RECTANGLE'
    data.size = size
    data.size_y = size_y
    data.color = color
    obj = bpy.data.objects.new(name,data)
    scene.collection.objects.link(obj)
    obj.location = location
    aim(obj,(0,0,.2))

softbox('Tall key',(-3,-3,4),240,2.8,4)
softbox('Narrow silver rim',(3,-1,2),180,1.2,4)
softbox('Broad ceiling',(0,1,4),220,3,2)
softbox('Back strip',(-1,3,1.5),120,1,3)
softbox('Front fill',(0,-4,1.5),120,3,2)
# The dark lens surrounded by white softboxes creates the brilliant's arrow reflections.
bpy.ops.mesh.primitive_circle_add(vertices=64,radius=.65,fill_type='NGON',location=(0,-4,1.0),rotation=(math.pi/2,0,0))
flag=bpy.context.object
flag.name='Camera flag'
flag.visible_camera=False
flag.visible_shadow=False
flag_material=bpy.data.materials.new('Dark lens reflection')
flag_material.use_nodes=True
flag_bsdf=flag_material.node_tree.nodes.get('Principled BSDF')
flag_bsdf.inputs['Base Color'].default_value=(.001,.001,.001,1)
flag_bsdf.inputs['Roughness'].default_value=1
flag.data.materials.append(flag_material)
world = bpy.data.worlds.new('Neutral studio with camera-only chroma background')
world.use_nodes = True
scene.world = world
nodes = world.node_tree.nodes
nodes.clear()
output = nodes.new('ShaderNodeOutputWorld')
studio = nodes.new('ShaderNodeBackground')
studio.inputs['Color'].default_value = (.12,.105,.12,1)
studio.inputs['Strength'].default_value = 1
camera_bg = nodes.new('ShaderNodeBackground')
camera_bg.inputs['Color'].default_value = (0,1,0,1)
camera_bg.inputs['Strength'].default_value = 1
path = nodes.new('ShaderNodeLightPath')
mix = nodes.new('ShaderNodeMixShader')
world.node_tree.links.new(path.outputs['Is Camera Ray'],mix.inputs[0])
world.node_tree.links.new(studio.outputs[0],mix.inputs[1])
world.node_tree.links.new(camera_bg.outputs[0],mix.inputs[2])
world.node_tree.links.new(mix.outputs[0],output.inputs[0])

camera_data = bpy.data.cameras.new('Fixed product camera')
camera = bpy.data.objects.new('Fixed product camera',camera_data)
scene.collection.objects.link(camera)
camera.location = (0,-7,1.65)
aim(camera,(0,0,.36))
camera_data.type = 'ORTHO'
camera_data.ortho_scale = 3.2
scene.camera = camera
scene.frame_start = 1
scene.frame_end = 480
# Orbit the camera and studio together around static jewellery. This is equivalent
# to turning the ring, while keeping all shared mesh acceleration data static.
turntable.rotation_euler.z = -2.45
studio_rig = bpy.data.objects.new('Orbiting studio',None)
scene.collection.objects.link(studio_rig)
for obj in list(scene.objects):
    if obj.type in ('CAMERA','LIGHT') or obj == flag:
        obj.parent = studio_rig
studio_rig.rotation_euler.z = 0
studio_rig.keyframe_insert(data_path='rotation_euler',frame=1,index=2)
studio_rig.rotation_euler.z = -math.tau
studio_rig.keyframe_insert(data_path='rotation_euler',frame=480,index=2)
for curve in studio_rig.animation_data.action.fcurves:
    for point in curve.keyframe_points:
        point.interpolation = 'LINEAR'
scene.frame_set(1)
args = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
if '--video' in args:
    scene.cycles.samples = 64
    scene.render.filepath = os.path.join(OUT,'ring-hd-poster.png')
    bpy.ops.render.render(write_still=True)
    scene.cycles.samples = 32
    scene.render.film_transparent = False
    scene.render.image_settings.color_mode = 'RGB'
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format = 'MPEG4'
    scene.render.ffmpeg.codec = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'HIGH'
    scene.render.ffmpeg.ffmpeg_preset = 'GOOD'
    scene.render.ffmpeg.gopsize = 60
    scene.render.filepath = os.path.join(OUT,'ring-turntable-hd.mp4')
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'ring-turntable.blend'))
    bpy.ops.render.render(animation=True)
else:
    scene.cycles.samples = 64
    for frame in ([1,121,241,361] if '--all-previews' in args else [401] if '--front-preview' in args else [1]):
        scene.frame_set(frame)
        scene.render.filepath = os.path.join(OUT,'preview-%03d.png' % frame)
        bpy.ops.render.render(write_still=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'ring-turntable.blend'))
print('RENDER COMPLETE',flush=True)
