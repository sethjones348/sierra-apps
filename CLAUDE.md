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
- **Git:** Commit meaningful changes with clear messages. Don't bundle unrelated app changes in one commit.

## Running an Existing App

To work on an existing app, `cd` into its directory under `apps/` and follow the instructions in its README.md.

## Tech Stack Defaults

When no specific tech is requested, use these defaults:
- **Web app:** Vite + React + TypeScript
- **Mobile app:** Expo (React Native) + TypeScript
- **API/backend:** Node.js + Express + TypeScript

These are just defaults — always use whatever the user asks for instead.
