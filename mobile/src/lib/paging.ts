import { api } from './api';

/**
 * One reader for six different pagination envelopes.
 *
 * Measured against the live API on 7 September 2026, seven listing endpoints
 * answer in six shapes:
 *
 *   /news, /reviews    { data, links, meta }              resource collection
 *   /guides            { current_page, data, ... }        raw Laravel paginator
 *   /games             { count, next, previous, results } another convention entirely
 *   /studios           { success, data, pagination }      ApiResponse::paginated
 *   /home              { success, message, data }         ApiResponse::success
 *   /settings          a bare object                      no envelope at all
 *
 * CLAUDE.md says every controller uses the ApiResponse trait. Most listing
 * endpoints do not, and nobody noticed because the web client was written
 * against each one as it was built — a page that reads one endpoint never
 * discovers that the next one disagrees.
 *
 * An app cannot work that way. It is one binary reading all of them, and
 * unlike the site it cannot be redeployed to match a change: a shape edited
 * after release breaks the copy already on somebody's phone.
 *
 * Normalising the API is the right fix and it is a breaking change to a live
 * site, so it is a decision rather than a commit. Until it is taken, the
 * difference is absorbed here, in one function, where it is written down.
 */

export interface Paged<T> {
    items: T[];
    page: number;
    lastPage: number;
}

/** Anything a listing endpoint might hand back, before it is understood. */
type Envelope<T> =
    | T[]
    | {
        data?: T[] | { data?: T[] };
        results?: T[];
        meta?: { current_page?: number; last_page?: number };
        pagination?: { current_page?: number; last_page?: number };
        current_page?: number;
        last_page?: number;
        count?: number;
        next?: string | null;
    };

export async function getPage<T>(path: string, signal?: AbortSignal, auth = false): Promise<Paged<T>> {
    /*
     * `api()` already unwraps one level: it returns `payload.data` when there
     * is one. For `{success, data, pagination}` that throws the pagination
     * away, so this asks for the whole body and does the unwrapping itself.
     */
    const body = await api<Envelope<T>>(path, { auth, signal, raw: true });

    // A bare array, which is what several endpoints send when they do not
    // paginate at all.
    if (Array.isArray(body)) {
        return { items: body, page: 1, lastPage: 1 };
    }

    const items =
        (Array.isArray(body.data) ? body.data : undefined) ??
        (Array.isArray(body.results) ? body.results : undefined) ??
        (body.data && !Array.isArray(body.data) && Array.isArray(body.data.data) ? body.data.data : undefined) ??
        [];

    const page = body.meta?.current_page ?? body.pagination?.current_page ?? body.current_page ?? 1;

    /*
     * `/games` states neither the current page nor the last one — it sends a
     * total and a URL for the next page. So "is there more" is the presence
     * of `next`, and the page number is the one that was asked for.
     */
    const lastPage =
        body.meta?.last_page ??
        body.pagination?.last_page ??
        body.last_page ??
        (body.next ? page + 1 : page);

    return { items, page, lastPage };
}
