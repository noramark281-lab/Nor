cmake_minimum_required(VERSION 3.14)
project(runner LANGUAGES CXX)

set(BINARY_NAME "Nor")
set(CMAKE_INSTALL_PREFIX "${CMAKE_BINARY_DIR}/install" CACHE PATH "" FORCE)

add_executable(${BINARY_NAME} WIN32 "runner/main.cpp")
target_compile_features(${BINARY_NAME} PRIVATE cxx_std_17)

install(TARGETS ${BINARY_NAME} RUNTIME DESTINATION .)
