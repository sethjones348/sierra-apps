/**
 * Shared configuration for all Sierra Apps.
 *
 * Usage: Add this script tag BEFORE your app script in any app's index.html:
 *   <script src="/sierra-apps/shared/config.js"></script>
 *
 * Then access: window.SIERRA_CONFIG.GOOGLE_CLIENT_ID
 */
window.SIERRA_CONFIG = {
  // Old Google OAuth Client ID — kept ONLY for the Drive→Firebase migration page
  // (which still needs Drive appdata scope). New apps should use Firebase Auth.
  GOOGLE_CLIENT_ID: '437861067044-r6m2ndd5bqgd0u82f1rjq8a3nv91fc3q.apps.googleusercontent.com',

  // Firebase web app config (sierra-apps-af32e)
  FIREBASE: {
    apiKey: 'AIzaSyDP4hBshwyeHW5IrgsVZVGL91PCdY0oCh0',
    authDomain: 'sierra-apps-af32e.firebaseapp.com',
    projectId: 'sierra-apps-af32e',
    storageBucket: 'sierra-apps-af32e.firebasestorage.app',
    messagingSenderId: '838544935272',
    appId: '1:838544935272:web:fc89fb5ff51c2c4a91eedd',
  },
};
