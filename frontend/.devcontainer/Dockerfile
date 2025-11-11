# Use official Node.js LTS image
FROM node:22-bullseye

# Set working directory
WORKDIR /workspace
COPY . .
# Install any extra tools (optional)
RUN apt-get update && apt-get install -y \
    git \
    curl \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Expose default React development port
EXPOSE 3000

# Default command
CMD [ "bash" ]
