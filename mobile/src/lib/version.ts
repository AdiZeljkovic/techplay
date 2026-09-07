import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { api } from './api';

/**
 * Whether this copy of the app is still one the server will talk to.
 *
 * The site and the API deploy together, so a change to one is a change to its
 * only reader in the same minute. This app breaks that arrangement the day it
 * is released: copies of it live on phones that will never be updated, and a
 * response edited months later breaks them silently — the reader does not
 * report anything, they just stop appearing.
 *
 * The server states a floor; this asks. Below it, the app says so rather than
 * making calls it cannot understand and drawing whatever comes back.
 */

export interface VersionVerdict {
    /** Too old to work. The app should show the update screen and nothing else. */
    blocked: boolean;
    /** Works, but there is a newer build worth having. Dismissible. */
    nudge: boolean;
    message: string;
    storeUrl: string | null;
}

interface Answer {
    minimum: number;
    recommended: number;
    store_url: { ios: string; android: string };
    message: string;
}

/**
 * This build's number.
 *
 * `buildNumber` on iOS and `versionCode` on Android are the store's own
 * counters: they only ever increase and never carry a dot, so "older than" is
 * an integer comparison rather than an argument about whether 1.10 comes
 * after 1.9. The marketing version is for people; this is for machines.
 */
export function currentBuild(): number {
    const raw = Platform.OS === 'ios'
        ? Constants.expoConfig?.ios?.buildNumber
        : Constants.expoConfig?.android?.versionCode;

    const parsed = Number.parseInt(String(raw ?? ''), 10);

    /*
     * A development build has no store number, and treating that as build 0
     * would lock the app out against any floor above zero — every time, on the
     * machine of whoever is working on it. Unknown means unblocked.
     */
    return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

export async function checkVersion(signal?: AbortSignal): Promise<VersionVerdict | null> {
    try {
        const answer = await api<Answer>('/system/app-version', { auth: false, signal });
        const build = currentBuild();

        return {
            blocked: build < answer.minimum,
            nudge: build >= answer.minimum && build < answer.recommended,
            message: answer.message,
            storeUrl: (Platform.OS === 'ios' ? answer.store_url?.ios : answer.store_url?.android) || null,
        };
    } catch {
        /*
         * No answer is not a verdict.
         *
         * A phone with no signal, or an API having a bad minute, must not
         * produce an update screen — that would be an app that refuses to work
         * offline because it could not ask permission to work offline.
         */
        return null;
    }
}
