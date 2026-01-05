"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function NewsletterVerifyPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Validation token missing.');
            return;
        }

        async function verify() {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/newsletter/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });

                const data = await res.json();

                if (res.ok) {
                    setStatus('success');
                    setMessage(data.message);
                    setTimeout(() => router.push('/'), 3000);
                } else {
                    setStatus('error');
                    setMessage(data.message || 'Verification failed.');
                }
            } catch (err) {
                setStatus('error');
                setMessage('An error occurred. Please try again.');
            }
        }

        verify();
    }, [token, router]);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white/5 border border-white/10 p-8 rounded-2xl text-center backdrop-blur-xl">
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-12 h-12 text-[var(--accent)] animate-spin mb-4" />
                        <h2 className="text-white text-xl font-bold">Verifying Subscription...</h2>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 border border-green-500/50">
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                        </div>
                        <h2 className="text-white text-2xl font-bold mb-2">Verified!</h2>
                        <p className="text-gray-400">{message}</p>
                        <p className="text-gray-500 text-sm mt-4">Redirecting you to homepage...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 border border-red-500/50">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-white text-2xl font-bold mb-2">Verification Failed</h2>
                        <p className="text-gray-400">{message}</p>
                        <button
                            onClick={() => router.push('/')}
                            className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                        >
                            Back to Home
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
