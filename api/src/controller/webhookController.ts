import { Request, Response } from 'express';
import { webhookService } from '../service/webhookService';
import { queueService } from '../service/queueService';
import {eventRepository} from "../repository/eventRepository";
import {sourceRepository} from "../repository/sourceRepository";

export const handleIncomingWebhook = async (req: Request, res: Response) => {
    const sourceId = req.params.sourceId as string;
    const payload = req.body;

    if (!sourceId) {
        return res.status(400).json({ error: "Source ID is required" });
    }

    try {
        const source = await sourceRepository.findById(sourceId);

        if (!source) {
            return res.status(404).json({ error: "Source not found" });
        }

        const secret = req.headers['x-webhook-secret'];
        if (source.secret && secret !== source.secret) {
            return res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
        }

        const event = await webhookService.createReceivedEvent(sourceId, payload);

        console.log(`[WEBHOOK] Событие создано: ${event.id}`);

        queueService.processEvent(event).catch(err => {
            console.error(`Критическая ошибка доставки для ${event.id}:`, err);
        });

        res.status(202).json({
            eventId: event.id,
            status: "received"
        });
    } catch (error: any) {
        console.error("Webhook Error:", error);
        res.status(500).json({ error: "Failed to process webhook" });
    }
};

export const getEvents = async (req: Request, res: Response) => {
    const { sourceId, status, page = '1', limit = '20' } = req.query;
    let events = await eventRepository.getAll();

    if (sourceId) events = events.filter(e => e.sourceId === sourceId);
    if (status) events = events.filter(e => e.delivery.status === status);

    const p = parseInt(page as string);
    const l = parseInt(limit as string);
    const total = events.length;
    const items = events.slice((p - 1) * l, p * l);

    res.json({ items, page: p, limit: l, total });
};

export const retryEvent = async (req: Request, res: Response) => {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    if (!id) {
        return res.status(400).json({ error: "Invalid ID format" });
    }

    const events = await eventRepository.getAll();
    const event = events.find(e => e.id === id);

    if (!event) return res.status(404).json({ error: "Event not found" });

    if (event.delivery.status === 'pending') {
        return res.status(400).json({ error: "Already pending" });
    }

    await webhookService.updateStatus(id, 'pending');

    queueService.processEvent(event).catch((err) => {
        console.error(`[QUEUE] Критическая ошибка ретрая для ${id}:`, err);
    });

    res.status(202).json({ message: "Retry started" });
};

export const getEventById = async (req: Request, res: Response) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id || id.trim() === '' || id === 'events') {
        return res.status(404).json({ error: "Event not found" });
    }

    try {
        const events = await eventRepository.getAll();
        const event = events.find(e => e.id === id);

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        res.json(event);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};