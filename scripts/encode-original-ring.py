import bpy, os
root=os.getcwd()
import sys, shutil, json
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
vivid='--vivid' in args
end_facing='--end-facing' in args
frames='packed-vivid' if vivid else 'packed'
out=os.path.join(root,'.preview','original-ring')
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.render.resolution_x=520
scene.render.resolution_y=178
scene.render.resolution_percentage=100
scene.render.fps=30
scene.frame_start=1
scene.frame_end=106
scene.view_settings.view_transform='Standard'
scene.view_settings.look='None'
scene.render.use_sequencer=True
editor=scene.sequence_editor_create()
order=list(range(1,107))
if end_facing: order.reverse()
strip=editor.sequences.new_image('Original ring with matte',os.path.join(out,frames,'frame-%04d.png'%order[0]),channel=1,frame_start=1)
for frame in order[1:]: strip.elements.append('frame-%04d.png'%frame)
strip.frame_final_duration=106
scene.render.image_settings.file_format='FFMPEG'
scene.render.image_settings.color_mode='RGB'
scene.render.ffmpeg.format='MPEG4'
scene.render.ffmpeg.codec='H264'
scene.render.ffmpeg.constant_rate_factor='HIGH'
scene.render.ffmpeg.ffmpeg_preset='GOOD'
filename='ring-recorded-end-facing.mp4' if end_facing else 'ring-recorded-vivid.mp4' if vivid else 'ring-recorded-motion.mp4'
scene.render.filepath=os.path.join(out,filename)
bpy.ops.render.render(animation=True)
if end_facing:
    poster='vivid-0106.png' if vivid else 'cutout-0106.png'
    shutil.copyfile(os.path.join(out,poster),os.path.join(root,'public','images','ring-recorded-end-facing.png'))
    with open(os.path.join(out,'metadata-vivid.json' if vivid else 'metadata.json'),encoding='utf-8') as source:
        metadata=json.load(source)
    metadata.update(reversePlayback=True,startSourceFrame=106,endSourceFrame=1,frontFacingAvailable=False)
    metadata['note']='Original recorded frames run in reverse to finish at the clearest available diamond-face angle. The final pose remains oblique; a direct frontal view is not in this source segment.'
    with open(os.path.join(out,'metadata-end-facing.json'),'w',encoding='utf-8') as target:
        json.dump(metadata,target,indent=2)
print('ORIGINAL MOTION ENCODED',flush=True)
