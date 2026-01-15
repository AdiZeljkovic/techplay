import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export const useSearchLimit = (limit = 2) => {
    const { user, isLoading } = useAuth();
    const [searchCount, setSearchCount] = useState(0);
    const [isLimitReached, setIsLimitReached] = useState(false);
    const [params, setParams] = useState({ limit: 0, date: '' });

    useEffect(() => {
        // Only run on client
        if (typeof window === 'undefined') return;

        const today = new Date().toISOString().split('T')[0];
        const stored = JSON.parse(localStorage.getItem('guest_search_limit') || '{"count": 0, "date": ""}');

        if (stored.date !== today) {
            // Reset if new day
            setSearchCount(0);
            localStorage.setItem('guest_search_limit', JSON.stringify({ count: 0, date: today }));
        } else {
            setSearchCount(stored.count);
        }
    }, []);

    const incrementSearch = () => {
        if (user) return; // No limit for logged users

        const newCount = searchCount + 1;
        setSearchCount(newCount);
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem('guest_search_limit', JSON.stringify({ count: newCount, date: today }));
    };

    const checkLimit = () => {
        if (!user && !isLoading && searchCount >= limit) {
            return true;
        }
        return false;
    };

    return {
        isLimitReached: checkLimit(),
        incrementSearch,
        remainingSearches: user ? Infinity : Math.max(0, limit - searchCount),
        isLoadingAuth: isLoading
    };
};
