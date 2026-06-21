import express, {Request, Response} from 'express';
import {deliverWebhook} from './service/deliveryService';
import {readEvents, saveEvents, updateEvent} from './service/eventsService';
import {randomUUID} from 'crypto';
import {writeFile} from 'fs/promises';
import {writeFileSync, existsSync, readFileSync} from 'fs';
import cors from 'cors';
import {readJsonFile} from "./service/readJson";

const DB_PATH = '/app/data/sources.json'; // путь к файлу бд
const app = express();
app.use(express.json()); // парсинг JSON тела запроса(все запросы)
app.use(cors());

const PORT = process.env.API_PORT || 4002;
app.post('/api/sources', async (req: Request, res: Response) => {
    const {name, secret, subscriberUrl} = req.body;
    if (!name) return res.status(400).json({error: "Name is required"});

    try {
        const sources = await readJsonFile(DB_PATH);

        const newSource = {
            id: randomUUID(),
            name,
            secret: secret || null,
            subscriberUrl: subscriberUrl || null
        };

        sources.push(newSource);
        await writeFile(DB_PATH, JSON.stringify(sources, null, 2));

        if (newSource.secret) {
            const SECRETS_PATH = '/app/data/secrets.json';
            let secrets: Record<string, string> = {};
            if (existsSync(SECRETS_PATH)) {
                const secretsContent = readFileSync(SECRETS_PATH, 'utf-8');
                const parsed = JSON.parse(secretsContent);
                secrets = (typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
            }
            secrets[newSource.id] = newSource.secret;
            writeFileSync(SECRETS_PATH, JSON.stringify(secrets, null, 2));
            console.log("ТЕКУЩЕЕ СОДЕРЖИМОЕ ФАЙЛА SECRETS.JSON:", secrets);
        }

        console.log(`--- ИСТОЧНИК УСПЕШНО СОЗДАН ---
                            Имя: ${newSource.name}
                            ID: ${newSource.id}
                            URL подписчика: ${newSource.subscriberUrl || 'Не указан'}
                            Секрет: ${newSource.secret ? 'Установлен (длина ' + newSource.secret.length + ')' : 'Отсутствует'}`);

        res.status(201).json({
            id: newSource.id,
            name: newSource.name,
            subscriberUrl: `http://localhost:${PORT}/webhooks/${newSource.id}`,
            hasSecret: !!newSource.secret
        });
    } catch (error) {
        console.error("Ошибка:", error);
        res.status(500).json({error: "Failed to save source"});
    }
});

app.post('/api/webhooks/:sourceId', async (req: Request, res: Response) => {
    const {sourceId} = req.params;
    const secretHeader = req.headers['x-webhook-secret'];
    const sources = await readJsonFile(DB_PATH);
    const source = sources.find((s: any) => s.id === sourceId);

    if (!source) {
        return res.status(404).json({error: "Source not found"});
    }

    if (source.secret && secretHeader !== source.secret) {
        return res.status(401).json({error: "UNAUTHORIZED", code: "UNAUTHORIZED"});
    }

    const event = {
        id: randomUUID(),
        sourceId,
        headers: {
            "content-type": req.headers["content-type"],
            "user-agent": req.headers["user-agent"] || null,
            "x-webhook-secret": req.headers["x-webhook-secret"] ? "***" : null
        },
        body: req.body,
        receivedAt: new Date().toISOString(),
        delivery: {
            status: "pending",
            attempts: [],
            lastError: null
        }
    };

    const events = await readEvents();
    events.push(event);
    await saveEvents(events);

    res.status(202).json({"eventId": event.id, "status": "received"});
    deliverWebhook(event.id).catch(err => console.error("Фоновая ошибка доставки:", err));
});

app.get('/api/events', async (req: Request, res: Response) => {
    const {sourceId, status, page = '1', limit = '20'} = req.query;
    let events = await readEvents();

    if (sourceId) events = events.filter((e: any) => e.sourceId === sourceId);
    if (status) events = events.filter((e: any) => e.delivery.status === status);

    const p = parseInt(page as string);
    const l = parseInt(limit as string);
    const total = events.length;
    const items = events.slice((p - 1) * l, p * l);

    res.json({items, page: p, limit: l, total});
});

app.get('/api/events/:id', async (req: Request, res: Response) => {
    const events = await readEvents();
    const event = events.find((e: any) => e.id === req.params.id);

    if (!event) return res.status(404).json({error: "Event not found"});
    res.json(event);
});

app.post('/api/events/:id/retry', async (req: Request, res: Response) => {
    const eventId = req.params.id as string;
    const events = await readEvents();
    const event = events.find((e: any) => e.id === eventId);

    if (!event) return res.status(404).json({error: "Event not found"});
    if (event.delivery.status === 'pending') return res.status(400).json({error: "Already pending"});

    await updateEvent(eventId, (ev) => ({
        ...ev,
        delivery: {
            ...ev.delivery,
            status: 'pending',
            lastError: null
        }
    }));

    deliverWebhook(eventId).catch(console.error);
    res.status(202).json({message: "Retry started"});
});

app.listen(PORT, () => console.log(`Сервер на ${PORT}`));