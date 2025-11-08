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
    zlib1g-dev \
    libasio-dev \
    && rm -rf /var/lib/apt/lists/*

# Build AWS SDK (only S3)
RUN git clone --recurse-submodules https://github.com/aws/aws-sdk-cpp.git /workspace/aws-sdk-cpp && \
    cd /workspace/aws-sdk-cpp && mkdir build && cd build && \
    cmake .. -DBUILD_ONLY="s3" -DBUILD_SHARED_LIBS=ON -DCMAKE_INSTALL_PREFIX=/usr/local -DBUILD_TESTING=OFF && \
    make -j$(nproc) && make install

# Build your backend
COPY . /workspace/backend-cpp
WORKDIR /workspace/backend-cpp
RUN cmake -S . -B build && cmake --build build -j$(nproc)

# ========================
# Stage 2: runtime
# ========================
FROM ubuntu:22.04
WORKDIR /app

# Install only required runtime libs
RUN apt-get update && apt-get install -y \
    libssl3 \
    libpqxx-dev \
    libcurl4-openssl-dev \
    zlib1g \
    && rm -rf /var/lib/apt/lists/* \
    && ldconfig

# Copy built binaries
COPY --from=builder /usr/local/lib /usr/local/lib
COPY --from=builder /workspace/backend-cpp/build/bin/backend /app/backend

EXPOSE 8080
CMD ["./backend"]
