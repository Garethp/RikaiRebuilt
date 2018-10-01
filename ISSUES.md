EPWING
 * Binaries built for linux/osx aren't built as executables
 * Need to replace the `~` in the install scripts with `${HOME}` as `~` isn't expanded
 * `~/.mozilla/` exists, but `~/.mozilla/native-messaging-hosts` doesn't. Need to `mkdir`
 * Doesn't seem to work on Linux. No error message.
