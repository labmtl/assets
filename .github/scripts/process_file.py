import argparse
import os
import sys
import hashlib
import subprocess
import re
from pathlib import Path
import html

# Define constants for output directories and flag file location
BASE_OUTPUT_DIR = Path("processed_media")
DESCRIPTION_DIR = BASE_OUTPUT_DIR / "descriptions"
IMAGE_DIR = BASE_OUTPUT_DIR / "images"
VIDEO_DIR = BASE_OUTPUT_DIR / "videos"
HTML_DIR = BASE_OUTPUT_DIR / "html"
FLAG_DIR = Path("processed_flags")

# Define processing step keywords
STEP_GEMINI_DESCRIPTION = "gemini_description"
STEP_IMAGE_CONVERSION = "image_conversion"
STEP_HTML_GENERATION = "html_generation"
STEP_VIDEO_CONVERSION = "video_conversion"
BASE_NAME_FLAG_PREFIX = "base_name:"

# Ensure output directories exist (idempotent)
for d in [DESCRIPTION_DIR, IMAGE_DIR, VIDEO_DIR, HTML_DIR, FLAG_DIR]:
    d.mkdir(parents=True, exist_ok=True)

def log_message(message, level="INFO"):
    print(f"[{level}] {message}", file=sys.stderr if level == "ERROR" else sys.stdout)

def read_flag_file(flag_path: Path) -> tuple[set[str], str | None]:
    processed_steps = set()
    base_name = None
    if flag_path.exists():
        with open(flag_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith(BASE_NAME_FLAG_PREFIX):
                    base_name = line.replace(BASE_NAME_FLAG_PREFIX, "", 1)
                elif line:
                    processed_steps.add(line)
    return processed_steps, base_name

def record_step_in_flag_file(flag_path: Path, step_keyword: str):
    if flag_path.exists():
        with open(flag_path, "r+", encoding="utf-8") as f:
            existing_steps = {line.strip() for line in f}
            if step_keyword not in existing_steps:
                f.seek(0, os.SEEK_END)
                if f.tell() > 0:
                    f.seek(f.tell() - 1, os.SEEK_SET)
                    if f.read(1) != '\n':
                        f.write('\n')
                f.write(f"{step_keyword}\n")
    else:
        with open(flag_path, "w", encoding="utf-8") as f:
            f.write(f"{step_keyword}\n")

def record_base_name_in_flag_file(flag_path: Path, base_name: str):
    base_name_line = f"{BASE_NAME_FLAG_PREFIX}{base_name}"
    lines = []
    found = False
    if flag_path.exists():
        with open(flag_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        with open(flag_path, "w", encoding="utf-8") as f:
            for line in lines:
                if line.strip().startswith(BASE_NAME_FLAG_PREFIX):
                    f.write(f"{base_name_line}\n")
                    found = True
                else:
                    f.write(line)
            if not found:
                if lines and not lines[-1].endswith('\n'):
                    f.write('\n')
                f.write(f"{base_name_line}\n")
    else:
        with open(flag_path, "w", encoding="utf-8") as f:
            f.write(f"{base_name_line}\n")

def main():
    parser = argparse.ArgumentParser(description="Process a single media file.")
    parser.add_argument("--input-file", required=True)
    parser.add_argument("--file-hash", required=True)
    parser.add_argument("--gemini-api-key", required=True)
    parser.add_argument("--github-repository", required=True)
    parser.add_argument("--github-ref-for-raw-url", required=True)
    args = parser.parse_args()

    log_message(f"Processing: {args.input_file}")
    flag_file_path = FLAG_DIR / args.file_hash
    processed_steps, current_base_name = read_flag_file(flag_file_path)

    # ---- Gemini Description ----
    if STEP_GEMINI_DESCRIPTION not in processed_steps:
        gemini_script = Path(__file__).parent / "get_gemini_description.py"
        cmd = [sys.executable, str(gemini_script), args.gemini_api_key, args.input_file, str(DESCRIPTION_DIR)]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            current_base_name = result.stdout.strip()
            if current_base_name and "error-" not in current_base_name.lower():
                record_step_in_flag_file(flag_file_path, STEP_GEMINI_DESCRIPTION)
                record_base_name_in_flag_file(flag_file_path, current_base_name)
                processed_steps.add(STEP_GEMINI_DESCRIPTION)
        else:
            log_message(f"Gemini failed: {result.stderr}", "ERROR")

    if not current_base_name:
        current_base_name = f"media-{args.file_hash[:8]}"

    # ---- Type Detection ----
    ext = Path(args.input_file).suffix.lower()
    is_image = ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    is_video = ext in ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv']

    if is_image and STEP_IMAGE_CONVERSION not in processed_steps:
        widths = [1920, 1280, 640]
        ok = True
        for w in widths:
            try:
                # JPG & WebP
                for fmt in ['jpg', 'webp']:
                    out = IMAGE_DIR / f"{current_base_name}-{w}w.{fmt}"
                    subprocess.run(["convert", args.input_file, "-resize", f"{w}x>", "-quality", "85" if fmt=='jpg' else "80", str(out)], check=True)
                    subprocess.run(["exiftool", "-tagsFromFile", args.input_file, "-all:all", "-overwrite_original", str(out)], check=False)
                log_message(f"Converted to {w}w")
            except Exception as e:
                log_message(f"Image conversion error: {e}", "ERROR")
                ok = False
        if ok:
            record_step_in_flag_file(flag_file_path, STEP_IMAGE_CONVERSION)
            processed_steps.add(STEP_IMAGE_CONVERSION)

    if is_image and STEP_HTML_GENERATION not in processed_steps:
        raw_url = f"https://raw.githubusercontent.com/{args.github_repository}/{args.github_ref_for_raw_url}/"
        desc_file = DESCRIPTION_DIR / f"{current_base_name}.md"
        alt_text = desc_file.read_text(encoding="utf-8") if desc_file.exists() else ""
        
        template_path = Path(__file__).parent / "templates" / "media_template.html"
        if template_path.exists():
            template = template_path.read_text(encoding="utf-8")
            widths = [1920, 1280, 640]
            webp_ss = ", ".join([f"{raw_url}processed_media/images/{current_base_name}-{w}w.webp {w}w" for w in widths])
            jpeg_ss = ", ".join([f"{raw_url}processed_media/images/{current_base_name}-{w}w.jpg {w}w" for w in widths])
            
            html_out = template.replace("{{TITLE}}", current_base_name)\
                               .replace("{{BASE_NAME}}", current_base_name)\
                               .replace("{{WEBP_SRCSET}}", webp_ss)\
                               .replace("{{JPEG_SRCSET}}", jpeg_ss)\
                               .replace("{{FALLBACK_IMG_SRC}}", f"{raw_url}processed_media/images/{current_base_name}-640w.jpg")\
                               .replace("{{ALT_TEXT}}", html.escape(alt_text))
            (HTML_DIR / f"{current_base_name}.html").write_text(html_out, encoding="utf-8")
            record_step_in_flag_file(flag_file_path, STEP_HTML_GENERATION)

    if is_video and STEP_VIDEO_CONVERSION not in processed_steps:
        heights = [1080, 720]
        ok = True
        for h in heights:
            try:
                # MP4
                mp4 = VIDEO_DIR / f"{current_base_name}-{h}p.mp4"
                subprocess.run(["ffmpeg", "-i", args.input_file, "-vf", f"scale=-2:min(ih\\,{h})", "-c:v", "libx264", "-preset", "medium", "-crf", "23", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", str(mp4), "-y"], check=True)
                # WebM
                webm = VIDEO_DIR / f"{current_base_name}-{h}p.webm"
                subprocess.run(["ffmpeg", "-i", args.input_file, "-vf", f"scale=-2:min(ih\\,{h})", "-c:v", "libvpx-vp9", "-crf", "30", "-b:v", "0", "-c:a", "libopus", "-b:a", "128k", str(webm), "-y"], check=True)
                log_message(f"Transcoded to {h}p")
            except Exception as e:
                log_message(f"Video conversion error: {e}", "ERROR")
                ok = False
        if ok:
            record_step_in_flag_file(flag_file_path, STEP_VIDEO_CONVERSION)

if __name__ == "__main__":
    main()
