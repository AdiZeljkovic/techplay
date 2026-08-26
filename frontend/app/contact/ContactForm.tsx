"use client";

import { useState, useRef, type FormEvent } from "react";
import { Send, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import { submitContactForm } from "./actions";

/**
 * The only part of /contact that needs the browser.
 *
 * It used to live inside the page, which made the whole page a client
 * component — the address, the three inbox cards and the hero all shipped as
 * JavaScript to render text that never changes. Split out, the form is the
 * island and the rest of the page is server-rendered.
 */

const TOPICS = [
    ["general", "General Inquiry"],
    ["press", "Press / News Tip"],
    ["advertising", "Advertising"],
    ["support", "Technical Support"],
    ["feedback", "Feedback"],
];

const LABEL = "block mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-faint)]";

export default function ContactForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // The topic used to ride on the native select's own value. A listbox is not
    // a form control, so it is held here and posted through a hidden input.
    const [subject, setSubject] = useState("");
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // A hidden input is exempt from native validation, so the check the
        // `required` attribute used to make happens here.
        if (!subject) {
            setError("Pick a subject so we know where to send this.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const formData = new FormData(e.target as HTMLFormElement);

        try {
            const result = await submitContactForm({
                name: formData.get("name") as string,
                email: formData.get("email") as string,
                subject: formData.get("subject") as string,
                message: formData.get("message") as string,
            });

            if (result.success) {
                setIsSent(true);
                formRef.current?.reset();
                setSubject("");
            } else {
                setError(result.message);
            }
        } catch {
            setError("An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSent) {
        return (
            <div className="rounded-[var(--radius-card)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-[var(--fill-1)] p-8 text-center">
                <span className="inline-flex w-12 h-12 rounded-full bg-[var(--fill-2)] text-[var(--accent)] items-center justify-center mb-4">
                    <CheckCircle2 className="w-6 h-6" />
                </span>
                <h4 className="font-display text-[15px] font-bold uppercase tracking-wider text-[var(--ink-hi)] mb-2">
                    Message sent
                </h4>
                <p className="text-[13px] text-[var(--ink-low)] leading-relaxed">
                    Thank you for reaching out. We&apos;ve received your message and will get back to you shortly.
                </p>
                <Button variant="outline" className="mt-6" onClick={() => setIsSent(false)}>
                    Send another message
                </Button>
            </div>
        );
    }

    return (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
            {error && (
                <p
                    role="alert"
                    className="flex items-center gap-2.5 rounded-[var(--radius-inner)] border border-[color-mix(in_srgb,var(--danger,#ef4444)_35%,transparent)] bg-[color-mix(in_srgb,var(--danger,#ef4444)_10%,transparent)] p-3 text-[12.5px] text-[var(--ink-hi)]"
                >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className={LABEL}>Name</label>
                    <Input id="name" name="name" placeholder="John Doe" required className="bg-[var(--surface-0)]" />
                </div>
                <div>
                    <label htmlFor="email" className={LABEL}>Email</label>
                    <Input id="email" name="email" type="email" placeholder="john@example.com" required className="bg-[var(--surface-0)]" />
                </div>
            </div>

            <div>
                <label htmlFor="subject" className={LABEL}>Subject</label>
                <Select
                    value={subject}
                    onChange={setSubject}
                    name="subject"
                    ariaLabel="Subject"
                    placeholder="Select a topic…"
                    options={TOPICS.map(([value, label]) => ({ value, label }))}
                    className="w-full h-10 px-3 text-[13px] bg-[var(--surface-0)]"
                />
            </div>

            <div>
                <label htmlFor="message" className={LABEL}>Message</label>
                <Textarea id="message" name="message" placeholder="How can we help you?" required className="min-h-[150px]" />
            </div>

            <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
                {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
                ) : (
                    <><Send className="w-4 h-4 mr-2" /> Send message</>
                )}
            </Button>

            <p className="text-[11px] text-[var(--ink-faint)] text-center">
                By sending this message, you agree to our Privacy Policy.
            </p>
        </form>
    );
}
