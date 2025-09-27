# Copilot Instructions for Awesome Emoji Picker

This project is a cross-browser WebExtension (Firefox, Chromium, Thunderbird) for emoji picking, clipboard, and page insertion. It is modular, uses modern JS, and is structured for maintainability and cross-platform support.

## Architecture & Key Patterns
- **Modular Structure:**
  - `src/` contains all extension code, split by context: `background/`, `content_scripts/`, `popup/`, `options/`, `common/`.
  - Shared logic is in `src/common/modules/` (e.g., `BrowserCommunication`, `AddonSettings`, `Logger`).
- **Browser Communication:**
  - Use `BrowserCommunication.addListener(COMMUNICATION_MESSAGE_TYPE.X, callback)` for cross-context messaging.
  - Message types are defined in `src/common/modules/data/BrowserCommunicationTypes.js` as an object (used like an enum). Always use the exported constants, not raw strings.
- **Settings:**
  - Settings are managed via `AddonSettings` in `src/common/modules/AddonSettings/`.
- **Localization:**
  - All user-facing strings are localized using `_locales/` and the `Localizer` module (which uses the normal WebExtension function behind).
- **UI:**
  - Popup and options UIs are in `src/popup/` and `src/options/`.
  - Styles are modular and use `common.css` and context-specific CSS.

## Developer Workflows
- **Build:**
  - Use `scripts/make.sh [browser]` to build a release ZIP for a specific browser (default: Firefox). This script copies the correct manifest and zips the extension, excluding dev/test files.
- **Testing:**
  - Tests are in `src/tests/` and `tests/`. Run them in a browser context; see `CONTRIBUTING.md` for details.
- **Linting:**
  - Run ESLint with `eslint` (configured for JSDoc and modern JS).
- **Debugging:**
  - Load `src/` as an unpacked extension in your browser for development.

## Project-Specific Conventions
- **Message Types:**
  - Never use raw strings for message types; always use `COMMUNICATION_MESSAGE_TYPE` values.
- **JSDoc:**
  - Use typedefs for value enums (see `BrowserCommunicationTypes.js`).
- **No TypeScript:**
  - The project uses JS with JSDoc for type checking (`checkJs` is enabled in `jsconfig.json`).
- **No Webpack:**
  - All code is loaded as-is; no bundling step.
- **Manifest Management:**
  - Manifests for each browser are in `scripts/manifests/` and copied by the build script.

## Integration Points
- **emoji-mart:**
  - Used for emoji data and search. See `src/common/modules/EmojiMart/`.
- **WebExtension APIs:**
  - Use the `browser` namespace for all extension APIs (polyfilled for Chrome).

## Examples
- Registering a message listener:
  ```js
  import { COMMUNICATION_MESSAGE_TYPE } from '../data/BrowserCommunicationTypes.js';
  BrowserCommunication.addListener(COMMUNICATION_MESSAGE_TYPE.OMNIBAR_TOGGLE, callback);
  ```
- Adding a new settings option:
  - Update the relevant UI in `options/`. Do not forget `DefaultSettings.js` for default values.

## References
- [README.md](../../README.md)
- [CONTRIBUTING.md](../../CONTRIBUTING.md)
- [src/common/modules/BrowserCommunication/README.md](../../src/common/modules/BrowserCommunication/README.md)

---

If any section is unclear or missing, please provide feedback for further refinement.
