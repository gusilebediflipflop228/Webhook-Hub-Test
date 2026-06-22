export type DeliveryStatus = 'pending' | 'delivered' | 'failed';

export interface Attempt {
    at: string;
    statusCode: number | null;
    error: string | null;
}

export interface Delivery {
    status: DeliveryStatus;
    attempts: Attempt[];
    lastError: string | null;
}

export interface WebhookEvent {
    id: string;
    sourceId: string;
    headers: Record<string, string>;
    payload: Record<string, unknown>;
    receivedAt: string;
    delivery: Delivery;
}

export interface Source {
    id: string;
    name: string;
    subscriberUrl: string | null;
    secret: string | null;
}