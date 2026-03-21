# Sierra Apps

This is a multi-app monorepo. It holds one or many independent apps — web apps, mobile apps, or anything else.

## Repo Structure

```
sierra-apps/
├── apps/                  # All apps live here, one directory per app
│   ├── my-web-app/        # Example: a web app
│   ├── budget-tracker/    # Example: another app
│   └── ...
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
- **Git:** Commit meaningful changes with clear messages. Don't bundle unrelated app changes in one commit. Pushing directly to `main` is fine in this repo.

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

### Mobile-first design

Since the user will mostly view apps on their phone:
- Design for small screens first (responsive CSS)
- Use large tap targets (min 44x44px) for buttons and links
- Use readable font sizes (min 16px body text)
- Avoid hover-dependent interactions
- Test that layouts work well in a narrow viewport

## Running an Existing App

To work on an existing app, `cd` into its directory under `apps/` and follow the instructions in its README.md.

## Tech Stack Defaults

When no specific tech is requested, use these defaults:
- **Web app:** Vite + React + TypeScript
- **Mobile app:** Expo (React Native) + TypeScript
- **API/backend:** Node.js + Express + TypeScript

These are just defaults — always use whatever the user asks for instead.
