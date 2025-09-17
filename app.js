import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { BrowserMultiFormatReader } from 'https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/esm/index.min.js';

const firebaseConfig = window.__FIREBASE_CONFIG__ || {};
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missing = requiredKeys.filter((key) => !firebaseConfig[key]);
if (missing.length) {
  console.warn(
    `Missing Firebase configuration values: ${missing.join(', ')}. Update firebase-config.js with your project keys.`,
  );
}

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

let currentUser = null;
let authMode = 'sign-in';

const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const authForm = document.getElementById('auth-form');
const authSubmit = document.getElementById('auth-submit');
const authToggle = document.getElementById('auth-toggle');
const authMessage = document.getElementById('auth-message');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const signedInContainer = document.getElementById('signed-in');
const userEmail = document.getElementById('user-email');
const signOutButton = document.getElementById('sign-out');

const apiForm = document.getElementById('api-form');
const apiUrlInput = document.getElementById('api-url');
const apiMethodSelect = document.getElementById('api-method');
const apiBodyTextarea = document.getElementById('api-body');
const apiAuthCheckbox = document.getElementById('api-auth');
const apiStatus = document.getElementById('api-status');
const apiResponse = document.getElementById('api-response');

const scannerContainer = document.getElementById('scanner');
const scannerStartButton = document.getElementById('scanner-start');
const scannerStopButton = document.getElementById('scanner-stop');
const scannerVideo = document.getElementById('scanner-preview');
const scannerOverlay = document.getElementById('scanner-overlay');
const scannerResult = document.getElementById('scanner-result');
const scannerError = document.getElementById('scanner-error');
const infoLastScan = document.getElementById('info-last-scan');

const reader = new BrowserMultiFormatReader();
let scannerControls = null;

const escapeHtml = (value) => {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
};

const setStatus = (online, text) => {
  statusIndicator.classList.toggle('online', online);
  statusIndicator.classList.toggle('offline', !online);
  statusText.textContent = text;
};

const updateAuthMode = () => {
  if (authMode === 'sign-in') {
    authSubmit.textContent = 'Sign in';
    authToggle.textContent = "Don't have an account? Create one";
    passwordInput.autocomplete = 'current-password';
  } else {
    authSubmit.textContent = 'Create account';
    authToggle.textContent = 'Already registered? Sign in';
    passwordInput.autocomplete = 'new-password';
  }
};

const setAuthMessage = (message, isError = false) => {
  authMessage.textContent = message;
  authMessage.classList.toggle('error', isError);
};

authToggle.addEventListener('click', () => {
  authMode = authMode === 'sign-in' ? 'sign-up' : 'sign-in';
  setAuthMessage('');
  updateAuthMode();
});

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    setAuthMessage('Please provide both an email and password.', true);
    return;
  }

  authSubmit.disabled = true;
  setAuthMessage(authMode === 'sign-in' ? 'Signing in…' : 'Creating account…');

  try {
    if (authMode === 'sign-in') {
      await signInWithEmailAndPassword(auth, email, password);
      setAuthMessage('Signed in successfully.');
    } else {
      await createUserWithEmailAndPassword(auth, email, password);
      setAuthMessage('Account created and signed in.');
    }
    authForm.reset();
  } catch (error) {
    setAuthMessage(error.message || 'Authentication failed.', true);
  } finally {
    authSubmit.disabled = false;
  }
});

signOutButton.addEventListener('click', async () => {
  signOutButton.disabled = true;
  setAuthMessage('Signing out…');
  try {
    await signOut(auth);
    setAuthMessage('Signed out.');
  } catch (error) {
    setAuthMessage(error.message || 'Failed to sign out.', true);
  } finally {
    signOutButton.disabled = false;
  }
});

const handleAuthState = (user) => {
  currentUser = user;
  if (user) {
    signedInContainer.classList.remove('hidden');
    authForm.classList.add('hidden');
    authToggle.classList.add('hidden');
    userEmail.textContent = user.email || 'Anonymous user';
    setStatus(true, `Signed in as ${user.email || 'anonymous'}`);
    apiAuthCheckbox.disabled = false;
    if (!apiAuthCheckbox.checked) {
      apiAuthCheckbox.checked = true;
    }
  } else {
    signedInContainer.classList.add('hidden');
    authForm.classList.remove('hidden');
    authToggle.classList.remove('hidden');
    setStatus(false, 'Not signed in');
    apiAuthCheckbox.checked = false;
    apiAuthCheckbox.disabled = true;
  }
};

onAuthStateChanged(auth, handleAuthState);
updateAuthMode();
setStatus(false, 'Checking authentication…');

apiForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  apiStatus.textContent = 'Calling API…';
  apiStatus.classList.remove('error');
  apiResponse.textContent = '';
  apiResponse.classList.add('hidden');

  try {
    const url = apiUrlInput.value.trim();
    if (!url) {
      throw new Error('Provide an API endpoint URL.');
    }

    const method = apiMethodSelect.value;
    const headers = new Headers();
    let body = apiBodyTextarea.value.trim();

    if (apiAuthCheckbox.checked) {
      if (!currentUser) {
        throw new Error('Sign in to include a Firebase ID token.');
      }
      const token = await currentUser.getIdToken();
      headers.set('Authorization', `Bearer ${token}`);
    }

    if (method !== 'GET' && body) {
      try {
        JSON.parse(body);
      } catch (err) {
        throw new Error('Request body must be valid JSON.');
      }
      headers.set('Content-Type', 'application/json');
    } else if (method === 'GET') {
      body = undefined;
    }

    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    const text = await response.text();
    apiStatus.textContent = `Response: ${response.status} ${response.statusText}`;
    apiResponse.textContent = text || 'No content';
    apiResponse.classList.remove('hidden');
  } catch (error) {
    apiStatus.textContent = error.message || 'API request failed.';
    apiStatus.classList.add('error');
  }
});

const stopScanner = () => {
  if (scannerControls) {
    scannerControls.stop();
    scannerControls = null;
  }
  reader.reset();
  scannerContainer.classList.remove('active');
  scannerOverlay.textContent = 'Camera inactive';
  scannerOverlay.classList.remove('hidden');
  scannerStartButton.disabled = false;
  scannerStopButton.disabled = true;
};

const startScanner = async () => {
  scannerError.textContent = '';
  scannerResult.textContent = '';
  infoLastScan.textContent = 'Starting camera…';

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    scannerError.textContent = 'Camera API not supported in this browser.';
    return;
  }

  try {
    stopScanner();
    scannerOverlay.textContent = 'Starting camera…';
    scannerOverlay.classList.remove('hidden');
    scannerContainer.classList.add('active');
    scannerStartButton.disabled = true;
    scannerStopButton.disabled = false;

    scannerControls = await reader.decodeFromVideoDevice(
      undefined,
      scannerVideo,
      (result, error, controls) => {
        if (result) {
          const text = result.getText();
          const escaped = escapeHtml(text);
          scannerResult.innerHTML = `Last scan: <code>${escaped}</code>`;
          infoLastScan.innerHTML = `Most recent barcode: <code>${escaped}</code>`;
          scannerOverlay.textContent = 'Barcode detected';
          controls.stop();
          scannerControls = null;
          scannerStartButton.disabled = false;
          scannerStopButton.disabled = true;
          scannerContainer.classList.remove('active');
          setTimeout(() => {
            scannerOverlay.textContent = 'Camera inactive';
            scannerOverlay.classList.remove('hidden');
          }, 800);
        }
        if (error && error.name !== 'NotFoundException') {
          scannerError.textContent = error.message || 'Camera error. Try again.';
        }
      },
    );

    scannerOverlay.textContent = '';
    scannerOverlay.classList.add('hidden');
  } catch (error) {
    scannerError.textContent = error.message || 'Unable to start the camera. Check permissions and try again.';
    stopScanner();
  }
};

scannerStartButton.addEventListener('click', startScanner);
scannerStopButton.addEventListener('click', () => {
  stopScanner();
  infoLastScan.textContent = 'Start the scanner to read a barcode. The decoded value will appear here.';
});

window.addEventListener('pagehide', stopScanner);
window.addEventListener('beforeunload', stopScanner);