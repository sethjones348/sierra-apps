# Sierra Apps

This is a multi-app monorepo. It holds one or many independent apps — web apps, mobile apps, or anything else.

## Repo Structure

```
sierra-apps/
├── apps/                  # All apps live here, one directory per app
│   ├── my-web-app/        # Example: a web app
│   ├── budget-tracker/    # Example: another app
│   └── ...
├── shared/                # Shared libraries used by all apps
│   ├── config.js          # Google OAuth Client ID and shared config
│   └── google-drive-storage.js  # Google Sign-In + Drive storage helper
├── CLAUDE.md              # This file — repo-level guidance
└── package.json           # Root workspace config (for JS/TS apps)
```

## How to Create a New App

When asked to build a new app, follow these steps:

1. **Create a new directory under `apps/`** using a short, kebab-case name (e.g., `apps/recipe-finder`).
2. **Pick the right tool for the job:**
   - **Web app (React):** Use Vite + React. Run `npm create vite@latest <app-name> -- --template react-ts` from the `apps/` directory.
   - **Web app (Next.js):** Use `npx create-next-app@latest <app-name> --ts` from the `apps/` directory.
   - **Mobile app (React Native / Expo):** Use `npx create-expo-app <app-name>` from the `apps/` directory.
   - **Simple static site:** Just create the directory and add HTML/CSS/JS files directly.
   - **Python app:** Create the directory, add a `requirements.txt` or `pyproject.toml`, and set up a virtual environment.
   - **Other:** Use whatever framework or language makes sense. Each app is independent.
3. **Add a README.md inside the app directory** explaining what the app does and how to run it.
4. **Each app is self-contained.** It has its own dependencies, its own build process, and its own README.

## Conventions

- **App isolation:** Each app in `apps/` is independent. Don't create cross-app dependencies unless explicitly asked.
- **Naming:** Use lowercase kebab-case for directory names (e.g., `meal-planner`, not `MealPlanner`).
- **README per app:** Every app directory must have a `README.md` with:
  - What the app does
  - How to install dependencies
  - How to run it locally
  - How to build for production (if applicable)
- **No unnecessary complexity:** Use the simplest approach that works. Don't add linting configs, CI pipelines, or monorepo tooling unless asked.
- **Git:** Commit meaningful changes with clear messages. Don't bundle unrelated app changes in one commit. Always push to `claude/main`. Do not push to any other branch.

## Deploying Apps with GitHub Pages

**This is critical.** The user primarily works from the Claude app on their phone. They can't access `localhost` or dev servers. Every app must be deployable to **GitHub Pages** so the user can open it in their phone's browser via a real URL.

The GitHub Pages site for this repo is:
**`https://sethjones348.github.io/sierra-apps/`**

Each app is served from a subdirectory:
**`https://sethjones348.github.io/sierra-apps/<app-name>/`**

### How to deploy an app

1. **Build the app** so it produces static files (HTML/CSS/JS).
2. **Put the built output in the app's directory** so it can be served directly from the repo.
3. **Update `index.html` at the repo root** — add a card linking to the new app so it appears on the homepage.
4. **Commit and push to `main`** — GitHub Pages will serve the files automatically.
5. **Give the user the URL** so they can open it on their phone.

### For static HTML/CSS/JS apps (simplest):
- Just create files directly in `apps/<app-name>/` — they're already ready to serve.
- No build step needed.

### For Vite + React apps:
- Set the `base` option in `vite.config.ts` to `/sierra-apps/<app-name>/` so asset paths work on GitHub Pages.
- Build with `npm run build`.
- Copy or configure the output (`dist/`) so the built files end up committed to the repo. The simplest approach: set `build.outDir` to `./` or commit the `dist/` contents directly into the app directory.
- Alternatively, keep it simple and just build single-file apps with inline scripts and styles — no build step needed.

### Prefer simple, buildless apps

Since everything deploys via GitHub Pages, **prefer simple static apps whenever possible**:
- A single `index.html` with inline `<style>` and `<script>` tags is often all you need.
- Use CDN links for libraries (e.g., React via `https://unpkg.com/react@18/umd/react.production.min.js`).
- This avoids build steps entirely — just write, commit, push, and it's live.
- Only use a build tool (Vite, etc.) when the app genuinely needs it (complex routing, many components, TypeScript, etc.).

### GitHub Pages setup (one-time)

GitHub Pages must be enabled on this repo. Go to **Settings > Pages** on GitHub and set:
- **Source:** Deploy from a branch
- **Branch:** `main`
- **Folder:** `/ (root)`

Once enabled, everything pushed to `main` is live at `https://sethjones348.github.io/sierra-apps/`.

### Design aesthetic

**The user loves the look and feel of apps like Anthropologie, Zara, and similar fashion/lifestyle brands.** All apps should follow this aesthetic:

**Typography:**
- Use elegant, thin/light-weight fonts. Import a serif or refined sans-serif from Google Fonts (e.g., `Playfair Display` for headings, `Inter` or `DM Sans` for body text).
- Generous letter-spacing on headings and uppercase labels (e.g., `letter-spacing: 0.1em`).
- Light font weights (300–400 for body, 400–500 for headings).

**Color palette:**
- Muted, warm neutrals: cream/ivory (`#FAF8F5`), warm gray (`#8A8478`), soft black (`#2C2C2C`), white (`#FFFFFF`).
- Accent sparingly — dusty rose (`#C4A68A`), sage (`#A3A88E`), or muted gold (`#C5A46D`).
- Avoid bright, saturated colors. Everything should feel soft and elevated.

**Layout & spacing:**
- Lots of whitespace — let the design breathe.
- Clean grid layouts with generous padding.
- Full-width sections with contained content (max-width ~500px for mobile).
- Subtle dividers (thin 1px lines in light gray) instead of heavy borders or shadows.

**UI elements:**
- Buttons: minimal, often outlined or text-only. Rounded corners (6–8px) or pill-shaped. Uppercase text with letter-spacing.
- Cards: very subtle shadows or no shadows at all — use background color contrast instead.
- Inputs: clean underline or thin border style, not chunky.
- Icons: thin line-weight icons (use Lucide or Feather icons via CDN).

**Interactions:**
- Subtle transitions (0.2s ease) on hover/active states.
- Avoid flashy animations. Elegance over excitement.
- Smooth scroll behavior.

**Mobile-first:**
- Design for small screens first (responsive CSS)
- Large tap targets (min 44x44px) for buttons and links
- Readable font sizes (min 16px body text)
- Avoid hover-dependent interactions

## Persistent Storage (Google Drive)

All apps that need to persist user data should use **Google Sign-In + Google Drive** as the single source of truth. **Do not use localStorage** for data persistence — Drive is the database.

### Architecture

- **Google Drive `appDataFolder`** is the only data store — all reads and writes go through Drive
- The `appDataFolder` is a hidden, app-specific folder in the user's Drive (doesn't clutter their files)
- App content is hidden until the user signs in — show a "Sign in to ..." prompt instead
- On sign-in, data is loaded directly from Drive with `loadFromDrive()`
- On sign-out, local state is cleared and app content is hidden
- No merge logic needed — Drive is the single source of truth

### Auth session persistence — CRITICAL

The shared library caches three things in `localStorage` to keep the user signed in across page loads and navigations:

1. **Access token + expiry** (`gds-auth-token`) — Google OAuth tokens last ~1 hour. On page load, the cached token is checked **immediately** (before Google's GIS library even loads). If still valid, it's used directly with zero auth requests.
2. **User info** (`gds-auth-user`) — name and picture, so the signed-in UI renders instantly.
3. **Drive file IDs** (`gds-file-<filename>`) — so `loadFromDrive()` skips the file search and reads the file directly (1 API call instead of 2).

**Rules to follow — do NOT violate these:**

- **Never store app data in localStorage.** Only auth state (token, user info, file IDs) goes in localStorage. App data lives in Drive.
- **Never use `syncFromDrive()` or merge logic.** Drive is the single source of truth. Load from Drive, save to Drive. No two-way sync, no merge functions.
- **Never call `signOut()` when a silent token refresh fails.** If a silent refresh fails, just show the sign-in button. Do not revoke the token or clear the user cache — that makes re-authentication harder.
- **Never wait for Google's GIS library to load before restoring a cached session.** The GIS library (`google.accounts.oauth2`) is only needed for sign-in/sign-out buttons and token requests. A cached token can be used immediately on page load. Set up GIS in the background.
- **Never do a file search (`_findDriveFile`) on every page load.** Cache the Drive file ID after the first lookup. The file ID doesn't change. Only re-search if the cached ID fails (e.g., file was deleted).
- **Constructor takes only `fileName`.** No `localStorageKey` parameter — the library manages its own cache keys internally.

### Shared libraries

Two shared files in `shared/` provide everything needed:

1. **`shared/config.js`** — Contains the Google OAuth Client ID (shared across all apps)
2. **`shared/google-drive-storage.js`** — `GoogleDriveStorage` class that handles auth UI, sign-in/out, and Drive read/write

The Google OAuth Client ID is: `437861067044-r6m2ndd5bqgd0u82f1rjq8a3nv91fc3q.apps.googleusercontent.com`

### How to add storage to a new app

1. Add these script tags to the app's `<head>` (in this order):
   ```html
   <script src="https://accounts.google.com/gsi/client" async defer></script>
   <script src="/sierra-apps/shared/config.js"></script>
   <script src="/sierra-apps/shared/google-drive-storage.js"></script>
   ```

2. Add a `<style>` tag for the auth UI styles:
   ```html
   <style id="gds-styles"></style>
   ```

3. Add an auth container and sign-in prompt in the HTML:
   ```html
   <div id="authSection"></div>

   <!-- Shown when not signed in -->
   <div class="signin-prompt" id="signinPrompt">
     <p>Sign in to see your data</p>
   </div>

   <!-- Hidden until signed in -->
   <div id="appContent" style="display:none;">
     <!-- Your app content here -->
   </div>
   ```

4. In your app's JavaScript, initialize and use:
   ```javascript
   // Each app uses its own unique file name in Drive
   const storage = new GoogleDriveStorage('my-app-data.json');

   // Inject the auth UI styles
   document.getElementById('gds-styles').textContent = GoogleDriveStorage.getStyles();

   // Render the sign-in/sign-out UI
   storage.renderAuthUI(document.getElementById('authSection'), {
     onSignIn: async () => {
       // Load data directly from Drive (single source of truth)
       myData = await storage.loadFromDrive() || defaultValue;

       // Show app content
       document.getElementById('signinPrompt').style.display = 'none';
       document.getElementById('appContent').style.display = 'block';
       render();
     },
     onSignOut: () => {
       // Clear state and hide app content
       myData = defaultValue;
       document.getElementById('signinPrompt').style.display = 'block';
       document.getElementById('appContent').style.display = 'none';
     }
   });

   // Save data (writes directly to Drive)
   storage.save(myData);
   ```

### Important notes

- Each app MUST use a **unique file name** for its Drive file (e.g., `outdoor-hours-data.json`, `budget-data.json`)
- **Do not use localStorage for app data** — only for auth session caching (handled by the shared library)
- App content must be **hidden until the user signs in** — show a friendly sign-in prompt instead
- On sign-out, **clear all local state** and hide app content
- The sign-in button and sync status are handled automatically by the shared library
- The OAuth Client ID is configured for the origin `https://sethjones348.github.io` — no per-app setup needed
- Multiple pages in the same app (e.g., `index.html` and `album.html`) each create their own `GoogleDriveStorage` instance — this is fine, they share the same cached token via localStorage

## Running an Existing App

To work on an existing app, `cd` into its directory under `apps/` and follow the instructions in its README.md.

## Tech Stack Defaults

When no specific tech is requested, use these defaults:
- **Web app:** Vite + React + TypeScript
- **Mobile app:** Expo (React Native) + TypeScript
- **API/backend:** Node.js + Express + TypeScript

These are just defaults — always use whatever the user asks for instead.
