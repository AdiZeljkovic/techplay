"use client";

import { useEffect, useState } from "react";
import { X, Send, Mail, Building2, User, MessageSquare, DollarSign, Target } from "lucide-react";

/**
 * "Request a custom package" — the form a media buyer fills instead of writing
 * an email from scratch.
 *
 * It was unreachable until now: built, imported, rendered, and never opened,
 * because setPackageModalOpen(true) was not called anywhere. Reaching it
 * exposed two things worth fixing rather than restyling.
 *
 * The submit handler waited 1.5 seconds on a setTimeout commented "Simulate API
 * call" before opening a mailto: link. There is no API — the form hands its
 * contents to the visitor's mail client, which is a reasonable thing to do
 * without a backend, but the fake wait only made a working action look slow.
 *
 * And the whole thing was painted in #001540, a blue that appears nowhere else
 * on the site, fourteen times over.
 */

interface RequestPackageModalProps {
    isOpen: boolean;
    onClose: () => void;
    contactEmail?: string;
}

const BUDGETS = [
    ["<5k", "Under €5,000"],
    ["5k-10k", "€5,000 – €10,000"],
    ["10k-25k", "€10,000 – €25,000"],
    ["25k-50k", "€25,000 – €50,000"],
    ["50k+", "€50,000+"],
];

const OBJECTIVES = [
    ["brand-awareness", "Brand awareness"],
    ["product-launch", "Product launch"],
    ["lead-generation", "Lead generation"],
    ["sales", "Direct sales"],
    ["engagement", "Community engagement"],
    ["other", "Something else"],
];

const EMPTY = { name: "", email: "", company: "", budget: "", objective: "", message: "" };

const LABEL = "block mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-faint)]";
const FIELD =
    "w-full h-11 rounded-[var(--radius-inner)] bg-[var(--surface-0)] border border-[var(--line)] " +
    "pl-10 pr-3 text-[13px] text-[var(--ink-hi)] placeholder:text-[var(--ink-faint)] " +
    "focus:outline-none focus:ring-2 focus:ring-[var(--accent)]";
const ICON = "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-faint)] pointer-events-none";

export default function RequestPackageModal({ isOpen, onClose, contactEmail }: RequestPackageModalProps) {
    const [formData, setFormData] = useState(EMPTY);
    const [submitted, setSubmitted] = useState(false);

    // Escape closes it, and the page behind stops scrolling while it is open.
    useEffect(() => {
        if (!isOpen) return;

        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const set = (field: keyof typeof EMPTY) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => setFormData((prev) => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const subject = `Media kit request from ${formData.name}`;
        const body = [
            `Name: ${formData.name}`,
            `Email: ${formData.email}`,
            `Company: ${formData.company}`,
            `Budget: ${formData.budget}`,
            `Objective: ${formData.objective}`,
            "",
            "Message:",
            formData.message,
        ].join("\n");

        window.location.href =
            `mailto:${contactEmail || "marketing@techplay.gg"}` +
            `?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        setSubmitted(true);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="package-modal-title"
                className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-[var(--radius-panel)] sm:rounded-[var(--radius-panel)] bg-[var(--surface-1)] border border-[var(--line-strong)] p-6 md:p-8"
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute right-4 top-4 inline-flex w-9 h-9 rounded-[var(--radius-inner)] bg-[var(--fill-2)] text-[var(--ink-low)] items-center justify-center hover:text-[var(--ink-hi)] transition-colors duration-300"
                >
                    <X className="w-4 h-4" />
                </button>

                {submitted ? (
                    <div className="py-10 text-center">
                        <span className="inline-flex w-12 h-12 rounded-[var(--radius-inner)] bg-[var(--fill-2)] text-[var(--accent)] items-center justify-center mb-4">
                            <Mail className="w-5 h-5" />
                        </span>
                        <h2 className="font-display text-[15px] font-bold uppercase tracking-wider text-[var(--ink-hi)] mb-2">
                            Your email is ready
                        </h2>
                        <p className="mx-auto max-w-md text-[13px] text-[var(--ink-low)] leading-relaxed">
                            We&apos;ve opened your mail client with the details filled in. Send it and we&apos;ll
                            come back with a plan — usually within a few hours.
                        </p>
                        <button
                            type="button"
                            onClick={() => { setFormData(EMPTY); setSubmitted(false); onClose(); }}
                            className="btn-command btn-command-quiet mt-6 inline-flex items-center h-11 px-6 bg-[var(--fill-2)] text-[var(--ink-hi)] font-display text-[13px] font-bold uppercase tracking-wider hover:bg-[var(--fill-3)] transition-colors duration-300"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="mb-6 pr-10">
                            <h2 id="package-modal-title" className="font-display text-[17px] font-black uppercase tracking-tight text-[var(--ink-hi)]">
                                Request a custom package
                            </h2>
                            <p className="mt-2 text-[13px] text-[var(--ink-low)] leading-relaxed">
                                Tell us about your campaign goals and we&apos;ll put together a media plan with
                                pricing and placement options.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="pkg-name" className={LABEL}>Your name *</label>
                                    <div className="relative">
                                        <User className={ICON} />
                                        <input id="pkg-name" required value={formData.name} onChange={set("name")} placeholder="John Doe" className={FIELD} />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="pkg-email" className={LABEL}>Email *</label>
                                    <div className="relative">
                                        <Mail className={ICON} />
                                        <input id="pkg-email" type="email" required value={formData.email} onChange={set("email")} placeholder="john@company.com" className={FIELD} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="pkg-company" className={LABEL}>Company</label>
                                <div className="relative">
                                    <Building2 className={ICON} />
                                    <input id="pkg-company" value={formData.company} onChange={set("company")} placeholder="Your Company" className={FIELD} />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="pkg-budget" className={LABEL}>Budget</label>
                                    <div className="relative">
                                        <DollarSign className={ICON} />
                                        <select id="pkg-budget" value={formData.budget} onChange={set("budget")} className={`${FIELD} appearance-none`}>
                                            <option value="">Select a range…</option>
                                            {BUDGETS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="pkg-objective" className={LABEL}>Objective</label>
                                    <div className="relative">
                                        <Target className={ICON} />
                                        <select id="pkg-objective" value={formData.objective} onChange={set("objective")} className={`${FIELD} appearance-none`}>
                                            <option value="">What are you after?</option>
                                            {OBJECTIVES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="pkg-message" className={LABEL}>Message</label>
                                <div className="relative">
                                    <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-[var(--ink-faint)] pointer-events-none" />
                                    <textarea
                                        id="pkg-message"
                                        rows={4}
                                        value={formData.message}
                                        onChange={set("message")}
                                        placeholder="Tell us about your campaign, target audience, timeline, or any specific requirements…"
                                        className="w-full rounded-[var(--radius-inner)] bg-[var(--surface-0)] border border-[var(--line)] py-3 pl-10 pr-3 text-[13px] text-[var(--ink-hi)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn-command inline-flex w-full items-center justify-center gap-2 h-11 px-6 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-display text-[13px] font-bold uppercase tracking-wider transition-colors duration-300"
                            >
                                <Send className="w-4 h-4" />
                                Send request
                            </button>

                            <p className="text-center text-[11px] text-[var(--ink-faint)]">
                                This opens your mail client with the details filled in — nothing is sent from here.
                            </p>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
