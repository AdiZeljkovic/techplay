'use server';

export async function submitContactForm(formData: {
    name: string;
    email: string;
    subject: string;
    message: string;
}) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    try {
        const response = await fetch(`${API_URL}/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, message: data.message || 'Failed to send message.' };
        }

        return { success: true, message: data.message || 'Message sent successfully.' };
    } catch {
        return { success: false, message: 'Failed to send message. Please try again later.' };
    }
}
