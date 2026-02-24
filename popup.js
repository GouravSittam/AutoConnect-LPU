/**
 * LPU WiFi Auto-Login — Popup Script
 * Saves / loads / clears configuration in chrome.storage.local.
 * Password is base64-encoded at rest to avoid plain-text storage.
 */

'use strict';

// ── DOM References ──────────────────────────────────────────────
const form = document.getElementById('settingsForm');
const usernameSel = document.getElementById('usernameSelector');
const passwordSel = document.getElementById('passwordSelector');
const submitSel = document.getElementById('submitSelector');
const regNumberInput = document.getElementById('regNumber');
const passwordInput = document.getElementById('password');
const clearBtn = document.getElementById('clearBtn');
const togglePasswordBtn = document.getElementById('togglePassword');
const statusEl = document.getElementById('status');

// ── Helpers ─────────────────────────────────────────────────────

/** Show a toast-style status message */
function showStatus(message, type = 'success') {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  setTimeout(() => {
    statusEl.className = 'status hidden';
  }, 2500);
}

/** Encode string to base64 */
function encode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

/** Decode base64 to string */
function decode(b64) {
  try {
    return decodeURIComponent(escape(atob(b64)));
  } catch {
    return '';
  }
}

// ── Load saved settings on popup open ───────────────────────────
chrome.storage.local.get(
  ['usernameSelector', 'passwordSelector', 'submitSelector', 'regNumber', 'password'],
  (data) => {
    if (data.usernameSelector) usernameSel.value = data.usernameSelector;
    if (data.passwordSelector) passwordSel.value = data.passwordSelector;
    if (data.submitSelector) submitSel.value = data.submitSelector;
    if (data.regNumber) regNumberInput.value = data.regNumber;
    if (data.password) passwordInput.value = decode(data.password);
  }
);

// ── Save ────────────────────────────────────────────────────────
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const regNumber = regNumberInput.value.trim();
  const password = passwordInput.value;

  if (!regNumber) {
    showStatus('Please enter your registration number.', 'error');
    return;
  }
  if (!password) {
    showStatus('Please enter your password.', 'error');
    return;
  }

  const config = {
    usernameSelector: usernameSel.value.trim(),
    passwordSelector: passwordSel.value.trim(),
    submitSelector: submitSel.value.trim(),
    regNumber,
    password: encode(password)
  };

  chrome.storage.local.set(config, () => {
    if (chrome.runtime.lastError) {
      showStatus('Error saving: ' + chrome.runtime.lastError.message, 'error');
    } else {
      showStatus('✓  Credentials saved! You\'re all set.', 'success');
    }
  });
});

// ── Clear ───────────────────────────────────────────────────────
clearBtn.addEventListener('click', () => {
  chrome.storage.local.clear(() => {
    usernameSel.value = '';
    passwordSel.value = '';
    submitSel.value = '';
    regNumberInput.value = '';
    passwordInput.value = '';
    showStatus('All data cleared.', 'info');
  });
});

// ── Toggle password visibility ──────────────────────────────────
togglePasswordBtn.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  document.getElementById('eyeIcon').innerHTML = isPassword
    ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>'
    : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
});
