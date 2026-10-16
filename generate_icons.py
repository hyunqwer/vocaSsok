"""Render the code-native VocaSsok icon for browser and home-screen use."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent / "icons"
SCALE = 4


def box(values):
    return tuple(round(v * SCALE) for v in values)


def render(maskable=False):
    canvas = Image.new("RGB", (512 * SCALE, 512 * SCALE), "#246d50")
    card = Image.new("RGBA", canvas.size)
    draw = ImageDraw.Draw(card)
    draw.rounded_rectangle(box((156, 102, 356, 342)), radius=28*SCALE, fill="#f8fbef")
    draw.line([box((213, 164)), box((248, 233)), box((287, 164))], fill="#246d50", width=25*SCALE, joint="curve")
    for x,y in [(213,164),(248,233),(287,164)]:
        draw.ellipse(box((x-12.5,y-12.5,x+12.5,y+12.5)), fill="#246d50")
    card = card.rotate(-9, resample=Image.Resampling.BICUBIC, center=box((256,222)))
    canvas.paste(card, (0,0), card)
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle(box((112,256,400,408)), radius=76*SCALE, fill="#174f3b")
    draw.rectangle(box((112,256,400,332)), fill="#174f3b")
    draw.line([box((130,270)),box((256,327)),box((382,270))], fill="#8dc8a4", width=12*SCALE, joint="curve")
    for x,y in [(130,270),(256,327),(382,270)]:
        draw.ellipse(box((x-6,y-6,x+6,y+6)), fill="#8dc8a4")
    draw.ellipse(box((354,108,404,158)), fill="#f4bd58")
    if maskable:
        # Keep all meaningful artwork inside the central 80% safe circle.
        inset = Image.new("RGB", canvas.size, "#246d50")
        size = round(512*SCALE*.82)
        inset.paste(canvas.resize((size,size),Image.Resampling.LANCZOS), ((canvas.width-size)//2,(canvas.height-size)//2))
        canvas = inset
    return canvas


if __name__ == "__main__":
    ROOT.mkdir(exist_ok=True)
    art = render()
    for size in (32, 180, 192, 512):
        name = "apple-touch-icon.png" if size == 180 else f"icon-{size}.png"
        art.resize((size,size),Image.Resampling.LANCZOS).save(ROOT/name)
    render(True).resize((512,512),Image.Resampling.LANCZOS).save(ROOT/"icon-maskable-512.png")
    art.resize((256,256),Image.Resampling.LANCZOS).save(ROOT/"favicon.ico", sizes=[(16,16),(32,32),(48,48),(64,64),(256,256)])
