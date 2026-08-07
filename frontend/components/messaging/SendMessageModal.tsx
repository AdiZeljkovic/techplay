"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, Send } from "lucide-react";
import axios from "@/lib/axios";
import toast from "react-hot-toast";

interface SendMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientUsername: string;
    replyToMessageId?: number | null; // Added prop for threading
    initialSubject?: string; // Auto-fill subject for replies
}

export function SendMessageModal({ isOpen, onClose, recipientUsername, replyToMessageId, initialSubject }: SendMessageModalProps) {
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    // Auto-fill subject if provided (e.g., "Re: Original Subject")
    useEffect(() => {
        if (isOpen && initialSubject) {
            setSubject(initialSubject.startsWith("Re:") ? initialSubject : `Re: ${initialSubject}`);
        } else if (isOpen) {
            setSubject("");
            setBody("");
        }
    }, [isOpen, initialSubject]);

    const handleSend = async () => {
        if (!subject.trim() || !body.trim()) return;

        setLoading(true);
        try {
            await axios.post('/messages', {
                receiver_username: recipientUsername,
                subject,
                body,
                parent_id: replyToMessageId // Send parent_id for threading
            });
            setSent(true);
            setTimeout(() => {
                onClose();
                setSent(false);
                setSubject("");
                setBody("");
            }, 1000);
        } catch (error) {
            console.error("Failed to send message", error);
            toast.error("Failed to send message");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-[var(--surface-1)] border-[var(--line)] text-white shadow-2xl backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Send className="w-5 h-5 text-[var(--accent)]" />
                        Message to <span className="text-[var(--accent)]">{recipientUsername}</span>
                    </DialogTitle>
                </DialogHeader>

                {sent ? (
                    <div className="flex flex-col items-center justify-center py-10 text-[var(--accent)] animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 rounded-full bg-[var(--accent)]/20 flex items-center justify-center mb-4">
                            <Send className="w-8 h-8" />
                        </div>
                        <p className="font-bold text-lg">Message Sent Successfully!</p>
                    </div>
                ) : (
                    <div className="space-y-5 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/55">Subject</label>
                            <Input
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="What's this about?"
                                className="bg-[var(--surface-2)] border-[var(--line)] focus:ring-[var(--accent)]/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/55">Message</label>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder="Write your message here..."
                                className="w-full min-h-[150px] p-4 rounded-[var(--radius-card)] bg-[var(--surface-2)] border border-[var(--line)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 text-sm transition-all resize-y placeholder:text-white/35"
                            />
                        </div>
                    </div>
                )}

                {!sent && (
                    <DialogFooter>
                        <Button variant="ghost" onClick={onClose} disabled={loading} className="hover:bg-[var(--surface-2)]">
                            Cancel
                        </Button>
                        <Button onClick={handleSend} disabled={loading || !subject.trim() || !body.trim()} className="bg-[var(--accent)] text-black hover:bg-[var(--accent)]/90">
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Send Message
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
