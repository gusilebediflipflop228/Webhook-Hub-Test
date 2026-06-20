import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const EVENTS_DB = path.join(__dirname, '..', '..', 'data', 'events.json');

export async function readEvents() {
    const data = await readFile(EVENTS_DB, 'utf-8');
    return data ? JSON.parse(data) : [];
}

export async function saveEvents(events: any[]) {
    await writeFile(EVENTS_DB, JSON.stringify(events, null, 2));
}

export async function updateEvent(eventId: string, updateFn: (event: any) => any) {
    const events = await readEvents();
    const index = events.findIndex((e: any) => e.id === eventId);
    if (index !== -1) {
        events[index] = updateFn(events[index]);
        await saveEvents(events);
    }
}