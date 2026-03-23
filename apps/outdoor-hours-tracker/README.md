# Outdoor Hours Tracker

Track how much time you spend outside. Features a stopwatch for real-time tracking and manual entry for logging past hours.

## Features

- **Stopwatch** — Start, pause, resume, and save timed outdoor sessions
- **Log past hours** — Manually add entries with date, duration, and an optional note
- **Running total** — See your all-time hours and weekly summary at a glance
- **History** — View, review, and delete individual entries
- **Google Drive sync** — Sign in with Google to back up your data to Google Drive
- **Offline-first** — Works without sign-in using local storage; Drive sync is optional

## How to run

Open `index.html` in a browser. No build step or dependencies required.

## Google Drive Setup

To enable the "Sign in with Google" feature, you need a Google OAuth Client ID (free, ~5 minutes):

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** > **New Project**, name it anything (e.g. "Outdoor Hours"), and create it
3. In the left sidebar, go to **APIs & Services** > **Library**
4. Search for **Google Drive API** and click **Enable**
5. Go to **APIs & Services** > **OAuth consent screen**
   - Choose **External** user type
   - Fill in the app name (e.g. "Outdoor Hours") and your email
   - Add the scope: `https://www.googleapis.com/auth/drive.appdata`
   - Add yourself as a test user
6. Go to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **OAuth client ID**
   - Application type: **Web application**
   - Under **Authorized JavaScript origins**, add: `https://sethjones348.github.io`
   - (For local testing, also add: `http://localhost` and `http://localhost:8080`)
   - Click **Create** and copy the Client ID
7. Open `index.html` and replace `YOUR_CLIENT_ID_HERE` with your Client ID

**Note:** While the app is in "Testing" mode on Google Cloud, only users added as test users can sign in. To allow anyone, you'd need to publish the OAuth consent screen (requires Google verification for sensitive scopes).

## Live URL

[https://sethjones348.github.io/sierra-apps/apps/outdoor-hours-tracker/](https://sethjones348.github.io/sierra-apps/apps/outdoor-hours-tracker/)
