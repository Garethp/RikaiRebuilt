## Rikai Rebuilt

#### What is it?
Rikai Rebuilt is an attempt to rewrite the Firefox extension [Rikaisama](http://rikaisama.sourceforge.net/)
for the WebExtension API since the XUL API that Rikaisama was built with doesn't work in Firefox anymore

#### How is this different to the other Rikaisama Alternatives
Rather than trying to be an alternative, this plugin will try to be as true to the original as possible,
attempting to keep the logic and functionality the same by rewriting it line by line. On top of that,
the end goal is to have this extension be compatible with all browsers that support WebExtension

#### How fare you?
Take a look at the Feature List below

## Features

#### Completed
 * Scanning the page when enabled to see definitions of the Kanji
 * Playing JDIC Audio for highlighted words
 * Importing to Anki
 * Customizing the keyboard shortcuts
 * Support for Multiple dictionaries
 * Support for adding tags when importing in to Anki
 * Sanseido dictionary support
 * Showing pitch accents
 * Showing Frequency Information

#### Not completed
 * EPWING dictionary support
 * Super Sticky Mode
 * Saving words to files

#### Roadmap
 * Adding alternate view
 * Adding sticky mode
 * Edge and Opera Support
 * Possible EPWING support
 * Add Jisho Stroke Orders

## Building for different browsers

A small note: When building for Chrome you need to remove the clipboard read optional
permission from the manifest. They don't require it (Firefox does though) and because
they don't require it they consider it a violation to even include it in the manifest
