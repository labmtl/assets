#!/bin/bash
set -e

echo "Building Docker image for Manifest Editor..."
docker build -t manifest-editor tools/editor
echo "Docker build successful!"
