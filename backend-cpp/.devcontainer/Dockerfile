# ========================
# Dev container base
# ========================
FROM ubuntu:22.04

# ========================
# Environment
# ========================
ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /workspace

# ========================
# Install dev dependencies
# ========================
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    libssl-dev \
    libpqxx-dev \
    libcurl4-openssl-dev \
    zlib1g-dev \
    libasio-dev \
    && rm -rf /var/lib/apt/lists/*

# Build AWS SDK (only S3)
RUN git clone --recurse-submodules https://github.com/aws/aws-sdk-cpp.git /workspace/aws-sdk-cpp && \
    cd /workspace/aws-sdk-cpp && mkdir build && cd build && \
    cmake .. -DBUILD_ONLY="s3" -DBUILD_SHARED_LIBS=ON -DCMAKE_INSTALL_PREFIX=/usr/local -DBUILD_TESTING=OFF && \
    make -j$(nproc) && make install

# Build Crow
RUN git clone https://github.com/CrowCpp/Crow.git /workspace/crow && \
    cd /workspace/crow && \
    mkdir build && cd build && \
    cmake .. -DCROW_BUILD_EXAMPLES=OFF -DCROW_BUILD_TESTS=OFF && \
    make install

# ========================
# Create vscode user


# ========================
# Copy project and set permissions
# ========================
COPY . /workspace/backend-cpp


# Switch to vscode user
USER vscode

WORKDIR /workspace/backend-cpp

EXPOSE 8080

# ========================
# Default command for dev
# ========================
CMD ["/bin/bash"]