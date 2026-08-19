cmake_minimum_required(VERSION 3.14)

set(EPHEMERAL_DIR "${CMAKE_CURRENT_SOURCE_DIR}/ephemeral")

# Configuration provided via flutter tool.
if(EXISTS "${EPHEMERAL_DIR}/generated_config.cmake")
  include("${EPHEMERAL_DIR}/generated_config.cmake")
else()
  set(FLUTTER_TARGET_PLATFORM "windows-x64")
endif()

# Set build type-specific variables.
set(WRAPPER_ROOT "${EPHEMERAL_DIR}/cpp_client_wrapper")

# === Flutter Library ===
set(FLUTTER_LIBRARY "${EPHEMERAL_DIR}/flutter_windows.dll")

# Published to parent scope for execution
set(FLUTTER_LIBRARY "${FLUTTER_LIBRARY}" PARENT_SCOPE)
set(FLUTTER_ICU_DATA_FILE "${EPHEMERAL_DIR}/icudtl.dat" PARENT_SCOPE)
set(PROJECT_BUILD_DIR "${CMAKE_SOURCE_DIR}/../build" PARENT_SCOPE)
set(NUM_PROC $ENV{NUMBER_OF_PROCESSORS})

add_library(flutter INTERFACE)
target_include_directories(flutter INTERFACE
  "${EPHEMERAL_DIR}"
)
target_link_libraries(flutter INTERFACE "${EPHEMERAL_DIR}/flutter_windows.dll.lib")
add_dependencies(flutter flutter_assemble)

# === Wrapper ===
list(APPEND CPP_WRAPPER_SOURCES_CORE
  "${WRAPPER_ROOT}/core_implementations.cc"
  "${WRAPPER_ROOT}/standard_codec.cc"
)
list(APPEND CPP_WRAPPER_SOURCES_PLUGIN
  "${WRAPPER_ROOT}/plugin_registrar.cc"
)
list(APPEND CPP_WRAPPER_SOURCES_APP
  "${WRAPPER_ROOT}/flutter_engine.cc"
  "${WRAPPER_ROOT}/flutter_view_controller.cc"
)

# Wrapper libraries.
add_library(flutter_wrapper_core STATIC
  ${CPP_WRAPPER_SOURCES_CORE}
)
apply_standard_settings(flutter_wrapper_core)
set_target_properties(flutter_wrapper_core PROPERTIES
  POSITION_INDEPENDENT_CODE ON)
set_target_properties(flutter_wrapper_core PROPERTIES
  CXX_VISIBILITY_PRESET "hidden")
target_link_libraries(flutter_wrapper_core PUBLIC flutter)
target_include_directories(flutter_wrapper_core PUBLIC
  "${WRAPPER_ROOT}/include"
  "${EPHEMERAL_DIR}"
)
add_dependencies(flutter_wrapper_core flutter_assemble)

add_library(flutter_wrapper_app STATIC
  ${CPP_WRAPPER_SOURCES_CORE}
  ${CPP_WRAPPER_SOURCES_APP}
)
apply_standard_settings(flutter_wrapper_app)
set_target_properties(flutter_wrapper_app PROPERTIES
  POSITION_INDEPENDENT_CODE ON)
set_target_properties(flutter_wrapper_app PROPERTIES
  CXX_VISIBILITY_PRESET "hidden")
target_link_libraries(flutter_wrapper_app PUBLIC flutter)
target_include_directories(flutter_wrapper_app PUBLIC
  "${WRAPPER_ROOT}/include"
  "${EPHEMERAL_DIR}"
)
add_dependencies(flutter_wrapper_app flutter_assemble)

# === Assemble Target ===
add_custom_command(
  OUTPUT ${FLUTTER_LIBRARY} ${FLUTTER_ICU_DATA_FILE}
    ${WRAPPER_ROOT}/core_implementations.cc
    ${WRAPPER_ROOT}/standard_codec.cc
    ${WRAPPER_ROOT}/flutter_engine.cc
    ${WRAPPER_ROOT}/flutter_view_controller.cc
    ${WRAPPER_ROOT}/plugin_registrar.cc
  COMMAND ${CMAKE_COMMAND} -E env
    ${FLUTTER_TOOL_ENVIRONMENT}
    "${FLUTTER_ROOT}/packages/flutter_tools/bin/tool_backend.bat"
      ${FLUTTER_TARGET_PLATFORM} $<CONFIG>
  VERBATIM
)

add_custom_target(flutter_assemble DEPENDS
  "${FLUTTER_LIBRARY}"
  ${FLUTTER_ICU_DATA_FILE}
  ${CPP_WRAPPER_SOURCES_CORE}
  ${CPP_WRAPPER_SOURCES_APP}
)
