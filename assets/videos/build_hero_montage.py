"""
Hero montage for AURA 2026
Order: AURA logo reveal (smoke / confetti on auditorium) → sports action cuts.
No title-sponsor cards. Optimized for web (faststart + mobile cut).
"""
import subprocess
from pathlib import Path

import imageio_ffmpeg

ff = imageio_ffmpeg.get_ffmpeg_exe()
vid = Path(__file__).resolve().parent
tmp = vid / "_hero_parts"
tmp.mkdir(exist_ok=True)

# Accurate aftermovie windows (remapped 2026-08):
# 74–81 logo smoke · 81+ basketball · 86+ kabaddi · 90 volley · 96 badminton · 99 cricket · 111 football
parts = [
    ("aftermovie.mp4", "p00_logo_smoke.mp4", 74.2, 7.0),   # logo reveal + smoke
    ("aftermovie.mp4", "p01_basketball.mp4", 80.8, 7.0),
    ("aftermovie.mp4", "p02_kabaddi.mp4", 86.0, 6.5),
    ("aftermovie.mp4", "p03_volleyball.mp4", 89.2, 6.0),
    ("aftermovie.mp4", "p04_cricket.mp4", 98.0, 7.0),
    ("aftermovie.mp4", "p05_football.mp4", 110.0, 7.0),
    ("aftermovie.mp4", "p06_badminton.mp4", 94.8, 6.0),
]

vf = (
    "scale=1100:618:force_original_aspect_ratio=decrease,"
    "pad=1100:618:(ow-iw)/2:(oh-ih)/2,fps=30,setsar=1,"
    "format=yuv420p"
)

parts_ok = []
for src, out, start, dur in parts:
    op = tmp / out
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

# Mobile: first ~20s (logo + first sports), baseline, ~3MB target
mobile = vid / "snip-hero-mobile.mp4"
cmd_m = [
    ff, "-y",
    "-i", str(final),
    "-t", "20",
    "-an",
    "-vf", "scale=960:-2",
    "-c:v", "libx264",
    "-profile:v", "baseline",
    "-level", "3.1",
    "-preset", "slow",
    "-crf", "26",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    str(mobile),
]
r = subprocess.run(cmd_m, capture_output=True, text=True)
print("MOBILE", "OK" if r.returncode == 0 else r.stderr[-400:])
if mobile.exists():
    print("mobile_kb", mobile.stat().st_size // 1024)

# First-frame check (should be logo / smoke)
head = tmp / "head_check.jpg"
subprocess.run(
    [ff, "-y", "-ss", "0.5", "-i", str(final), "-frames:v", "1", str(head)],
    capture_output=True,
)
print("head_check", head.exists())
