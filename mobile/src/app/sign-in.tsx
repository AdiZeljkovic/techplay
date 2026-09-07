import { router } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { Button } from '@/components/Button';
import { Body, Eyebrow, Notice, Screen, Title } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { ApiError, OfflineError } from '@/lib/api';
import { colors, font, radius, size, space, TOUCH_TARGET } from '@/theme/tokens';

export default function SignIn() {
    const { signIn } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    async function submit() {
        setError(null);
        setNotice(null);

        /*
         * The empty-field check lives here rather than on the button.
         *
         * Same rule as the Button component states: nothing is ever disabled
         * for being incomplete, because a control that does nothing teaches
         * nothing. Press it and find out what is missing.
         */
        if (!email.trim() || !password) {
            setError(
                !email.trim() && !password
                    ? 'Enter your email and password.'
                    : !email.trim()
                        ? 'Enter your email address.'
                        : 'Enter your password.'
            );

            return;
        }

        setBusy(true);

        try {
            const { requiresVerification } = await signIn(email.trim(), password);

            if (requiresVerification) {
                // The account exists and the password was right — it is the
                // email that has not been opened. Saying "wrong password"
                // here, which is what a naive failure path does, sends people
                // to reset a password that was never the problem.
                setNotice('Your email address has not been confirmed yet. Check your inbox for the link we sent.');

                return;
            }

            router.replace('/(tabs)');
        } catch (e) {
            if (e instanceof OfflineError) {
                setError(e.message);
            } else if (e instanceof ApiError) {
                // The API writes these for readers. Showing our own wording
                // instead would lose the distinction it is careful to make —
                // a locked account and a wrong password are not the same
                // thing and it says so.
                setError(e.message);
            } else {
                setError('Something went wrong. Try again in a moment.');
            }
        } finally {
            setBusy(false);
        }
    }

    return (
        <Screen>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.head}>
                        <Eyebrow tone="accent">Returning player</Eyebrow>
                        <Title style={styles.title}>
                            CONTINUE{'\n'}
                            <Text style={{ color: colors.accentInk }}>YOUR GAME</Text>
                        </Title>
                        <Body style={{ marginTop: space.sm }}>
                            Sign in to reach your shelf, your XP and everything you are following.
                        </Body>
                    </View>

                    {error && <Notice text={error} />}
                    {notice && <Notice text={notice} tone="info" />}

                    <View style={styles.field}>
                        <Eyebrow>Email address</Eyebrow>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="you@example.com"
                            placeholderTextColor={colors.inkFaint}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="email"
                            textContentType="emailAddress"
                            returnKeyType="next"
                        />
                    </View>

                    <View style={styles.field}>
                        <Eyebrow>Password</Eyebrow>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="••••••••"
                            placeholderTextColor={colors.inkFaint}
                            secureTextEntry
                            autoCapitalize="none"
                            autoComplete="current-password"
                            textContentType="password"
                            returnKeyType="go"
                            onSubmitEditing={submit}
                        />
                    </View>

                    <Button label="Sign in" onPress={submit} busy={busy} style={{ marginTop: space.sm }} />

                    <Button
                        label="Create an account"
                        variant="quiet"
                        onPress={() => router.push('/register')}
                    />

                    {/*
                      * Discord and Battle.net are still absent, and so is Sign
                      * in with Apple — which the App Store requires the moment
                      * the first of those appears. All three need the developer
                      * accounts, so the screen does not pretend to offer them.
                      */}
                    <Body style={styles.footnote}>
                        Connecting Steam, Xbox or PlayStation still happens on techplay.gg.
                        It is coming here.
                    </Body>
                </ScrollView>
            </KeyboardAvoidingView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: space.xl,
        gap: space.lg,
        flexGrow: 1,
        justifyContent: 'center',
    },
    head: {
        gap: space.xs,
        marginBottom: space.sm,
    },
    title: {
        marginTop: space.sm,
        fontSize: size.hero,
        lineHeight: size.hero * 1.08,
        textTransform: 'uppercase',
    },
    field: {
        gap: space.sm,
    },
    input: {
        height: TOUCH_TARGET,
        backgroundColor: colors.surface2,
        borderColor: colors.line,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.card,
        paddingHorizontal: space.lg,
        fontFamily: font.body,
        fontSize: size.body,
        color: colors.inkHi,
    },
    footnote: {
        fontSize: size.caption,
        lineHeight: size.caption * 1.55,
        color: colors.inkLow,
        marginTop: space.sm,
    },
});
