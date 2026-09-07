import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Body, Eyebrow, Screen, Title } from '@/components/Screen';
import { size, space } from '@/theme/tokens';

/**
 * The one screen a build too old to work is allowed to draw.
 *
 * There is no back button and no way past it. That is the point: below the
 * floor this app cannot understand what the API sends, and letting somebody
 * browse a half-broken version is worse than stopping them — they would
 * report the symptoms rather than the cause.
 *
 * The wording comes from the server, because this is by definition a build
 * that cannot be changed. Whatever went wrong with it has to be explainable
 * without a release.
 */
export default function TooOld() {
    const { message, store } = useLocalSearchParams<{ message?: string; store?: string }>();

    return (
        <Screen>
            <View style={styles.content}>
                <Eyebrow tone="accent">Update needed</Eyebrow>
                <Title style={{ fontSize: size.hero }}>TIME TO{'\n'}UPDATE</Title>

                <Body style={{ marginTop: space.sm }}>
                    {message || 'This version of the app is too old to talk to TechPlay. Update it to carry on.'}
                </Body>

                {store ? (
                    <Button
                        label="Open the store"
                        onPress={() => Linking.openURL(store)}
                        style={{ marginTop: space.lg }}
                    />
                ) : (
                    <Button
                        label="Open techplay.gg"
                        variant="quiet"
                        onPress={() => Linking.openURL('https://techplay.gg')}
                        style={{ marginTop: space.lg }}
                    />
                )}

                {/* Reading on the web needs no app at all, and somebody who
                    cannot update right now should not be turned away from the
                    site as well. */}
                <Body style={styles.footnote}>
                    Everything here is on techplay.gg in the meantime.
                </Body>
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: space.xl,
        gap: space.xs,
    },
    footnote: {
        fontSize: size.caption,
        marginTop: space.lg,
    },
});
