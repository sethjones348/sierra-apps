/**
 * Google Drive Storage — shared helper for Sierra Apps.
 *
 * Provides Google Sign-In + Google Drive appDataFolder storage.
 * Each app gets its own file in the user's hidden appDataFolder.
 *
 * Dependencies:
 *   1. <script src="https://accounts.google.com/gsi/client" async defer></script>
 *   2. <script src="/sierra-apps/shared/config.js"></script>
 *   3. <script src="/sierra-apps/shared/google-drive-storage.js"></script>
 *
 * Usage:
 *   const storage = new GoogleDriveStorage('my-app-data.json');
 *
 *   // Render auth UI
 *   storage.renderAuthUI(document.getElementById('authContainer'), {
 *     onSignIn: () => { ... },
 *     onSignOut: () => { ... },
 *     onSyncStatus: (msg, isError) => { ... }
 *   });
 *
 *   // Save data (saves locally + syncs to Drive if signed in)
 *   await storage.save(myDataObject);
 *
 *   // Load data (loads from local, then merges with Drive if signed in)
 *   const data = storage.loadLocal();
 *
 *   // Sync from Drive (call after sign-in)
 *   const driveData = await storage.syncFromDrive();
 */

class GoogleDriveStorage {
  constructor(fileName, localStorageKey) {
    this.fileName = fileName;
    this.localStorageKey = localStorageKey || fileName.replace('.json', '');
    this.accessToken = null;
    this.driveFileId = null;
    this.tokenClient = null;
    this.currentUser = null;
    this.isSyncing = false;
    this.callbacks = {};
    this._userCacheKey = 'gds-auth-user';
  }

  // =============================================
  // Auth UI
  // =============================================

  /**
   * Renders a sign-in/sign-out UI into the given container element.
   * callbacks: { onSignIn, onSignOut, onSyncStatus(msg, isError) }
   */
  renderAuthUI(container, callbacks) {
    this.callbacks = callbacks || {};
    this.authContainer = container;

    container.innerHTML =
      '<div class="gds-signed-out" id="gds-signed-out">' +
        '<button class="gds-signin-btn" id="gds-signin-btn">' +
          '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>' +
          ' Sign in with Google' +
        '</button>' +
        '<span class="gds-hint">Sync your data across devices</span>' +
      '</div>' +
      '<div class="gds-signed-in" id="gds-signed-in" style="display:none;">' +
        '<div class="gds-user-info">' +
          '<img class="gds-avatar" id="gds-avatar" src="" alt="">' +
          '<span class="gds-name" id="gds-name"></span>' +
        '</div>' +
        '<button class="gds-signout-btn" id="gds-signout-btn">Sign Out</button>' +
      '</div>' +
      '<div class="gds-sync-status" id="gds-sync-status"></div>';

    container.querySelector('#gds-signin-btn').addEventListener('click', () => this.signIn());
    container.querySelector('#gds-signout-btn').addEventListener('click', () => this.signOut());
    container.querySelector('#gds-sync-status').addEventListener('click', () => {
      if (this._needsReconnect) this._reconnect();
    });

    this._initAuth();
  }

  /**
   * Returns a <style> block with default styles for the auth UI.
   * Include this in your app's <head> or inline it.
   */
  static getStyles() {
    return `
      .gds-signed-out { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; }
      .gds-hint { font-size: 0.7rem; color: #8A8478; letter-spacing: 0.1em; }
      .gds-signin-btn {
        display: inline-flex; align-items: center; gap: 0.6rem;
        font-family: 'DM Sans', sans-serif; font-size: 0.8rem; font-weight: 400;
        letter-spacing: 0.08em; border: 1px solid #D5D0CA; background: #FFFFFF;
        color: #2C2C2C; padding: 0.65rem 1.5rem; border-radius: 30px;
        cursor: pointer; transition: all 0.2s ease; min-height: 44px;
      }
      .gds-signin-btn:active { background: #F5F3F0; }
      .gds-signed-in { display: flex; align-items: center; justify-content: center; gap: 0.8rem; }
      .gds-user-info { display: flex; align-items: center; gap: 0.5rem; }
      .gds-avatar { width: 28px; height: 28px; border-radius: 50%; }
      .gds-name { font-size: 0.75rem; color: #8A8478; letter-spacing: 0.05em; }
      .gds-signout-btn {
        font-family: 'DM Sans', sans-serif; font-size: 0.65rem; letter-spacing: 0.12em;
        text-transform: uppercase; background: none; border: none; color: #C4A68A;
        cursor: pointer; padding: 0.3rem 0.5rem; min-height: 44px;
        display: flex; align-items: center; transition: opacity 0.2s ease;
      }
      .gds-signout-btn:active { opacity: 0.5; }
      .gds-sync-status { font-size: 0.65rem; color: #A3A88E; letter-spacing: 0.08em; margin-top: 0.4rem; text-align: center; min-height: 44px; display: flex; align-items: center; justify-content: center; }
      .gds-sync-status.error { color: #C4A68A; }
      .gds-sync-status.reconnect { color: #C5A46D; cursor: pointer; text-decoration: underline; }
    `;
  }

  // =============================================
  // Auth internals
  // =============================================

  _initAuth() {
    if (typeof google === 'undefined' || !google.accounts) {
      setTimeout(() => this._initAuth(), 200);
      return;
    }

    const clientId = (window.SIERRA_CONFIG && window.SIERRA_CONFIG.GOOGLE_CLIENT_ID) || '';
    if (!clientId || clientId === 'YOUR_CLIENT_ID_HERE') {
      this._setSyncStatus('Google Client ID not configured', true);
      return;
    }

    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.profile',
      callback: (response) => this._handleTokenResponse(response),
    });

    // Try restoring cached session (show UI only — no popup on load)
    const cached = localStorage.getItem(this._userCacheKey);
    if (cached) {
      try {
        this.currentUser = JSON.parse(cached);
        this._showSignedIn();
        this._setSyncStatus('Tap to reconnect to Google Drive', false, true);
        this._needsReconnect = true;
      } catch (e) {
        localStorage.removeItem(this._userCacheKey);
      }
    }
  }

  signIn() {
    if (!this.tokenClient) {
      this._setSyncStatus('Google Sign-In not ready. Please wait...', true);
      return;
    }
    this.tokenClient.requestAccessToken({ prompt: 'consent' });
  }

  _reconnect() {
    if (!this.tokenClient) return;
    this._needsReconnect = false;
    this._setSyncStatus('Reconnecting...');
    this.tokenClient.requestAccessToken({ prompt: '' });
  }

  signOut() {
    if (this.accessToken) {
      google.accounts.oauth2.revoke(this.accessToken);
    }
    this.accessToken = null;
    this.driveFileId = null;
    this.currentUser = null;
    this._needsReconnect = false;
    localStorage.removeItem(this._userCacheKey);
    this._showSignedOut();
    this._setSyncStatus('');
    if (this.callbacks.onSignOut) this.callbacks.onSignOut();
  }

  _handleTokenResponse(response) {
    if (response.error) {
      if (response.error === 'access_denied') this.signOut();
      return;
    }

    this.accessToken = response.access_token;

    fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: 'Bearer ' + this.accessToken }
    })
    .then(r => r.json())
    .then(profile => {
      this.currentUser = {
        name: profile.given_name || profile.name,
        picture: profile.picture
      };
      localStorage.setItem(this._userCacheKey, JSON.stringify(this.currentUser));
      this._showSignedIn();
      if (this.callbacks.onSignIn) this.callbacks.onSignIn();
    })
    .catch(() => {
      this._setSyncStatus('Could not fetch profile', true);
    });
  }

  _showSignedIn() {
    if (!this.authContainer) return;
    this.authContainer.querySelector('#gds-signed-out').style.display = 'none';
    this.authContainer.querySelector('#gds-signed-in').style.display = 'flex';
    if (this.currentUser) {
      this.authContainer.querySelector('#gds-name').textContent = this.currentUser.name;
      const avatar = this.authContainer.querySelector('#gds-avatar');
      if (this.currentUser.picture) {
        avatar.src = this.currentUser.picture;
        avatar.style.display = 'block';
      } else {
        avatar.style.display = 'none';
      }
    }
  }

  _showSignedOut() {
    if (!this.authContainer) return;
    this.authContainer.querySelector('#gds-signed-out').style.display = 'flex';
    this.authContainer.querySelector('#gds-signed-in').style.display = 'none';
  }

  _setSyncStatus(msg, isError, isReconnect) {
    if (!this.authContainer) return;
    const el = this.authContainer.querySelector('#gds-sync-status');
    if (el) {
      el.textContent = msg;
      el.className = 'gds-sync-status' + (isError ? ' error' : '') + (isReconnect ? ' reconnect' : '');
    }
    if (this.callbacks.onSyncStatus) this.callbacks.onSyncStatus(msg, isError);
  }

  // =============================================
  // Local storage
  // =============================================

  loadLocal() {
    try {
      const raw = localStorage.getItem(this.localStorageKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  saveLocal(data) {
    localStorage.setItem(this.localStorageKey, JSON.stringify(data));
  }

  // =============================================
  // Save (local + Drive)
  // =============================================

  async save(data) {
    this.saveLocal(data);
    if (this.accessToken) {
      await this._syncToDrive(data);
    }
  }

  // =============================================
  // Drive API
  // =============================================

  async _driveRequest(url, options) {
    options = options || {};
    options.headers = options.headers || {};
    options.headers['Authorization'] = 'Bearer ' + this.accessToken;
    const r = await fetch(url, options);
    if (r.status === 401) {
      // Try silent token refresh
      await new Promise((resolve, reject) => {
        const oldToken = this.accessToken;
        this.tokenClient.requestAccessToken({ prompt: '' });
        const check = setInterval(() => {
          if (this.accessToken && this.accessToken !== oldToken) {
            clearInterval(check);
            resolve();
          }
        }, 500);
        setTimeout(() => { clearInterval(check); reject(new Error('Token refresh timeout')); }, 10000);
      });
      options.headers['Authorization'] = 'Bearer ' + this.accessToken;
      return fetch(url, options);
    }
    return r;
  }

  async _findDriveFile() {
    const query = encodeURIComponent("name='" + this.fileName + "' and trashed=false");
    const res = await this._driveRequest(
      'https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=' + query + '&fields=files(id,name)'
    );
    const data = await res.json();
    return (data.files && data.files.length > 0) ? data.files[0].id : null;
  }

  async _readDriveFile(fileId) {
    const res = await this._driveRequest(
      'https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media'
    );
    return res.json();
  }

  async _createDriveFile(data) {
    const metadata = { name: this.fileName, parents: ['appDataFolder'] };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    const res = await this._driveRequest(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
      { method: 'POST', body: form }
    );
    const result = await res.json();
    return result.id;
  }

  async _updateDriveFile(fileId, data) {
    await this._driveRequest(
      'https://www.googleapis.com/upload/drive/v3/files/' + fileId + '?uploadType=media',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }
    );
  }

  // =============================================
  // Sync
  // =============================================

  /**
   * Load data directly from Drive (Drive as single source of truth).
   * Returns the data from Drive, or null if no file exists yet.
   */
  async loadFromDrive() {
    if (!this.accessToken) return null;
    this._setSyncStatus('Loading...');

    try {
      this.driveFileId = await this._findDriveFile();

      if (this.driveFileId) {
        const data = await this._readDriveFile(this.driveFileId);
        this._setSyncStatus('Connected to Google Drive');
        return data;
      } else {
        this._setSyncStatus('Connected to Google Drive');
        return null;
      }
    } catch (e) {
      console.error('Drive load error:', e);
      this._setSyncStatus('Failed to load from Drive', true);
      return null;
    }
  }

  /**
   * Pull data from Drive, merge with provided local data, and return merged result.
   * Also pushes merged data back to Drive.
   * mergeFunction(local, remote) should return the merged data.
   */
  async syncFromDrive(localData, mergeFunction) {
    if (!this.accessToken || this.isSyncing) return localData;
    this.isSyncing = true;
    this._setSyncStatus('Syncing...');

    try {
      this.driveFileId = await this._findDriveFile();

      if (this.driveFileId) {
        const driveData = await this._readDriveFile(this.driveFileId);
        const merged = mergeFunction ? mergeFunction(localData, driveData) : driveData;
        this.saveLocal(merged);
        await this._updateDriveFile(this.driveFileId, merged);
        this._setSyncStatus('Synced with Google Drive');
        this.isSyncing = false;
        return merged;
      } else {
        // No file on Drive yet — upload local data
        if (localData && ((Array.isArray(localData) && localData.length > 0) || (!Array.isArray(localData) && Object.keys(localData).length > 0))) {
          this.driveFileId = await this._createDriveFile(localData);
          this._setSyncStatus('Synced with Google Drive');
        } else {
          this._setSyncStatus('Connected to Google Drive');
        }
        this.isSyncing = false;
        return localData;
      }
    } catch (e) {
      console.error('Drive sync error:', e);
      this._setSyncStatus('Sync failed — using local data', true);
      this.isSyncing = false;
      return localData;
    }
  }

  async _syncToDrive(data) {
    if (!this.accessToken || this.isSyncing) return;
    this.isSyncing = true;

    try {
      if (this.driveFileId) {
        await this._updateDriveFile(this.driveFileId, data);
      } else {
        this.driveFileId = await this._createDriveFile(data);
      }
      this._setSyncStatus('Synced with Google Drive');
    } catch (e) {
      console.error('Drive save error:', e);
      this._setSyncStatus('Sync failed — saved locally', true);
    }

    this.isSyncing = false;
  }

  /** Returns true if the user is currently signed in with a valid token. */
  isSignedIn() {
    return !!this.accessToken;
  }
}
