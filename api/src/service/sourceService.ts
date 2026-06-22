import { randomUUID } from 'crypto';
import { sourceRepository } from '../repository/sourceRepository';
import { secretRepository } from '../repository/secretsRepository';

export const sourceService = {
    async createSource(data: { name: string, secret?: string, subscriberUrl?: string }) {
        const defaultUrl = process.env.SUBSCRIBER_URL || 'http://subscriber:5001/deliver';
        const finalUrl = data.subscriberUrl || defaultUrl;

        const newSource = {
            id: randomUUID(),
            name: data.name,
            secret: data.secret || null,
            subscriberUrl: finalUrl
        };

        await sourceRepository.create(newSource);

        if (data.secret) {
            await secretRepository.saveSecret(newSource.id, data.secret);
        }

        return newSource;
    }
};