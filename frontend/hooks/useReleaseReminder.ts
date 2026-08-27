"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import axios from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";

/**
 * Ask to be told when a game comes out.
 *
 * The same twelve lines were written three times — CalendarClient,
 * ReleaseClient and ReleaseCard each had their own copy of the request, the
 * toast and the busy flag, and they had already drifted on what they said when
 * it failed.
 *
 * They are collected here because the button is about to appear in a fourth
 * place. `/calendar/{slug}` now points its canonical at `/games/{slug}`: the
 * two pages describe the same game from the same row and the calendar view is
 * the thinner of them, so the game page should own the entity outright — which
 * means owning the one thing the calendar page could do that it could not.
 */
export function useReleaseReminder(slug: string, onChanged?: () => void) {
    const { user } = useAuth();
    const [busy, setBusy] = useState(false);

    const toggle = async () => {
        if (!user) {
            toast.error("Sign in to track releases.");

            return;
        }

        setBusy(true);
        try {
            const res = await axios.post(`/calendar/${slug}/reminder`);
            toast.success(res.data?.message ?? "Reminder updated.");
            onChanged?.();
        } catch (e: unknown) {
            const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message ?? "That didn't work.");
        } finally {
            setBusy(false);
        }
    };

    return { toggle, busy, canRemind: !!user };
}
