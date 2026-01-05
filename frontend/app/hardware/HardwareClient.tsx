"use client";

import { useState } from "react";
import useSWR from "swr";
import axios from "@/lib/axios";
import { Review, PaginatedResponse } from "@/types";
import ReviewCard from "@/components/reviews/ReviewCard";
import { Button } from "@/components/ui/Button";
import { Cpu, ChevronLeft, ChevronRight } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import { HARDWARE_CATEGORIES } from "@/lib/categories";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-20 text-white">
        <h1>Hardware Build Check</h1>
        <p>If you see this, the build passed.</p>
    </div>
);
}
