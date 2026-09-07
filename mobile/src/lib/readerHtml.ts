import { colors, radius, size } from '@/theme/tokens';

/**
 * The article body, as a document the WebView can render.
 *
 * Why a WebView at all. The API sends what the CMS stored: paragraphs, but
 * also tables, figures with captions, blockquotes, embedded YouTube, code.
 * A native renderer has to be taught each of those and gets the awkward ones
 * wrong — a table becomes a column of orphaned words, an iframe disappears.
 * The body is a document, so it is rendered by the thing that renders
 * documents, and everything around it stays native.
 *
 * The whole article goes in, not only the prose: hero, title, byline. One
 * scroll container means no measuring a WebView's height from the outside,
 * which is the trick that never quite works and jitters when it fails.
 */

interface Reader {
    title: string;
    excerpt: string | null;
    image: string | null;
    imageAlt: string | null;
    category: string | null;
    author: string | null;
    published: string | null;
    readingTime: number | null;
    content: string;
}

/**
 * Escapes text that goes into the document as text.
 *
 * `content` is deliberately not escaped — it is HTML the editorial team wrote
 * and the backend already ran through SanitizationService. Everything else
 * here is a field that could contain an apostrophe or an ampersand and has no
 * business being parsed as markup.
 */
function esc(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function readerHtml(a: Reader): string {
    const meta = [a.author, a.published, a.readingTime ? `${a.readingTime} min read` : null]
        .filter(Boolean)
        .map((part) => esc(String(part)))
        .join(' &middot; ');

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
  /* The site's own faces. They are bundled in the app, and a WebView cannot
     reach the app's font registry — so this is the one place that asks Google
     for them, with a real stack behind it for the seconds before they land. */
  @import url("https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@700&family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Mono&display=swap");

  :root {
    --surface-0: ${colors.surface0};
    --surface-1: ${colors.surface1};
    --surface-2: ${colors.surface2};
    --ink-hi: ${colors.inkHi};
    --ink-mid: ${colors.inkMid};
    --ink-low: ${colors.inkLow};
    --line: ${colors.line};
    --accent: ${colors.accentInk};
  }

  * { box-sizing: border-box; }

  html, body {
    margin: 0;
    padding: 0;
    background: var(--surface-0);
    color: var(--ink-mid);
    font-family: "IBM Plex Sans", -apple-system, system-ui, sans-serif;
    /* 17px, not 15: this is the one screen that is read rather than scanned,
       and a phone held at arm's length is further away than a monitor. */
    font-size: 17px;
    line-height: 1.68;
    -webkit-text-size-adjust: 100%;
    -webkit-font-smoothing: antialiased;
  }

  /* Nothing here selects, drags or long-presses into a system menu. It is an
     article, not a form, and the platform's text-selection handles fighting a
     scroll gesture is the commonest way a reader loses their place. */
  body {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
  }

  .wrap { padding: 0 20px 64px; }

  figure.hero { margin: 0 -20px 20px; }
  figure.hero img { width: 100%; display: block; background: var(--surface-2); }

  .eyebrow {
    font-family: "Instrument Sans", sans-serif;
    font-weight: 700;
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent);
    margin: 20px 0 8px;
  }

  h1 {
    font-family: "Instrument Sans", sans-serif;
    font-weight: 700;
    font-size: 28px;
    line-height: 1.16;
    letter-spacing: -0.02em;
    color: var(--ink-hi);
    text-wrap: balance;
    margin: 0 0 10px;
  }

  .standfirst { font-size: 17px; color: var(--ink-mid); margin: 0 0 14px; }

  .byline {
    font-family: "IBM Plex Mono", monospace;
    font-size: ${size.caption}px;
    color: var(--ink-low);
    padding-bottom: 18px;
    border-bottom: 1px solid var(--line);
    margin-bottom: 22px;
  }

  p { margin: 16px 0; }
  strong, b { color: var(--ink-hi); font-weight: 600; }

  h2 {
    font-family: "Instrument Sans", sans-serif;
    font-weight: 700;
    font-size: 21px;
    line-height: 1.25;
    color: var(--ink-hi);
    text-wrap: balance;
    margin: 34px 0 6px;
  }

  h3 {
    font-family: "Instrument Sans", sans-serif;
    font-weight: 700;
    font-size: 17px;
    color: var(--ink-hi);
    margin: 26px 0 4px;
  }

  a { color: var(--accent); text-decoration: none; border-bottom: 1px solid rgba(255,77,106,0.35); }

  ul, ol { padding-left: 22px; margin: 16px 0; }
  li { margin: 6px 0; }
  li::marker { color: var(--ink-low); }

  img, video { max-width: 100%; height: auto; border-radius: ${radius.card}px; }

  figure { margin: 24px 0; }
  figcaption { font-size: 13px; color: var(--ink-low); margin-top: 8px; }

  blockquote {
    margin: 24px 0;
    padding: 2px 0 2px 16px;
    border-left: 3px solid var(--accent);
    color: var(--ink-hi);
    font-size: 18px;
  }

  /* A table is the one thing that cannot be made to fit, so it scrolls in its
     own box rather than pushing the whole article sideways. */
  .tablewrap { overflow-x: auto; margin: 22px 0; border: 1px solid var(--line); border-radius: ${radius.panel}px; }
  table { border-collapse: collapse; width: 100%; font-size: 14px; }
  th, td { padding: 10px 14px; border-bottom: 1px solid var(--line); text-align: left; }
  th { color: var(--ink-low); font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; }
  tr:last-child td { border-bottom: 0; }

  pre {
    background: var(--surface-1);
    border: 1px solid var(--line);
    border-radius: ${radius.panel}px;
    padding: 14px 16px;
    overflow-x: auto;
    font-family: "IBM Plex Mono", monospace;
    font-size: 13px;
    line-height: 1.55;
  }

  code { font-family: "IBM Plex Mono", monospace; font-size: 0.88em; color: var(--ink-hi); }

  iframe { max-width: 100%; border: 0; border-radius: ${radius.card}px; aspect-ratio: 16 / 9; height: auto; }

  hr { border: 0; border-top: 1px solid var(--line); margin: 32px 0; }
</style>
</head>
<body>
  <div class="wrap">
    ${a.image ? `<figure class="hero"><img src="${esc(a.image)}" alt="${esc(a.imageAlt ?? '')}"></figure>` : ''}
    ${a.category ? `<div class="eyebrow">${esc(a.category)}</div>` : ''}
    <h1>${esc(a.title)}</h1>
    ${a.excerpt ? `<p class="standfirst">${esc(a.excerpt)}</p>` : ''}
    ${meta ? `<div class="byline">${meta}</div>` : ''}
    ${a.content}
  </div>

<script>
  /* Tables get their scroller here rather than in the CMS, so old articles
     benefit too. */
  document.querySelectorAll('table').forEach(function (t) {
    var w = document.createElement('div');
    w.className = 'tablewrap';
    t.parentNode.insertBefore(w, t);
    w.appendChild(t);
  });
</script>
</body>
</html>`;
}
