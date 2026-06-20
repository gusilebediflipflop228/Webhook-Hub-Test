'use client';
import {useParams} from 'next/navigation';
import {useEffect, useState} from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002';

export default function EventDetail() {
    const {id} = useParams();
    const [event, setEvent] = useState<any>(null);

    useEffect(() => {
        fetch(`${API_URL}/api/events/${id}`)
            .then(r => r.json())
            .then(setEvent);
    }, [id]);

    const handleRetry = async () => {
        const res = await fetch(`${API_URL}/api/events/${id}/retry`, {method: 'POST'});
        if (res.ok) alert("Retry started!");
        else alert("Failed to retry");
    };

    if (!event) return <div className="p-8">Loading...</div>;

    return (
        <main className="p-8">
            <button onClick={() => history.back()} className="mb-4 text-blue-500">← Back</button>
            <h1 className="text-2xl font-bold mb-4">Event {event.id}</h1>

            <button onClick={handleRetry} className="bg-green-600 text-white px-4 py-2 rounded mb-6">
                Retry Delivery
            </button>

            <div>
                <h2 className="font-bold">Attempts:</h2>
                <pre className="bg-gray-100 p-2 text-sm">
    {JSON.stringify(event?.delivery?.attempts || [], null, 2)}
  </pre>
            </div>
        </main>
    );
}