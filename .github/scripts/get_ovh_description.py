import argparse
import os
import base64
import requests
import sys
import subprocess
from pathlib import Path

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def extract_frames(video_path, num_frames=8):
    """Extracts a sequence of frames from a video using ffmpeg."""
    temp_dir = Path("temp_frames")
    temp_dir.mkdir(exist_ok=True)
    
    # Remove old frames
    for f in temp_dir.glob("*.jpg"):
        f.unlink()

    # Get duration
    cmd_duration = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", video_path]
    try:
        duration = float(subprocess.check_output(cmd_duration).decode().strip())
    except Exception as e:
        print(f"Error getting duration: {e}", file=sys.stderr)
        return []

    # Extract frames at regular intervals
    frames = []
    for i in range(num_frames):
        timestamp = (duration / (num_frames + 1)) * (i + 1)
        frame_path = temp_dir / f"frame_{i}.jpg"
        cmd = [
            "ffmpeg", "-ss", str(timestamp), "-i", video_path,
            "-frames:v", "1", "-q:v", "2", str(frame_path), "-y"
        ]
        subprocess.run(cmd, capture_output=True)
        if frame_path.exists():
            frames.append(str(frame_path))
    
    return frames

def get_ovh_description(token, file_path, output_dir, model="Qwen2.5-VL-72B-Instruct"):
    # Correct API endpoint for OVHcloud AI Endpoints
    endpoint = f"https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    file_path_obj = Path(file_path)
    ext = file_path_obj.suffix.lower()
    is_image = ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    is_video = ext in ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv']

    content = []
    if is_image:
        base64_image = encode_image(file_path)
        content.append({"type": "text", "text": "Describe this image in detail and provide a concise filename."})
        content.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
        })
    elif is_video:
        frame_paths = extract_frames(file_path)
        content.append({"type": "text", "text": "Here is a sequence of frames from a video. Describe the video in detail and provide a concise filename."})
        for f in frame_paths:
            base64_frame = encode_image(f)
            content.append({
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{base64_frame}"}
            })
    else:
        return "error-unsupported-type"

    payload = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": content
            }
        ],
        "max_tokens": 500
    }

    try:
        response = requests.post(endpoint, headers=headers, json=payload)
        if response.status_code != 200:
            print(f"\n--- OVH API ERROR ---", file=sys.stderr)
            print(f"Status: {response.status_code}", file=sys.stderr)
            print(f"Body: {response.text[:1000]}", file=sys.stderr)
            print(f"----------------------\n", file=sys.stderr)
        response.raise_for_status()
        
        try:
            data = response.json()
        except Exception as json_err:
            print(f"Failed to parse JSON response. Status: {response.status_code}", file=sys.stderr)
            print(f"Response text: {response.text[:1000]}", file=sys.stderr)
            raise json_err

        full_text = data['choices'][0]['message']['content']

        # Extract filename (heuristically if model doesn't follow instructions perfectly)
        # We ask for a concise filename in the prompt.
        # Let's try to split the response into a filename and description.
        
        # Improvement: Ask for a specific format in prompt
        # Actually, let's just use the first line as filename if it's short, or generic.
        
        lines = full_text.strip().split('\n')
        concise_filename = "generic-media"
        
        # Heuristic 1: Look for a line starting with "Filename:"
        for line in lines:
            clean_line = line.strip()
            if clean_line.lower().startswith("filename:"):
                potential_name = clean_line.split(":", 1)[1].strip()
                potential_name = Path(potential_name).stem # Remove extension if any
                concise_filename = re.sub(r'[^a-z0-9\-]', '', potential_name.lower().replace(' ', '-').replace('_', '-')).strip('-')
                break
        
        # Heuristic 2: Fallback to first line if still generic
        if concise_filename == "generic-media":
            first_line = lines[0].strip()
            if 5 < len(first_line) < 100:
                concise_filename = re.sub(r'[^a-z0-9\-]', '', first_line.lower().replace(' ', '-').replace('_', '-')).strip('-')
        
        # Final safety check
        if not concise_filename or len(concise_filename) < 3:
            concise_filename = f"media-{args.file_hash[:8]}" if 'args' in locals() and hasattr(args, 'file_hash') else "generic-media"

        md_filename = os.path.join(output_dir, f"{concise_filename}.md")
        os.makedirs(os.path.dirname(md_filename), exist_ok=True)
        with open(md_filename, "w", encoding="utf-8") as f:
            f.write(full_text)
            
        return concise_filename

    except Exception as e:
        print(f"Error calling OVHcloud AI Endpoints: {e}", file=sys.stderr)
        return f"error-ovh-failed"

import re
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Get media description from OVHcloud AI Endpoints.")
    parser.add_argument("token", help="OVHcloud AI Token")
    parser.add_argument("file_path", help="Path to the media file")
    parser.add_argument("output_dir", help="Directory to save the .md file")
    parser.add_argument("--model", default="qwen2.5-vl-72b-instruct", help="Model to use")
    args = parser.parse_args()

    concise_name = get_ovh_description(args.token, args.file_path, args.output_dir, args.model)
    print(concise_name)
