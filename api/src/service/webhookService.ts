import { randomUUID } from 'crypto';
import { eventRepository } from '../repository/eventRepository';
import { sourceRepository } from '../repository/sourceRepository';
import {DeliveryStatus, WebhookEvent} from "../types";

export const webhookService = {
    async createReceivedEvent(sourceId: string, payload: Record<string, unknown>): Promise<WebhookEvent> {
        const source = await sourceRepository.findById(sourceId);

        const newEvent: WebhookEvent = {
            id: randomUUID(),
            sourceId,
            headers: {},
            payload,
            receivedAt: new Date().toISOString(),
            delivery: {
                status: 'pending',
                attempts: [],
                lastError: null
            }
        };
        await eventRepository.create(newEvent);

        if (!source || !source.subscriberUrl) {
            await this.updateStatus(newEvent.id, 'failed', {
                timestamp: new Date().toISOString(),
                status: null,
                error: 'Source not found or no subscriber URL configured'
            });
            throw new Error('Invalid source configuration');
        }

        await this.updateStatus(newEvent.id, 'pending');

        return newEvent;
    },

    async updateStatus(
        id: string,
        status: DeliveryStatus,
        attempt?: {
            timestamp: string,
            status: number | null,
            error?: string | null
        }
    ) {
        console.log(`[STATUS] Обновление ${id} до ${status}`);

        await eventRepository.updateStatus(id, (event) => {
            const newAttempt = attempt ? {
                at: attempt.timestamp,
                statusCode: attempt.status,
                error: attempt.error ?? null
            } : null;

            const updatedDelivery = {
                ...event.delivery,
                status: status,
                attempts: newAttempt
                    ? [...event.delivery.attempts, newAttempt]
                    : event.delivery.attempts,
                lastError: attempt?.error ?? event.delivery.lastError
            };

            return {
                ...event,
                delivery: updatedDelivery
            };
        });
    }
};