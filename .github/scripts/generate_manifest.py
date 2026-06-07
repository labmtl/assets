import json
from pathlib import Path
import sys

def main():
    flag_dir = Path("processed_flags")
    description_dir = Path("processed_media/descriptions")
    manifest_path = Path("processed_media/manifest.json")
    
    if not flag_dir.exists():
        print("Flag directory not found. Skipping manifest generation.")
        return

    existing_assets = {}
    if manifest_path.exists():
        try:
            with open(manifest_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                for asset in data:
                    existing_assets[asset["id"]] = asset
        except Exception as e:
            print(f"Warning: could not read existing manifest: {e}")

    assets = []
    
    # Iterate over all flags (each flag corresponds to an original upload hash)
    for flag_file in flag_dir.glob("*"):
        if flag_file.name == ".gitkeep":
            continue
            
        with open(flag_file, "r", encoding="utf-8") as f:
            lines = [l.strip() for l in f if l.strip()]
            
        base_name = None
        steps = []
        for line in lines:
            if line.startswith("base_name:"):
                base_name = line.replace("base_name:", "", 1)
            else:
                steps.append(line)
        
        if not base_name:
            continue
            
        # Get description
        desc_path = description_dir / f"{base_name}.md"
        description = desc_path.read_text(encoding="utf-8") if desc_path.exists() else ""
        
        existing_asset = existing_assets.get(flag_file.name, {})

        asset = {
            "id": flag_file.name, # The original MD5 hash
            "base_name": existing_asset.get("base_name", base_name),
            "description": existing_asset.get("description", description),
            "labels": existing_asset.get("labels", []),
            "steps": steps,
            "formats": {
                "images": [],
                "videos": [],
                "html": f"processed_media/html/{base_name}.html"
            }
        }
        
        # Check available images
        for ext in ["jpg", "webp"]:
            for w in [1920, 1280, 640]:
                img_path = Path(f"processed_media/images/{base_name}-{w}w.{ext}")
                if img_path.exists():
                    asset["formats"]["images"].append({
                        "width": w,
                        "format": ext,
                        "path": str(img_path)
                    })
        
        # Check available videos
        for ext in ["mp4", "webm"]:
            for h in [1080, 720]:
                vid_path = Path(f"processed_media/videos/{base_name}-{h}p.{ext}")
                if vid_path.exists():
                    asset["formats"]["videos"].append({
                        "height": h,
                        "format": ext,
                        "path": str(vid_path)
                    })
        
        assets.append(asset)
    
    # Sort assets by base_name (handling cases where base_name might be a dict)
    def get_sort_key(x):
        bn = x["base_name"]
        if isinstance(bn, dict):
            return str(bn.get("en", bn.get("fr", "")))
        return str(bn)

    assets.sort(key=get_sort_key)
    
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(assets, f, indent=2, ensure_ascii=False)
        
    print(f"Manifest generated with {len(assets)} assets at {manifest_path}")

    # Generate root index.html
    generate_index_html(assets)

def generate_index_html(assets):
    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LabMTL Assets</title>
    <style>
        body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1, h2 { color: #333; }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
        ul { list-style-type: none; padding: 0; }
        li { margin-bottom: 10px; padding: 10px; background: #f4f4f4; border-radius: 5px; }
        .editor-link { display: inline-block; margin-bottom: 20px; padding: 10px 15px; background: #0066cc; color: white; border-radius: 5px; font-weight: bold; }
        .editor-link:hover { background: #0052a3; text-decoration: none; }
    </style>
</head>
<body>
    <h1>LabMTL Media Assets</h1>

    <a href="editor/index.html" class="editor-link">Open Manifest Editor</a>

    <h2>Processed HTML Snippets</h2>
    <ul>
"""
    for asset in assets:
        html_path = asset.get("formats", {}).get("html")
        if html_path:
            title = asset.get("title", {})
            title_text = title.get("en", title.get("fr", asset.get("base_name", "Unknown")))
            if isinstance(title_text, dict):
                title_text = title_text.get("en", title_text.get("fr", asset.get("base_name", "Unknown")))
            html_content += f'        <li><a href="{html_path}">{title_text}</a> ({html_path})</li>\n'

    html_content += """    </ul>
</body>
</html>"""

    with open("index.html", "w", encoding="utf-8") as f:
        f.write(html_content)
    print("Generated root index.html")

if __name__ == "__main__":
    main()
