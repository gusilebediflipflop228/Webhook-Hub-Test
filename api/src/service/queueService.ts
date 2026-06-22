import { webhookService } from './webhookService';
import { deliveryService } from './deliveryService';
import { sourceRepository } from '../repository/sourceRepository';
import { WebhookEvent } from '../types';

export const queueService = {
    async processEvent(event: WebhookEvent) {
        console.log(`[QUEUE] Начало доставки события: ${event.id}`);

        const source = await sourceRepository.findById(event.sourceId);
        if (!source || !source.subscriberUrl) {
            console.error(`[QUEUE] Ошибка: Источник или URL не найдены для ${event.id}`);
            return;
        }

        const delays = [1000, 3000, 9000];

        for (let attempt = 0; attempt <= delays.length; attempt++) {
            console.log(`[QUEUE] Попытка #${attempt + 1} для ${event.id}`);

            const result = await deliveryService.send(event, source.subscriberUrl, source.secret);

            const attemptData = {
                timestamp: new Date().toISOString(),
                status: result.status,
                error: result.error || null
            };

            const isSuccess = result.status >= 200 && result.status < 300;

            if (isSuccess) {
                console.log(`[QUEUE] УСПЕХ: Событие ${event.id} доставлено.`);
                await webhookService.updateStatus(event.id, 'delivered', attemptData);
                return;
            }

            console.warn(`[QUEUE] Ошибка доставки ${event.id}: ${result.status} - ${result.error || 'нет ошибки'}`);

            const finalStatus = attempt < delays.length ? 'pending' : 'failed';
            await webhookService.updateStatus(event.id, finalStatus, attemptData);

            if (attempt < delays.length) {
                console.log(`[QUEUE] Ожидание ${delays[attempt]}мс перед следующей попыткой...`);
                await new Promise(res => setTimeout(res, delays[attempt]));
            }
        }
    }
};