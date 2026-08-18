import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";

/*
 * Where the unsubscribe link lands.
 *
 * Nothing is done here. The API route already removed them before redirecting —
 * which is the point: a one-click unsubscribe has to act on the click, not on a
 * button pressed afterwards on a page that may never load. So this is a receipt,
 * not a form.
 *
 * That also makes it a plain server component. No token in the URL, nothing to
 * fetch, nothing to get wrong.
 */
export const metadata: Metadata = {
    title: "Unsubscribed | TechPlay",
    description: "You have been removed from the TechPlay newsletter.",
    // A receipt for one person is not something search should hold on to.
    robots: { index: false, follow: false },
};

export default function NewsletterUnsubscribedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white/5 border border-white/10 p-8 rounded-[var(--radius-panel)] text-center backdrop-blur-xl">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 border border-green-500/50 mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>

                <h1 className="text-white text-2xl font-bold mb-2">You&rsquo;re off the list</h1>

                <p className="text-white/45">
                    We won&rsquo;t send you the newsletter again. Nothing else changes &mdash;
                    if you have an account, it stays exactly as it was.
                </p>

                {/*
                    People click this by accident, and a receipt with no way back
                    turns a misclick into a lost reader.
                */}
                <p className="text-white/35 text-sm mt-6">
                    Left by mistake?{" "}
                    <Link href="/#newsletter" className="text-[var(--accent)] hover:underline">
                        Sign up again
                    </Link>{" "}
                    &mdash; we&rsquo;ll send one mail to confirm it&rsquo;s you.
                </p>

                <Link
                    href="/"
                    className="inline-block mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-[var(--radius-card)] transition-colors"
                >
                    Back to TechPlay
                </Link>
            </div>
        </div>
    );
}
