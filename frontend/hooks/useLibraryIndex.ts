"use client";

import useSWR from "swr";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/lib/api";

const fetcher = (url: string, token: string) =>
  fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then((r) =>
    r.ok ? r.json() : null
  );

export type LibraryStatus =
  | "playing"
  | "completed"
  | "backlog"
  | "wishlist"
  | "dropped";

export function useLibraryIndex(): {
  library: Record<string, LibraryStatus>;
  isLoading: boolean;
} {
  const { user, token } = useAuth();

  const { data, isLoading } = useSWR(
    user && token ? [`${getApiUrl()}/collection/index`, token] : null,
    ([url, tok]) => fetcher(url, tok),
    { dedupingInterval: 60_000, revalidateOnFocus: false }
  );

  return {
    library: data?.data ?? {},
    isLoading,
  };
}
