import os
from PIL import Image, ImageDraw, ImageFont

ASSETS_DIR = "/home/team/shared/wurfel/engine/assets/"

def create_gradient(color1, color2, width=1080, height=1920):
    base = Image.new('RGB', (width, height), color1)
    top = Image.new('RGB', (width, height), color2)
    mask = Image.new('L', (width, height))
    mask_data = []
    for y in range(height):
        mask_data.extend([int(255 * (y / height))] * width)
    mask.putdata(mask_data)
    base.paste(top, (0, 0), mask)
    return base

def create_sample_assets():
    os.makedirs(ASSETS_DIR, exist_ok=True)
    
    # 1. Gradient Backgrounds
    g1 = create_gradient((255, 0, 150), (0, 255, 255))
    g1.save(os.path.join(ASSETS_DIR, "bg_gradient_1.png"))
    
    g2 = create_gradient((60, 60, 60), (0, 0, 0))
    g2.save(os.path.join(ASSETS_DIR, "bg_dark.png"))
    
    # 2. Shapes
    circle = Image.new('RGBA', (500, 500), (0, 0, 0, 0))
    draw = ImageDraw.Draw(circle)
    draw.ellipse((50, 50, 450, 450), fill=(255, 255, 0, 255))
    circle.save(os.path.join(ASSETS_DIR, "shape_circle.png"))
    
    square = Image.new('RGBA', (500, 500), (0, 0, 0, 0))
    draw = ImageDraw.Draw(square)
    draw.rectangle((50, 50, 450, 450), fill=(0, 255, 100, 255))
    square.save(os.path.join(ASSETS_DIR, "shape_square.png"))

    # 3. Watermark/Logo
    logo = Image.new('RGBA', (400, 100), (0, 0, 0, 0))
    draw = ImageDraw.Draw(logo)
    # Simple logo with text
    draw.text((10, 10), "HyperForge", fill=(255, 255, 255, 200))
    logo.save(os.path.join(ASSETS_DIR, "hyperforge_logo.png"))
    logo.save(os.path.join(ASSETS_DIR, "watermark.png"))

if __name__ == "__main__":
    create_sample_assets()
    print("Sample assets created in", ASSETS_DIR)
