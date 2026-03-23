/**
 * Google Drive Storage — shared helper for Sierra Apps.
 *
 * Google Drive is the single source of truth.
 * Sign in to see your data. Sign out to hide it.
 * Access token is cached in localStorage so page refreshes and
 * navigations don't require re-authentication (~1 hour token lifetime).
 *
 * Dependencies:
 *   1. <script src="https://accounts.google.com/gsi/client" async defer></script>
 *   2. <script src="/sierra-apps/shared/config.js"></script>
 *   3. <script src="/sierra-apps/shared/google-drive-storage.js"></script>
 */

class GoogleDriveStorage {
  constructor(fileName) {
    this.fileName = fileName;
    this.accessToken = null;
    this.driveFileId = null;
    this.tokenClient = null;
    this.currentUser = null;
    this.callbacks = {};
    this._userCacheKey = 'gds-auth-user';
    this._tokenCacheKey = 'gds-auth-token';
    this._fileIdCacheKey = 'gds-file-' + fileName;
  }

  // =============================================
  // Auth UI
  // =============================================

  renderAuthUI(container, callbacks) {
    this.callbacks = callbacks || {};
    this.authContainer = container;

    container.innerHTML =
      '<div class="gds-signed-out" id="gds-signed-out">' +
        '<button class="gds-signin-btn" id="gds-signin-btn">' +
          '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>' +
          ' Sign in with Google' +
        '</button>' +
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

    this._initAuth();
  }

  static getStyles() {
    return `
      .gds-signed-out { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; }
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
    `;
  }

  // =============================================
  // Auth internals
  // =============================================

  _initAuth() {
    // Try to restore session from cached token immediately (no GIS library needed)
    var cachedUser = null;
    var cachedToken = null;
    try {
      var userRaw = localStorage.getItem(this._userCacheKey);
      var tokenRaw = localStorage.getItem(this._tokenCacheKey);
      if (userRaw) cachedUser = JSON.parse(userRaw);
      if (tokenRaw) cachedToken = JSON.parse(tokenRaw);
    } catch (e) {
      localStorage.removeItem(this._userCacheKey);
      localStorage.removeItem(this._tokenCacheKey);
    }

    // Restore cached Drive file ID
    var cachedFileId = localStorage.getItem(this._fileIdCacheKey);
    if (cachedFileId) this.driveFileId = cachedFileId;

    if (cachedUser && cachedToken && cachedToken.expiresAt > Date.now()) {
      // Cached token is still valid — use it directly, no auth request needed
      this.accessToken = cachedToken.accessToken;
      this.currentUser = cachedUser;
      this._showSignedIn();
      if (this.callbacks.onSignIn) this.callbacks.onSignIn();
      // Set up GIS in background for sign-out button
      this._initGIS();
      return;
    }

    if (cachedUser && cachedToken) {
      // User was signed in but token expired — need GIS for silent refresh
      this.currentUser = cachedUser;
      this._showSignedIn();
      this._setSyncStatus('Connecting...');
      this._pendingSilentRefresh = true;
      this._initGIS();
      return;
    }

    // No cached session — need GIS for sign-in button
    localStorage.removeItem(this._userCacheKey);
    localStorage.removeItem(this._tokenCacheKey);
    this._initGIS();
  }

  _initGIS() {
    if (typeof google === 'undefined' || !google.accounts) {
      setTimeout(() => this._initGIS(), 200);
      return;
    }

    var clientId = (window.SIERRA_CONFIG && window.SIERRA_CONFIG.GOOGLE_CLIENT_ID) || '';
    if (!clientId || clientId === 'YOUR_CLIENT_ID_HERE') {
      this._setSyncStatus('Google Client ID not configured', true);
      return;
    }

    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.profile',
      callback: (response) => this._handleTokenResponse(response),
    });

    // If we were waiting to do a silent refresh, do it now
    if (this._pendingSilentRefresh) {
      this._pendingSilentRefresh = false;
      this._silentRefresh = true;
      this.tokenClient.requestAccessToken({ prompt: '' });
    }
  }

  signIn() {
    if (!this.tokenClient) {
      this._setSyncStatus('Google Sign-In not ready', true);
      return;
    }
    this._silentRefresh = false;
    this.tokenClient.requestAccessToken({ prompt: 'consent' });
  }

  signOut() {
    if (this.accessToken) {
      google.accounts.oauth2.revoke(this.accessToken);
    }
    this.accessToken = null;
    this.driveFileId = null;
    this.currentUser = null;
    localStorage.removeItem(this._userCacheKey);
    localStorage.removeItem(this._tokenCacheKey);
    localStorage.removeItem(this._fileIdCacheKey);
    this._showSignedOut();
    this._setSyncStatus('');
    if (this.callbacks.onSignOut) this.callbacks.onSignOut();
  }

  _handleTokenResponse(response) {
    var wasSilent = this._silentRefresh;
    this._silentRefresh = false;

    if (response.error) {
      if (wasSilent) {
        // Silent refresh failed — clear session and show sign-in button
        this.currentUser = null;
        this.accessToken = null;
        localStorage.removeItem(this._userCacheKey);
        localStorage.removeItem(this._tokenCacheKey);
        this._showSignedOut();
        this._setSyncStatus('');
      }
      return;
    }

    this.accessToken = response.access_token;

    // Cache the token with its expiry (typically ~3600 seconds)
    var expiresAt = Date.now() + ((response.expires_in || 3600) * 1000);
    localStorage.setItem(this._tokenCacheKey, JSON.stringify({
      accessToken: this.accessToken,
      expiresAt: expiresAt
    }));

    // Fetch user profile
    fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: 'Bearer ' + this.accessToken }
    })
    .then(function(r) { return r.json(); })
    .then(function(profile) {
      this.currentUser = {
        name: profile.given_name || profile.name,
        picture: profile.picture
      };
      localStorage.setItem(this._userCacheKey, JSON.stringify(this.currentUser));
      this._showSignedIn();
      if (this.callbacks.onSignIn) this.callbacks.onSignIn();
    }.bind(this))
    .catch(function() {
      // Token works but profile fetch failed — still sign in
      if (!this.currentUser) {
        this.currentUser = { name: 'Signed In', picture: '' };
      }
      localStorage.setItem(this._userCacheKey, JSON.stringify(this.currentUser));
      this._showSignedIn();
      if (this.callbacks.onSignIn) this.callbacks.onSignIn();
    }.bind(this));
  }

  _showSignedIn() {
    if (!this.authContainer) return;
    this.authContainer.querySelector('#gds-signed-out').style.display = 'none';
    this.authContainer.querySelector('#gds-signed-in').style.display = 'flex';
    if (this.currentUser) {
      this.authContainer.querySelector('#gds-name').textContent = this.currentUser.name;
      var avatar = this.authContainer.querySelector('#gds-avatar');
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

  _setSyncStatus(msg, isError) {
    if (!this.authContainer) return;
    var el = this.authContainer.querySelector('#gds-sync-status');
    if (el) {
      el.textContent = msg;
      el.className = 'gds-sync-status' + (isError ? ' error' : '');
    }
  }

  // =============================================
  // Save (Drive only)
  // =============================================

  async save(data) {
    if (!this.accessToken) return;

    try {
      if (this.driveFileId) {
        await this._updateDriveFile(this.driveFileId, data);
      } else {
        this.driveFileId = await this._createDriveFile(data);
        localStorage.setItem(this._fileIdCacheKey, this.driveFileId);
      }
      this._setSyncStatus('Saved');
    } catch (e) {
      console.error('Drive save error:', e);
      if (e.message === 'token_expired') {
        this._onTokenExpired();
      } else {
        this._setSyncStatus('Save failed', true);
      }
    }
  }

  // =============================================
  // Drive API
  // =============================================

  async _driveRequest(url, options) {
    options = options || {};
    options.headers = options.headers || {};
    options.headers['Authorization'] = 'Bearer ' + this.accessToken;
    var r = await fetch(url, options);
    if (r.status === 401) {
      // Token was revoked or is invalid — clear it
      this.accessToken = null;
      localStorage.removeItem(this._tokenCacheKey);
      throw new Error('token_expired');
    }
    return r;
  }

  _onTokenExpired() {
    this.accessToken = null;
    localStorage.removeItem(this._tokenCacheKey);
    this._setSyncStatus('Session expired — please sign in again', true);
  }

  async _findDriveFile() {
    var query = encodeURIComponent("name='" + this.fileName + "' and trashed=false");
    var res = await this._driveRequest(
      'https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=' + query + '&fields=files(id,name)'
    );
    var data = await res.json();
    return (data.files && data.files.length > 0) ? data.files[0].id : null;
  }

  async _readDriveFile(fileId) {
    var res = await this._driveRequest(
      'https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media'
    );
    return res.json();
  }

  async _createDriveFile(data) {
    var metadata = { name: this.fileName, parents: ['appDataFolder'] };
    var form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    var res = await this._driveRequest(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
      { method: 'POST', body: form }
    );
    var result = await res.json();
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
  // Load from Drive
  // =============================================

  async loadFromDrive() {
    if (!this.accessToken) return null;
    this._setSyncStatus('Loading...');

    try {
      // Use cached file ID if available, otherwise search for it
      if (!this.driveFileId) {
        this.driveFileId = await this._findDriveFile();
        if (this.driveFileId) {
          localStorage.setItem(this._fileIdCacheKey, this.driveFileId);
        }
      }

      if (this.driveFileId) {
        var data = await this._readDriveFile(this.driveFileId);
        this._setSyncStatus('');
        return data;
      } else {
        this._setSyncStatus('');
        return null;
      }
    } catch (e) {
      console.error('Drive load error:', e);
      if (e.message === 'token_expired') {
        this._onTokenExpired();
      } else {
        // If cached file ID was stale, clear it and retry once
        if (this.driveFileId && localStorage.getItem(this._fileIdCacheKey)) {
          localStorage.removeItem(this._fileIdCacheKey);
          this.driveFileId = null;
          return this.loadFromDrive();
        }
        this._setSyncStatus('Failed to load', true);
      }
      return null;
    }
  }

  isSignedIn() {
    return !!this.accessToken;
  }
}
