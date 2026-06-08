import sys
import os

# Add the engine directory to path to import local modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from hyperframe import render_frame
from templates import TEMPLATES

THUMBNAILS_DIR = "/home/team/shared/wurfel/engine/assets/thumbnails/"

def generate_thumbnails():
    os.makedirs(THUMBNAILS_DIR, exist_ok=True)
    
    for template_id, template in TEMPLATES.items():
        print(f"Generating thumbnail for {template_id}...")
        
        # Use the first frame of the template for the thumbnail
        if template.default_frames:
            hf = template.default_frames[0]
            # Render the middle state of the first hyperframe
            state = hf.start # Simple choice
            
            # If it's a text template, add some dummy text
            text = "PREVIEW" if template.category == "text" else None
            
            img = render_frame(
                state, 
                width=480, height=854, # Smaller size for thumbnails
                effect=hf.effect,
                text=text
            )
            
            img.save(os.path.join(THUMBNAILS_DIR, f"{template_id}.png"))
            
    print("Thumbnails generated in", THUMBNAILS_DIR)

if __name__ == "__main__":
    generate_thumbnails()
