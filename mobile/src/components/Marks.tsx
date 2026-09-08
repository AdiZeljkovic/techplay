import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

/**
 * The bar's marks, which are the site's marks.
 *
 * `MobileTabBar.tsx` draws lucide at 22px and `strokeWidth={1.4}`, round caps
 * and joins, and its docblock explains why: hand-drawn angular marks at that
 * size read as weight rather than as meaning. The app had reached for text
 * glyphs — ▤ ◈ ▦ ◉ — which is the same mistake in a cheaper form, and worse,
 * they are font characters, so they render as whatever the platform happens to
 * have and look like a different set on iOS than on Android.
 *
 * The path data below is copied out of `lucide-react` v0.562.0, the version
 * the site has installed, rather than redrawn — so the two are the same object
 * and stay the same object. Only the five in use are here; importing the
 * package would ship a thousand icons through a bundler that does not shake
 * them out.
 *
 * ISC licensed, © Lucide Contributors.
 */

const STROKE = 1.4;

function Mark({
    size = 22,
    stroke = STROKE,
    color,
    children,
}: {
    size?: number;
    stroke?: number;
    color: string;
    children: React.ReactNode;
}) {
    return (
        <Svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {children}
        </Svg>
    );
}

/**
 * `stroke` exists for one caller. The quick-link panels' art is 256px line
 * drawing with an ~8px stroke — 3% of the frame — where lucide at 1.4 on a
 * 24-unit box is 5.8%. A mark drawn beside that art at the default weight
 * reads as a heavier object from a different set, so the panel that has no
 * painted file thins its mark to sit in the same family.
 */
export type MarkProps = { size?: number; stroke?: number; color: string };

export function HouseMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <Path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
            <Path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </Mark>
    );
}

export function LayersMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <Path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />
            <Path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" />
            <Path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />
        </Mark>
    );
}

export function GamepadMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <Line x1="6" x2="10" y1="11" y2="11" />
            <Line x1="8" x2="8" y1="9" y2="13" />
            <Line x1="15" x2="15.01" y1="12" y2="12" />
            <Line x1="18" x2="18.01" y1="10" y2="10" />
            <Path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" />
        </Mark>
    );
}

export function CalendarMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <Path d="M8 2v4" />
            <Path d="M16 2v4" />
            <Rect width="18" height="18" x="3" y="4" rx="2" />
            <Path d="M3 10h18" />
        </Mark>
    );
}

export function UserMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <Circle cx="12" cy="7" r="4" />
        </Mark>
    );
}

export function ArrowRightMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <Path d="M5 12h14" />
            <Path d="m12 5 7 7-7 7" />
        </Mark>
    );
}

export function BookmarkMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <Path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </Mark>
    );
}

export function SearchMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <Path d="m21 21-4.34-4.34" />
            <Circle cx="11" cy="11" r="8" />
        </Mark>
    );
}

export function LifeBuoyMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <Circle cx="12" cy="12" r="10" />
            <Path d="m4.93 4.93 4.24 4.24" />
            <Path d="m14.83 9.17 4.24-4.24" />
            <Path d="m14.83 14.83 4.24 4.24" />
            <Path d="m9.17 14.83-4.24 4.24" />
            <Circle cx="12" cy="12" r="4" />
        </Mark>
    );
}

export function LogOutMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <Path d="m16 17 5-5-5-5" />
            <Path d="M21 12H9" />
            <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        </Mark>
    );
}

export function LogInMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <Path d="m10 17 5-5-5-5" />
            <Path d="M15 12H3" />
            <Path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        </Mark>
    );
}

/**
 * The two marks the shell draws itself.
 *
 * `TabMarks.tsx` on the site keeps exactly this pair and says why: they are
 * what the header needs and lucide does not supply in this shape. They are
 * also drawn in a different language from the rest — square caps, miter
 * joins, a 2.2 stroke — so they take their own wrapper rather than `Mark`,
 * which is round-capped at 1.4 for the lucide set.
 */
function Shell({
    size = 22,
    color,
    children,
}: {
    size?: number;
    color: string;
    children: React.ReactNode;
}) {
    return (
        <Svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={2.2}
            strokeLinecap="square"
            strokeLinejoin="miter"
        >
            {children}
        </Svg>
    );
}

/**
 * More — everything the five tabs do not carry.
 *
 * Three dots, not three lines. The site's own note: a hamburger would say
 * "this is the navigation", which since the tab bar exists it no longer is.
 */
export function MoreMark({ size = 22, color }: MarkProps) {
    return (
        <Shell size={size} color={color}>
            <Circle cx="5.6" cy="12" r="1.7" fill={color} stroke="none" />
            <Circle cx="12" cy="12" r="1.7" fill={color} stroke="none" />
            <Circle cx="18.4" cy="12" r="1.7" fill={color} stroke="none" />
        </Shell>
    );
}

/** The notification bell, which fills when something is waiting. */
export function BellMark({ size = 22, color, active = false }: MarkProps & { active?: boolean }) {
    return (
        <Shell size={size} color={color}>
            <Path
                d="M6 17.4v-5.6a6 6 0 0 1 12 0v5.6l1.6 2.2H4.4z"
                fill={active ? color : 'none'}
            />
            <Path d="M10.2 20.8a2 2 0 0 0 3.6 0" />
        </Shell>
    );
}
