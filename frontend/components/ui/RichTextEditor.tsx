"use client";

import "./tiptap.css";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
    Bold,
    Italic,
    Strikethrough,
    List,
    ListOrdered,
    Quote,
    Code,
    Link as LinkIcon,
    Image as ImageIcon,
    Undo,
    Redo,
    Heading2,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import axios from "@/lib/axios";
import { toast } from "react-hot-toast";

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
    minHeight?: string;
    /**
     * Where a picked or pasted image should be sent, e.g. "/forum/uploads".
     *
     * Without it the image button falls back to asking for a URL, which is
     * what it always did — and which is now useless on the forum, because the
     * sanitiser refuses images hosted anywhere but here. Pasting a link would
     * appear to work and then vanish on save.
     */
    uploadPath?: string;
}

export default function RichTextEditor({
    content,
    onChange,
    placeholder = "Write something...",
    minHeight = "200px",
    uploadPath,
}: RichTextEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    // Read inside the paste handler, which the editor builds once — a plain
    // variable would be captured at first render and go stale.
    const uploadPathRef = useRef(uploadPath);
    uploadPathRef.current = uploadPath;
    const pendingPaste = useRef<((file: File) => void) | null>(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [2, 3],
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-[var(--accent)] underline hover:no-underline",
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: "max-w-full rounded-[var(--radius-card)] my-4",
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: `prose prose-invert max-w-none focus:outline-none min-h-[${minHeight}] p-4`,
            },
            /**
             * Print Screen, Ctrl+V. Without this, pasting a screenshot put a
             * `blob:` URL into the document that only existed in that tab and
             * was stripped on save — the picture appeared to post and then was
             * not there.
             */
            handlePaste: (_view, event) => {
                if (!uploadPathRef.current) return false;

                const files = Array.from(event.clipboardData?.files ?? []);
                const image = files.find((f) => f.type.startsWith("image/"));
                if (!image) return false;

                event.preventDefault();
                pendingPaste.current?.(image);

                return true;
            },
        },
    });

    const addLink = useCallback(() => {
        if (!editor) return;

        const previousUrl = editor.getAttributes("link").href;
        const url = window.prompt("Enter URL:", previousUrl);

        if (url === null) return;

        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }, [editor]);

    /**
     * Send one file and put the returned URL in the document.
     *
     * Shared by the toolbar button and by paste, because on a gaming forum the
     * common case is Print Screen followed by Ctrl+V — asking someone to save
     * a screenshot to disk first is asking them not to post it.
     */
    const uploadAndInsert = useCallback(async (file: File) => {
        if (!editor || !uploadPath) return;

        setUploading(true);
        try {
            const form = new FormData();
            form.append("image", file);

            const res = await axios.post(uploadPath, form, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const url = res.data?.url;
            if (url) editor.chain().focus().setImage({ src: url }).run();
        } catch (err) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message
                ?? "That image could not be uploaded.";
            toast.error(message);
        } finally {
            setUploading(false);
        }
    }, [editor, uploadPath]);

    pendingPaste.current = (file: File) => { void uploadAndInsert(file); };

    const addImage = useCallback(() => {
        if (!editor) return;

        if (!uploadPath) {
            const url = window.prompt("Enter image URL:");
            if (url) editor.chain().focus().setImage({ src: url }).run();
            return;
        }

        fileInputRef.current?.click();
    }, [editor, uploadPath]);

    if (!editor) {
        return (
            <div className="bg-[var(--surface-0)] border border-[var(--line)] rounded-[var(--radius-card)] animate-pulse" style={{ minHeight }}>
                <div className="h-10 bg-[var(--surface-2)] rounded-t-xl" />
                <div className="p-4" style={{ minHeight }} />
            </div>
        );
    }

    const ToolbarButton = ({
        onClick,
        isActive = false,
        disabled = false,
        children,
        title,
    }: {
        onClick: () => void;
        isActive?: boolean;
        disabled?: boolean;
        children: React.ReactNode;
        title: string;
    }) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`p-2 rounded-[var(--radius-card)] transition-all ${isActive
                    ? "bg-[var(--accent)] text-white"
                    : "text-white/35 hover:text-white hover:bg-[var(--surface-2)]"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
            {children}
        </button>
    );

    return (
        <div className="bg-[var(--surface-0)] border border-[var(--line)] rounded-[var(--radius-card)] overflow-hidden focus-within:border-[var(--accent)] focus-within:ring-1 focus-within:ring-[var(--accent)] transition-all">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-[var(--line)] bg-[var(--surface-2)]/50">
                {/* Text Formatting */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive("bold")}
                    title="Bold (Ctrl+B)"
                >
                    <Bold className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive("italic")}
                    title="Italic (Ctrl+I)"
                >
                    <Italic className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    isActive={editor.isActive("strike")}
                    title="Strikethrough"
                >
                    <Strikethrough className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    isActive={editor.isActive("code")}
                    title="Inline Code"
                >
                    <Code className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-[var(--line)] mx-1" />

                {/* Headings */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive("heading", { level: 2 })}
                    title="Heading"
                >
                    <Heading2 className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-[var(--line)] mx-1" />

                {/* Lists */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive("bulletList")}
                    title="Bullet List"
                >
                    <List className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive("orderedList")}
                    title="Numbered List"
                >
                    <ListOrdered className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive("blockquote")}
                    title="Quote"
                >
                    <Quote className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-[var(--line)] mx-1" />

                {/* Links & Images */}
                <ToolbarButton
                    onClick={addLink}
                    isActive={editor.isActive("link")}
                    title="Add Link"
                >
                    <LinkIcon className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={addImage}
                    disabled={uploading}
                    title={uploadPath ? "Add an image (or just paste one)" : "Add Image"}
                >
                    <ImageIcon className={`w-4 h-4 ${uploading ? "animate-pulse" : ""}`} />
                </ToolbarButton>

                {uploadPath && (
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            // Cleared so picking the same file twice still fires.
                            e.target.value = "";
                            if (file) void uploadAndInsert(file);
                        }}
                    />
                )}

                <div className="flex-1" />

                {/* Undo/Redo */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    title="Undo (Ctrl+Z)"
                >
                    <Undo className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    title="Redo (Ctrl+Y)"
                >
                    <Redo className="w-4 h-4" />
                </ToolbarButton>
            </div>

            {/* Editor Content */}
            <EditorContent
                editor={editor}
                className="text-white"
                style={{ minHeight }}
            />
        </div>
    );
}
