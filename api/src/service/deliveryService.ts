import { WebhookEvent } from '../types';
import axios from 'axios';
import crypto from 'crypto';

export const deliveryService = {
    async send(event: WebhookEvent, subscriberUrl: string, secret: string | null): Promise<{ status: number, error?: string }> {
        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json',
                'x-source-id': event.sourceId};
            const targetUrl = subscriberUrl.replace('localhost', 'subscriber');

            if (secret) {
                const signature = crypto
                    .createHmac('sha256', secret)
                    .update(JSON.stringify(event.payload))
                    .digest('hex');
                headers['X-Signature'] = signature;
            }

            console.log('[DEBUG] ОТПРАВЛЯЮ ЗАГОЛОВКИ:', headers);

            const response = await axios.post(targetUrl, event.payload, {
                headers,
                timeout: 5000
            });

            return { status: response.status };
        } catch (error: any) {
            return {
                status: error.response?.status || 500,
                error: error.message
            };
        }
    }
};