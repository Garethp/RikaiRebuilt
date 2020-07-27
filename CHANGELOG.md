## Changelog

### Version 1.3.4
 * Adds the ability to select which dictionary definition you want to import or hear the audio of (#13)
 * Fixes missing audio files form LanguagePod (#6)

### Version 1.3.3
 * Tell Anki to download Audio when playing Audio (#14)

### Version 1.3.2
 * Adding a Clear Page button in the VN Hook Page

### Version 1.3.1
 * Fixing broken Sanseido Mode

### Version 1.3.0
 * Added VN Hook Functionality. The VN Hook page now monitors your clipboard and automatically pastes it for you

### Version 1.2.2
 * Updating the text detection to work better with vertical text and discord

#### Version 1.2.0
 * Migration from JavaScript to TypeScript
 * Cleaning up the code quality of basically every part of the application

#### Version 1.1.7
 * Fixing name dictionary

#### Version 1.1.6
 * Fixing issue with having multiple dictionaries in Firefox
 * Fixed issues with extracting sentences

#### Version 1.1.5
 * Fixed a bug where dictionary types weren't being used
 * Fixed some issues with deinflection
 * When changing dictionary, you no longer have to move your mouse for it to take effect

#### Version 1.1.4
 * Previous bug about incorrect icon was not solved. This should solve it.

#### Version 1.1.3
 * Included support for Typescript by including Webpack. Hopefully won't cause issues
 * Fixed annoying bug where the icon wouldn't reset on start, making the icon look like it was enabled when it wasn't

#### Version 1.1.2
 * Adding more error reporting
 * Automatically stripping the /CATALOGS

#### Version 1.1.1
 * Fixing the "No Epwing Dictionary Set" popup showing all the time

#### Version 1.1.0
 * Adding some basic EPWING functionality in

#### Version 1.0.26
 * Small fixes in the Sanseido Mode Fallback

#### Version 1.0.25
 * Added Kanji Dictionary

#### Version 1.0.24
 * Fixed issue with PitchDb not opening, which stops anki imports

#### Version 1.0.23
 * Made Sanseido Mode work over HTTPS

#### Version 1.0.22
 * Sanseido Mode added

#### Version 1.0.21
 * Added pitch accents

#### Version 1.0.20
 * Drastically reduce the amount of memory used to import a dictionary

#### Version 1.0.19
 * Moved most settings to sync storage
 * Changed options page to use port messaging, so having the options page doesn't cause the addon to stop working
 * Made the progress bar for importing dictionaries actually show the progress
 * Added a volume option for playing sound

#### Version 1.0.18
 * Fixed broken Anki Import

#### Version 1.0.17
 * Hopefully fixed some issues regarding text selection in form fields

#### Version 1.0.16
 * Fixed popup positioning

#### Version 1.0.15
 * Added theme selections
 * Allowing adding multiple values to a field (by separating with spaces)

#### Version 1.0.14
 * Fixed some issues with Chrome frequency

#### Version 1.0.13
 * Fixed manual selections being removed by Rikai

#### Version 1.0.12
 * Adding Frequency Information
 * Solving issue with selecting and copying text
 * Moving dictionaries to a new DB system

#### Version 1.0.11
 * Solving issue with inputs not working after being used

#### Version 1.0.10
 * Fixing issue caused by last update

#### Version 1.0.9
 * Added an options button if you right click on the Rikai icon, for future Edge support
 * Allow text in forms

#### Version 1.0.8
 * Add the option to open up the Changelog on each update
 * Added options for hiding X rated definitions, show maximum names and show maximum entries
 * Made options page update automatically, no more clicking save
 * Added an edict-like format for Dictionary

#### Version 1.0.7
 * Made the enable/disable apply across the entire browser, not just per-tab

#### Version 1.0.6
 * Added an option to not fill in the Audio field when there's no audio

#### Version 1.0.5
 * Fixed the key event being propogated once used

#### Version 1.0.4
 * Fixed the lack of icon

#### Version 1.0.3
 * Added Chrome Support
 * Added tags when importing to Anki
 * Added a popup for when users are trying to use the extension when the options page is open
 * Cleaned up Options page
