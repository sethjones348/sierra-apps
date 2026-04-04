/**
 * Google Drive Storage — shared helper for Sierra Apps.
 *
 * Architecture:
 * - User identity persists in localStorage until explicit sign-out.
 * - Access tokens are short-lived (~1 hour) and refreshed automatically.
 * - App data is cached in localStorage for instant page loads.
 * - Google Drive is the source of truth; localStorage is a read cache.
 * - Saves auto-refresh expired tokens. If refresh fails, a full-screen
 *   overlay blocks the app until the user signs back in.
 *
 * Dependencies:
 *   1. <script src="https://accounts.google.com/gsi/client" async defer></script>
 *   2. <script src="/sierra-apps/shared/config.js"></script>
 *   3. <script src="/sierra-apps/shared/google-drive-storage.js"></script>
 */

var _GDS = {
  user: null,
  accessToken: null,
  tokenExpiry: 0,
  tokenClient: null,
  authUI: null,
  pendingToken: null,
  _resolve: null,
  _reject: null,
  _isSignIn: false,
  _isReconnect: false,
  USER_KEY: 'gds-auth-user',
  TOKEN_KEY: 'gds-auth-token',
};

var _gdsInstances = [];

function _gdsSetStatus(msg, isError) {
  if (_GDS.authUI) _GDS.authUI._setSyncStatus(msg, isError);
}

function _handleGDSToken(response) {
  var isSignIn = _GDS._isSignIn;
  var isReconnect = _GDS._isReconnect;
  _GDS._isSignIn = false;
  _GDS._isReconnect = false;
  _GDS.pendingToken = null;

  if (response.error) {
    if (_GDS._reject) {
      var rej = _GDS._reject;
      _GDS._resolve = null;
      _GDS._reject = null;
      rej(new Error(response.error));
    }
    return;
  }

  // Save token
  _GDS.accessToken = response.access_token;
  _GDS.tokenExpiry = Date.now() + ((response.expires_in || 3600) * 1000);
  try {
    localStorage.setItem(_GDS.TOKEN_KEY, JSON.stringify({
      accessToken: _GDS.accessToken,
      expiresAt: _GDS.tokenExpiry,
    }));
  } catch (e) {}

  if (isSignIn || isReconnect) {
    if (isSignIn) {
      // First sign-in — fetch user profile
      fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: 'Bearer ' + _GDS.accessToken },
      })
        .then(function(r) { return r.json(); })
        .then(function(profile) {
          _GDS.user = {
            name: profile.given_name || profile.name,
            picture: profile.picture,
          };
          localStorage.setItem(_GDS.USER_KEY, JSON.stringify(_GDS.user));
          if (_GDS.authUI) {
            _GDS.authUI._showSignedIn();
            _GDS.authUI._hideReauthOverlay();
            if (_GDS.authUI.callbacks.onSignIn) _GDS.authUI.callbacks.onSignIn();
          }
        })
        .catch(function() {
          _GDS.user = { name: 'Signed In', picture: '' };
          localStorage.setItem(_GDS.USER_KEY, JSON.stringify(_GDS.user));
          if (_GDS.authUI) {
            _GDS.authUI._showSignedIn();
            _GDS.authUI._hideReauthOverlay();
            if (_GDS.authUI.callbacks.onSignIn) _GDS.authUI.callbacks.onSignIn();
          }
        });
    } else {
      // Reconnect — dismiss overlay, reload data
      if (_GDS.authUI) {
        _GDS.authUI._hideReauthOverlay();
        _gdsSetStatus('');
        if (_GDS.authUI.callbacks.onSignIn) _GDS.authUI.callbacks.onSignIn();
      }
    }
    return;
  }

  // Silent refresh — resolve the promise
  if (_GDS._resolve) {
    var res = _GDS._resolve;
    _GDS._resolve = null;
    _GDS._reject = null;
    res();
  }
}

class GoogleDriveStorage {
  constructor(fileName) {
    this.fileName = fileName;
    this._fileIdCacheKey = 'gds-file-' + fileName;
    this._dataCacheKey = 'gds-data-' + fileName;
    this.driveFileId = localStorage.getItem(this._fileIdCacheKey) || null;
    this.callbacks = {};
    this.authContainer = null;
    _gdsInstances.push(this);
  }

  // =============================================
  // Auth UI
  // =============================================

  renderAuthUI(container, callbacks) {
    this.callbacks = callbacks || {};
    this.authContainer = container;
    _GDS.authUI = this;

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

    // Reauth overlay (inserted once, hidden by default)
    if (!document.getElementById('gds-reauth-overlay')) {
      var overlay = document.createElement('div');
      overlay.id = 'gds-reauth-overlay';
      overlay.className = 'gds-reauth-overlay';
      overlay.style.display = 'none';
      overlay.innerHTML =
        '<div class="gds-reauth-content">' +
          '<div class="gds-reauth-title">Session Expired</div>' +
          '<div class="gds-reauth-msg">Sign in again to keep saving</div>' +
          '<button class="gds-signin-btn" id="gds-reauth-btn">' +
            '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>' +
            ' Sign in with Google' +
          '</button>' +
        '</div>';
      document.body.appendChild(overlay);
      overlay.querySelector('#gds-reauth-btn').addEventListener('click', () => this._reconnect());
    }

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
      .gds-sync-status { font-size: 0.65rem; color: #A3A88E; letter-spacing: 0.08em; margin-top: 0.4rem; text-align: center; min-height: 1em; }
      .gds-sync-status.error { color: #C4A68A; font-weight: 500; }
      .gds-reauth-overlay {
        position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10000;
        background: rgba(250, 248, 245, 0.95); display: flex; align-items: center;
        justify-content: center;
      }
      .gds-reauth-content { text-align: center; padding: 2rem; }
      .gds-reauth-title {
        font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: 400;
        color: #2C2C2C; margin-bottom: 0.6rem;
      }
      .gds-reauth-msg {
        font-size: 0.8rem; color: #8A8478; letter-spacing: 0.05em; margin-bottom: 1.5rem;
      }
    `;
  }

  // =============================================
  // Auth internals
  // =============================================

  _initAuth() {
    try {
      var userRaw = localStorage.getItem(_GDS.USER_KEY);
      if (userRaw) _GDS.user = JSON.parse(userRaw);
    } catch (e) {
      localStorage.removeItem(_GDS.USER_KEY);
    }

    try {
      var tokenRaw = localStorage.getItem(_GDS.TOKEN_KEY);
      if (tokenRaw) {
        var tokenData = JSON.parse(tokenRaw);
        if (tokenData.expiresAt > Date.now()) {
          _GDS.accessToken = tokenData.accessToken;
          _GDS.tokenExpiry = tokenData.expiresAt;
        }
      }
    } catch (e) {
      localStorage.removeItem(_GDS.TOKEN_KEY);
    }

    if (_GDS.user) {
      this._showSignedIn();
      if (this.callbacks.onSignIn) this.callbacks.onSignIn();
    }

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

    _GDS.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.profile',
      callback: _handleGDSToken,
    });

    // If signed in but token is expired, try silent refresh
    if (_GDS.user && !this._hasValidToken()) {
      var self = this;
      this._refreshTokenSilently()
        .then(function() {
          _gdsSetStatus('');
          if (self.callbacks.onSignIn) self.callbacks.onSignIn();
        })
        .catch(function() {
          // Silent refresh failed — show overlay so user knows they need to sign in
          self._showReauthOverlay();
        });
    }
  }

  signIn() {
    if (!_GDS.tokenClient) {
      this._setSyncStatus('Google Sign-In not ready', true);
      return;
    }
    _GDS._isSignIn = true;
    _GDS._isReconnect = false;
    _GDS.tokenClient.requestAccessToken({ prompt: 'consent' });
  }

  signOut() {
    if (_GDS.accessToken) {
      google.accounts.oauth2.revoke(_GDS.accessToken);
    }
    _GDS.user = null;
    _GDS.accessToken = null;
    _GDS.tokenExpiry = 0;

    var keysToRemove = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.indexOf('gds-') === 0) keysToRemove.push(key);
    }
    keysToRemove.forEach(function(k) { localStorage.removeItem(k); });

    _gdsInstances.forEach(function(inst) {
      inst.driveFileId = null;
    });

    this._hideReauthOverlay();
    this._showSignedOut();
    this._setSyncStatus('');
    if (this.callbacks.onSignOut) this.callbacks.onSignOut();
  }

  // =============================================
  // Token management
  // =============================================

  _hasValidToken() {
    return !!_GDS.accessToken && _GDS.tokenExpiry > Date.now();
  }

  _refreshTokenSilently() {
    if (_GDS.pendingToken) return _GDS.pendingToken;
    if (!_GDS.tokenClient) return Promise.reject(new Error('GIS not ready'));

    var p = new Promise(function(resolve, reject) {
      _GDS._resolve = resolve;
      _GDS._reject = reject;
    });
    _GDS.pendingToken = p;
    _GDS._isSignIn = false;
    _GDS._isReconnect = false;
    _GDS.tokenClient.requestAccessToken({ prompt: '' });
    return p;
  }

  async _ensureToken() {
    if (this._hasValidToken()) return true;
    try {
      await this._refreshTokenSilently();
      return true;
    } catch (e) {
      this._showReauthOverlay();
      return false;
    }
  }

  _reconnect() {
    if (!_GDS.tokenClient) return;
    _GDS._isReconnect = true;
    _GDS._isSignIn = false;
    _GDS.tokenClient.requestAccessToken({ prompt: 'consent' });
  }

  // =============================================
  // Reauth overlay
  // =============================================

  _showReauthOverlay() {
    var el = document.getElementById('gds-reauth-overlay');
    if (el) el.style.display = 'flex';
  }

  _hideReauthOverlay() {
    var el = document.getElementById('gds-reauth-overlay');
    if (el) el.style.display = 'none';
  }

  // =============================================
  // Data caching (localStorage — read cache only)
  // =============================================

  _cacheData(data) {
    try {
      localStorage.setItem(this._dataCacheKey, JSON.stringify(data));
    } catch (e) {}
  }

  getCachedData() {
    try {
      var raw = localStorage.getItem(this._dataCacheKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  // =============================================
  // Save (auto-refreshes token, blocks app if it can't)
  // =============================================

  async save(data) {
    var hasToken = await this._ensureToken();
    if (!hasToken) return false;

    try {
      if (this.driveFileId) {
        await this._updateDriveFile(this.driveFileId, data);
      } else {
        this.driveFileId = await this._createDriveFile(data);
        localStorage.setItem(this._fileIdCacheKey, this.driveFileId);
      }
      this._cacheData(data);
      _gdsSetStatus('Saved');
      return true;
    } catch (e) {
      if (e.message === 'token_expired') {
        _GDS.accessToken = null;
        _GDS.tokenExpiry = 0;
        localStorage.removeItem(_GDS.TOKEN_KEY);
        this._showReauthOverlay();
      } else {
        _gdsSetStatus('Save failed — try again', true);
      }
      return false;
    }
  }

  // =============================================
  // Load from Drive
  // =============================================

  async loadFromDrive(_retried) {
    if (this._hasValidToken()) {
      try {
        if (!this.driveFileId) {
          this.driveFileId = await this._findDriveFile();
          if (this.driveFileId) {
            localStorage.setItem(this._fileIdCacheKey, this.driveFileId);
          }
        }

        if (this.driveFileId) {
          var data = await this._readDriveFile(this.driveFileId);
          this._cacheData(data);
          return data;
        }

        return null;
      } catch (e) {
        if (e.message === 'token_expired') {
          _GDS.accessToken = null;
          _GDS.tokenExpiry = 0;
          localStorage.removeItem(_GDS.TOKEN_KEY);
        } else if (!_retried && this.driveFileId) {
          localStorage.removeItem(this._fileIdCacheKey);
          this.driveFileId = null;
          return this.loadFromDrive(true);
        }
      }
    }

    return this.getCachedData();
  }

  isSignedIn() {
    return !!_GDS.user;
  }

  // =============================================
  // Drive API
  // =============================================

  async _driveRequest(url, options) {
    options = options || {};
    options.headers = options.headers || {};
    options.headers['Authorization'] = 'Bearer ' + _GDS.accessToken;
    var r = await fetch(url, options);
    if (r.status === 401) {
      throw new Error('token_expired');
    }
    return r;
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
        body: JSON.stringify(data),
      }
    );
  }

  // =============================================
  // UI helpers
  // =============================================

  _showSignedIn() {
    if (!this.authContainer) return;
    this.authContainer.querySelector('#gds-signed-out').style.display = 'none';
    this.authContainer.querySelector('#gds-signed-in').style.display = 'flex';
    if (_GDS.user) {
      this.authContainer.querySelector('#gds-name').textContent = _GDS.user.name;
      var avatar = this.authContainer.querySelector('#gds-avatar');
      if (_GDS.user.picture) {
        avatar.src = _GDS.user.picture;
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
    if (!el) return;
    el.textContent = msg;
    el.className = 'gds-sync-status' + (isError ? ' error' : '');
  }
}
