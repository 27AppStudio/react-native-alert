#!/usr/bin/env python3
"""Puts the raw captures of capture.sh in phone frames for the README.

Usage: frame.py <raw_dir> <out_dir>

<raw_dir>/<platform>-<scene>-<light|dark>.png come from capture.sh. Writes, on a transparent
background, with one rim that reads on light and dark pages:
  <out_dir>/<platform>-<scene>-<appearance>.png   one framed phone per CELLS entry, for the table
  <out_dir>/hero.png                              HERO's phones side by side, under the intro
Each page is HTML (CSS frame, camera cutout) rendered by headless Chrome, then pngquant.
Needs Google Chrome and pngquant.
"""
import shutil
import struct
import subprocess
import sys
from pathlib import Path

CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

# What the README shows: the table's cells, and the hero's phones from left to right.
# Each image is the same for every reader: GitHub swaps <picture> sources by the OS, not by its
# own theme setting, and npm never swaps. So each slot shows one appearance, and the hero both.
CELLS = [(f'{p}-album', 'light') for p in ('ios26', 'ios18', 'android')] + \
        [(f'{p}-notes', 'dark') for p in ('ios26', 'ios18', 'android')]
HERO = [('ios26-album', 'light'), ('android-notes', 'dark')]

# Frames, as fractions of the phone's width. iPhone: a metal rim, a black bezel, the Dynamic
# Island (126 x 37 pt, 11 pt from the top of a 402 pt screen). Pixel 9: a satin rim, a thin
# bezel and the punch-hole camera.
PHONES = {
    'ios': dict(r=0.172, rim=0.0065, bezel=0.019, cutout='island'),
    'android': dict(r=0.118, rim=0.0075, bezel=0.021, cutout='hole'),
}
# One rim and shadow that read on GitHub's light and dark pages and on npm.
METAL = 'linear-gradient(135deg,#d1d1d6 0%,#7c7c82 18%,#3a3a3e 50%,#7c7c82 82%,#c7c7cc 100%)'
SHADOW = '0 {a}px {b}px rgba(0,0,0,.28),0 {c}px {d}px rgba(0,0,0,.16)'

CELL_W = 440          # table cells show at 220 px
HERO_PHONE_W = 600    # the hero shows at ~880 px, so phones at ~330 px
HERO_GAP = 110
PAD = 0.12            # room for the shadow, as a fraction of the phone's width

PAGE = """<!doctype html><html><head><meta charset="utf-8"><style>
html,body{{margin:0;background:transparent}}
.stage{{position:relative;width:{W}px;height:{H}px}}
.frame{{position:absolute;box-sizing:border-box}}
.bezel{{background:#000;height:100%;box-sizing:border-box}}
.screen{{position:relative;overflow:hidden;height:100%}}
.screen img{{display:block;width:100%}}
.island,.hole{{position:absolute;left:50%;transform:translateX(-50%);background:#000}}
</style></head><body><div class="stage">{phones}</div></body></html>"""


def size(png):
    with open(png, 'rb') as f:
        return struct.unpack('>II', f.read(24)[16:24])


def phone(img, platform, appearance, w, left, top):
    """One framed phone `w` px wide at (left, top); returns (html, height)."""
    p = PHONES['ios' if platform.startswith('ios') else 'android']
    iw, ih = size(img)
    rim, bezel = round(w * p['rim']), round(w * p['bezel'])
    sw = w - 2 * (rim + bezel)
    sh = round(sw * ih / iw)
    h = sh + 2 * (rim + bezel)
    r = round(w * p['r'])
    shadow = SHADOW.format(a=round(w * .05), b=round(w * .11), c=round(w * .012), d=round(w * .03))
    if p['cutout'] == 'island':
        cw, ch = sw * 126 / 402, sw * 37.3 / 402
        cutout = f'<div class="island" style="top:{sw * 11 / 402:.1f}px;width:{cw:.1f}px;height:{ch:.1f}px;border-radius:{ch / 2:.1f}px"></div>'
    else:
        d = sw * 0.034
        cutout = f'<div class="hole" style="top:{sh * 0.0215 - d / 2:.1f}px;width:{d:.1f}px;height:{d:.1f}px;border-radius:50%"></div>'
    html = (f'<div class="frame" style="left:{left}px;top:{top}px;width:{w}px;height:{h}px;border-radius:{r}px;'
            f'padding:{rim}px;background:{METAL};box-shadow:{shadow}">'
            f'<div class="bezel" style="border-radius:{r - rim}px;padding:{bezel}px">'
            f'<div class="screen" style="border-radius:{r - rim - bezel}px"><img src="{img.resolve().as_uri()}">{cutout}</div>'
            f'</div></div>')
    return html, h


def render(html, png, width, height):
    page = png.with_suffix('.html')
    page.write_text(html)
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars',
                    '--force-device-scale-factor=1', '--virtual-time-budget=2000',
                    '--allow-file-access-from-files', '--default-background-color=00000000',
                    f'--window-size={width},{height}', f'--screenshot={png}', page.resolve().as_uri()],
                   check=True, capture_output=True)
    page.unlink()
    subprocess.run(['pngquant', '--force', '--skip-if-larger', '--quality=80-95', '--ext', '.png', str(png)],
                   check=False)
    print(png)


def main(raw, out):
    out.mkdir(parents=True, exist_ok=True)
    for cell, appearance in CELLS:
        img = raw / f'{cell}-{appearance}.png'
        if not img.exists():
            sys.exit(f'missing capture: {img}')
        pad = round(CELL_W * PAD)
        html, h = phone(img, cell.split('-')[0], appearance, CELL_W, pad, round(pad * .6))
        W, H = CELL_W + 2 * pad, h + round(pad * 1.9)
        render(PAGE.format(W=W, H=H, phones=html), out / f'{cell}-{appearance}.png', W, H)
    pad = round(HERO_PHONE_W * PAD)
    parts, heights = [], []
    for i, (shot, appearance) in enumerate(HERO):
        img = raw / f'{shot}-{appearance}.png'
        html, h = phone(img, shot.split('-')[0], appearance, HERO_PHONE_W,
                        pad + i * (HERO_PHONE_W + HERO_GAP), round(pad * .6))
        parts.append(html)
        heights.append(h)
    W = 2 * pad + len(HERO) * HERO_PHONE_W + (len(HERO) - 1) * HERO_GAP
    H = max(heights) + round(pad * 1.9)
    render(PAGE.format(W=W, H=H, phones=''.join(parts)), out / 'hero.png', W, H)

if __name__ == '__main__':
    if not shutil.which('pngquant'):
        sys.exit('pngquant not found: brew install pngquant')
    main(Path(sys.argv[1]), Path(sys.argv[2]))
