import bpy, os
root=os.path.abspath(os.getcwd())
out=os.path.join(root,'.preview','ring-render-v3')
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.render.resolution_x=1920
scene.render.resolution_y=800
scene.render.resolution_percentage=100
scene.render.fps=60
scene.frame_start=1
scene.frame_end=480
scene.view_settings.view_transform='Standard'
scene.view_settings.look='None'
scene.render.use_sequencer=True
editor=scene.sequence_editor_create()
for name,file,channel,offset in [('Colour','ring-turntable-hd.mp4',1,-480),('Alpha','ring-alpha-mask.mp4',2,480)]:
    strip=editor.sequences.new_movie(name,os.path.join(out,file),channel=channel,frame_start=1)
    strip.blend_type='ALPHA_OVER'
    strip.transform.scale_x=1
    strip.transform.scale_y=1
    strip.transform.offset_x=offset
    strip.transform.offset_y=0
scene.render.image_settings.file_format='FFMPEG'
scene.render.image_settings.color_mode='RGB'
scene.render.ffmpeg.format='MPEG4'
scene.render.ffmpeg.codec='H264'
scene.render.ffmpeg.constant_rate_factor='HIGH'
scene.render.ffmpeg.ffmpeg_preset='GOOD'
scene.render.ffmpeg.gopsize=60
scene.render.filepath=os.path.join(out,'ring-turntable-60fps.mp4')
bpy.ops.render.render(animation=True)
print('PACK COMPLETE',flush=True)
