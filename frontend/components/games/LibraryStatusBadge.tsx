"use client";

import { LibraryStatus } from "@/hooks/useLibraryIndex";
import { BookmarkPlus, CheckCircle2, Gamepad2, Heart, XCircle } from "lucide-react";

interface Props {
  status: LibraryStatus | undefined;
  className?: string;
}

const CONFIG: Record<
  LibraryStatus,
  { label: string; color: string; Icon: React.ElementType }
> = {
  playing: {
    label: "Playing",
    color: "bg-green-600/90 text-white",
    Icon: Gamepad2,
  },
  completed: {
    label: "Completed",
    color: "bg-emerald-700/90 text-white",
    Icon: CheckCircle2,
  },
  backlog: {
    label: "Backlog",
    color: "bg-blue-700/90 text-white",
    Icon: BookmarkPlus,
  },
  wishlist: {
    label: "Wishlist",
    color: "bg-pink-600/90 text-white",
    Icon: Heart,
  },
  dropped: {
    label: "Dropped",
    color: "bg-zinc-600/90 text-white",
    Icon: XCircle,
  },
};

export default function LibraryStatusBadge({ status, className = "" }: Props) {
  if (!status) return null;

  const { label, color, Icon } = CONFIG[status];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${color} ${className}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}
