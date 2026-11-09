import bpy, os

root=os.getcwd()
out=os.path.join(root,'.preview','original-ring','native')
os.makedirs(out,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.render.resolution_x=842
scene.render.resolution_y=1080
scene.render.resolution_percentage=100
scene.render.fps=30
scene.view_settings.view_transform='Standard'
scene.view_settings.look='None'
scene.render.image_settings.file_format='PNG'
scene.render.image_settings.color_mode='RGBA'
scene.render.use_sequencer=True
editor=scene.sequence_editor_create()
strip=editor.sequences.new_movie('Original user recording',os.path.join(root,'Screen Recording 2026-11-05 131243.mp4'),channel=1,frame_start=1)
strip.transform.scale_x=1
strip.transform.scale_y=1
strip.transform.offset_x=1
strip.transform.offset_y=-43
scene.render.resolution_x=260
scene.render.resolution_y=178
scene.frame_start=1
scene.frame_end=106
scene.render.filepath=os.path.join(out,'frame-')
bpy.ops.render.render(animation=True)
print('ORIGINAL FRAMES EXTRACTED',flush=True)
