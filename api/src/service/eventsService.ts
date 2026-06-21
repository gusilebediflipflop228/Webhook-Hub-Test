import {writeFile} from 'fs/promises';
import {existsSync, readFileSync} from "fs";

const EVENTS_DB = '/app/data/events.json';

export async function readEvents() {
    if (!existsSync(EVENTS_DB)) {
        return [];
    }
    const data = readFileSync(EVENTS_DB, 'utf-8');
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