import {readEvents, updateEvent} from './eventsService';
import crypto from 'crypto';
import {readJsonFile} from "./readJson";

const SOURCES_DB = '/app/data/sources.json';

export async function deliverWebhook(eventId: string) {
    console.log(`[DEBUG] Запуск доставки для ${eventId}`);

    const events = await readEvents();
    const event = events.find((e: any) => e.id === eventId);
    if (!event) return;

    const sources = await readJsonFile(SOURCES_DB);
    const source = sources.find((s: any) => s.id === event.sourceId);

    if (!source || !source.subscriberUrl) {
        console.log(`[DEBUG] ОШИБКА: Источник не найден или нет subscriberUrl.`);
        return;
    }

    const targetUrl = source.subscriberUrl.replace('localhost', 'subscriber');
    console.log(`[DEBUG] Все ок, адрес подписчика: ${targetUrl}`);

    const payload = {
        eventId: event.id,
        sourceId: event.sourceId,
        payload: event.body,
        receivedAt: event.receivedAt
    };
    const bodyString = JSON.stringify(payload);

    let signature = '';
    if (source.secret) {
        signature = crypto
            .createHmac('sha256', source.secret)
            .update(bodyString)
            .digest('hex');
        console.log(`[DEBUG] Сгенерирована сигнатура для ${eventId}: ${signature}`);
    }

    const delays = [1000, 3000, 9000];

    for (let i = 0; i <= delays.length; i++) {
        try {
            console.log(`Попытка ${i + 1} для ${eventId}`);
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Signature': signature
                },
                body: bodyString
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
                console.log(`Успешно доставлено!`);
                return;
            }
            throw new Error(`Status ${response.status}`);
        } catch (err: any) {
            console.error(`Ошибка попытки ${i + 1}: ${err.message}`);

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