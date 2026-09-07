import * as SecureStore from 'expo-secure-store';

/**
 * Where the token lives.
 *
 * The web keeps it in `localStorage` because a browser has nothing better.
 * A phone does: the Keychain on iOS and the Keystore on Android, both of
 * which are encrypted at rest and survive a backup without leaking. An auth
 * token is a credential, and AsyncStorage — the obvious choice, and the wrong
 * one — is a plain unencrypted file any rooted device can read.
 *
 * Sanctum tokens last seven days (`SANCTUM_TOKEN_EXPIRATION=10080`). That is
 * fine for a browser tab and wrong for an app: nobody wants to sign in to a
 * news reader every Monday. `/auth/refresh` exists and is called on launch,
 * so a phone that opens the app at least once a week never sees a login
 * screen again.
 */
const TOKEN_KEY = 'techplay.token';

export async function getToken(): Promise<string | null> {
    try {
        return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
        // A device with no secure hardware, or a keychain the OS refused to
        // open. Treated as signed out rather than as an error — the reader
        // can sign in again, and pretending otherwise would wedge the app.
        return null;
    }
}

export async function setToken(token: string): Promise<void> {
    try {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch {
        // Nothing to do about it here. The session survives in memory for as
        // long as the app is open, which is better than refusing to sign in.
    }
}

export async function clearToken(): Promise<void> {
    try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {
        // Already gone, or unreadable. Either way there is no token to use.
    }
}
