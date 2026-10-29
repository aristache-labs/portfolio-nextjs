"""Compose the showreel from screenshots/showreel/raw/desktop.mkv and mobile.mkv.

    python scripts/showreel/compose.py --preview   # graphics + one composed still, no render
    python scripts/showreel/compose.py             # full render into screenshots/showreel/out

Everything is generated: dark brand background with soft shadows, a laptop and a phone frame
(transparent screen windows), section labels, and the intro and outro cards. The two recordings
are cut into matching sections so the laptop and the phone always show the same chapter.
"""

import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / "screenshots" / "showreel"
RAW, ASSETS, OUT = WORK / "raw", WORK / "assets", WORK / "out"
FONTS = Path("C:/Windows/Fonts")
LOGO = ROOT / "public" / "brand" / "logo-full-v2.webp"

W, H, FPS = 1920, 1080, 60
TEAL, BRIGHT, INK = (88, 229, 208), (118, 245, 225), (8, 12, 13)

# Geometry (pixels on the 1920x1080 canvas).
LAP_SCREEN = (148, 227, 1160, 604)  # the 1920x1000 recording, scaled 0.604
LAP_OUTER = (134, 213, 1188, 636)
PH_SCREEN = (1376, 156, 396, 767)  # the 440x852 recording, scaled 0.9
PH_OUTER = (1362, 142, 424, 795)

# Raw-footage windows per chapter (seconds), the speed applied, and the output length.
# d = desktop recording, m = phone recording. Chapters line up in time on both sides.
FLOW = json.loads((Path(__file__).resolve().parent / "flow.json").read_text(encoding="utf-8"))
# Section labels follow the same anchors the capture script scrolls to.
LABELS = {
    "#about": ("01", "ABOUT"),
    "#skills": ("02", "SKILLS"),
    "#experience": ("03", "EXPERIENCE"),
    "#projects": ("04", "PROJECTS"),
    "#contact": ("05", "CONTACT"),
}
INTRO, OUTRO, FADE = 3.0, 3.6, 0.6
# Generated intro and outro clips (Gemini Omni), used instead of the static cards when present.
GEN = WORK / "veo" / "out"
GEN_INTRO, GEN_OUTRO = GEN / "intro.mp4", GEN / "outro.mp4"
GEN_INTRO_S, GEN_OUTRO_S = 8.0, 8.6  # the clips are 10 s: the logo has settled by 8 s, the outro fades out by 8.6 s


def font(name, size):
    return ImageFont.truetype(str(FONTS / name), size)


def rrect(size, box, radius, fill=255, scale=2):
    """Anti-aliased rounded rectangle mask: box is (x, y, w, h)."""
    img = Image.new("L", (size[0] * scale, size[1] * scale), 0)
    x, y, w, h = box
    ImageDraw.Draw(img).rounded_rectangle(
        [x * scale, y * scale, (x + w) * scale, (y + h) * scale], radius=radius * scale, fill=fill
    )
    return img.resize(size, Image.LANCZOS)


def make_background():
    base = Image.new("RGB", (W, H), INK)
    radial = Image.radial_gradient("L").resize((W, H), Image.BICUBIC)  # 0 centre, 255 edge
    glow_mask = ImageChops.invert(radial).point(lambda v: int(((v / 255) ** 1.5) * 150))
    base = Image.composite(Image.new("RGB", (W, H), (16, 84, 78)), base, glow_mask)
    vignette = radial.point(lambda v: int(max(0, v - 110) * 1.1))
    base = Image.composite(Image.new("RGB", (W, H), (0, 0, 0)), base, vignette)
    noise = Image.effect_noise((W, H), 2.5).convert("RGB")  # gentle dither, avoids banding
    return ImageChops.add(base, noise, 1.0, -128)


def with_shadows(bg):
    layer = Image.new("L", (W, H), 0)
    for ox, oy, ow, oh in (LAP_OUTER, PH_OUTER):
        layer = ImageChops.lighter(layer, rrect((W, H), (ox, oy + 34, ow, oh), 26, fill=150))
    layer = layer.filter(ImageFilter.GaussianBlur(46))
    return Image.composite(Image.new("RGB", (W, H), (0, 0, 0)), bg, layer)


def device(outer, screen, r_out, r_screen, fill, edge, extras):
    s = 2
    img = Image.new("RGBA", (W * s, H * s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    ox, oy, ow, oh = outer
    d.rounded_rectangle(
        [ox * s, oy * s, (ox + ow) * s, (oy + oh) * s], radius=r_out * s, fill=fill, outline=edge, width=3 * s
    )
    extras(d, s)
    sx, sy, sw, sh = screen
    window = Image.new("L", img.size, 255)
    ImageDraw.Draw(window).rounded_rectangle(
        [sx * s, sy * s, (sx + sw) * s, (sy + sh) * s], radius=r_screen * s, fill=0
    )
    img.putalpha(ImageChops.multiply(img.getchannel("A"), window))
    return img


def make_laptop():
    ox, oy, ow, oh = LAP_OUTER

    def extras(d, s):
        cx = ox + ow // 2
        d.ellipse([(cx - 4) * s, (oy + 6) * s, (cx + 4) * s, (oy + 14) * s], fill=(34, 40, 42))
        base_y = oy + oh
        d.rounded_rectangle(
            [(ox - 34) * s, base_y * s, (ox + ow + 34) * s, (base_y + 18) * s],
            radius=9 * s, fill=(30, 36, 38), outline=(70, 82, 84), width=2 * s,
        )
        d.rounded_rectangle(
            [(cx - 90) * s, base_y * s, (cx + 90) * s, (base_y + 7) * s], radius=4 * s, fill=(18, 22, 24)
        )

    img = device(LAP_OUTER, LAP_SCREEN, 22, 8, (20, 25, 27, 255), (66, 78, 80, 255), extras)
    return img.resize((W, H), Image.LANCZOS)


def make_phone():
    ox, oy, ow, oh = PH_OUTER

    def extras(d, s):
        d.rounded_rectangle([(ox - 4) * s, (oy + 130) * s, ox * s, (oy + 200) * s], radius=2 * s, fill=(46, 54, 56))
        d.rounded_rectangle([(ox + ow) * s, (oy + 170) * s, (ox + ow + 4) * s, (oy + 270) * s], radius=2 * s, fill=(46, 54, 56))

    img = device(PH_OUTER, PH_SCREEN, 54, 40, (14, 18, 20, 255), (74, 86, 88, 255), extras)
    return img.resize((W, H), Image.LANCZOS)


def spaced(draw, xy, text, fnt, fill, gap):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += draw.textlength(ch, font=fnt) + gap
    return x


def spaced_width(text, fnt, gap):
    probe = ImageDraw.Draw(Image.new("L", (10, 10)))
    return sum(probe.textlength(ch, font=fnt) + gap for ch in text) - gap


def make_label(num, text):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fnt = font("consolab.ttf", 30)
    gap = 4
    parts = [(num, TEAL), (" / ", (120, 140, 140)), (text, (236, 246, 244))]
    width = sum(spaced_width(t, fnt, gap) + gap for t, _ in parts)
    pw, ph = int(width + 64), 62
    px, py = (W - pw) // 2, 972
    pill = Image.new("RGBA", (W * 2, H * 2), (0, 0, 0, 0))
    ImageDraw.Draw(pill).rounded_rectangle(
        [px * 2, py * 2, (px + pw) * 2, (py + ph) * 2], radius=ph, fill=(8, 12, 13, 225), outline=(88, 229, 208, 120), width=4
    )
    img = Image.alpha_composite(img, pill.resize((W, H), Image.LANCZOS))
    d = ImageDraw.Draw(img)
    x = px + 32
    for t, colour in parts:
        x = spaced(d, (x, py + 12), t, fnt, colour, gap) + gap
    return img


def centred(d, y, text, fnt, fill, gap=0):
    w = spaced_width(text, fnt, gap) if gap else d.textlength(text, font=fnt)
    if gap:
        spaced(d, ((W - w) / 2, y), text, fnt, fill, gap)
    else:
        d.text(((W - w) / 2, y), text, font=fnt, fill=fill)


def make_card(kind):
    img = make_background().convert("RGBA")
    logo = Image.open(LOGO).convert("RGBA")
    height = 300 if kind == "intro" else 240
    logo = logo.resize((int(logo.width * height / logo.height), height), Image.LANCZOS)
    top = 250 if kind == "intro" else 230
    img.alpha_composite(logo, ((W - logo.width) // 2, top))
    d = ImageDraw.Draw(img)
    if kind == "intro":
        centred(d, 610, "DIAGNOSE  ·  BUILD  ·  AUTOMATE", font("consolab.ttf", 30), BRIGHT, gap=7)
        centred(d, 690, "www.aristache.dev", font("segoeui.ttf", 36), (200, 214, 212))
    else:
        centred(d, 520, "www.aristache.dev", font("segoeuib.ttf", 60), (240, 250, 248))
        centred(d, 620, "Adrian Cristache", font("segoeui.ttf", 38), (200, 214, 212))
        centred(d, 690, "IT infrastructure, deployment automation, web and mobile development.", font("segoeui.ttf", 28), (130, 150, 150))
        centred(d, 800, "github.com/aristache-labs", font("consolab.ttf", 28), TEAL, gap=3)
    return img.convert("RGB")


def build_assets():
    ASSETS.mkdir(parents=True, exist_ok=True)
    bg = make_background()
    with_shadows(bg).save(ASSETS / "bg.png")
    make_laptop().save(ASSETS / "laptop.png")
    make_phone().save(ASSETS / "phone.png")
    make_card("intro").save(ASSETS / "intro.png")
    make_card("outro").save(ASSETS / "outro.png")
    for selector, (number, text) in LABELS.items():
        make_label(number, text).save(ASSETS / label_name(selector))
    print("assets written to", ASSETS)


def frame_at(video, seconds, size, name):
    target = ASSETS / name
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", str(seconds), "-i", str(video),
         "-frames:v", "1", "-vf", f"scale={size[0]}:{size[1]}:flags=lanczos", str(target)],
        check=True,
    )
    return Image.open(target).convert("RGB")


def marker_span(video):
    """(first, end) seconds during which the magenta sync marker is on screen."""
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(video), "-vf", "fps=60,crop=8:8:0:0,format=rgb24", "-f", "rawvideo", "-"],
        capture_output=True, check=True,
    ).stdout
    size = 8 * 8 * 3
    first, last = -1, -1
    for i in range(len(raw) // size):
        chunk = raw[i * size:(i + 1) * size]
        # The encoder blends some edge pixels, so judge the whole 8x8 square by its mean colour.
        red, green, blue = sum(chunk[0::3]) / 64, sum(chunk[1::3]) / 64, sum(chunk[2::3]) / 64
        if red > 120 and blue > 120 and green < 90:
            if first < 0:
                first = i
            last = i
    if last < 0:
        raise SystemExit("sync marker not found in " + video.name)
    return first / 60.0, (last + 1) / 60.0


def scroll_start(video):
    """Seconds into a recording at which the scroll begins: just after the sync marker goes away."""
    return marker_span(video)[1] + 0.3


def label_name(selector):
    return "label-" + selector.lstrip("#") + ".png"


def preview():
    start = {"d": scroll_start(RAW / "desktop.mkv"), "m": scroll_start(RAW / "mobile.mkv")}
    canvas = Image.open(ASSETS / "bg.png").convert("RGB")
    canvas.paste(frame_at(RAW / "desktop.mkv", start["d"] + 13.0, LAP_SCREEN[2:], "pv-desktop.png"), LAP_SCREEN[:2])
    canvas.paste(frame_at(RAW / "mobile.mkv", start["m"] + 13.0, PH_SCREEN[2:], "pv-mobile.png"), PH_SCREEN[:2])
    canvas = canvas.convert("RGBA")
    canvas.alpha_composite(Image.open(ASSETS / "laptop.png"))
    canvas.alpha_composite(Image.open(ASSETS / "phone.png"))
    canvas.alpha_composite(Image.open(ASSETS / label_name("#skills")))
    canvas.convert("RGB").save(ASSETS / "preview.png")
    print("preview written to", ASSETS / "preview.png")


def render():
    OUT.mkdir(parents=True, exist_ok=True)
    before, after = FLOW["holdBeforeS"], FLOW["holdAfterS"]
    anchors = FLOW["anchors"]
    main = round(before + anchors[-1][1] + after, 2)
    starts = {"d": scroll_start(RAW / "desktop.mkv"), "m": scroll_start(RAW / "mobile.mkv")}
    print("scroll starts at", {k: round(v, 2) for k, v in starts.items()}, "main", main, "s")
    for side, value in starts.items():
        if value - before < 0:
            raise SystemExit("recording " + side + " starts too late for the pre-roll")
    cmd = ["ffmpeg", "-hide_banner", "-y"]
    # 0 background, 1 laptop, 2 phone, 3 intro, 4 outro, then labels, then the two recordings.
    cmd += ["-loop", "1", "-framerate", str(FPS), "-t", str(main), "-i", str(ASSETS / "bg.png")]
    for name in ("laptop", "phone"):
        cmd += ["-loop", "1", "-framerate", str(FPS), "-t", str(main), "-i", str(ASSETS / f"{name}.png")]
    generated = GEN_INTRO.exists() and GEN_OUTRO.exists()
    intro_len, outro_len = (GEN_INTRO_S, GEN_OUTRO_S) if generated else (INTRO, OUTRO)
    if generated:
        cmd += ["-t", str(intro_len), "-i", str(GEN_INTRO), "-t", str(outro_len), "-i", str(GEN_OUTRO)]
    else:
        cmd += ["-loop", "1", "-framerate", str(FPS), "-t", str(INTRO), "-i", str(ASSETS / "intro.png")]
        cmd += ["-loop", "1", "-framerate", str(FPS), "-t", str(OUTRO), "-i", str(ASSETS / "outro.png")]
    index = 5
    labels = []
    for selector, seconds in anchors:
        if selector in LABELS:
            length = 5.2
            cmd += ["-loop", "1", "-framerate", str(FPS), "-t", str(length), "-i", str(ASSETS / label_name(selector))]
            labels.append((index, round(before + seconds - 1.6, 2), length))
            index += 1
    filters = []
    for side, size, name in (("d", LAP_SCREEN[2:], "desktop.mkv"), ("m", PH_SCREEN[2:], "mobile.mkv")):
        window = round(starts[side] - before, 3)
        cmd += ["-ss", str(window), "-t", str(main + 1), "-i", str(RAW / name)]
        # The sync marker is inside the pre-roll: paint over it with the page's own dark corner.
        seen_from, seen_to = marker_span(RAW / name)
        hide = f"between(t,{round(seen_from - window - 0.06, 3)},{round(seen_to - window + 0.06, 3)})"
        filters.append(
            f"[{index}:v]drawbox=x=0:y=0:w=11:h=11:color=0x070b0c:t=fill:enable='{hide}',"
            f"setpts=PTS-STARTPTS,scale={size[0]}:{size[1]}:flags=lanczos,fps={FPS},format=yuv420p,"
            f"tpad=stop_mode=clone:stop_duration=2,trim=duration={main},setpts=PTS-STARTPTS[{side}v]"
        )
        index += 1
    filters.append("[0:v]format=yuv420p[bg]")
    filters.append(f"[bg][dv]overlay={LAP_SCREEN[0]}:{LAP_SCREEN[1]}[a]")
    filters.append(f"[a][mv]overlay={PH_SCREEN[0]}:{PH_SCREEN[1]}[b]")
    filters.append("[b][1:v]overlay=0:0:format=auto[c]")
    filters.append("[c][2:v]overlay=0:0:format=auto[d0]")
    last = "d0"
    for number, (idx, at, length) in enumerate(labels):
        filters.append(
            f"[{idx}:v]format=rgba,fade=t=in:st=0:d=0.5:alpha=1,fade=t=out:st={round(length - 0.5, 2)}:d=0.5:alpha=1,"
            f"setpts=PTS-STARTPTS+{at}/TB[l{number}]"
        )
        filters.append(f"[{last}][l{number}]overlay=0:0:format=auto:eof_action=pass[o{number}]")
        last = f"o{number}"
    filters.append(f"[{last}]format=yuv420p,fps={FPS},trim=duration={main},setpts=PTS-STARTPTS[main]")
    if generated:
        # 1280x720 at 24 fps from the model: upscale to the canvas, no extra fades (they fade themselves).
        for tag, idx in (("intro", 3), ("outro", 4)):
            filters.append(
                f"[{idx}:v]scale={W}:{H}:flags=lanczos,fps={FPS},format=yuv420p,setpts=PTS-STARTPTS[{tag}]"
            )
    else:
        filters.append(f"[3:v]format=yuv420p,fps={FPS},fade=t=in:st=0:d=0.8[intro]")
        filters.append(f"[4:v]format=yuv420p,fps={FPS},fade=t=out:st={OUTRO - 0.8}:d=0.8[outro]")
    filters.append(f"[intro][main]xfade=transition=fade:duration={FADE}:offset={round(intro_len - FADE, 2)}[im]")
    offset = round(intro_len + main - 2 * FADE, 2)
    filters.append(f"[im][outro]xfade=transition=fade:duration={FADE}:offset={offset}[v]")
    total = round(intro_len + main + outro_len - 2 * FADE, 2)
    audio = []
    if generated:
        # Loudness-match both soundtracks, fade the intro's tail into the silent middle, then place the outro.
        filters.append(f"[3:a]loudnorm=I=-18:TP=-2:LRA=7,afade=t=out:st={round(intro_len - 1.2, 2)}:d=1.2[ia]")
        filters.append(
            f"[4:a]loudnorm=I=-20:TP=-2:LRA=7,afade=t=in:st=0:d=0.4,adelay={int(offset * 1000)}|{int(offset * 1000)}[oa]"
        )
        filters.append(f"[ia][oa]amix=inputs=2:normalize=0:duration=longest,atrim=0:{total},asetpts=PTS-STARTPTS[a]")
        audio = ["-map", "[a]", "-c:a", "aac", "-b:a", "192k"]
    target = OUT / ("aristache-showreel-1080p60-v3.mp4" if generated else "aristache-showreel-1080p60.mp4")
    cmd += [
        "-filter_complex", ";".join(filters), "-map", "[v]", *(audio or ["-an"]),
        "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p",
        "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
        "-movflags", "+faststart", str(target),
    ]
    print("rendering", target.name, "total about", total, "s", "(generated intro/outro)" if generated else "")
    subprocess.run(cmd, check=True)
    print("done:", target)


if __name__ == "__main__":
    build_assets()
    if "--preview" in sys.argv:
        preview()
    else:
        render()
