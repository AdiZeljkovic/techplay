import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { checkVersion } from '@/lib/version';
import { colors } from '@/theme/tokens';

/**
 * The fork, and nothing else.
 *
 * It holds while the stored session is checked — which involves reading the
 * keychain and a refresh call — and then sends the reader to the feed or to
 * the sign-in screen. Drawing anything here would mean drawing it twice, once
 * before the answer and once after.
 */
export default function Entry() {
    const { user, loading } = useAuth();

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

    return <Redirect href={user ? '/(tabs)' : '/sign-in'} />;
}
