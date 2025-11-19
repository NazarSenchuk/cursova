#!/bin/sh
set -e

# Template file and output
TEMPLATE_FILE="/app/public/env-config.js"
OUTPUT_FILE="/app/dist/env-config.js"
INDEX_FILE="/app/dist/index.html"

if [ -f "$TEMPLATE_FILE" ]; then
  # Create output directory if it doesn't exist
  mkdir -p /app/dist
  
  # Replace placeholders in env-config.js
  sed \
    -e "s|{{VITE_API_URL}}|${VITE_API_URL:-https://default-api.example.com}|g" \
    "$TEMPLATE_FILE" > "$OUTPUT_FILE"
  
  # Add env-config.js script to index.html if not already present
  if ! grep -q "env-config.js" "$INDEX_FILE"; then
    echo "Adding env-config.js to index.html"
    sed -i 's|</body>|  <script src="/env-config.js"></script>\n</body>|' "$INDEX_FILE"
  fi
fi

# Start the server
exec serve -s dist -l 3000