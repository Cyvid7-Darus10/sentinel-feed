#!/usr/bin/env python3
"""Generate favicon, PWA icons, and OG image for Sentinel Feed using the app icon design."""

import math
from PIL import Image, ImageDraw, ImageFont


def draw_sentinel_icon(size):
    """Draw the minimal shield + signal icon at given size."""
    icon = Image.new("RGB", (size, size), (255, 255, 255))
    draw = ImageDraw.Draw(icon)

    CENTER = size // 2
    ACCENT = (16, 185, 129)
    ACCENT_LIGHT = (209, 250, 229)

    # Scale factor
    s = size / 1024

    shield_top = int(140 * s)
    shield_bottom = int(780 * s)
    shield_w = int(280 * s)

    shield_points = [
        (CENTER, shield_top),
        (CENTER + shield_w, shield_top + int(90 * s)),
        (CENTER + shield_w, CENTER + int(20 * s)),
        (CENTER + int(shield_w * 0.55), shield_bottom - int(50 * s)),
        (CENTER, shield_bottom),
        (CENTER - int(shield_w * 0.55), shield_bottom - int(50 * s)),
        (CENTER - shield_w, CENTER + int(20 * s)),
        (CENTER - shield_w, shield_top + int(90 * s)),
    ]

    draw.polygon(shield_points, fill=ACCENT_LIGHT)
    draw.line(shield_points + [shield_points[0]], fill=ACCENT, width=max(int(18 * s), 1))

    signal_y = CENTER - int(30 * s)

    wave_configs = [
        (int(100 * s), max(int(16 * s), 1)),
        (int(170 * s), max(int(14 * s), 1)),
        (int(240 * s), max(int(12 * s), 1)),
    ]

    for radius, width in wave_configs:
        bbox = [CENTER - radius, signal_y - radius, CENTER + radius, signal_y + radius]
        draw.arc(bbox, 220, 320, fill=ACCENT, width=width)

    dot_r = max(int(22 * s), 2)
    draw.ellipse(
        [CENTER - dot_r, signal_y - dot_r, CENTER + dot_r, signal_y + dot_r],
        fill=ACCENT,
    )

    return icon


# --- Generate favicon.ico (multi-size) ---
sizes_ico = [16, 32, 48]
ico_images = [draw_sentinel_icon(s) for s in sizes_ico]
ico_images[0].save(
    "src/app/favicon.ico",
    format="ICO",
    sizes=[(s, s) for s in sizes_ico],
    append_images=ico_images[1:],
)
print("  src/app/favicon.ico")

# --- Generate PWA icons ---
pwa_sizes = [192, 512]
for s in pwa_sizes:
    img = draw_sentinel_icon(s)
    img.save(f"public/icon-{s}x{s}.png", "PNG")
    print(f"  public/icon-{s}x{s}.png")

# --- Generate apple-touch-icon ---
apple = draw_sentinel_icon(180)
apple.save("src/app/apple-icon.png", "PNG")
print("  src/app/apple-icon.png")

# --- Generate OG image (1200x630) with logo + text ---
og = Image.new("RGB", (1200, 630), (10, 10, 12))
og_draw = ImageDraw.Draw(og)

# Draw icon centered-left
icon_size = 200
sentinel_icon = draw_sentinel_icon(icon_size)
og.paste(sentinel_icon, (80, (630 - icon_size) // 2))

# Title text
try:
    title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 64)
    sub_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 28)
except (IOError, OSError):
    title_font = ImageFont.load_default()
    sub_font = ImageFont.load_default()

og_draw.text((320, 220), "Sentinel Feed", fill=(255, 255, 255), font=title_font)
og_draw.text(
    (320, 310),
    "AI-curated tech intelligence from 7+ sources",
    fill=(150, 150, 160),
    font=sub_font,
)

og.save("public/og-image.png", "PNG")
print("  public/og-image.png")

print("\nDone.")
