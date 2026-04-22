# LabMTL Assets

Automated media asset management repository for LabMTL.

## How it works

1.  **Upload**: Add your raw images or videos to the `uploads/` directory.
2.  **Automated Processing**: A GitHub Action is triggered on every push to `uploads/`.
    *   **IA Description**: Gemini 1.5 Flash generates a concise filename and a detailed description/alt-text.
    *   **Image Conversion**: Images are resized to multiple widths (1920, 1280, 640) and converted to JPG and WebP.
    *   **Video Conversion**: Videos are transcoded to 1080p and 720p in MP4 and WebM formats.
    *   **HTML Snippets**: Responsive HTML snippets are generated for easy embedding.
    *   **Manifest**: A `processed_media/manifest.json` is automatically updated to list all available assets.
3.  **Commit**: The processed assets and metadata are committed back to the repository.

## Structure

- `uploads/`: Raw files to be processed.
- `processed_media/`: Transformed assets and metadata.
    - `images/`: Resized images (JPG, WebP).
    - `videos/`: Transcoded videos (MP4, WebM).
    - `descriptions/`: Detailed AI-generated descriptions (.md).
    - `html/`: Responsive HTML snippets.
    - `manifest.json`: Central index of all processed assets.
- `processed_flags/`: Tracking files to avoid re-processing existing assets.

## Usage in Frontend

You can fetch `processed_media/manifest.json` to get a list of all available assets and their metadata.

```javascript
// Example usage
const manifest = await fetch('https://raw.githubusercontent.com/labmtl/assets/main/processed_media/manifest.json').then(r => r.json());
```
