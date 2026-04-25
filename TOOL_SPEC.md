# Manifest Editor Tool Specification

## Overview
A local-first, browser-based management tool for the media pipeline's `manifest.json`. This application enables rapid labeling of processed media, both individually and in bulk, and facilitates the generation of dynamic slideshow components for external websites.

## Tech Stack
* **Runtime & Backend:** Bun (Latest LTS)
* **Frontend Framework:** Vite + Vue 3 (Composition API)
* **UI Components:** Element Plus (Heavily customized for premium aesthetics)
* **Styling:** Vanilla CSS with modern features (CSS Variables, Flexbox/Grid, Backdrop Filters)
* **Design Pattern:** Local-first, editing files directly in the `labmtl/assets` repository.

## Design Aesthetics (The "WOW" Factor)
The application will feature a state-of-the-art, premium interface:
*   **Color Palette:**
    *   **Background:** Deep Navy/Slate (`#020617`)
    *   **Surface:** Translucent Zinc (`rgba(24, 24, 27, 0.6)`)
    *   **Accent:** Electric Cyan (`#06b6d4`) and Vibrant Purple (`#8b5cf6`)
*   **Visual Effects:**
    *   **Glassmorphism:** Navigation and action bars use `backdrop-filter: blur(16px)` and a subtle `1px` white border at `0.1` opacity.
    *   **Glow:** Active tags and selected images have a soft outer glow in the accent color.
*   **Micro-animations:**
    *   **Thumbnail Hover:** Smooth scale-up (`1.05`) with a 0.3s ease-out transition.
    *   **Selection:** Checkmarks appear with a subtle "pop" animation.
    *   **Filtering:** Grid items rearrange using Vue's `<TransitionGroup>` for a fluid experience.

## Key Features

### 1. Media Gallery & Selection
*   **Fluid Grid:** A responsive grid showing thumbnails.
*   **Smart Loading:** Uses the `640w.webp` format for previews to ensure instant loading of hundreds of items.
*   **Advanced Selection:**
    *   Click-and-drag or individual checkbox selection.
    *   "Select All", "Deselect All", and "Invert Selection" actions.
    *   Search-based selection: "Select all matching current search".
*   **Global Search:** Real-time filtering by `base_name`, `description`, or existing `labels`.

### 2. Label Management
*   **Individual Edit:** Click an image to open a side drawer with full metadata and a tag-based label editor.
*   **Bulk Edit:** A floating action bar appears when multiple items are selected.
    *   **Add Labels:** Apply tags to all selected images without overwriting existing ones.
    *   **Set Labels:** Overwrite all labels for selected images.
    *   **Remove Labels:** Select specific tags to strip from the selection.
*   **Smart Suggestions:** Autocomplete based on all unique labels found in the current manifest.

### 3. Slideshow Generator
*   **Configuration UI:** Select a label (e.g., `highlight`, `hero`) and configure parameters (autoplay speed, transition style).
*   **Live Preview:** A small interactive preview of the slideshow within the editor.
*   **Code Output:** Generates a copy-pasteable HTML snippet and a link to the standalone `slideshow.js`.
*   **Distribution:** The `slideshow.js` runtime script will be generated and saved in `processed_media/` alongside the `manifest.json`.

### 4. File I/O & Loading
*   **Initial Load:** Automatically attempts to read `manifest.json` from the root directory.
*   **Manual Load:** Ability to provide a custom local path or re-scan the directory for other `.json` manifests.
*   **Save System:** Explicit "Save Changes" button with visual feedback and "Auto-save" option.
*   **Safety:** Creates a timestamped backup (e.g., `manifest.2024-04-25T10:26:08.json.bak`) before overwriting.

## Data Structure Modification
The tool will add/modify a `labels` key at the root of each media object:
```json
{
  "id": "...",
  "base_name": "...",
  "labels": ["web-screenshot", "featured", "project-x"],
  "formats": { ... }
}
```

## Implementation Plan

### Phase 1: Foundation
1.  Initialize Vite + Vue 3 project in `assets/tools/editor`.
2.  Set up Bun backend in `assets/tools/editor/server.ts`.
3.  Configure Bun to serve the `processed_media/` directory as static assets.
4.  Implement `GET /api/manifest` and basic error handling.

### Phase 2: Core UI & Selection
1.  Implement the Gallery grid using CSS Grid and optimized images.
2.  Build the selection store (Pinia) to track selected IDs.
3.  Create the floating "Bulk Actions" bar with glassmorphic styling.

### Phase 3: Labeling & Metadata
1.  Build the Side Drawer for individual image inspection.
2.  Implement the Tag Input component with autocomplete.
3.  Implement the `POST /api/manifest` save logic with timestamped backups.

### Phase 4: Slideshow Generator & Polish
1.  Create the Slideshow configuration panel and code generator.
2.  Develop the `slideshow.js` widget and save logic.
3.  Apply design tokens, glow effects, and transitions.
4.  Final local testing and performance optimization.

---

## Configuration Decisions (Confirmed)
1.  **Slideshow Widget**: Saved in `processed_media/` next to `manifest.json`.
2.  **Backups**: Use timestamped `.json.bak` files.
3.  **Deployment**: Local use for now (future deployment ready).
