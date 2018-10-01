#!/usr/bin/env bash

os_path="linux"
name="eplkup"

if [ ! -f "./bin/$os_path/eplkup" ]; then
    echo "Epwing file not found"
    exit 1
fi

if [ ! -f ./manifest/manifest-unix.dist.json ]; then
    echo "Manifest template not found"
    exit 1
fi


place_manifest_in_first_folder () {
    foldersToCheck=("$@")
    browser=${foldersToCheck[-1]}
    unset 'foldersToCheck[${#foldersToCheck[@]}-1]'

    for folder in "${foldersToCheck[@]}"
    do
        parentDirectory=`dirname "$folder"`
        if [ -d "$parentDirectory" ]; then
            if [ ! -d "$folder" ]; then
                mkdir "$folder"
            fi

            if [ "$browser" = "chrome" ]; then
                sed "s|{EPWING-PATH}|$PWD/bin/$os_path/eplkup|" manifest/manifest-unix.dist.json | \
                sed "s|allowed_extensions|allowed_origins|" \
                > "${folder}/${name}.json"
            else
                sed "s|{EPWING-PATH}|$PWD/bin/$os_path/eplkup|" manifest/manifest-unix.dist.json \
                > "${folder}/${name}.json"
            fi
            break
        fi
    done
}

# The folders that we're going to be placing our manifest into
declare -a chromeFolders=(
    # Local
    "${HOME}/Library/Application Support/Google/Chrome/NativeMessagingHosts/"
    "${HOME}/.config/google-chrome/NativeMessagingHosts/"

    # Global
    "/Library/Google/Chrome/NativeMessagingHosts/"
    "/etc/opt/chrome/native-messaging-hosts/"
)

declare -a chromiumFolders=(
    # Local
    "${HOME}/Library/Application Support/Chromium/NativeMessagingHosts/"
    "${HOME}/.config/chromium/NativeMessagingHosts/"

    # Global
    "/Library/Application Support/Chromium/NativeMessagingHosts/"
    "/etc/chromium/native-messaging-hosts/"
)

declare -a firefoxFolders=(
    # Local
    "${HOME}/Library/Application Support/Mozilla/NativeMessagingHosts"
    "${HOME}/.mozilla/native-messaging-hosts/"

    # Global
    "/Library/Application Support/Mozilla/NativeMessagingHosts/"
    "/usr/lib/mozilla/native-messaging-hosts/"
    "/usr/lib64/mozilla/native-messaging-hosts/"
    "/usr/share/mozilla/native-messaging-hosts/"
)

place_manifest_in_first_folder "${chromeFolders[@]}" "chrome"
place_manifest_in_first_folder "${chromiumFolders[@]}" "chrome"
place_manifest_in_first_folder "${firefoxFolders[@]}" "firefox"

