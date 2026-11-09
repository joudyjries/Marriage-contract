import bpy, os
import sys
root=os.path.abspath(os.getcwd())
out=os.path.join(root,'.preview','ring-render-v3')
bpy.ops.wm.open_mainfile(filepath=os.path.join(out,'ring-turntable.blend'))
scene=bpy.context.scene
preferences=bpy.context.preferences.addons['cycles'].preferences
preferences.compute_device_type='OPTIX'
preferences.get_devices()
for device in preferences.devices: device.use=device.type=='OPTIX'
scene.cycles.device='GPU'
scene.cycles.samples=4
scene.cycles.use_denoising=False
scene.cycles.max_bounces=1
scene.render.film_transparent=False
scene.view_settings.view_transform='Standard'
scene.view_settings.look='None'
for obj in scene.objects:
    if obj.type=='LIGHT' or obj.name=='Camera flag': obj.hide_render=True
for material in list(bpy.data.materials):
    if not material.use_nodes: continue
    reflection=material.name.endswith(' reflection')
    material.node_tree.nodes.clear()
    emission=material.node_tree.nodes.new('ShaderNodeEmission')
    emission.inputs['Color'].default_value=(1,1,1,1)
    emission.inputs['Strength'].default_value=1
    if reflection:
        geometry=material.node_tree.nodes.new('ShaderNodeNewGeometry')
        separate=material.node_tree.nodes.new('ShaderNodeSeparateXYZ')
        fade=material.node_tree.nodes.new('ShaderNodeMapRange')
        fade.inputs['From Min'].default_value=-.85
        fade.inputs['From Max'].default_value=0
        fade.inputs['To Min'].default_value=0
        fade.inputs['To Max'].default_value=.34
        gamma=material.node_tree.nodes.new('ShaderNodeMath')
        gamma.operation='POWER'
        gamma.inputs[1].default_value=2.2
        material.node_tree.links.new(geometry.outputs['Position'],separate.inputs[0])
        material.node_tree.links.new(separate.outputs['Z'],fade.inputs['Value'])
        material.node_tree.links.new(fade.outputs[0],gamma.inputs[0])
        material.node_tree.links.new(gamma.outputs[0],emission.inputs['Color'])
    output=material.node_tree.nodes.new('ShaderNodeOutputMaterial')
    material.node_tree.links.new(emission.outputs[0],output.inputs['Surface'])
scene.world.node_tree.nodes.clear()
background=scene.world.node_tree.nodes.new('ShaderNodeBackground')
background.inputs['Color'].default_value=(0,0,0,1)
background.inputs['Strength'].default_value=0
output=scene.world.node_tree.nodes.new('ShaderNodeOutputWorld')
scene.world.node_tree.links.new(background.outputs[0],output.inputs[0])
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
scene.frame_set(1)
scene.render.image_settings.file_format='PNG'
scene.render.filepath=os.path.join(out,'mask-preview.png')
bpy.ops.render.render(write_still=True)
if '--preview' in args:
    print('MASK PREVIEW COMPLETE',flush=True)
    sys.exit(0)
scene.render.image_settings.file_format='FFMPEG'
scene.render.image_settings.color_mode='RGB'
scene.render.ffmpeg.format='MPEG4'
scene.render.ffmpeg.codec='H264'
scene.render.ffmpeg.constant_rate_factor='HIGH'
scene.render.ffmpeg.ffmpeg_preset='GOOD'
scene.render.filepath=os.path.join(out,'ring-alpha-mask.mp4')
bpy.ops.render.render(animation=True)
print('MASK COMPLETE',flush=True)
