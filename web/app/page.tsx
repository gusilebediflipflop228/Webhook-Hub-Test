'use client';
import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002';
export default function Home() {
    const [events, setEvents] = useState<any[]>([]);
    const [sourceId, setSourceId] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        const params = new URLSearchParams();
        if (sourceId) params.append('sourceId', sourceId);
        if (status) params.append('status', status);

        fetch(`${API_URL}/api/events?${params.toString()}`)
            .then(res => res.json())
            .then(data => setEvents(data.items || []));
    }, [sourceId, status]);

    return (
        <main className="p-8">
            <h1 className="text-2xl font-bold mb-6">Webhook Events</h1>

            {/* Фильтры */}
            <div className="flex gap-4 mb-6">
                <input
                    placeholder="Filter by SourceID"
                    className="border p-2 rounded"
                    onChange={(e) => setSourceId(e.target.value)}
                />
                <select className="border p-2 rounded" onChange={(e) => setStatus(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="received">received</option>
                    <option value="pending">pending</option>
                    <option value="delivered">delivered</option>
                    <option value="failed">failed</option>
                </select>
            </div>

            <table className="w-full border-collapse border border-gray-200">
                <thead>
                <tr className="bg-gray-100">
                    <th className="border p-3 text-left">ID</th>
                    <th className="border p-3 text-left">Status</th>
                    <th className="border p-3 text-left">Actions</th>
                </tr>
                </thead>
                <tbody>
                {events.map((ev) => (
                    <tr key={ev.id} className="border-b hover:bg-gray-50">
                        <td className="border p-3 font-mono text-sm">{ev.id}</td>
                        <td className="border p-3">{ev.delivery.status}</td>
                        <td className="border p-3">
                            <a href={`/events/${ev.id}`} className="text-blue-600 font-bold">Details</a>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </main>
    );
}