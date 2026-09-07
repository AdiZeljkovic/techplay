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
import { TurnstileGate } from '@/components/TurnstileGate';
import { api, ApiError, OfflineError } from '@/lib/api';
import { colors, font, radius, size, space, TOUCH_TARGET } from '@/theme/tokens';

/**
 * The API's rules, not decoration.
 *
 * RegisterRequest asks for Password::min(8)->mixedCase()->numbers()->symbols()
 * ->uncompromised(). The first four can be checked here; the fifth cannot —
 * it is a lookup against known breaches and only the server can do it, which
 * is why it is stated below the list rather than shown as a tick nobody can
 * earn locally.
 */
const RULES: { label: string; short: string; test: (p: string) => boolean }[] = [
    { label: 'At least 8 characters', short: 'two more characters', test: (p) => p.length >= 8 },
    { label: 'One uppercase letter', short: 'an uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { label: 'One lowercase letter', short: 'a lowercase letter', test: (p) => /[a-z]/.test(p) },
    { label: 'One number', short: 'a number', test: (p) => /[0-9]/.test(p) },
    { label: 'One special character', short: 'a special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export default function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [token, setToken] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    const missing = RULES.filter((r) => !r.test(password)).map((r) => r.short);
    const ready = password.length > 0 && missing.length === 0;

    async function submit() {
        setError(null);

        /*
         * Every refusal is spoken, and the button is never disabled for any of
         * them. That rule was learned expensively on the web: the sign-up form
         * disabled its button under exactly the condition that would have
         * raised the message explaining why, so the explanation was written,
         * wired up and unreachable. Two readers reported the site as broken.
         */
        if (!username.trim() || !email.trim() || !password) {
            setError('Fill in a username, an email address and a password.');

            return;
        }

        if (!ready) {
            setError(`Your password still needs ${missing.join(' and ')}.`);

            return;
        }

        if (password !== confirm) {
            setError('The two passwords do not match.');

            return;
        }

        if (!token) {
            setError('The security check has not finished. Give it a moment and try again.');

            return;
        }

        setBusy(true);

        try {
            await api('/auth/register', {
                method: 'POST',
                auth: false,
                body: {
                    username: username.trim(),
                    email: email.trim(),
                    password,
                    password_confirmation: confirm,
                    recaptcha_token: token,
                },
            });

            setDone(true);
        } catch (e) {
            if (e instanceof OfflineError) {
                setError(e.message);
            } else if (e instanceof ApiError) {
                // The API's own words. It distinguishes a taken username from a
                // breached password from a stale captcha, and rewording any of
                // those loses the distinction it is careful to make.
                setError(e.message);
            } else {
                setError('Something went wrong. Try again in a moment.');
            }

            /*
             * A spent token cannot be sent twice. Clearing it makes the gate
             * below issue a fresh challenge rather than letting the next
             * attempt fail on a captcha that was already used.
             */
            setToken(null);
        } finally {
            setBusy(false);
        }
    }

    if (done) {
        return (
            <Screen>
                <View style={styles.doneWrap}>
                    <Eyebrow tone="accent">Almost there</Eyebrow>
                    <Title style={{ fontSize: size.hero }}>CHECK{'\n'}YOUR EMAIL</Title>
                    <Body style={{ marginTop: space.sm }}>
                        We have sent a link to {email.trim()}. Open it to finish setting up your
                        account — you cannot sign in until you do.
                    </Body>
                    <Body style={styles.footnote}>
                        Nothing arrived? Look in spam first. It is the usual answer.
                    </Body>
                    <Button label="Back to sign in" onPress={() => router.replace('/sign-in')} style={{ marginTop: space.lg }} />
                </View>
            </Screen>
        );
    }

    return (
        <Screen>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                    <View style={{ gap: space.xs }}>
                        <Eyebrow tone="accent">New player</Eyebrow>
                        <Title style={styles.title}>
                            START{'\n'}
                            <Text style={{ color: colors.accentInk }}>NEW GAME</Text>
                        </Title>
                    </View>

                    {error && <Notice text={error} />}

                    <Field label="Username — your gamertag">
                        <TextInput
                            style={styles.input}
                            value={username}
                            onChangeText={setUsername}
                            placeholder="Pick a name"
                            placeholderTextColor={colors.inkFaint}
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="next"
                        />
                    </Field>

                    <Field label="Email address">
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
                            returnKeyType="next"
                        />
                    </Field>

                    <Field label="Password">
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="••••••••"
                            placeholderTextColor={colors.inkFaint}
                            secureTextEntry
                            autoCapitalize="none"
                            autoComplete="new-password"
                            returnKeyType="next"
                        />
                    </Field>

                    {password.length > 0 && (
                        <View style={styles.rules}>
                            {RULES.map((rule) => {
                                const passed = rule.test(password);

                                return (
                                    <Text key={rule.label} style={[styles.rule, passed && styles.rulePassed]}>
                                        {passed ? '✓' : '✕'}  {rule.label}
                                    </Text>
                                );
                            })}

                            {/* The sixth rule, which has no tick because only
                                the server can check it. Somebody could satisfy
                                all five above and still be turned away. */}
                            <Text style={styles.ruleNote}>
                                Passwords found in known data breaches are refused, however many of
                                these they meet.
                            </Text>
                        </View>
                    )}

                    <Field label="Confirm password">
                        <TextInput
                            style={styles.input}
                            value={confirm}
                            onChangeText={setConfirm}
                            placeholder="••••••••"
                            placeholderTextColor={colors.inkFaint}
                            secureTextEntry
                            autoCapitalize="none"
                            autoComplete="new-password"
                            returnKeyType="go"
                            onSubmitEditing={submit}
                        />
                    </Field>

                    <TurnstileGate onToken={setToken} onFailed={() => setToken(null)} />

                    <Button label="Create player" onPress={submit} busy={busy} />

                    <Body style={styles.footnote}>
                        By creating an account you agree to our terms and privacy policy on
                        techplay.gg.
                    </Body>
                </ScrollView>
            </KeyboardAvoidingView>
        </Screen>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <View style={{ gap: space.sm }}>
            <Eyebrow>{label}</Eyebrow>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    content: { padding: space.xl, gap: space.lg, paddingBottom: space.xxl },
    title: {
        fontSize: size.hero,
        lineHeight: size.hero * 1.06,
        textTransform: 'uppercase',
        marginTop: space.xs,
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
    rules: {
        backgroundColor: colors.surface2,
        borderColor: colors.line,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.card,
        padding: space.md,
        gap: 5,
    },
    rule: {
        fontFamily: font.body,
        fontSize: size.caption,
        color: colors.inkLow,
    },
    rulePassed: { color: colors.success },
    ruleNote: {
        fontFamily: font.body,
        fontSize: 11,
        lineHeight: 16,
        color: colors.inkFaint,
        marginTop: 4,
    },
    doneWrap: { flex: 1, justifyContent: 'center', padding: space.xl, gap: space.xs },
    footnote: {
        fontSize: size.caption,
        lineHeight: size.caption * 1.55,
        color: colors.inkLow,
    },
});
