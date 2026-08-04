import { redirect } from "next/navigation";

/** Friends became the Social Hub — the old URL keeps working. */
export default function FriendsPage() {
    redirect("/social");
}
