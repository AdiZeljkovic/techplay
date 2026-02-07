/**
 * Decode HTML entities in a string.
 * Works in both browser and Node.js (SSR-safe for Next.js).
 */

const entityMap: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#039;': "'",
  '&#39;': "'",
  '&apos;': "'",
  '&#x27;': "'",
  '&#x2F;': '/',
  '&#47;': '/',
  '&nbsp;': ' ',
  '&ndash;': '\u2013',
  '&mdash;': '\u2014',
  '&laquo;': '\u00AB',
  '&raquo;': '\u00BB',
  '&copy;': '\u00A9',
  '&reg;': '\u00AE',
  '&trade;': '\u2122',
  '&hellip;': '\u2026',
};

const entityPattern = /&(?:#(?:x([0-9a-fA-F]+)|(\d+))|([a-zA-Z]+));/g;

export function decodeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(entityPattern, (match, hex, dec, named) => {
    if (hex) return String.fromCodePoint(parseInt(hex, 16));
    if (dec) return String.fromCodePoint(parseInt(dec, 10));
    const namedEntity = `&${named};`;
    return entityMap[namedEntity] ?? match;
  });
}
