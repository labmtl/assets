# Manifest Editor

A premium, local-first management tool for the labmtl media manifest.

## Features
- **Visual Grid**: View all processed media thumbnails.
- **Bulk Labeling**: Select multiple images and add/remove labels in one click.
- **Search**: Filter by name, description, or existing labels.
- **Slideshow Generator**: Generate embed code for dynamic slideshows.
- **Idempotency**: Saves labels back to `manifest.json` for use in other apps.
- **Safety**: Automatically creates timestamped backups of your manifest.

## Getting Started

### Run everything at once
This will start both the Bun backend (port 3000) and the Vite frontend (port 5173).
```bash
cd tools/editor
/Users/rngadam/.bun/bin/bun run all
```

Open your browser to http://localhost:5173.

## Tech Stack
- **Backend**: Bun
- **Frontend**: Vue 3 + Vite + Element Plus
- **Design**: Glassmorphism, Dark Mode, Micro-animations.
