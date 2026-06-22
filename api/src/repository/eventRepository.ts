import { WebhookEvent } from '../types';
import { updateJsonFile } from './baseRepository';
import {readJsonFile} from "../readJson";

import path from 'path';
const EVENTS_PATH = path.resolve(process.cwd(), 'data', 'events.json');

export const eventRepository = {
    async getAll(): Promise<WebhookEvent[]> {
        return await readJsonFile<WebhookEvent>(EVENTS_PATH);
    },

    async create(event: WebhookEvent): Promise<void> {
        await updateJsonFile<WebhookEvent>(EVENTS_PATH, (events) => {
            events.push(event);
            return events;
        });
    },
    async updateStatus(id: string, updateFn: (event: WebhookEvent) => WebhookEvent): Promise<void> {
        await updateJsonFile<WebhookEvent>(EVENTS_PATH, (events) => {
            return events.map(e => e.id === id ? updateFn(e) : e);
        });
    }
};