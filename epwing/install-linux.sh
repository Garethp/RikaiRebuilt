#!/usr/bin/env bash

declare -a os_path="linux"

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
    for folder in "${foldersToCheck[@]}"
    do
        if [ -d "$folder" ]; then
            echo "Found $folder"
            sed "s|{EPWING-PATH}|$PWD/bin/$os_path/eplkup|" manifest/manifest-unix.dist.json > "${folder}/manifest.json"
            break
        fi
    done
}

# The folders that we're going to be placing our manifest into
declare -a chromeFolders=(
    # Local
    "~/Library/Application Support/Google/Chrome/NativeMessagingHosts/"
    "~/.config/google-chrome/NativeMessagingHosts/"

    # Global
    "/Library/Google/Chrome/NativeMessagingHosts/"
    "/etc/opt/chrome/native-messaging-hosts/"
)

declare -a chromiumFolders=(
    # Local
    "~/Library/Application Support/Chromium/NativeMessagingHosts/"
    "~/.config/chromium/NativeMessagingHosts/"

    # Global
    "/Library/Application Support/Chromium/NativeMessagingHosts/"
    "/etc/chromium/native-messaging-hosts/"
)

declare -a firefoxFolders=(
    # Local
    "~/Library/Application Support/Mozilla/NativeMessagingHosts"
    "~/.mozilla/native-messaging-hosts/"

    # Global
    "/Library/Application Support/Mozilla/NativeMessagingHosts/"
    "/usr/lib/mozilla/native-messaging-hosts/"
    "/usr/lib64/mozilla/native-messaging-hosts/"
    "/usr/share/mozilla/native-messaging-hosts/"
)

place_manifest_in_first_folder "${chromeFolders[@]}"
place_manifest_in_first_folder "${chromiumFolders[@]}"
place_manifest_in_first_folder "${firefoxFolders[@]}"

