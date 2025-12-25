#!/bin/bash
# Run Screenshot to Slides script

set -e

# Load environment variables
if [ -f ../../.env ]; then
    export $(cat ../../.env | grep -v '^#' | xargs)
fi

echo "📸 Running Screenshot to Slides..."
echo "=================================="

python3 screenshot_to_slides.py

echo ""
echo "✅ Screenshots captured and added to presentation!"
