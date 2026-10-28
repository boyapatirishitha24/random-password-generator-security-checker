# Keysmith — Password Generator and Security Checker

A responsive password tool with a small Node.js backend and a local browser checker.

## Run it

### Run with the backend

Requires Node.js 18 or newer. From this folder, run:

```sh
npm start
```

Then open <http://127.0.0.1:3000>. The server uses Node's `crypto.randomInt` for unbiased password and passphrase generation. The API does not save or log generated passwords.

### Open as a local file

You can still open `index.html` directly. In that mode the browser generates passwords with `crypto.getRandomValues`; no backend is needed.

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
- Keep checker input in the browser. The checker does not save or transmit what you enter.
- Use a same-origin JSON API for server-side password generation, with browser-side generation as a fallback.
- Responsive layout for desktop and mobile.

## API

- `GET /api/health` — returns `{ "status": "ok" }`.
- `POST /api/generate` — accepts JSON options for a password or passphrase and returns the generated value. It does not accept passwords to check.

Server-generated values travel to the browser in the API response. The server does not persist or log them. For a public deployment, serve the app over HTTPS.

## Deploy a live demo

This repository includes a Render Blueprint at the repository root. To create a free Node.js web service, open the [Render deploy page](https://render.com/deploy?repo=https://github.com/boyapatirishitha24/random-password-generator-security-checker), sign in, review the Blueprint, and deploy it. The first request after the free service has been idle may take about a minute while it wakes up.

## Notes

Strength and entropy are educational estimates, not a breach-database lookup or a guarantee of safety. For the best protection, use a unique password for each account and store it in a reputable password manager.
