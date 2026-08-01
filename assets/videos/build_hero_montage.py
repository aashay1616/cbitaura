"""Hero montage: all sports + trailer title fonts. NO title-sponsor cards. Optimized for web start."""
import subprocess
from pathlib import Path

import imageio_ffmpeg

ff = imageio_ffmpeg.get_ffmpeg_exe()
vid = Path(__file__).resolve().parent
tmp = vid / "_hero_parts"
tmp.mkdir(exist_ok=True)

# No trailer tail (that segment includes TITLE SPONSOR / Telangana Tourism)
parts = [
    ("aftermovie.mp4", "p01_bb.mp4", 74, 7),
    ("trailer.mp4", "p02_kabaddi_title.mp4", 47, 3.5),
    ("aftermovie.mp4", "p03_kabaddi.mp4", 84, 7),
    ("aftermovie.mp4", "p04_cricket.mp4", 94, 8),
    ("trailer.mp4", "p05_football_title.mp4", 70, 3.5),
    ("aftermovie.mp4", "p06_football.mp4", 108, 7),
    ("aftermovie.mp4", "p07_volley.mp4", 138, 7),
    ("aftermovie.mp4", "p08_badminton.mp4", 144, 7),
    ("aftermovie.mp4", "p09_tt.mp4", 156, 7),
]

# Slightly smaller for faster first paint; fixed SAR/fps for smooth concat
vf = (
    "scale=1100:618:force_original_aspect_ratio=decrease,"
    "pad=1100:618:(ow-iw)/2:(oh-ih)/2,fps=30,setsar=1,"
    "format=yuv420p"
)

parts_ok = []
for src, out, start, dur in parts:
    op = tmp / out
    # -ss after -i is slower but more accurate; before -i is faster for keyframes
    # use input seek + short output for speed; force keyframe at start of each part
    cmd = [
        ff, "-y",
        "-ss", str(start),
        "-i", str(vid / src),
        "-t", str(dur),
        "-vf", vf,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "26",
        "-g", "30",
        "-keyint_min", "30",
        "-sc_threshold", "0",
        "-an",
        "-pix_fmt", "yuv420p",
        str(op),
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    print(out, "OK" if r.returncode == 0 else "FAIL")
    if r.returncode == 0:
        parts_ok.append(op)
    else:
        print(r.stderr[-400:])

lst = tmp / "list.txt"
with lst.open("w", encoding="utf-8") as f:
    for p in parts_ok:
        f.write(f"file '{p.as_posix()}'\n")

final = vid / "snip-hero.mp4"
# Re-encode full concat with faststart so first seconds play immediately
cmd = [
    ff, "-y",
    "-f", "concat", "-safe", "0", "-i", str(lst),
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "26",
    "-profile:v", "main",
    "-level", "4.0",
    "-g", "30",
    "-keyint_min", "30",
    "-sc_threshold", "0",
    "-an",
    "-movflags", "+faststart",
    "-pix_fmt", "yuv420p",
    str(final),
]
r = subprocess.run(cmd, capture_output=True, text=True)
print("HERO", "OK" if r.returncode == 0 else r.stderr[-500:])
if final.exists():
    print("size_kb", final.stat().st_size // 1024, "segments", len(parts_ok))

# Verify last 2 seconds aren't sponsor
check = tmp / "tail_check.jpg"
subprocess.run(
    [ff, "-y", "-sseof", "-1.5", "-i", str(final), "-frames:v", "1", str(check)],
    capture_output=True,
)
print("tail_check", check.exists())
