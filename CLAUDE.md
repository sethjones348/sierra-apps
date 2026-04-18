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

## Persistent Storage (Firebase)

All apps use **Firebase Auth (Google sign-in) + Firebase Storage** for persistence. Firebase Storage is the source of truth (one JSON file per dataset), and localStorage is a read-only cache for instant page loads.

The Firebase project is **`sierra-apps-af32e`**. Config lives in `shared/config.js` under `window.SIERRA_CONFIG.FIREBASE`.

### Why Firebase Storage instead of Firestore

Apps store one JSON blob per dataset, often containing inlined photos. Firestore documents cap at 1 MB which is too small. Firebase Storage has a 5 GB per-object limit (Blaze tier), so we keep the same "one JSON file per dataset" model the old Drive code used. Apps need no structural changes to their data.

### Architecture

- **Firebase Storage** at `users/{uid}/{fileName}` is the source of truth
- **localStorage** caches app data for instant page loads (read cache only — writes always go to Firebase)
- **Firebase Auth** (Google provider) handles sign-in. Firebase persists sessions via its own LOCAL persistence — no manual token refresh needed.
- App content is hidden until the user signs in — show a "Sign in to ..." prompt instead
- On sign-in, data is loaded from Firebase Storage (or from localStorage cache for instant render)
- On sign-out, all local state and caches are cleared and app content is hidden
- Auth state is shared across all `FirebaseStorage` instances on the same page via the `_FBS` global

### How auth and data flow works

1. **Page load with cached identity**: User shown as signed in immediately from `fbs-auth-user` cache. `onSignIn` fires once from cache (renders cached data), then again once Firebase Auth rehydrates (refreshes from Firebase).
2. **Page load with no cached identity**: Sign-in button shown. After click, `signInWithPopup` runs, then `onSignIn` fires.
3. **Save**: Always writes to Firebase Storage. Returns `false` and shows a "Save failed" status on error. No silent caching of failed writes.
4. **Token expiry**: Firebase SDK refreshes its own ID tokens silently behind the scenes. If the user has been gone long enough that the refresh token is invalid, the next save throws and `onAuthStateChanged` fires with `user: null` — the app sees `onSignOut` and shows the sign-in prompt.

### localStorage keys the library uses

- **`fbs-auth-user`** — name and picture, so the signed-in UI renders instantly. Cleared on explicit sign-out.
- **`fbs-data-<filename>`** — copy of the Firebase Storage file for instant page loads.

(Firebase Auth manages its own keys under `firebase:authUser:*`.)

### Rules to follow — do NOT violate these

- **Never use dirty flags or local-only saves.** Saves must go to Firebase or fail visibly. No silent local caching of writes.
- **Never wait for Firebase to initialize before showing the cached UI.** Cached identity and data are available immediately on page load.
- **Constructor takes only `fileName`.** The library manages its own cache keys internally.
- **Never manually share auth state between instances.** All instances share auth automatically via the `_FBS` global.

### Shared libraries

Two shared files in `shared/` provide everything needed:

1. **`shared/config.js`** — `SIERRA_CONFIG.FIREBASE` web app config
2. **`shared/firebase-storage.js`** — `FirebaseStorage` class that handles auth UI, sign-in/out, and Firebase Storage read/write

### How to add storage to a new app

1. Add these script tags to the app's `<head>` (in this order):
   ```html
   <script src="https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/11.6.0/firebase-auth-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/11.6.0/firebase-storage-compat.js"></script>
   <script src="/sierra-apps/shared/config.js"></script>
   <script src="/sierra-apps/shared/firebase-storage.js"></script>
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

   <div class="signin-prompt" id="signinPrompt">
     <p>Sign in to see your data</p>
   </div>

   <div class="loading-state" id="loadingState">
     <div class="loading-spinner"></div>
     <div class="loading-text">Gathering...</div>
   </div>

   <div id="appContent" style="display:none;">
     <!-- Your app content here -->
   </div>
   ```

4. In your app's JavaScript, declare ALL state variables and storage instances BEFORE calling `renderAuthUI`:

   ```javascript
   let myData = defaultValue;

   const storage = new FirebaseStorage('my-app-data.json');

   document.getElementById('gds-styles').textContent = FirebaseStorage.getStyles();

   // NOTE: onSignIn may be called more than once (once with cached identity on
   // page load, again after Firebase Auth rehydrates). Treat it as idempotent.
   storage.renderAuthUI(document.getElementById('authSection'), {
     onSignIn: async () => {
       var cached = storage.getCachedData();
       if (cached !== null) {
         myData = cached;
         document.getElementById('signinPrompt').style.display = 'none';
         document.getElementById('loadingState').style.display = 'none';
         document.getElementById('appContent').style.display = 'block';
         render();
         var fresh = await storage.load();
         if (fresh !== null) { myData = fresh; render(); }
       } else {
         document.getElementById('signinPrompt').style.display = 'none';
         document.getElementById('appContent').style.display = 'none';
         document.getElementById('loadingState').style.display = 'block';
         myData = await storage.load() || defaultValue;
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

   storage.save(myData);
   ```

### Important notes

- **Every piece of app data that needs to persist MUST be stored in Firebase Storage** via a `FirebaseStorage` instance. If you're adding a new data model (e.g., photos, settings, categories), create a new `FirebaseStorage('my-app-newmodel.json')` instance for it and use `save()` / `load()`.
- Each app MUST use a **unique file name** for its Firebase Storage file
- **Do not manually manage localStorage for app data.** The shared library handles all caching internally.
- **Declare ALL state variables and `FirebaseStorage` instances BEFORE calling `renderAuthUI`.** The `onSignIn` callback may run synchronously during initialization.
- **Always use cache-first rendering in `onSignIn`.** Check `storage.getCachedData()` first.
- App content must be **hidden until the user signs in** — show a friendly sign-in prompt instead
- On sign-out, **clear all in-memory state**, hide app content AND the loading state, and show the sign-in prompt. The shared library clears all `fbs-*` localStorage keys automatically.
- Multiple pages in the same app each create their own `FirebaseStorage` instance — this is fine, they share auth state via the `_FBS` global
- Multiple `FirebaseStorage` instances on the same page share auth state automatically

### Drive→Firebase migration

For users with existing Google Drive data from the old `GoogleDriveStorage` library, there's a one-time migration page at `/sierra-apps/migrate.html`. It signs the user into Google with both Firebase Auth and Drive `appdata` scopes, then copies each known JSON file from Drive to Firebase Storage. Drive files are not deleted, so the original data remains as a backup.

### Firebase project management

The Firebase project is `sierra-apps-af32e`. Common admin tasks:

```bash
firebase deploy --only firestore:rules,storage  # deploy security rules
firebase apps:sdkconfig WEB                     # show web app config
gcloud storage buckets describe gs://sierra-apps-af32e.firebasestorage.app  # bucket info
```

`firestore.rules`, `storage.rules`, `firebase.json`, and `.firebaserc` live at the repo root.

## Running an Existing App

To work on an existing app, `cd` into its directory under `apps/` and follow the instructions in its README.md.

## Tech Stack Defaults

When no specific tech is requested, use these defaults:
- **Web app:** Vite + React + TypeScript
- **Mobile app:** Expo (React Native) + TypeScript
- **API/backend:** Node.js + Express + TypeScript

These are just defaults — always use whatever the user asks for instead.
