import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
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

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.surface0, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={colors.accentInk} />
            </View>
        );
    }

    return <Redirect href={user ? '/feed' : '/sign-in'} />;
}
