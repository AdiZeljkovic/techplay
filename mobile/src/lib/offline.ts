import { Directory, File, Paths } from 'expo-file-system';

/**
 * Articles kept on the phone, for reading with no signal.
 *
 * Three decisions, all of which could reasonably have gone the other way.
 *
 * **Only what somebody saves.** Not everything they open. An app that quietly
 * keeps every article a reader has touched fills their phone with things they
 * did not ask for and cannot see, and the first they hear of it is a storage
 * screen blaming TechPlay for 300 MB.
 *
 * **Kept until removed**, with a cap. Thirty is enough to be useful on a
 * flight and small enough that nobody has to think about it; past that the
 * least recently saved makes room.
 *
 * **A saved copy is a fallback, never the truth.** With a signal the article
 * is fetched fresh, because a piece can be corrected after somebody saved it
 * and serving them the stale one silently is worse than not having saved it.
 * The stored copy is used when the network fails, and the screen says when it
 * was taken.
 */

const DIRECTORY = 'offline';
const INDEX = 'index.json';
const CAP = 30;

export interface SavedArticle {
    slug: string;
    title: string;
    excerpt: string | null;
    content: string;
    featured_image_url: string | null;
    featured_image_alt: string | null;
    published_at_human: string | null;
    reading_time: number | null;
    category: { name: string } | null;
    author: { name?: string | null; username: string } | null;
    /** When this copy was taken, so the screen can say so. */
    saved_at: string;
}

/** The index: slug and when it was saved, newest first. Bodies live beside it. */
type Index = { slug: string; title: string; saved_at: string }[];

function dir(): Directory {
    const directory = new Directory(Paths.document, DIRECTORY);

    if (!directory.exists) {
        directory.create({ intermediates: true });
    }

    return directory;
}

function indexFile(): File {
    return new File(dir(), INDEX);
}

/**
 * A slug is a URL segment and this is a filename, so it is not trusted
 * blindly. Nothing in the catalogue has ever had a slash in it, but a path
 * built from a remote string is a path somebody else can choose.
 */
function bodyFile(slug: string): File {
    return new File(dir(), `${slug.replace(/[^a-z0-9-_]/gi, '_')}.json`);
}

export async function readIndex(): Promise<Index> {
    try {
        const file = indexFile();

        if (!file.exists) { return []; }

        return JSON.parse(await file.text()) as Index;
    } catch {
        // A truncated write, a full disk, a file somebody's backup mangled.
        // An unreadable index means nothing is saved, which is recoverable;
        // throwing here would take down whatever screen asked.
        return [];
    }
}

function writeIndex(index: Index): void {
    const file = indexFile();

    if (!file.exists) { file.create(); }

    file.write(JSON.stringify(index));
}

export async function isSaved(slug: string): Promise<boolean> {
    return (await readIndex()).some((entry) => entry.slug === slug);
}

export async function save(article: Omit<SavedArticle, 'saved_at'>): Promise<void> {
    const saved: SavedArticle = { ...article, saved_at: new Date().toISOString() };

    const body = bodyFile(article.slug);

    if (!body.exists) { body.create(); }

    body.write(JSON.stringify(saved));

    const index = (await readIndex()).filter((entry) => entry.slug !== article.slug);
    index.unshift({ slug: article.slug, title: article.title, saved_at: saved.saved_at });

    /*
     * Over the cap, the oldest goes — and its body with it. Trimming the index
     * without deleting the file would leave a phone quietly filling with
     * articles nothing can reach.
     */
    for (const stale of index.slice(CAP)) {
        try {
            const file = bodyFile(stale.slug);
            if (file.exists) { file.delete(); }
        } catch {
            // Already gone, or unreadable. Either way it is not on the index
            // any more, which is what the reader can see.
        }
    }

    writeIndex(index.slice(0, CAP));
}

export async function read(slug: string): Promise<SavedArticle | null> {
    try {
        const file = bodyFile(slug);

        if (!file.exists) { return null; }

        return JSON.parse(await file.text()) as SavedArticle;
    } catch {
        return null;
    }
}

export async function remove(slug: string): Promise<void> {
    try {
        const file = bodyFile(slug);
        if (file.exists) { file.delete(); }
    } catch {
        // The index is what the reader sees, so it is cleared either way.
    }

    writeIndex((await readIndex()).filter((entry) => entry.slug !== slug));
}
