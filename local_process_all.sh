#!/usr/bin/env bash

# local_process_all.sh - Process all files in uploads/ locally

# Ensure we have the API token
if [ -z "$OVH_AI_TOKEN" ]; then
    echo "Error: OVH_AI_TOKEN is not set. Please load your environment (direnv/nix develop) or export it."
    exit 1
fi

# Get repository name (for HTML snippets)
# Try to get it from git, fallback to labmtl/assets
REPO_NAME=$(git remote get-url origin 2>/dev/null | sed -E 's/.*github.com[:\/](.*)\.git/\1/')
if [ -z "$REPO_NAME" ]; then
    REPO_NAME="labmtl/assets"
fi

echo "Using Repository: $REPO_NAME"
echo "Starting local processing for all files in uploads/..."

# Use md5sum if available, fallback to md5 -q on macOS
get_md5() {
    if command -v md5sum >/dev/null 2>&1; then
        md5sum "$1" | awk '{ print $1 }'
    else
        md5 -q "$1"
    fi
}

find uploads -type f | while read file; do
    # Skip .gitkeep
    if [[ "$file" == *"/.gitkeep" ]]; then continue; fi
    
    echo "--------------------------------------------------"
    echo "Processing: $file"
    file_hash=$(get_md5 "$file")
    
    python .github/scripts/process_file.py \
      --input-file "$file" \
      --file-hash "$file_hash" \
      --api-token "$OVH_AI_TOKEN" \
      --github-repository "$REPO_NAME" \
      --github-ref-for-raw-url "main"
done

echo "--------------------------------------------------"
echo "Generating manifest..."
python .github/scripts/generate_manifest.py

echo "Done! Check processed_media/ for outputs."
