import type { Metadata } from "next";
import RulesClient from "./RulesClient";

/**
 * The guidelines get their own title and their own address.
 *
 * A client component cannot export metadata, so this page inherited the
 * forum's generic one — it announced itself to search as "Community Forums -
 * Gaming Discussions & Help", the same as every other page under /forum. The
 * rules are static text, so a thin server wrapper is all it takes.
 */
export const metadata: Metadata = {
    title: "Community guidelines",
    description:
        "What keeps the TechPlay boards worth reading: respect, relevance, and the rules a moderator can point at — each one numbered.",
    alternates: { canonical: "/forum/rules" },
    openGraph: {
        title: "Community guidelines — TechPlay Forum",
        description: "The rules of the TechPlay community forum, numbered so they can be cited.",
        type: "article",
    },
};

export default function ForumRulesPage() {
    return <RulesClient />;
}
