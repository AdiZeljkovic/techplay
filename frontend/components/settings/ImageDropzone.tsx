"use client";

import { useRef, useState } from "react";
import { Upload, Trash2, ImageIcon, User as UserIcon } from "lucide-react";

/**
 * Picking a picture, without the browser's own button.
 *
 * Both image fields were bare `<input type="file">` elements. Whatever a
 * browser draws for those is the one control on a settings page that belongs to
 * the browser rather than to the site — different on every platform, unstylable
 * past the file: pseudo-element, and reading as scaffolding somebody meant to
 * come back to.
 *
 * The input is still there, still an input, still keyboard-reachable: it is
 * only moved off screen and driven by a surface that can be drawn. Which also
 * makes room for the thing a file button cannot do — dropping a file on the
 * picture it is going to replace.
 */
export default function ImageDropzone({
    shape,
    preview,
    onFile,
    onClear,
    hint,
    label,
}: {
    shape: "avatar" | "cover";
    preview: string | null;
    onFile: (file: File) => void;
    onClear?: () => void;
    hint: string;
    label: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [over, setOver] = useState(false);

    const take = (files: FileList | null) => {
        const file = files?.[0];
        if (file && file.type.startsWith("image/")) onFile(file);
    };

    const surface = shape === "avatar"
        ? "w-[92px] h-[92px] rounded-full"
        : "w-full aspect-[4/1] rounded-[var(--radius-card)]";

    return (
        <div>
            <div className="flex items-baseline justify-between gap-3 mb-2.5">
                <p className="font-display text-[9px] font-black uppercase tracking-[0.16em] text-white/40">{label}</p>
                {preview && onClear && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="inline-flex items-center gap-1.5 font-display text-[9px] font-bold uppercase tracking-[0.12em] text-white/30 hover:text-[var(--accent)] transition-colors"
                    >
                        <Trash2 className="w-3 h-3" /> Remove
                    </button>
                )}
            </div>

            <div className={shape === "avatar" ? "flex items-center gap-5" : ""}>
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setOver(true); }}
                    onDragLeave={() => setOver(false)}
                    onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files); }}
                    className={`group relative overflow-hidden shrink-0 border-2 border-dashed transition-colors duration-300 ${surface} ${
                        over
                            ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]"
                            : preview
                                ? "border-transparent"
                                : "border-white/[0.14] bg-white/[0.02] hover:border-white/30"
                    }`}
                    aria-label={`${label}: choose or drop an image`}
                >
                    {preview ? (
                        <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={preview} alt="" aria-hidden className="w-full h-full object-cover" />
                            {/* The instruction lives on the picture, and only
                                while somebody is looking at it. */}
                            <span className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300 font-display text-[9.5px] font-black uppercase tracking-[0.14em] text-white">
                                <Upload className="w-3.5 h-3.5" /> Replace
                            </span>
                        </>
                    ) : (
                        <span className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-white/25">
                            {shape === "avatar"
                                ? <UserIcon className="w-7 h-7" />
                                : <ImageIcon className="w-5 h-5" />}
                            {shape === "cover" && (
                                <span className="font-display text-[9.5px] font-bold uppercase tracking-[0.13em]">
                                    Drop an image, or click
                                </span>
                            )}
                        </span>
                    )}
                </button>

                {shape === "avatar" && (
                    <div className="min-w-0">
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-[8px] border border-white/[0.12] bg-white/[0.03] font-display text-[10px] font-bold uppercase tracking-[0.12em] text-white/70 hover:border-white/30 hover:text-white transition-colors"
                        >
                            <Upload className="w-3.5 h-3.5" /> {preview ? "Replace" : "Upload"}
                        </button>
                        <p className="mt-2 text-[11px] text-white/25">{hint}</p>
                    </div>
                )}
            </div>

            {shape === "cover" && <p className="mt-2 text-[11px] text-white/25">{hint}</p>}

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={(e) => take(e.target.files)}
                className="sr-only"
            />
        </div>
    );
}
