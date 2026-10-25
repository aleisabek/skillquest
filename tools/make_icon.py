"""SkillQuest icon, hacker edition: black CRT tile, code rain, glitched neon >_ prompt."""
import random, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

S = 1024
out = sys.argv[1]
random.seed(7)
GREEN, CYAN, RED = (57, 255, 136), (0, 209, 255), (255, 77, 109)

mask = Image.new("L", (S, S), 0)
ImageDraw.Draw(mask).rounded_rectangle([40, 40, S - 40, S - 40], radius=200, fill=255)

# Dark base with a faint green center glow
base = Image.new("RGBA", (S, S), (3, 8, 6, 255))
glow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
ImageDraw.Draw(glow).ellipse([160, 200, 860, 860], fill=(57, 255, 136, 55))
base = Image.alpha_composite(base, glow.filter(ImageFilter.GaussianBlur(150)))

# Code rain columns
rain = Image.new("RGBA", (S, S), (0, 0, 0, 0))
rd = ImageDraw.Draw(rain)
mono = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 46)
glyphs = "0101<>/{}$#=+;:|[]"
for x in range(70, S - 60, 58):
    head = random.randint(-200, S)
    length = random.randint(4, 12)
    for k in range(length):
        y = head - k * 50
        if 40 < y < S - 80:
            a = int(150 * (1 - k / length)) + (60 if k == 0 else 0)
            rd.text((x, y), random.choice(glyphs), font=mono, fill=(57, 255, 136, min(a, 210)))
base = Image.alpha_composite(base, rain)

# Glitched ">_" prompt: cyan and red offset copies under a glowing green one
big = ImageFont.truetype("C:/Windows/Fonts/consolab.ttf", 440)
def prompt(color, dx=0, dy=0):
    layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(layer).text((150 + dx, 210 + dy), ">_", font=big, fill=color)
    return layer
for col, dx, dy in [(CYAN + (190,), -16, 4), (RED + (170,), 16, -4)]:
    base = Image.alpha_composite(base, prompt(col, dx, dy))
g = prompt(GREEN + (255,))
base = Image.alpha_composite(base, g.filter(ImageFilter.GaussianBlur(28)))
base = Image.alpha_composite(base, g.filter(ImageFilter.GaussianBlur(10)))
base = Image.alpha_composite(base, g)

# A few horizontal glitch slices
for _ in range(3):
    y = random.randint(300, 700); h = random.randint(14, 30); sh = random.choice([-38, -24, 26, 40])
    band = base.crop((0, y, S, y + h))
    base.paste(band, (sh, y))

# Scanlines and a thin neon border
scan = Image.new("RGBA", (S, S), (0, 0, 0, 0))
sd = ImageDraw.Draw(scan)
for y in range(0, S, 8):
    sd.rectangle([0, y, S, y + 2], fill=(0, 0, 0, 70))
base = Image.alpha_composite(base, scan)
border = Image.new("RGBA", (S, S), (0, 0, 0, 0))
ImageDraw.Draw(border).rounded_rectangle([52, 52, S - 52, S - 52], radius=190, outline=GREEN + (230,), width=14)
base = Image.alpha_composite(base, border.filter(ImageFilter.GaussianBlur(12)))
base = Image.alpha_composite(base, border)

icon = Image.new("RGBA", (S, S), (0, 0, 0, 0))
icon.paste(base, (0, 0), mask)
icon.resize((512, 512), Image.LANCZOS).save(out + "/SkillQuest-icon.png")
icon.save(out + "/SkillQuest.ico", sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
icon.resize((64, 64), Image.LANCZOS).save(out + "/fav64.png")
icon.resize((32, 32), Image.LANCZOS).save(out + "/fav32.png")
print("ok")
