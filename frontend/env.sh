#!/bin/sh
set -e

# Template file and output
TEMPLATE_FILE="/app/public/env-config.js"
OUTPUT_FILE="/app/dist/env-config.js"
INDEX_FILE="/app/dist/index.html"

if [ -f "$TEMPLATE_FILE" ]; then
  # Create output directory if it doesn't exist
  mkdir -p /app/dist
  
  # Replace placeholders in env-config.js with environment variables or defaults
  sed \
    -e "s|{{VITE_API_URL}}|${VITE_API_URL:-http://localhost:8080}|g" \
    -e "s|{{VITE_ACCESS_KEY}}|${VITE_ACCESS_KEY:-}|g" \
    -e "s|{{VITE_SECRET_KEY}}|${VITE_SECRET_KEY:-}|g" \
    -e "s|{{VITE_R2_ENDPOINT}}|${VITE_R2_ENDPOINT:-https://086cf4cab6f623952bd0831a164dc89b.r2.cloudflarestorage.com}|g" \
    -e "s|{{VITE_R2_REGION}}|${VITE_R2_REGION:-auto}|g" \
    "$TEMPLATE_FILE" > "$OUTPUT_FILE"
  
  echo "Environment configuration generated successfully"
  
  # Add env-config.js script to index.html if not already present
  if [ -f "$INDEX_FILE" ] && ! grep -q "env-config.js" "$INDEX_FILE"; then
    echo "Adding env-config.js to index.html"
    sed -i 's|</head>|  <script src="/env-config.js"></script>\n</head>|' "$INDEX_FILE"
  fi
fi

# Start the server
exec serve -s dist -l 3000