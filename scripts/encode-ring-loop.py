"""Loop the recorded rotation without its original upward movement."""
import os
import shutil
import bpy

root = os.getcwd()
# Use the corrected silver colours, not the faded capture, at full intro opacity.
frames = os.path.join(root, '.preview', 'original-ring', 'packed-vivid')
# Reverse the safe part of the recording, then return through the same angles.
# Adjacent poses match at both ends, including the loop seam.
order = list(range(106, 22, -1)) + list(range(24, 106))
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.resolution_x = 520
scene.render.resolution_y = 178
scene.render.resolution_percentage = 100
scene.render.fps = 30
scene.frame_start = 1
scene.frame_end = len(order)
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'None'
scene.render.use_sequencer = True
editor = scene.sequence_editor_create()
strip = editor.sequences.new_image('Continuous recorded ring', os.path.join(frames, 'frame-%04d.png' % order[0]), channel=1, frame_start=1)
for frame in order[1:]:
    strip.elements.append('frame-%04d.png' % frame)
strip.frame_final_duration = len(order)
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.image_settings.color_mode = 'RGB'
scene.render.ffmpeg.format = 'MPEG4'
scene.render.ffmpeg.codec = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.ffmpeg.ffmpeg_preset = 'GOOD'
scene.render.filepath = os.path.join(root, 'public', 'videos', 'ring-recorded-loop-vivid.mp4')
bpy.ops.render.render(animation=True)
shutil.copyfile(
    os.path.join(root, '.preview', 'original-ring', 'vivid-0106.png'),
    os.path.join(root, 'public', 'images', 'ring-recorded-loop-poster.png'),
)
