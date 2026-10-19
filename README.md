# Instagram Unsave

A small Chrome extension (Manifest V3) that unsaves all of your saved Instagram posts with one click.

## Install (load unpacked)

1. Download or clone this repository:
   ```
   git clone https://github.com/haikubits/instagram-unsave.git
   ```
2. Open `chrome://extensions` in Chrome (or any Chromium browser such as Edge or Brave).
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the repository folder (the one containing `manifest.json`).
5. The extension "Simple Instagram Unsaver" now appears in your list.

## Use

1. Log in at [instagram.com](https://www.instagram.com/).
2. Open your saved posts page: `https://www.instagram.com/<your-username>/saved/`.
3. Click the red **Unsave all** button at the bottom-right of the page and confirm the prompt.
4. Wait while the counter updates. Click **Cancel** at any time to stop.
5. Reload the page when it says **Done**.

If you edit the code or reload the extension, refresh the Instagram tab too.

## How it works

The content script runs only on `https://www.instagram.com/*` and uses your existing logged-in session:

- Lists saved posts from `/api/v1/feed/saved/posts/`.
- Unsaves each post with `/api/v1/web/save/<id>/unsave/`, sending your CSRF token from the page cookie.
- Waits 1.5 s between requests, and pauses 5 minutes if Instagram rate-limits (HTTP 429).

No data is collected or sent anywhere other than instagram.com. The extension requests no special browser permissions.

## Limitations

- Uses Instagram's undocumented web API, which can change without notice. If it stops working, check the
  endpoints in `content.js`.
- Unsaving cannot be undone. Try it on a few posts first if you are unsure.
- Automating actions may go against Instagram's terms of use. Use at your own risk.
