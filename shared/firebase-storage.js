/**
 * Firebase Storage — shared helper for Sierra Apps.
 *
 * Drop-in replacement for the old GoogleDriveStorage class.
 * Uses Firebase Auth (Google provider) + Firebase Storage for JSON blobs.
 *
 * Why Firebase Storage and not Firestore: this preserves the "one JSON file
 * per dataset" model the old Drive code used, which means apps don't need
 * any structural changes — and Firebase Storage has no per-document size cap
 * so photo blobs encoded inside JSON still work.
 *
 * Dependencies (in this order):
 *   <script src="https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js"></script>
 *   <script src="https://www.gstatic.com/firebasejs/11.6.0/firebase-auth-compat.js"></script>
 *   <script src="https://www.gstatic.com/firebasejs/11.6.0/firebase-storage-compat.js"></script>
 *   <script src="/sierra-apps/shared/config.js"></script>
 *   <script src="/sierra-apps/shared/firebase-storage.js"></script>
 */

var _FBS = {
  app: null,
  auth: null,
  storage: null,
  user: null,            // { uid, name, picture } — mirror of Firebase's currentUser for our UI
  authUI: null,
  initialized: false,
  // Resolves the first time Firebase Auth has rehydrated state (signed in OR out).
  // save()/load() await this so writes don't race with init.
  ready: null,
  _readyResolve: null,
  USER_KEY: 'fbs-auth-user',
};
_FBS.ready = new Promise(function(res) { _FBS._readyResolve = res; });

var _fbsInstances = [];

function _fbsInit() {
  if (_FBS.initialized) return;
  if (typeof firebase === 'undefined' || !firebase.initializeApp) {
    return; // SDK not loaded yet
  }
  var cfg = window.SIERRA_CONFIG && window.SIERRA_CONFIG.FIREBASE;
  if (!cfg) {
    console.error('SIERRA_CONFIG.FIREBASE missing');
    return;
  }
  _FBS.app = firebase.initializeApp(cfg);
  _FBS.auth = firebase.auth();
  _FBS.storage = firebase.storage();
  // Persist auth across sessions (default LOCAL but be explicit)
  _FBS.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function() {});
  _FBS.initialized = true;

  _FBS.auth.onAuthStateChanged(function(user) {
    var firstFire = !!_FBS._readyResolve;
    if (user) {
      _FBS.user = {
        uid: user.uid,
        name: (user.displayName || '').split(' ')[0] || 'Signed In',
        picture: user.photoURL || '',
      };
      try { localStorage.setItem(_FBS.USER_KEY, JSON.stringify(_FBS.user)); } catch (e) {}
      if (_FBS.authUI) {
        _FBS.authUI._showSignedIn();
        if (_FBS.authUI.callbacks.onSignIn) _FBS.authUI.callbacks.onSignIn();
      }
    } else {
      _FBS.user = null;
      try { localStorage.removeItem(_FBS.USER_KEY); } catch (e) {}
      if (_FBS.authUI) {
        _FBS.authUI._showSignedOut();
        if (_FBS.authUI.callbacks.onSignOut) _FBS.authUI.callbacks.onSignOut();
      }
    }
    if (firstFire) {
      var resolve = _FBS._readyResolve;
      _FBS._readyResolve = null;
      resolve();
    }
  });
}

function _fbsSetStatus(msg, isError) {
  if (_FBS.authUI) _FBS.authUI._setSyncStatus(msg, isError);
}

class FirebaseStorage {
  constructor(fileName) {
    this.fileName = fileName;
    this._dataCacheKey = 'fbs-data-' + fileName;
    this.callbacks = {};
    this.authContainer = null;
    _fbsInstances.push(this);
  }

  // =============================================
  // Auth UI (mirrors GoogleDriveStorage API)
  // =============================================

  renderAuthUI(container, callbacks) {
    this.callbacks = callbacks || {};
    this.authContainer = container;
    _FBS.authUI = this;

    container.innerHTML =
      '<div class="fbs-signed-out" id="fbs-signed-out">' +
        '<button class="fbs-signin-btn" id="fbs-signin-btn">' +
          '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>' +
          ' Sign in with Google' +
        '</button>' +
      '</div>' +
      '<div class="fbs-signed-in" id="fbs-signed-in" style="display:none;">' +
        '<div class="fbs-user-info">' +
          '<img class="fbs-avatar" id="fbs-avatar" src="" alt="">' +
          '<span class="fbs-name" id="fbs-name"></span>' +
        '</div>' +
        '<button class="fbs-signout-btn" id="fbs-signout-btn">Sign Out</button>' +
      '</div>' +
      '<div class="fbs-sync-status" id="fbs-sync-status"></div>';

    container.querySelector('#fbs-signin-btn').addEventListener('click', () => this.signIn());
    container.querySelector('#fbs-signout-btn').addEventListener('click', () => this.signOut());

    // Render cached identity immediately for instant UI
    var cached = this._readCachedUser();
    if (cached) {
      _FBS.user = cached;
      this._showSignedIn();
    }

    _fbsInit();

    // Fire onSignIn from cached identity right away (no waiting on Firebase init)
    // Firebase's onAuthStateChanged will fire again once the SDK rehydrates,
    // but consumers are expected to be idempotent (matches old GoogleDriveStorage contract).
    if (cached && this.callbacks.onSignIn) {
      // Defer one tick so the caller can finish wiring up event handlers
      setTimeout(() => { if (_FBS.user) this.callbacks.onSignIn(); }, 0);
    }
  }

  _readCachedUser() {
    try {
      var raw = localStorage.getItem(_FBS.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  static getStyles() {
    return `
      .fbs-signed-out { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; }
      .fbs-signin-btn {
        display: inline-flex; align-items: center; gap: 0.6rem;
        font-family: 'DM Sans', sans-serif; font-size: 0.8rem; font-weight: 400;
        letter-spacing: 0.08em; border: 1px solid #D5D0CA; background: #FFFFFF;
        color: #2C2C2C; padding: 0.65rem 1.5rem; border-radius: 30px;
        cursor: pointer; transition: all 0.2s ease; min-height: 44px;
      }
      .fbs-signin-btn:active { background: #F5F3F0; }
      .fbs-signed-in { display: flex; align-items: center; justify-content: center; gap: 0.8rem; }
      .fbs-user-info { display: flex; align-items: center; gap: 0.5rem; }
      .fbs-avatar { width: 28px; height: 28px; border-radius: 50%; }
      .fbs-name { font-size: 0.75rem; color: #8A8478; letter-spacing: 0.05em; }
      .fbs-signout-btn {
        font-family: 'DM Sans', sans-serif; font-size: 0.65rem; letter-spacing: 0.12em;
        text-transform: uppercase; background: none; border: none; color: #C4A68A;
        cursor: pointer; padding: 0.3rem 0.5rem; min-height: 44px;
        display: flex; align-items: center; transition: opacity 0.2s ease;
      }
      .fbs-signout-btn:active { opacity: 0.5; }
      .fbs-sync-status { font-size: 0.65rem; color: #A3A88E; letter-spacing: 0.08em; margin-top: 0.4rem; text-align: center; min-height: 1em; }
      .fbs-sync-status.error { color: #C4A68A; font-weight: 500; }
    `;
  }

  // =============================================
  // Auth actions
  // =============================================

  async signIn() {
    if (!_FBS.initialized) _fbsInit();
    if (!_FBS.auth) {
      this._setSyncStatus('Firebase not ready', true);
      return;
    }
    var provider = new firebase.auth.GoogleAuthProvider();
    try {
      await _FBS.auth.signInWithPopup(provider);
      // onAuthStateChanged handles UI + onSignIn callback
    } catch (e) {
      this._setSyncStatus('Sign-in failed', true);
      console.error('Firebase signIn error:', e);
    }
  }

  async signOut() {
    if (!_FBS.auth) return;
    try { await _FBS.auth.signOut(); } catch (e) {}
    // Wipe all fbs-* localStorage keys
    var keys = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf('fbs-') === 0) keys.push(k);
    }
    keys.forEach(function(k) { localStorage.removeItem(k); });
    // onAuthStateChanged handles the UI swap and onSignOut callback
  }

  isSignedIn() {
    return !!_FBS.user;
  }

  // =============================================
  // Data caching (read-only cache for instant load)
  // =============================================

  _cacheData(data) {
    try { localStorage.setItem(this._dataCacheKey, JSON.stringify(data)); } catch (e) {}
  }

  getCachedData() {
    try {
      var raw = localStorage.getItem(this._dataCacheKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  // =============================================
  // Save / Load (Firebase Storage as the JSON file store)
  // =============================================

  _storageRef() {
    if (!_FBS.user) throw new Error('Not signed in');
    return _FBS.storage.ref('users/' + _FBS.user.uid + '/' + this.fileName);
  }

  async save(data) {
    if (!_FBS.initialized) _fbsInit();
    await _FBS.ready;
    if (!_FBS.user) {
      this._setSyncStatus('Not signed in', true);
      return false;
    }
    try {
      var ref = this._storageRef();
      var blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      await ref.put(blob, { contentType: 'application/json' });
      this._cacheData(data);
      this._setSyncStatus('Saved');
      return true;
    } catch (e) {
      console.error('FirebaseStorage.save error:', e);
      this._setSyncStatus('Save failed — try again', true);
      return false;
    }
  }

  // Renamed from loadFromDrive() — kept that name as an alias for drop-in compat.
  async load() {
    if (!_FBS.initialized) _fbsInit();
    await _FBS.ready;
    if (!_FBS.user) return this.getCachedData();
    try {
      var ref = this._storageRef();
      var url = await ref.getDownloadURL();
      var res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var data = await res.json();
      this._cacheData(data);
      return data;
    } catch (e) {
      // 404 = no file yet (first run); anything else = real error
      if (e && (e.code === 'storage/object-not-found' || e.message.indexOf('404') !== -1)) {
        return null;
      }
      console.error('FirebaseStorage.load error:', e);
      // Fall back to cache so the app stays usable
      return this.getCachedData();
    }
  }

  loadFromDrive() { return this.load(); } // alias for drop-in API compat

  // =============================================
  // UI helpers
  // =============================================

  _showSignedIn() {
    if (!this.authContainer) return;
    var so = this.authContainer.querySelector('#fbs-signed-out');
    var si = this.authContainer.querySelector('#fbs-signed-in');
    if (so) so.style.display = 'none';
    if (si) si.style.display = 'flex';
    if (_FBS.user) {
      var nameEl = this.authContainer.querySelector('#fbs-name');
      if (nameEl) nameEl.textContent = _FBS.user.name;
      var avatar = this.authContainer.querySelector('#fbs-avatar');
      if (avatar) {
        if (_FBS.user.picture) {
          avatar.src = _FBS.user.picture;
          avatar.style.display = 'block';
        } else {
          avatar.style.display = 'none';
        }
      }
    }
  }

  _showSignedOut() {
    if (!this.authContainer) return;
    var so = this.authContainer.querySelector('#fbs-signed-out');
    var si = this.authContainer.querySelector('#fbs-signed-in');
    if (so) so.style.display = 'flex';
    if (si) si.style.display = 'none';
  }

  _setSyncStatus(msg, isError) {
    if (!this.authContainer) return;
    var el = this.authContainer.querySelector('#fbs-sync-status');
    if (!el) return;
    el.textContent = msg;
    el.className = 'fbs-sync-status' + (isError ? ' error' : '');
  }
}
