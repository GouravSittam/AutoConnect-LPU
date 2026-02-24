# LPU WiFi Auto-Login — Chrome Extension (Manifest V3)

Automatically detects the **LPU 24Online WiFi login portal** (`internet.lpu.in`), fills in your registration number and password, accepts Terms & Conditions, and clicks Login — all in under a second.

---

## ✨ Features

| Feature | Description |
|---|---|
| **LPU-Specific** | Built for the 24Online portal at `internet.lpu.in` |
| **Auto T&C Accept** | Automatically checks "I Agree with Terms and Conditions" |
| **Auto-Fill** | Fills registration number and password |
| **Auto-Submit** | Clicks the Login button |
| **Configurable Selectors** | Optional advanced CSS selectors if the portal HTML changes |
| **Retry Logic** | Retries once after 2 s if the form loads slowly |
| **Secure Storage** | Credentials are base64-encoded in Chrome's sandboxed storage |

---

## 📁 File Structure

```
wifi-auto-login/
├── manifest.json      # Manifest V3 — targets internet.lpu.in
├── popup.html         # Settings popup UI
├── popup.css          # Dark gradient theme
├── popup.js           # Save / load / clear credentials
├── content.js         # Auto-fill + auto-submit on LPU portal
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

---

## 🚀 Installation

1. **Download / Clone** this folder to your machine.

2. Open **Google Chrome** → navigate to:
   ```
   chrome://extensions
   ```

3. Enable **Developer mode** (toggle in the top-right corner).

4. Click **"Load unpacked"** → select the `wifi-auto-login` folder.

5. **Pin** the extension icon in the toolbar.

---

## ⚙️ Setup

1. Click the extension icon → the settings popup opens.

2. Enter your **Registration Number** (e.g. `12208224`) and **Password**.

3. Click **Save**.

4. That's it! Next time `internet.lpu.in` loads, the extension will:
   - ✅ Accept Terms & Conditions
   - ✅ Fill your credentials
   - ✅ Click Login

### Advanced Selectors (Optional)

If the portal changes its HTML, expand **"Advanced Selectors"** and set custom CSS selectors for the username field, password field, and submit button.

---

## 🔒 Security

- Credentials are **base64-encoded** (not plain text).
- Chrome's `storage.local` is **sandboxed per-extension**.
- The content script **only runs** on `internet.lpu.in`.
- No data is sent to any external server.

---

## 🛠 Troubleshooting

| Problem | Solution |
|---|---|
| Extension doesn't trigger | Make sure you're on `internet.lpu.in/24online/webpages/client.jsp` |
| Fields not filled | Open DevTools → Console → check `[LPU Auto-Login]` logs |
| Wrong field detected | Set custom selectors in the Advanced section |

---

## 📝 License

Personal use. Use in accordance with LPU's internet usage policy.
