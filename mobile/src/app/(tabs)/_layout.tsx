import { Tabs } from 'expo-router';

import { TabBar } from '@/components/TabBar';

/**
 * Five tabs, which is the ceiling.
 *
 * It was four, and they were the app's own idea of the sections — Read, News,
 * Dates, You. The site had already answered this question and answered it
 * differently: Home, Feed, you, Games, Forum, with a written reason for the
 * count (past five the labels stop fitting at 390px and the targets drop under
 * the 44px floor) and for the centre slot being a person rather than a place.
 * Two products disagreeing about their own navigation is a thing a reader
 * feels immediately and cannot name.
 *
 * So the app takes the site's five. The Game Database stands in the slot the
 * forum holds on the web, because the app has no forum yet; the calendar keeps
 * the fifth place it earned — it is the only screen here worth opening on a day
 * when nothing was published, and it is what push will eventually be for.
 *
 * The bar itself is `TabBar`, which draws the site's console. `tabBarStyle`
 * still hides the platform's own: passing a `tabBar` replaces the component,
 * not the space the navigator reserves for it.
 */
export default function TabsLayout() {
    return (
        <Tabs
            tabBar={(props) => <TabBar {...props} />}
            screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}
        >
            <Tabs.Screen name="index" options={{ title: 'Home' }} />
            <Tabs.Screen name="news" options={{ title: 'Feed' }} />
            <Tabs.Screen name="profile" options={{ title: 'You' }} />
            <Tabs.Screen name="catalogue" options={{ title: 'Games' }} />
            <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
        </Tabs>
    );
}
