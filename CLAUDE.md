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

**Loading states:**
- Any time the app is waiting for data (Drive load, save, sign-in), show a centered loading indicator.
- Use a small CSS spinner (thin border, `border-top` colored with muted gold `#C5A46D`) with a cute word underneath in uppercase letter-spaced text.
- Example words: "Gathering...", "Curating...", "Preparing...", "Refreshing..." — pick one that fits the context.
- The spinner + word should be centered in the content area and match the app's aesthetic (light weight, muted colors, generous spacing).
- Standard CSS spinner pattern:
  ```css
  .loading-spinner {
    width: 24px; height: 24px;
    border: 2px solid #E8E4DF;
    border-top-color: #C5A46D;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 0.8rem;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-text {
    font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase;
    color: #8A8478; font-weight: 400; text-align: center;
  }
  ```

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

All apps that need to persist user data should use **Google Sign-In + Google Drive**. Drive is the source of truth, and localStorage is a read-only cache for instant page loads.

### Architecture

- **Google Drive `appDataFolder`** is the source of truth for app data
- **localStorage** caches app data for instant page loads (read cache only — writes always go to Drive)
- **Saves require a valid token.** If the token is expired, `save()` automatically attempts a silent refresh. If refresh fails, a full-screen overlay blocks the app until the user signs back in. No data is silently lost.
- App content is hidden until the user signs in — show a "Sign in to ..." prompt instead
- On sign-in, data is loaded from Drive (or from localStorage cache if no token is available)
- On sign-out, all local state and caches are cleared and app content is hidden
- Auth state (user identity, token, file IDs, data cache) is shared across all `GoogleDriveStorage` instances on the same page via the `_GDS` global — no need to manually share tokens between instances

### How auth and data flow works

1. **Page load with cached identity + valid token**: User shown as signed in immediately. `loadFromDrive()` loads from Drive, caches locally.
2. **Page load with cached identity + expired token**: User shown as signed in with cached data. GIS library loads in background and attempts silent token refresh. If refresh succeeds, data reloads from Drive. If refresh fails, a full-screen reauth overlay appears prompting the user to sign back in.
3. **Page load with no cached identity**: Sign-in button shown. User signs in interactively, data loads from Drive.
4. **Save with valid token**: Data saved to Drive, then cached in localStorage.
5. **Save with expired token**: `save()` auto-refreshes the token silently. If refresh succeeds, saves transparently. If refresh fails, reauth overlay blocks the app — `save()` returns `false`.

### Auth session persistence

The shared library caches these in `localStorage`:

1. **User info** (`gds-auth-user`) — name and picture, so the signed-in UI renders instantly on page load. Persists until explicit sign-out.
2. **Access token + expiry** (`gds-auth-token`) — Google OAuth tokens last ~1 hour. Used directly if still valid; otherwise a silent refresh is attempted.
3. **Drive file IDs** (`gds-file-<filename>`) — so `loadFromDrive()` skips the file search and reads directly (1 API call instead of 2).
4. **App data cache** (`gds-data-<filename>`) — a copy of the Drive file contents for instant page loads.

**Rules to follow — do NOT violate these:**

- **Never use dirty flags or local-only saves.** Saves must go to Drive or fail visibly. No silent local caching of writes.
- **Never wait for Google's GIS library to load before restoring a cached session.** Cached identity and data are available immediately. GIS is only needed for token requests.
- **Never do a file search (`_findDriveFile`) on every page load.** Cache the Drive file ID after the first lookup. Only re-search if the cached ID fails.
- **Constructor takes only `fileName`.** The library manages its own cache keys internally.
- **Never manually share tokens between instances** (e.g., `photoStorage.accessToken = storage.accessToken`). All instances share auth state automatically via the `_GDS` global.

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

2. Add a `<style>` tag for the auth UI styles and loading state:
   ```html
   <style id="gds-styles"></style>
   <style>
     .loading-state { display: none; text-align: center; padding: 5rem 1.5rem; }
     .loading-spinner {
       width: 24px; height: 24px; border: 2px solid #E8E4DF;
       border-top-color: #C5A46D; border-radius: 50%;
       animation: spin 0.8s linear infinite; margin: 0 auto 0.8rem;
     }
     @keyframes spin { to { transform: rotate(360deg); } }
     .loading-text {
       font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase;
       color: #8A8478; font-weight: 400;
     }
   </style>
   ```

3. Add an auth container, sign-in prompt, loading state, and app content in the HTML:
   ```html
   <div id="authSection"></div>

   <!-- Shown when not signed in -->
   <div class="signin-prompt" id="signinPrompt">
     <p>Sign in to see your data</p>
   </div>

   <!-- Loading state (shown while data loads on first visit) -->
   <div class="loading-state" id="loadingState">
     <div class="loading-spinner"></div>
     <div class="loading-text">Gathering...</div>
   </div>

   <!-- Hidden until signed in -->
   <div id="appContent" style="display:none;">
     <!-- Your app content here -->
   </div>
   ```

4. In your app's JavaScript, declare ALL state variables and storage instances BEFORE calling `renderAuthUI`. The `onSignIn` callback is called synchronously during initialization, so any variables it references must already be declared.

   ```javascript
   // --- State (MUST be declared before renderAuthUI) ---
   let myData = defaultValue;

   // --- Storage instances (MUST be declared before renderAuthUI) ---
   const storage = new GoogleDriveStorage('my-app-data.json');

   // Inject the auth UI styles
   document.getElementById('gds-styles').textContent = GoogleDriveStorage.getStyles();

   // Render the sign-in/sign-out UI
   // NOTE: onSignIn may be called more than once (once with cached data on
   // page load, again after a background token refresh loads fresh Drive data).
   // This is normal — treat it as idempotent.
   storage.renderAuthUI(document.getElementById('authSection'), {
     onSignIn: async () => {
       // Try cached data first for instant render (no spinner)
       var cached = storage.getCachedData();

       if (cached !== null) {
         // Cache hit — show instantly, then refresh from Drive in background
         myData = cached;
         document.getElementById('signinPrompt').style.display = 'none';
         document.getElementById('loadingState').style.display = 'none';
         document.getElementById('appContent').style.display = 'block';
         render();

         // Background refresh from Drive
         var fresh = await storage.loadFromDrive();
         if (fresh !== null) { myData = fresh; render(); }
       } else {
         // No cache — show loading spinner while loading from Drive
         document.getElementById('signinPrompt').style.display = 'none';
         document.getElementById('appContent').style.display = 'none';
         document.getElementById('loadingState').style.display = 'block';

         myData = await storage.loadFromDrive() || defaultValue;

         document.getElementById('loadingState').style.display = 'none';
         document.getElementById('appContent').style.display = 'block';
         render();
       }
     },
     onSignOut: () => {
       myData = defaultValue;
       document.getElementById('loadingState').style.display = 'none';
       document.getElementById('appContent').style.display = 'none';
       document.getElementById('signinPrompt').style.display = 'block';
     }
   });

   // Save data (caches locally + writes to Drive if token available)
   storage.save(myData);
   ```

### Important notes

- **Every piece of app data that needs to persist MUST be stored in Google Drive** via a `GoogleDriveStorage` instance. If you're adding a new data model (e.g., photos, settings, categories), create a new `GoogleDriveStorage('my-app-newmodel.json')` instance for it and use `save()` / `loadFromDrive()`. Do not store data only in JavaScript variables or only in localStorage — it must round-trip through Drive.
- Each app MUST use a **unique file name** for its Drive file (e.g., `outdoor-hours-data.json`, `budget-data.json`)
- **Do not manually manage localStorage for app data.** The shared library handles all caching (data, auth, file IDs) internally.
- **Declare ALL state variables and `GoogleDriveStorage` instances BEFORE calling `renderAuthUI`.** The `onSignIn` callback runs synchronously during `_initAuth`, so any variable it references must already be initialized — otherwise you get a temporal dead zone `ReferenceError`.
- **Always use cache-first rendering in `onSignIn`.** Check `storage.getCachedData()` first. If cached data exists, render instantly (no spinner), then refresh from Drive in the background. Only show the loading spinner on first visit when no cache exists.
- App content must be **hidden until the user signs in** — show a friendly sign-in prompt instead
- On sign-out, **clear all in-memory state**, hide app content AND the loading state, and show the sign-in prompt. The shared library clears all `gds-*` localStorage keys automatically.
- The sign-in button, sync status, and reauth overlay are handled automatically by the shared library
- The OAuth Client ID is configured for the origin `https://sethjones348.github.io` — no per-app setup needed
- Multiple pages in the same app (e.g., `index.html` and `album.html`) each create their own `GoogleDriveStorage` instance — this is fine, they share the same auth state via the `_GDS` global and the same cached token via localStorage
- Multiple `GoogleDriveStorage` instances on the same page (e.g., one for data, one for photos) share auth state automatically — do not manually copy tokens between instances

## Running an Existing App

To work on an existing app, `cd` into its directory under `apps/` and follow the instructions in its README.md.

## Tech Stack Defaults

When no specific tech is requested, use these defaults:
- **Web app:** Vite + React + TypeScript
- **Mobile app:** Expo (React Native) + TypeScript
- **API/backend:** Node.js + Express + TypeScript

These are just defaults — always use whatever the user asks for instead.
