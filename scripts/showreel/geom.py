# Bounding box (x y w h) of the pure-magenta test page inside a captured screen frame.
import sys
from PIL import Image, ImageChops

im = Image.open(sys.argv[1]).convert("RGB")
r, g, b = im.split()
mask = ImageChops.multiply(
    ImageChops.multiply(
        r.point(lambda v: 255 if v > 230 else 0),
        g.point(lambda v: 255 if v < 40 else 0),
    ),
    b.point(lambda v: 255 if v > 230 else 0),
)
box = mask.getbbox()
if box is None:
    print("0 0 0 0")
else:
    left, top, right, bottom = box
    print(left, top, right - left, bottom - top)
