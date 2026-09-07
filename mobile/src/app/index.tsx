import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { checkVersion } from '@/lib/version';
import { colors } from '@/theme/tokens';

/**
 * Straight into the app. There is no fork.
 *
 * This used to send anybody without a session to a sign-in screen, which was
 * wrong twice over. The front page is public — `/home` takes no token — so
 * demanding an account to read the news is asking for something the app does
 * not need. And App Store rule 5.1.1 forbids exactly that: an app may not
 * require an account for features that work without one, which is a rejection
 * rather than an opinion.
 *
 * So the reader lands on the feed, and signing in is asked for at the point
 * where it actually buys something — a shelf, XP, a profile.
 *
 * The wait here is only for the version check and the stored session, neither
 * of which is worth drawing a screen for.
 */
export default function Entry() {
    const { loading } = useAuth();

    /*
     * Asked once, on launch, beside the session check.
     *
     * A build below the server's floor cannot understand what the API sends,
     * so it is stopped here rather than allowed to draw whatever comes back.
     * No answer — no signal, the API having a bad minute — is not a verdict:
     * an app that refuses to open because it could not ask permission to open
     * is worse than one that is out of date.
     */
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        checkVersion(controller.signal).then((verdict) => {
            if (controller.signal.aborted) { return; }

            if (verdict?.blocked) {
                router.replace({
                    pathname: '/too-old',
                    params: { message: verdict.message, store: verdict.storeUrl ?? '' },
                });

                return;
            }

            setChecked(true);
        });

        return () => controller.abort();
    }, []);

    if (loading || !checked) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.surface0, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={colors.accentInk} />
            </View>
        );
    }

    return <Redirect href="/(tabs)" />;
}
