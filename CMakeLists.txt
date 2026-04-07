cmake_minimum_required(VERSION 3.28)
set(PROJECT_NAME "$ENV{PROJECT_NAME}")
project("${PROJECT_NAME}" LANGUAGES C CXX OBJC OBJCXX)

add_library(core
    src-native/test.h
    src-native/test.mm
)

if(NOT EMSCRIPTEN)
  # Linux hardening linker flags — incompatible with wasm-ld
  set(LINUX_LINKER_FLAGS "-Wl,-z,relro,-z,now -Wl,-z,nodlopen -Wl,-z,noexecstack -Wl,--as-needed -Wl,--no-copy-dt-needed-entries")
  set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} ${LINUX_LINKER_FLAGS}")
  set(CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} ${LINUX_LINKER_FLAGS}")

  find_package(Boost REQUIRED COMPONENTS unit_test_framework)
  enable_testing()
  add_executable(core_test src-native/test.test.c++)
  target_link_libraries(core_test PUBLIC core Boost::unit_test_framework)
  add_test(NAME core_test COMMAND core_test)
endif()