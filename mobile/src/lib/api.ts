import { clearToken, getToken } from './session';

/**
 * The one way this app talks to TechPlay.
 *
 * Two things it does that the web client does not have to.
 *
 * **It times out.** A browser tab that hangs is a spinner somebody can close;
 * a phone that hangs on a train with one bar looks broken. `fetch` has no
 * timeout of its own, so every request gets an AbortController.
 *
 * **It says what went wrong.** Where the API uses the ApiResponse trait it
 * answers `{ success, message, data }`, and `message` is written for readers —
 * the backend has been through several rounds of making it so. Throwing that
 * message rather than a status code is what lets a screen show something
 * worth reading instead of "Request failed".
 *
 * Not every route uses the trait, though CLAUDE.md says they all do. Measured
 * on 7 September 2026, seven listing endpoints answered in six different
 * shapes; lib/paging carries the list. Reads that page go through it.
 */

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://api-beta.techplay.gg/api/v1';

/** Long enough for a slow network, short enough that the reader is not left guessing. */
const TIMEOUT_MS = 15_000;

export class ApiError extends Error {
    readonly status: number;

    /** Field errors from Laravel's validator, when it is a 422. */
    readonly fields: Record<string, string[]>;

    constructor(message: string, status: number, fields: Record<string, string[]> = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.fields = fields;
    }
}

/** Raised when nothing came back at all — no signal, aeroplane mode, a dropped tunnel. */
export class OfflineError extends Error {
    constructor() {
        super('No connection. Check your signal and try again.');
        this.name = 'OfflineError';
    }
}

type Options = {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    /** Send the stored token. On by default; the few public reads pass false. */
    auth?: boolean;
    signal?: AbortSignal;
    /**
     * Return the whole body rather than its `data`.
     *
     * Unwrapping is right for the routes that use the ApiResponse trait, and
     * wrong for a paginated one: `{success, data, pagination}` unwrapped to
     * `data` loses the page numbers with it. Listing endpoints ask for the
     * envelope and read it in lib/paging, which knows all six shapes this API
     * actually sends.
     */
    raw?: boolean;
};

/**
 * What to do when the server says the token is no longer good.
 *
 * Set once by AuthContext. The client cannot import the context — that would
 * be a cycle — and a 401 has to reach the screen that draws the session, not
 * just the call that happened to hit it.
 */
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
    onUnauthorized = handler;
}

export async function api<T>(path: string, options: Options = {}): Promise<T> {
    const { method = 'GET', body, auth = true, signal, raw = false } = options;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    // A caller's own cancellation — a screen unmounting, a search term
    // changing — has to reach the same request the timeout would abort.
    signal?.addEventListener('abort', () => controller.abort(), { once: true });

    const headers: Record<string, string> = {
        Accept: 'application/json',
    };

    if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
    }

    if (auth) {
        const token = await getToken();
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
    }

    let response: Response;

    try {
        response = await fetch(`${BASE}${path}`, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
            signal: controller.signal,
        });
    } catch (error) {
        clearTimeout(timer);

        // AbortError covers both the timeout and a caller cancelling. Neither
        // is a server fault, and both look the same to somebody holding a
        // phone: nothing arrived.
        throw new OfflineError();
    } finally {
        clearTimeout(timer);
    }

    /*
     * A body that is not JSON.
     *
     * It happens: Cloudflare answers a challenge with HTML, and a 502 from a
     * worker that ran out of time has no body at all. Reading `.json()` on
     * either throws a parse error that tells nobody anything, so the status
     * is what gets reported instead.
     */
    let payload: { success?: boolean; message?: string; data?: T; errors?: Record<string, string[]> } | null = null;

    try {
        payload = await response.json();
    } catch {
        payload = null;
    }

    if (response.status === 401) {
        // The token is gone — revoked, expired, or the account deleted. Drop
        // it rather than sending it again on every screen for the rest of the
        // session.
        await clearToken();
        onUnauthorized?.();

        throw new ApiError(payload?.message ?? 'Your session has ended. Sign in again.', 401);
    }

    if (!response.ok) {
        throw new ApiError(
            payload?.message ?? `Something went wrong (${response.status}).`,
            response.status,
            payload?.errors ?? {}
        );
    }

    /*
     * Unwrap `data` when there is one, which covers every route that uses the
     * trait and does no harm to the few that answer with a bare object.
     * Callers that need the envelope — anything paginated — ask for it.
     */
    if (raw) {
        return payload as T;
    }

    return (payload?.data ?? payload) as T;
}
