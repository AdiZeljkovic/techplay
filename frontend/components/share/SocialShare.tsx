"use client";

import { useState } from "react";
import { Twitter, Facebook, Linkedin, Share2, Link as LinkIcon, Check, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface SocialShareProps {
    url: string;
    title: string;
    description?: string;
    className?: string;
    vertical?: boolean;
}

export default function SocialShare({
    url,
    title,
    description = "",
    className = "",
    vertical = true,
}: SocialShareProps) {
    const [copied, setCopied] = useState(false);
    const fullUrl = url.startsWith("http") ? url : `https://techplay.gg${url}`;
    const encodedUrl = encodeURIComponent(fullUrl);
    const encodedTitle = encodeURIComponent(title);
    const encodedDescription = encodeURIComponent(description);

    const shareLinks = {
        twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
        telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
        reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    };

    const handleShare = (platform: string) => {
        const link = shareLinks[platform as keyof typeof shareLinks];
        if (link) {
            window.open(link, "_blank", "width=600,height=400");
        }
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: description,
                    url: fullUrl,
                });
                toast.success("Shared successfully!");
            } catch (error: any) {
                if (error.name !== "AbortError") {
                    console.error("Share failed:", error);
                }
            }
        } else {
            handleCopyLink();
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(fullUrl);
            setCopied(true);
            toast.success("Link copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast.error("Failed to copy link");
        }
    };

    const buttonClass = "w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] flex items-center justify-center transition-all hover:scale-110 shadow-lg";

    const shareButtons = [
        {
            name: "Twitter",
            icon: Twitter,
            color: "hover:text-[#1DA1F2] hover:border-[#1DA1F2]",
            action: () => handleShare("twitter"),
        },
        {
            name: "Facebook",
            icon: Facebook,
            color: "hover:text-[#4267B2] hover:border-[#4267B2]",
            action: () => handleShare("facebook"),
        },
        {
            name: "LinkedIn",
            icon: Linkedin,
            color: "hover:text-[#0077B5] hover:border-[#0077B5]",
            action: () => handleShare("linkedin"),
        },
        {
            name: "WhatsApp",
            icon: MessageCircle,
            color: "hover:text-[#25D366] hover:border-[#25D366]",
            action: () => handleShare("whatsapp"),
        },
    ];

    if (vertical) {
        return (
            <div className={`flex flex-col gap-4 items-center ${className}`}>
                {shareButtons.map((btn) => (
                    <button
                        key={btn.name}
                        onClick={btn.action}
                        className={`${buttonClass} ${btn.color}`}
                        title={`Share on ${btn.name}`}
                        aria-label={`Share on ${btn.name}`}
                    >
                        <btn.icon className="w-5 h-5" />
                    </button>
                ))}

                <div className="w-px h-12 bg-[var(--border)] my-2" />

                <button
                    onClick={handleCopyLink}
                    className={`${buttonClass} hover:text-[var(--accent)] hover:border-[var(--accent)]`}
                    title="Copy link"
                    aria-label="Copy link"
                >
                    {copied ? <Check className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                </button>

                <button
                    onClick={handleNativeShare}
                    className={`${buttonClass} hover:text-[var(--accent)] hover:border-[var(--accent)]`}
                    title="Share"
                    aria-label="Share"
                >
                    <Share2 className="w-5 h-5" />
                </button>
            </div>
        );
    }

    // Horizontal layout for mobile
    return (
        <div className={`flex gap-3 flex-wrap justify-center ${className}`}>
            {shareButtons.map((btn) => (
                <button
                    key={btn.name}
                    onClick={btn.action}
                    className={`${buttonClass} ${btn.color}`}
                    title={`Share on ${btn.name}`}
                    aria-label={`Share on ${btn.name}`}
                >
                    <btn.icon className="w-5 h-5" />
                </button>
            ))}

            <button
                onClick={handleCopyLink}
                className={`${buttonClass} hover:text-[var(--accent)] hover:border-[var(--accent)]`}
                title="Copy link"
                aria-label="Copy link"
            >
                {copied ? <Check className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
            </button>

            <button
                onClick={handleNativeShare}
                className={`${buttonClass} hover:text-[var(--accent)] hover:border-[var(--accent)]`}
                title="Share"
                aria-label="Share"
            >
                <Share2 className="w-5 h-5" />
            </button>
        </div>
    );
}
