import {readEvents, updateEvent} from './eventsService';
import {readFile} from 'fs/promises';
import path from 'path';

const SOURCES_DB = path.join(__dirname, '../../data/sources.json');
export async function deliverWebhook(eventId: string) {
    console.log(`Начало доставки для события: ${eventId}`); // дебаг

    const events = await readEvents();
    const event = events.find((e: any) => e.id === eventId);

    if (!event) {
        console.log(`Событие ${eventId} не найдено!`); // дебаг
        return;
    }

    const sourcesData = await readFile(SOURCES_DB, 'utf-8');
    const sources = JSON.parse(sourcesData);
    const source = sources.find((s: any) => s.id === event.sourceId);

    if (!source || !source.subscriberUrl) {
        console.log(`Источник или URL не найдены`);
        return;
    }

    const delays = [1000, 3000, 9000];

    for (let i = 0; i <= delays.length; i++) {
        try {
            console.log(`опытка ${i + 1} для ${eventId}`); // дебаг
            const response = await fetch(source.subscriberUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId: event.id,
                    sourceId: event.sourceId,
                    payload: event.body,
                    receivedAt: event.receivedAt
                })
            });

            if (response.ok) {
                await updateEvent(eventId, (ev) => ({
                    ...ev,
                    delivery: {
                        status: 'delivered',
                        attempts: [...ev.delivery.attempts,
                            { at: new Date().toISOString(), statusCode: response.status, error: null }],
                        lastError: null
                    }
                }));
                console.log(`Успешно доставлено!`); // дебаг
                return;
            }
            throw new Error(`Status ${response.status}`);
        } catch (err: any) {
            console.error(`Ошибка попытки ${i + 1}: ${err.message}`); // дебаг

            if (i === delays.length) {
                await updateEvent(eventId, (ev) => ({
                    ...ev,
                    delivery: { ...ev.delivery, status: 'failed', lastError: err.message }
                }));
            } else {
                await new Promise(resolve => setTimeout(resolve, delays[i]));
            }
        }
    }
}