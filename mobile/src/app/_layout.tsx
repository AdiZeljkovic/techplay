import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono';
import {
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans';
import {
    InstrumentSans_400Regular,
    InstrumentSans_700Bold,
} from '@expo-google-fonts/instrument-sans';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '@/context/AuthContext';
import { colors, font } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

/**
 * One theme, deliberately.
 *
 * `useColorScheme` is not consulted anywhere in this app. TechPlay has no
 * light palette — globals.css carries none, and no screen on the site has
 * ever been drawn on white. Following the phone's setting would produce a
 * half-light app nobody designed, which is worse than committing.
 *
 * React Navigation's DarkTheme is overridden rather than accepted: its greys
 * are its own, and a header in somebody else's grey is exactly the near-miss
 * that reads as unfinished.
 */
const navigationTheme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        primary: colors.accentInk,
        background: colors.surface0,
        card: colors.surface0,
        text: colors.inkHi,
        border: colors.line,
        notification: colors.accent,
    },
};

export default function RootLayout() {
    /*
     * Bundled, not fetched.
     *
     * The site loads these three from Google Fonts, which is right for a page
     * that can fall back mid-render. An app has nowhere to fall back to: the
     * first frame either has the typeface or it does not, and a phone on a
     * slow connection would draw the whole interface in the system face and
     * then jump.
     */
    const [fontsLoaded, fontError] = useFonts({
        [font.display]: InstrumentSans_700Bold,
        [font.displayRegular]: InstrumentSans_400Regular,
        [font.body]: IBMPlexSans_400Regular,
        [font.bodyMedium]: IBMPlexSans_500Medium,
        [font.bodySemi]: IBMPlexSans_600SemiBold,
        [font.mono]: IBMPlexMono_400Regular,
    });

    useEffect(() => {
        // A font that fails to load is not a reason to hold the splash screen
        // forever — the app is readable in the system face, and a permanent
        // splash is indistinguishable from a crash.
        if (fontsLoaded || fontError) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError]);

    if (!fontsLoaded && !fontError) {
        return null;
    }

    return (
        <AuthProvider>
            <ThemeProvider value={navigationTheme}>
                <StatusBar style="light" />
                <Stack
                    screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: colors.surface0 },
                        // Without this a push animation shows the ground
                        // behind the screen, which on iOS is white.
                        animation: 'slide_from_right',
                    }}
                />
            </ThemeProvider>
        </AuthProvider>
    );
}
