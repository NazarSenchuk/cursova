cmake_minimum_required(VERSION 3.16)
project(backend_cpp)

# === Set C++ standard ===
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_BUILD_TYPE Release)

# === Tell CMake to use shared libraries for AWS SDK ===
set(BUILD_SHARED_LIBS ON)

# === Specify AWS SDK installation path ===
set(AWSSDK_ROOT_DIR "/usr/local/")

# === Find AWS SDK (only S3) ===
find_package(AWSSDK REQUIRED COMPONENTS s3)

# === Include directories ===
include_directories(
    ${CMAKE_SOURCE_DIR}/third_party/crow/include
    ${CMAKE_SOURCE_DIR}/third_party/libpqxx/include
)

# === Source files ===
file(GLOB_RECURSE SOURCES ${CMAKE_SOURCE_DIR}/src/*.cpp)

# === Executable ===
add_executable(backend ${SOURCES})

# === Link AWS SDK libraries automatically ===
target_link_libraries(backend ${AWSSDK_LINK_LIBRARIES})

# === Link system libraries ===
target_link_libraries(backend
    -lcurl
    -lssl
    -lcrypto
    -lz
    -ldl
    -lpthread
)

# === Link PostgreSQL libraries ===
target_link_libraries(backend
    pqxx
    pq
)

# === Output directory ===
set_target_properties(backend PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin
)

# === Optional: verbose output for debugging ===
set(CMAKE_VERBOSE_MAKEFILE ON)
