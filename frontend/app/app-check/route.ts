/**
 * The Turnstile widget, alone, for the mobile app to host in a WebView.
 *
 * Cloudflare ships no native SDK for iOS or Android, and Turnstile validates
 * against the domain the widget was served from — so a native app cannot
 * produce a token on its own. The supported way round it is the one every app
 * in this position uses: serve a page from your own domain, let the widget run
 * there, and hand the token back across the bridge.
 *
 * A route handler rather than a page, because this document has to escape the
 * site's root layout entirely. A page under `app/` is always rendered inside
 * it — header, footer, fonts, consent banner, analytics — and none of that
 * belongs in a 300pt box inside somebody's phone.
 *
 * Safe to leave public. A Turnstile token is single-use, short-lived and worth
 * nothing without the secret key, which never leaves the server and is what
 * actually decides whether a registration is allowed through. Somebody who
 * opens this in a browser gets a token they could have got from the sign-up
 * form instead.
 */

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAACQelqz05sxYB2FD';

const HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<meta name="robots" content="noindex, nofollow">
<style>
  html, body {
    margin: 0;
    padding: 0;
    background: #05070A;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    font-family: system-ui, sans-serif;
  }
</style>
<script>
(function () {
  function send(payload) {
    // The channel the app listens on. Absent in an ordinary browser, which is
    // why opening this page directly does nothing at all.
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    }
  }

  window.onTurnstileReady = function () {
    turnstile.render('#widget', {
      sitekey: ${JSON.stringify(SITE_KEY)},
      theme: 'dark',
      callback: function (token) { send({ type: 'token', token: token }); },
      'error-callback': function () { send({ type: 'error' }); },
      // A token lasts about five minutes. Rather than let one go stale in a
      // form somebody is still filling in, the widget says so and the app
      // asks for another.
      'expired-callback': function () { send({ type: 'expired' }); },
    });
  };
})();
</script>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileReady&render=explicit" async defer></script>
</head>
<body><div id="widget"></div></body>
</html>`;

export const dynamic = 'force-static';

export function GET() {
    return new Response(HTML, {
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'X-Robots-Tag': 'noindex, nofollow',
            // Short, because the site key can change and a phone should not be
            // holding a stale one for a day.
            'Cache-Control': 'public, max-age=300',
        },
    });
}
