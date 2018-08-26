cmake_minimum_required(VERSION 3.5)
project(eplkup LANGUAGES C)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_SOURCE_DIR}/bin)

# Set the output directory for each operating system
if (WIN32)
    set (CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_RUNTIME_OUTPUT_DIRECTORY}/windows)
elseif(APPLE)
    set (CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_RUNTIME_OUTPUT_DIRECTORY}/osx)
elseif(UNIX)
    set (CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_RUNTIME_OUTPUT_DIRECTORY}/linux)
endif()

# Include the eb and libiconv library
find_library(EB_LIBRARY eb HINTS libraries/eb/lib REQUIRED)

if (WIN32)
    find_library(LIB_ICONV libiconv libraries/libiconv/lib)
else()
    find_library(LIB_ICONV
        NAMES libiconv iconv
        HINTS /usr/local/opt/libiconv/lib /libraries/libiconv /libraries/libiconv/lib
        REQUIRED
    )
endif()

# Define what our source files are
file(GLOB SRC_FILES "libraries/cJSON/include/*.c" "src/eb/*.h" "src/*.c" "src/*/*.c" "libraries/cJSON/include/*.h")

include_directories(libraries/cJSON/include)

# Include the headers of libraries for Windows, since they don't get installed on to the system

if (WIN32 OR APPLE)
    include_directories(libraries/postsrc/include libraries/eb/include libraries/cJSON/include libraries/libiconv/include /usr/local/opt/libiconv/include)
endif()
if (WIN32)

    add_definitions(-Dssize_t=int)
endif()

add_executable(eplkup ${SOURCE_FILES} ${SRC_FILES} src/NativeMessaging/NativeMessaging.h src/NativeMessaging/NativeMessaging.h)

# Link our executable
target_link_libraries(eplkup PUBLIC ${EB_LIBRARY})

if (WIN32)
    target_link_libraries(eplkup PUBLIC ${LIB_ICONV})
endif()

