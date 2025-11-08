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
    curl \
    libssl-dev \
    libpqxx-dev \
    libcurl4-openssl-dev \
    unzip \
    wget \
    pkg-config \
    sudo \
    gdb \
    vim \
    && rm -rf /var/lib/apt/lists/*

# ========================
# Install AWS SDK C++ (S3 only)
# ========================
RUN git clone --recurse-submodules https://github.com/aws/aws-sdk-cpp.git /workspace/aws-sdk-cpp \
    && mkdir -p /workspace/aws-sdk-cpp/build \
    && cd /workspace/aws-sdk-cpp/build \
    && cmake .. \
        -DBUILD_ONLY="s3" \
        -DBUILD_SHARED_LIBS=ON \
        -DCMAKE_INSTALL_PREFIX=/usr/local \
        -DLEGACY_BUILD=ON \
        -DBUILD_TESTING=OFF \
    && make -j$(nproc) \
    && make install

# ========================
# Copy project
# ========================
COPY . /workspace/backend-cpp
WORKDIR /workspace/backend-cpp

# ========================
# Build project
# ========================
RUN mkdir -p build && cd build \
    && cmake .. \
    && make -j$(nproc)

# ========================
# Expose ports if needed (example: 8080)
# ========================
EXPOSE 8080

# ========================
# Default command for dev
# ========================
CMD ["/bin/bash"]
