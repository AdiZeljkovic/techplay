"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea"; // Assuming you have this or will use standard textarea
import { Loader2, Send } from "lucide-react";
import axios from "@/lib/axios";

interface SendMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientUsername: string;
}

export function SendMessageModal({ isOpen, onClose, recipientUsername }: SendMessageModalProps) {
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSend = async () => {
        if (!subject.trim() || !body.trim()) return;

        setLoading(true);
        try {
            await axios.post('/messages', {
                receiver_username: recipientUsername,
                subject,
                body
            });
            setSent(true);
            setTimeout(() => {
                onClose();
                setSent(false);
                setSubject("");
                setBody("");
            }, 1500);
        } catch (error) {
            console.error("Failed to send message", error);
            alert("Failed to send message");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)]">
                <DialogHeader>
                    <DialogTitle>Message {recipientUsername}</DialogTitle>
                </DialogHeader>

                {sent ? (
                    <div className="flex flex-col items-center justify-center py-10 text-[var(--accent)]">
                        <Send className="w-12 h-12 mb-4 animate-bounce" />
                        <p className="font-bold">Message Sent!</p>
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--text-secondary)]">Subject</label>
                            <Input
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="What's this about?"
                                className="bg-[var(--bg-elevated)] border-[var(--border)]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--text-secondary)]">Message</label>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder="Write your message here..."
                                className="w-full min-h-[120px] p-3 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm"
                            />
                        </div>
                    </div>
                )}

                {!sent && (
                    <DialogFooter>
                        <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
                        <Button onClick={handleSend} disabled={loading || !subject.trim() || !body.trim()}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Send Message
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
