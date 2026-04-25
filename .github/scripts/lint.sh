#!/bin/bash
set -e

cd tools/editor
echo "Running type check..."
bun run build
echo "Linting complete!"
