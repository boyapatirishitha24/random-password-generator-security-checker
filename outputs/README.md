# Keysmith — Password Generator and Security Checker

A responsive, dependency-free password tool that runs in your browser.

## Run it

Open `index.html` in a modern browser. Password generation uses the browser's cryptographically secure random number generator (`crypto.getRandomValues`). No build step or installation is required.

## Features

- Generate passwords from 8 to 64 characters, choosing lowercase, uppercase, numbers, and symbols.
- Generate memorable multi-word passphrases with a selectable word count.
- Choose quick 16, 24, or 32 character presets for random passwords.
- Reveal or hide the generated password on screen.
- Switch between light and dark themes; the theme preference is saved in the browser.
- Choose a hyphen, space, or period between passphrase words.
- Clear the displayed password and checker results immediately.
- Exclude visually similar characters and copy a generated password.
- Check an entered password's estimated entropy, length, character variety, repeated characters, and common patterns.
- Keep all password processing in the browser. The checker does not save or transmit what you enter.
- Responsive layout for desktop and mobile.

## Notes

Strength and entropy are educational estimates, not a breach-database lookup or a guarantee of safety. For the best protection, use a unique password for each account and store it in a reputable password manager.
