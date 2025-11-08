# ========================
# Stage 1: build
# ========================
FROM ubuntu:22.04 AS builder

WORKDIR /workspace
ENV DEBIAN_FRONTEND=noninteractive

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    libssl-dev \
    libpqxx-dev \
    libcurl4-openssl-dev \
    unzip \
    wget \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# AWS SDK C++ (S3 only)
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

# Copy project and build
COPY . /workspace/backend-cpp
WORKDIR /workspace/backend-cpp
RUN mkdir -p build && cd build \
    && cmake .. \
    && make -j$(nproc)

# ========================
# Stage 2: production runtime
# ========================
FROM ubuntu:22.04

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    libssl-dev \
    libpqxx-dev \
    libcurl4-openssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy AWS SDK libs and built backend
COPY --from=builder /usr/local/lib /usr/local/lib
COPY --from=builder /usr/local/include /usr/local/include
COPY --from=builder /workspace/backend-cpp/build/bin/backend /app/backend

# Expose port
EXPOSE 8080

# Run backend
CMD ["./backend"]
