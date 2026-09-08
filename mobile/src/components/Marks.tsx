import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';

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

export function NewspaperMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <Path d="M15 18h-5" />
            <Path d="M18 14h-8" />
            <Path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2" />
            <Rect width="8" height="4" x="10" y="6" rx="1" />
        </Mark>
    );
}

export function CpuMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <Path d="M12 20v2" />
            <Path d="M12 2v2" />
            <Path d="M17 20v2" />
            <Path d="M17 2v2" />
            <Path d="M2 12h2" />
            <Path d="M2 17h2" />
            <Path d="M2 7h2" />
            <Path d="M20 12h2" />
            <Path d="M20 17h2" />
            <Path d="M20 7h2" />
            <Path d="M7 20v2" />
            <Path d="M7 2v2" />
            <Rect x="4" y="4" width="16" height="16" rx="2" />
            <Rect x="8" y="8" width="8" height="8" rx="1" />
        </Mark>
    );
}

export function BookOpenMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <Path d="M12 7v14" />
            <Path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
        </Mark>
    );
}

export function TrophyMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <Path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978" />
            <Path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978" />
            <Path d="M18 9h1.5a1 1 0 0 0 0-5H18" />
            <Path d="M4 22h16" />
            <Path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" />
            <Path d="M6 9H4.5a1 1 0 0 1 0-5H6" />
        </Mark>
    );
}

export function UsersMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <Path d="M16 3.128a4 4 0 0 1 0 7.744" />
            <Path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <Circle cx="9" cy="7" r="4" />
        </Mark>
    );
}

export function GiftMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <Rect x="3" y="8" width="18" height="4" rx="1" />
            <Path d="M12 8v13" />
            <Path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
            <Path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
        </Mark>
    );
}

export function SwordsMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <Polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
            <Line x1="13" x2="19" y1="19" y2="13" />
            <Line x1="16" x2="20" y1="16" y2="20" />
            <Line x1="19" x2="21" y1="21" y2="19" />
            <Polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
            <Line x1="5" x2="9" y1="14" y2="18" />
            <Line x1="7" x2="4" y1="17" y2="20" />
            <Line x1="3" x2="5" y1="19" y2="21" />
        </Mark>
    );
}

export function ShieldHalfMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <Path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
            <Path d="M12 22V2" />
        </Mark>
    );
}

export function CompassMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <Path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z" />
            <Circle cx="12" cy="12" r="10" />
        </Mark>
    );
}

export function MapPinnedMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <Path d="M18 8c0 3.613-3.869 7.429-5.393 8.795a1 1 0 0 1-1.214 0C9.87 15.429 6 11.613 6 8a6 6 0 0 1 12 0" />
            <Circle cx="12" cy="8" r="2" />
            <Path d="M8.714 14h-3.71a1 1 0 0 0-.948.683l-2.004 6A1 1 0 0 0 3 22h18a1 1 0 0 0 .948-1.316l-2-6a1 1 0 0 0-.949-.684h-3.712" />
        </Mark>
    );
}

export function Disc3Mark(props: MarkProps) {
    return (
        <Mark {...props}>
            <Circle cx="12" cy="12" r="10" />
            <Path d="M6 12c0-1.7.7-3.2 1.8-4.2" />
            <Circle cx="12" cy="12" r="2" />
            <Path d="M18 12c0 1.7-.7 3.2-1.8 4.2" />
        </Mark>
    );
}

export function ShoppingCartMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <Circle cx="8" cy="21" r="1" />
            <Circle cx="19" cy="21" r="1" />
            <Path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </Mark>
    );
}

export function SettingsMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <Path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
            <Circle cx="12" cy="12" r="3" />
        </Mark>
    );
}

export function XMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <Path d="M18 6 6 18" />
            <Path d="m6 6 12 12" />
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
