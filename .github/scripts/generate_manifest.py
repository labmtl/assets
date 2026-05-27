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

if __name__ == "__main__":
    main()
