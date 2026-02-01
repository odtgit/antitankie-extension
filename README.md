# Wikipedia Birthplace Corrector

A browser extension that restores modern country names for birthplaces on Wikipedia, correcting Soviet-era SSR designations to reflect the legal continuity doctrine recognized by affected nations.

## Overview

The Wikipedia Birthplace Corrector is a lightweight, privacy-focused browser extension that automatically updates Wikipedia articles to display modern country names instead of outdated Soviet Socialist Republic (SSR) designations. It works seamlessly across all language editions of Wikipedia without modifying the source articles themselves.

When you encounter text like "Born in Tallinn, Estonian SSR, Soviet Union," the extension automatically displays it as "Born in Tallinn, Estonia"—providing historically and legally accurate information aligned with the international recognition of these nations' sovereignty.

## Background

### The Wikipedia Controversy

For over 18 years, Wikipedia has been at the center of a contentious debate regarding how to refer to the Baltic states and other former Soviet republics during the Soviet period. This issue encompasses far more than just formatting preferences—it touches on fundamental questions of national sovereignty, legal continuity, and historical accuracy.

**Key Resources:**
- [Wikipedia Talk:Manual of Style/Baltic states-related articles discussion](https://en.wikipedia.org/wiki/Wikipedia_talk:Manual_of_Style/Dates_and_numbers) - The ongoing RFC (Request for Comments) that has struggled to reach consensus
- [ERR News coverage of mass editing campaign](https://news.err.ee/) - Coverage of coordinated efforts to standardize birthplace references
- [Baltic Sentinel coverage](https://balticsentinel.com/) - Analysis of the naming dispute's political implications

### Legal Foundations

The extension is grounded in well-established international legal principles:

**Legal Continuity Doctrine**
- Estonia, Latvia, and Lithuania maintain that their pre-war republics never legally ceased to exist, even during Soviet occupation (1940-1941, 1944-1991)
- This doctrine is recognized by major international bodies and democratic nations
- The Baltic states' legal continuity is central to their post-1990 restoration of independence

**Stimson Doctrine / Non-Recognition Policy**
- The United States and other Western nations never formally recognized the Soviet annexation of the Baltic states
- This policy of non-recognition maintained that the Baltic republics retained their legitimate status as independent states
- Western governments continued to recognize Baltic diplomatic missions throughout the Cold War

**Wikipedia RFC Status**
- Despite 18+ years of debate, Wikipedia's Request for Comments has resulted in "no consensus"
- This means neither standardized approach has achieved the required support
- The extension respects Wikipedia's neutral point of view by allowing individual users to choose their preferred presentation

## What It Does

### Core Functionality

The extension provides automatic, client-side text replacement on Wikipedia pages:

- **Text Replacement**: Replaces "Estonian SSR" with "Estonia", "Ukrainian SSR" with "Ukraine", and other similar designations
- **Link Updates**: Corrects Wikipedia internal links to point to the correct country article pages
- **Multi-Language Support**: Works across all language editions of Wikipedia (en.wikipedia.org, de.wikipedia.org, fr.wikipedia.org, etc.)
- **Soviet Union Suffix Removal**: Removes ", Soviet Union" suffixes that often accompany SSR designations (e.g., "Estonian SSR, Soviet Union" becomes "Estonia")
- **Non-Invasive**: Does not modify Wikipedia's source data—all changes occur in your browser only
- **User Control**: Can be easily disabled via the extension popup if you prefer the original text

### How It Works

1. The extension injects a content script on Wikipedia pages
2. It scans the page for Soviet-era designations
3. Replacements are performed in real-time on the visible content
4. All processing happens locally in your browser—nothing is sent to external servers
5. Users can toggle the extension on/off from the popup menu

## Countries Covered

The extension replaces designations for all 15 former Soviet republics:

### Baltic States
- Estonian SSR → Estonia
- Latvian SSR → Latvia
- Lithuanian SSR → Lithuania

### Eastern European Republics
- Ukrainian SSR → Ukraine
- Byelorussian SSR / Belarusian SSR → Belarus
- Moldavian SSR / Moldovan SSR → Moldova

### Caucasus Region
- Georgian SSR → Georgia
- Armenian SSR → Armenia
- Azerbaijan SSR / Azerbaijani SSR → Azerbaijan

### Central Asian Republics
- Kazakh SSR → Kazakhstan
- Uzbek SSR → Uzbekistan
- Turkmen SSR → Turkmenistan
- Kirghiz SSR / Kyrgyz SSR → Kyrgyzstan
- Tajik SSR → Tajikistan

### Russian Federation
- Russian SFSR / RSFSR → Russia

**Note**: The extension also handles various naming conventions for each republic (e.g., "Estonian SSR" and "Estonian Soviet Socialist Republic" both map to "Estonia").

## Installation

### Chrome, Chromium, Edge, Brave, and Other Chromium-Based Browsers

1. Clone or download this repository to your computer
2. Open your browser and navigate to the extensions page:
   - **Chrome/Chromium/Brave**: `chrome://extensions`
   - **Edge**: `edge://extensions`
3. Enable **"Developer mode"** (toggle in the top-right corner)
4. Click **"Load unpacked"**
5. Navigate to the extension folder and select it
6. The extension should now appear in your extensions list and in the browser toolbar

### Firefox

1. Clone or download this repository to your computer
2. Navigate to Firefox's debugging page: `about:debugging`
3. Click **"This Firefox"** in the left sidebar
4. Click **"Load Temporary Add-on"**
5. Navigate to the extension folder and select the `manifest.json` file (or `manifest.firefox.json` if you rename it)
6. The extension should now appear in your Firefox toolbar

**Note**: For temporary loading in Firefox, the extension will remain until you restart the browser. For permanent installation, you would need to package it as an .xpi file and add it through the official Firefox Add-ons website (requires review).

## Building for Distribution

To prepare the extension for distribution:

```bash
# Copy the entire extension folder
cp -r antitankie-extension/ ./build/antitankie-extension/

# For Firefox, rename the manifest
cp build/antitankie-extension/manifest.firefox.json build/antitankie-extension/manifest.json

# Optionally, create a zip file for distribution
cd build
zip -r antitankie-extension.zip antitankie-extension/
```

The extension is ready to be loaded unpacked in developer mode or packaged for submission to browser extension stores.

## Files and Structure

```
antitankie-extension/
├── manifest.json                 # Chrome/Chromium manifest
├── manifest.firefox.json         # Firefox-specific manifest
├── content.js                    # Content script (runs on Wikipedia pages)
├── background.js                 # Background/service worker script
├── replacements.js               # Core replacement logic and SSR mappings
├── popup.html                    # Extension popup UI
├── popup.js                      # Popup functionality and user preferences
├── popup.css                     # Popup styling
├── icons/
│   ├── icon16.png               # 16x16 extension icon
│   ├── icon48.png               # 48x48 extension icon
│   └── icon128.png              # 128x128 extension icon
└── README.md                     # This file
```

## Privacy

The Wikipedia Birthplace Corrector is built with privacy as a core principle:

- **No Data Collection**: The extension does not collect, track, or transmit any information about your browsing habits
- **Local Processing Only**: All text replacement and processing occurs entirely within your browser
- **No Network Requests**: The extension makes no external network requests (except to load Wikipedia pages, which you're already accessing)
- **No Server Communication**: Your data is never sent to external servers
- **No Tracking**: No analytics, telemetry, or tracking code is included
- **Transparent Code**: The source code is available for inspection to verify these privacy claims

### Permissions Explained

The extension requests the following permissions, which are used as indicated:

- **storage**: Saves your enabled/disabled preference so the extension remembers your settings between sessions
- **activeTab**: Allows the extension to know which tab you're currently viewing (needed to apply replacements to the active Wikipedia page)
- **host_permissions (*://*.wikipedia.org/*)**: Enables the extension to run on Wikipedia pages across all languages and protocols

## Features

- Lightweight and fast—minimal performance impact
- Respects user preference with an easy on/off toggle
- Works on mobile browsers (Chrome for Android, Firefox for Android) where these features are available
- Handles multiple naming variations (e.g., "Estonian SSR" and "Estonian Soviet Socialist Republic")
- Removes obsolete "Soviet Union" suffixes for cleaner text
- Updates internal Wikipedia links to point to correct country articles

## Troubleshooting

### The extension doesn't seem to be working

1. **Verify it's enabled**: Check the extension popup—ensure the toggle is switched on
2. **Refresh the page**: Load or reload your Wikipedia page
3. **Check the console**: Open Developer Tools (F12) and check the Console tab for any error messages
4. **Verify permissions**: Ensure the extension has permission to run on wikipedia.org

### Replacements aren't showing on some pages

- The extension only runs on pages that load after it's enabled
- If you enable/disable the extension, refresh the page to see changes
- Some Wikipedia pages may use dynamic content loading that bypasses the initial content script

### Firefox says the add-on isn't registered

This is normal when loading the extension temporarily via `about:debugging`. The temporary load is for development and testing purposes only.

## Contributing

This project welcomes contributions and feedback:

- **Bug Reports**: If you encounter issues, please open a GitHub issue with:
  - The URL of the Wikipedia page where the issue occurred
  - A description of the unexpected behavior
  - Your browser and version

- **Feature Requests**: Suggestions for improvements are welcome

- **Code Contributions**: Pull requests are accepted for bug fixes and improvements

## License

This extension is released under the MIT License. See the LICENSE file for full details.

## Related Reading

- [United Nations General Assembly Resolution 50/80](https://undocs.org/en/A/RES/50/80) - Recognition of Baltic states' sovereignty
- [International Court of Justice cases on Baltic states](https://www.icj-cij.org/)
- [Wikipedia Manual of Style](https://en.wikipedia.org/wiki/Wikipedia:Manual_of_Style) - General Wikipedia style guidelines
- Legal Continuity in International Law - Academic resources on the continuity doctrine

## Disclaimer

This extension is provided as-is for informational purposes. While it aims to reflect internationally recognized legal principles regarding national sovereignty, users should be aware that the interpretation of birthplace designations is subject to ongoing debate. This extension does not claim to represent the definitive Wikipedia position on these matters, but rather provides a tool for users who prefer modern country name designations.

---

**Version**: 1.0.0
**Last Updated**: 2025-02-01
**Browser Support**: Chrome, Chromium, Brave, Edge, Firefox (and other Chromium-based browsers)
