/**
 * The site's own tokens, carried across unchanged.
 *
 * Every value here is copied from frontend/app/globals.css rather than picked
 * again. An app that is "nearly" the brand is worse than one that is plainly
 * something else: readers notice the near-miss and cannot say why.
 *
 * TechPlay is dark only — globals.css carries no light palette and no
 * prefers-color-scheme block — so this is one set, not two. That is a product
 * decision already taken on the web, and the app follows it rather than
 * inventing a light theme nobody designed.
 */

export const colors = {
    /** Page, scrims, the header bar. */
    surface0: '#05070A',
    /** Panels and cards. */
    surface1: '#0B0E14',
    /** Elevated: sheets, inputs, inner cards. */
    surface2: '#10141B',
    /** Topmost: pressed and active fills. */
    surface3: '#161B22',

    /** Default borders and dividers. */
    line: 'rgba(255, 255, 255, 0.06)',
    /** Interactive edges, inputs. */
    lineStrong: 'rgba(255, 255, 255, 0.12)',

    fill1: 'rgba(255, 255, 255, 0.03)',
    fill2: 'rgba(255, 255, 255, 0.06)',
    fill3: 'rgba(255, 255, 255, 0.10)',

    inkHi: '#FFFFFF',
    inkMid: 'rgba(255, 255, 255, 0.70)',
    inkLow: 'rgba(255, 255, 255, 0.45)',
    inkFaint: 'rgba(255, 255, 255, 0.30)',

    accent: '#DC143C',
    accentHover: '#FF4D6A',
    /*
     * Crimson on the page ground measures 4.04:1 — just under the 4.5:1 that
     * body text needs — so the site keeps a brighter shade for text and the
     * true accent for fills. The same split applies here.
     */
    accentInk: '#FF4D6A',
    accentDeep: '#4A0D1A',
    accentSoft: 'rgba(220, 20, 60, 0.15)',

    track: 'rgba(255, 255, 255, 0.08)',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F0B429',
} as const;

/**
 * Radii, in points.
 *
 * The web states these in rem against a 16px root, so 0.5rem is 8. Written as
 * numbers because React Native has no unit — and rounded, since a fractional
 * corner radius is invisible and costs a re-measure.
 */
export const radius = {
    inner: 3,
    card: 5,
    panel: 8,
    sheet: 12,
} as const;

/**
 * Spacing, on the four-point grid the site already uses.
 */
export const space = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
} as const;

/**
 * Type.
 *
 * Three faces, the same three the site loads: Instrument Sans for display,
 * IBM Plex Sans for reading, IBM Plex Mono for figures. They are bundled
 * rather than fetched — a phone on a slow connection should not be waiting on
 * fonts.google.com to render a headline, and an app has nowhere to fall back
 * to gracefully the way a web page does.
 *
 * `display` here means the site's own idiom: heavy, uppercase, letterspaced.
 * It is a label voice, not a headline voice, and it is used the same way.
 */
export const font = {
    display: 'InstrumentSans-Bold',
    displayRegular: 'InstrumentSans-Regular',
    body: 'IBMPlexSans-Regular',
    bodyMedium: 'IBMPlexSans-Medium',
    bodySemi: 'IBMPlexSans-SemiBold',
    mono: 'IBMPlexMono-Regular',
} as const;

/**
 * The type scale, in points.
 *
 * A phone is not a desktop: the site's 42px display sizes do not survive a
 * 390pt viewport, so this is the scale re-derived for the device rather than
 * the web's numbers divided by something.
 */
export const size = {
    /** Uppercase micro-labels — the site's `text-[10px] tracking-[0.14em]`. */
    label: 10,
    caption: 12,
    small: 13,
    body: 15,
    lead: 17,
    title: 20,
    display: 26,
    hero: 32,
} as const;

/**
 * Apple asks for 44pt, Google for 48dp. Anything a finger touches is at least
 * this tall, and the mobile-web audit of August 2026 found 518 targets below
 * it on the site — a mistake worth not repeating in a place where touch is
 * the only input there is.
 */
export const TOUCH_TARGET = 48;
