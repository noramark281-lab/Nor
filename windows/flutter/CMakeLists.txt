cmake_minimum_required(VERSION 3.14)

set(EPHEMERAL_DIR "${CMAKE_CURRENT_SOURCE_DIR}/ephemeral")

# Configuration provided via flutter tool.
if(NOT DEFINED FLUTTER_TARGET_PLATFORM)
  set(FLUTTER_TARGET_PLATFORM "windows-x64")
endif()

# Flutter engine and library integration
set(FLUTTER_LIB_DIR "${EPHEMERAL_DIR}")
set(FLUTTER_LIB_NAME "flutter_windows.dll")
set(FLUTTER_LIB "${FLUTTER_LIB_DIR}/${FLUTTER_LIB_NAME}")
set(FLUTTER_WRAPPER_DIR "${EPHEMERAL_DIR}/cpp_client_wrapper")

# Public header directory
include_directories("${EPHEMERAL_DIR}")

# Standard target name for wrapper
set(WRAPPER_TARGET "flutter_wrapper_app")

add_library(${WRAPPER_TARGET} STATIC
  "${FLUTTER_WRAPPER_DIR}/core_implementations.cc"
  "${FLUTTER_WRAPPER_DIR}/standard_codec.cc"
  "${FLUTTER_WRAPPER_DIR}/flutter_engine.cc"
  "${FLUTTER_WRAPPER_DIR}/flutter_view_controller.cc"
)
apply_standard_settings(${WRAPPER_TARGET})
set_target_properties(${WRAPPER_TARGET} PROPERTIES
  POSITION_INDEPENDENT_CODE ON
)
set_target_properties(${WRAPPER_TARGET} PROPERTIES
  CXX_VISIBILITY_PRESET "hidden"
)
target_link_libraries(${WRAPPER_TARGET} PUBLIC "${FLUTTER_LIB}.lib")
target_include_directories(${WRAPPER_TARGET} PUBLIC
  "${EPHEMERAL_DIR}"
  "${FLUTTER_WRAPPER_DIR}/include"
)

add_custom_target(flutter_assemble
  COMMAND ${CMAKE_COMMAND} -E echo "Assembling Flutter..."
)
