# Locate scroll glides in a recording: prints bursts of large frame-to-frame change.
# usage: python motion.py video.mkv [threshold]
import subprocess
import sys

video = sys.argv[1]
threshold = float(sys.argv[2]) if len(sys.argv) > 2 else 6.0
fps, w, h = 10, 96, 54
raw = subprocess.run(
    ["ffmpeg", "-v", "error", "-i", video, "-vf", f"fps={fps},scale={w}:{h},format=gray", "-f", "rawvideo", "-"],
    capture_output=True, check=True,
).stdout
size = w * h
frames = [raw[i:i + size] for i in range(0, len(raw) - size + 1, size)]
diffs = [0.0] + [sum(abs(a - b) for a, b in zip(frames[i], frames[i - 1])) / size for i in range(1, len(frames))]
bursts, start = [], None
for i, d in enumerate(diffs):
    if d >= threshold and start is None:
        start = i
    elif d < threshold and start is not None:
        if i - start >= int(sys.argv[3] if len(sys.argv) > 3 else 5):
            bursts.append((start / fps, i / fps))
        start = None
if start is not None:
    bursts.append((start / fps, len(diffs) / fps))
print(f"{video}: {len(frames) / fps:.1f}s, threshold {threshold}")
for a, b in bursts:
    print(f"  burst {a:6.1f} -> {b:6.1f}  ({b - a:.1f}s)")
