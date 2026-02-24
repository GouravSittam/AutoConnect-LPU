/**
 * LPU WiFi Auto-Login — Content Script
 *
 * Specifically built for the LPU 24Online captive portal at:
 *   https://internet.lpu.in/24online/webpages/client.jsp
 *
 * Flow:
 *   1. Checks if this is the login page (client.jsp)
 *   2. Reads saved credentials from chrome.storage.local
 *   3. Checks the "I Agree with Terms and Conditions" checkbox
 *   4. Fills username (registration number) and password
 *   5. Clicks the "Login" button
 *
 * Includes retry logic for slow-loading pages.
 */

'use strict';

// ── Helpers ─────────────────────────────────────────────────────

/** Decode base64 → string */
function decodeB64(b64) {
  try {
    return decodeURIComponent(escape(atob(b64)));
  } catch {
    return '';
  }
}

/** Show a small fixed toast on the page */
function showToast(message, isError = false) {
  const existing = document.getElementById('__wifi_autologin_toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = '__wifi_autologin_toast';
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: '2147483647',
    padding: '12px 20px',
    borderRadius: '12px',
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '13px',
    fontWeight: '600',
    color: '#fff',
    background: isError
      ? 'linear-gradient(135deg, #ff416c, #ff4b2b)'
      : 'linear-gradient(135deg, #6c63ff, #48c6ef)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    transition: 'opacity 0.4s ease, transform 0.4s ease',
    opacity: '0',
    transform: 'translateY(12px)',
  });
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

/**
 * Try to find an element using the user-specified selector first,
 * then fall back to a list of common selectors.
 */
function findElement(customSelector, fallbacks) {
  if (customSelector) {
    try {
      const el = document.querySelector(customSelector);
      if (el) return el;
    } catch (e) {
      console.warn('[LPU Auto-Login] Invalid selector:', customSelector, e);
    }
  }
  for (const sel of fallbacks) {
    try {
      const el = document.querySelector(sel);
      if (el) return el;
    } catch {
      // ignore
    }
  }
  return null;
}

/**
 * Set input value using native setter so frameworks detect the change.
 */
function setNativeValue(el, value) {
  const nativeSet = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  ).set;
  nativeSet.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

// ── Main Login Logic ────────────────────────────────────────────

function attemptLogin(config, isRetry = false) {
  const { regNumber, password, usernameSelector, passwordSelector, submitSelector } = config;
  const decodedPassword = decodeB64(password);

  if (!regNumber || !decodedPassword) {
    console.warn('[LPU Auto-Login] Missing credentials. Open extension popup to configure.');
    return;
  }

  console.log('[LPU Auto-Login] Attempting auto-login…');

  // ── Step 1: Check the "I Agree with Terms and Conditions" checkbox ──
  // IMPORTANT: Must use .click() — NOT .checked = true — because
  // the portal's JS listens for the click event to enable the Login button.
  const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
  allCheckboxes.forEach((cb) => {
    if (!cb.checked) {
      cb.click();  // This fires the page's onclick handler that enables Login
      console.log('[LPU Auto-Login] ✓ Clicked checkbox:', cb.name || cb.id || 'unnamed');
    }
  });

  // ── Step 2: Find the username field ──
  const usernameField = findElement(usernameSelector, [
    'input[name="username"]',
    'input[name="userName"]',
    'input[name="user"]',
    'input[name="userid"]',
    'input[name="loginid"]',
    'input[name="LoginUserPassword_username"]',
    'input[id="username"]',
    'input[type="text"]',
  ]);

  // ── Step 3: Find the password field ──
  const passwordField = findElement(passwordSelector, [
    'input[name="password"]',
    'input[name="passwd"]',
    'input[name="pass"]',
    'input[name="LoginUserPassword_password"]',
    'input[id="password"]',
    'input[type="password"]',
  ]);

  // ── Step 4: Find the login/submit button ──
  const submitButton = findElement(submitSelector, [
    'input[type="submit"][value="Login"]',
    'input[type="submit"][value="login"]',
    'input[type="button"][value="Login"]',
    'input[type="button"][value="login"]',
    'button[type="submit"]',
    'input[type="submit"]',
    'button[name="login"]',
    'input[name="login"]',
    '#loginBtn',
    'button.btn-primary',
    'input[type="button"][onclick*="logon"]',
    'input[type="button"][onclick*="Login"]',
    'input[type="button"][onclick*="login"]',
  ]);

  // ── Validate ──
  if (!usernameField || !passwordField) {
    if (!isRetry) {
      console.log('[LPU Auto-Login] Form not found yet, retrying in 2s…');
      setTimeout(() => attemptLogin(config, true), 2000);
      return;
    }
    const missing = [];
    if (!usernameField) missing.push('username field');
    if (!passwordField) missing.push('password field');
    showToast(`⚠ Could not find: ${missing.join(', ')}`, true);
    console.error('[LPU Auto-Login] Could not locate:', missing);
    return;
  }

  // ── Step 5: Fill credentials ──
  try {
    usernameField.value = regNumber;
    usernameField.dispatchEvent(new Event('input', { bubbles: true }));
    usernameField.dispatchEvent(new Event('change', { bubbles: true }));

    passwordField.value = decodedPassword;
    passwordField.dispatchEvent(new Event('input', { bubbles: true }));
    passwordField.dispatchEvent(new Event('change', { bubbles: true }));

    console.log('[LPU Auto-Login] ✓ Credentials filled.');

    // ── Step 6: Click the Login button ──
    // Wait a moment so the page's JS can process the T&C checkbox
    // and enable the Login button before we click it.
    setTimeout(() => {
      if (submitButton) {
        // .click() on a DOM element DOES trigger inline onclick handlers
        // (e.g. onclick="logon()") — no script injection needed.
        submitButton.click();
        showToast('✓ LPU WiFi — Auto-login submitted!');
        console.log('[LPU Auto-Login] ✓ Login button clicked.');
      } else {
        // Fallback: try to find any button/input with "Login" text
        const allInputs = document.querySelectorAll('input[type="button"], input[type="submit"], button');
        let clicked = false;
        allInputs.forEach((el) => {
          if (!clicked && (el.value === 'Login' || el.value === 'login' || el.textContent.trim() === 'Login')) {
            el.click();
            clicked = true;
            showToast('✓ LPU WiFi — Auto-login submitted!');
            console.log('[LPU Auto-Login] ✓ Clicked Login via fallback search.');
          }
        });

        if (!clicked) {
          // Last resort: submit the form
          const form = usernameField.closest('form');
          if (form) {
            form.submit();
            showToast('✓ LPU WiFi — Auto-login submitted (via form)!');
          } else {
            showToast('⚠ Credentials filled but no Login button found.', true);
          }
        }
      }
    }, 1000); // 1 second delay to let the checkbox handler enable the button
  } catch (err) {
    showToast('⚠ Auto-login error: ' + err.message, true);
    console.error('[LPU Auto-Login] Error during autofill:', err);
  }
}

// ── Entry Point ─────────────────────────────────────────────────

// Only run on the login page (client.jsp), not on the post-login servlet page
const currentUrl = window.location.href.toLowerCase();
const isLoginPage =
  currentUrl.includes('client.jsp') ||
  currentUrl.includes('/webpages/') ||
  currentUrl.includes('24online');

if (isLoginPage) {
  chrome.storage.local.get(
    ['regNumber', 'password', 'usernameSelector', 'passwordSelector', 'submitSelector'],
    (config) => {
      if (!config.regNumber || !config.password) {
        console.log('[LPU Auto-Login] No credentials saved. Click the extension icon to configure.');
        return;
      }
      // Small delay to ensure the page is fully rendered
      setTimeout(() => attemptLogin(config), 800);
    }
  );
} else {
  console.log('[LPU Auto-Login] Not a login page, skipping.');
}
