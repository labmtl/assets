#!/bin/bash
set -e

echo "Starting integration tests..."

# Ensure we have a manifest file to serve
mkdir -p processed_media
if [ ! -f processed_media/manifest.json ]; then
    echo "[]" > processed_media/manifest.json
fi

# Run the docker container in background
CONTAINER_ID=$(docker run -d -p 3001:3000 -e ASSETS_ROOT=/app -v $(pwd)/processed_media:/app/processed_media manifest-editor)

# Wait for it to start
echo "Waiting for server to start..."
MAX_RETRIES=10
COUNT=0
until $(curl --output /dev/null --silent --head --fail http://localhost:3001/api/manifest); do
    if [ $COUNT -eq $MAX_RETRIES ]; then
        echo "Server failed to start in time."
        docker kill $CONTAINER_ID
        exit 1
    fi
    echo "Retrying..."
    sleep 2
    COUNT=$((COUNT+1))
done

echo "Server is up! Checking manifest response..."
curl -s http://localhost:3001/api/manifest | grep -q "\[" || (echo "Invalid manifest response"; docker kill $CONTAINER_ID; exit 1)

echo "Integration tests passed!"

# Cleanup
docker kill $CONTAINER_ID
