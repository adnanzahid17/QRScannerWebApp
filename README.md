# Firebase Barcode Scanner Web App

A responsive single-page web application that authenticates users with Firebase, calls REST APIs, and scans barcodes using the
mobile device camera. Everything runs in the browser with standard ES modules—no build step required.

## Features

- Email and password authentication powered by Firebase Authentication.
- REST API explorer with support for multiple HTTP methods and optional Firebase ID token injection.
- Real-time barcode scanning through the device camera using [`@zxing/browser`](https://github.com/zxing-js/library/tree/master/packages/browser).
- Mobile-friendly UI that works great when loaded on a phone.

## Getting started

1. **Configure Firebase**

   Open `firebase-config.js` and replace each `YOUR_FIREBASE_*` placeholder with the configuration values from your Firebase
   project (*Project settings → General → Your apps* in the Firebase console).

2. **Serve the files**

   Because the app is built with plain HTML, CSS, and JavaScript modules, you can open `index.html` directly in a browser or host
   the folder with any static web server. When using modules it is recommended to run through a lightweight server during
   development, for example:

   ```bash
   python -m http.server 5173
   ```

   Then visit [http://localhost:5173](http://localhost:5173) from your desktop or mobile browser.

3. **Test the barcode scanner**

   - Allow camera access when prompted.
   - Align the barcode inside the highlighted frame. The decoded text is displayed both in the scanner card and the *Scan result*
     panel.

## Usage notes

- Toggle between *Sign in* and *Create account* using the link below the authentication form.
- The REST API explorer can attach the currently signed-in user's Firebase ID token in the `Authorization` header when the
  checkbox is enabled.
- The app gracefully falls back with helpful messages if the camera is unavailable or permissions are denied.

## Tech stack

- Firebase Authentication (loaded from the official CDN)
- [`@zxing/browser`](https://github.com/zxing-js/library/tree/master/packages/browser) for barcode scanning
- Vanilla HTML, CSS, and modern JavaScript modules

## License

This project is provided for demonstration purposes. Update the licensing information as needed for your use case.