cmake_minimum_required(VERSION 3.14)
project(Nor LANGUAGES CXX)

set(BINARY_NAME "Nor")

cmake_policy(SET CMP0063 NEW)

set(CMAKE_INSTALL_RPATH "$ORIGIN/lib")

# Root filesystem for install targets.
set(FLUTTER_INSTALL_PREFIX "")

set(INSTALL_BUNDLE_DATA_DIR "${FLUTTER_INSTALL_PREFIX}data")
set(INSTALL_BUNDLE_LIB_DIR "${FLUTTER_INSTALL_PREFIX}")

set(FLUTTER_TARGET_PLATFORM "windows-x64")

# Set build types
get_property(is_multiconfig GLOBAL PROPERTY GENERATOR_IS_MULTI_CONFIG)
if(is_multiconfig)
  set(CMAKE_CONFIGURATION_TYPES "Debug;Profile;Release"
    CACHE STRING "" FORCE)
else()
  if(NOT CMAKE_BUILD_TYPE AND NOT CMAKE_CONFIGURATION_TYPES)
    set(CMAKE_BUILD_TYPE "Debug" CACHE STRING "Flutter build mode" FORCE)
    set_property(CACHE CMAKE_BUILD_TYPE PROPERTY STRINGS
      "Debug" "Profile" "Release")
  endif()
endif()

set(CMAKE_EXE_LINKER_FLAGS_PROFILE "${CMAKE_EXE_LINKER_FLAGS_RELEASE}")
set(CMAKE_SHARED_LINKER_FLAGS_PROFILE "${CMAKE_SHARED_LINKER_FLAGS_RELEASE}")
set(CMAKE_C_FLAGS_PROFILE "${CMAKE_C_FLAGS_RELEASE}")
set(CMAKE_CXX_FLAGS_PROFILE "${CMAKE_CXX_FLAGS_RELEASE}")

# Use Unicode for all targets.
add_definitions(-DUNICODE -D_UNICODE)

# Compilation flags that should be applied to Flutter and the project code.
function(APPLY_STANDARD_SETTINGS TARGET)
  target_compile_features(${TARGET} PUBLIC cxx_std_17)
  target_compile_options(${TARGET} PRIVATE /W4 /WX /wd"4100")
  target_compile_options(${TARGET} PRIVATE /EHsc)
  target_compile_definitions(${TARGET} PRIVATE "_HAS_EXCEPTIONS=0")
  target_compile_definitions(${TARGET} PRIVATE "$<$<CONFIG:Debug>:_DEBUG>")
endfunction()

# Flutter library and tool tracking.
add_subdirectory(flutter)

# Application build.
add_subdirectory(runner)

# Generated plugin build rules.
include(flutter/generated_plugins.cmake OPTIONAL)
