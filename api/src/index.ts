import express, {Request, Response} from 'express';
import { deliverWebhook } from './service/deliveryService';
import { readEvents, saveEvents } from './service/eventsService';
import {randomUUID} from 'crypto';
import {readFile, writeFile} from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'data', 'sources.json'); // путь к файлу бд
const app = express();
app.use(express.json()); // парсинг JSON тела запроса(все запросы)

const PORT = 4002;
app.post('/api/sources', async (req: Request, res: Response) => {

    const {name, secret, subscriberUrl} = req.body; // извлечение полей
    if (!name) {
        return res.status(400).json({error: "Name is required"});
    }

    try {
        const fileContent = await readFile(DB_PATH, 'utf-8'); // чтение файла бд
        const sources = fileContent ? JSON.parse(fileContent) : []; // если файл пустой, создаем пустой массив

        const newSource = {
            id: randomUUID(),
            name,
            secret: secret || null,
            subscriberUrl: subscriberUrl || null
        };

        sources.push(newSource);
        await writeFile(DB_PATH, JSON.stringify(sources, null, 2));

        console.log(`Создан источник: ${name} с ID: ${newSource.id}`); // для дебага логирование

        res.status(201).json({
            id: newSource.id,
            name: newSource.name,
            ingestUrl: `http://localhost:${PORT}/webhooks/${newSource.id}`,
            hasSecret: !!newSource.secret // преобразование в бул
        });
    } catch (error) {
        console.error("Ошибка при создании источника:", error);
        res.status(500).json({error: "Failed to save source"});
    }
});

app.post('/api/webhooks/:sourceId', async (req: Request, res: Response) => {
    const {sourceId} = req.params;
    const secretHeader = req.headers['x-webhook-secret'];

    const fileContent = await readFile(DB_PATH, 'utf-8');
    const sources = fileContent ? JSON.parse(fileContent) : [];
    const source = sources.find((s: any) => s.id === sourceId);

    if (!source) return res.status(404).json({error: "Source not found"});

    if (source.secret) {
        if (secretHeader !== source.secret) {
            return res.status(401).json({error: "UNAUTHORIZED", code: "UNAUTHORIZED"});
        }
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
            lastError: null }
    };

    const events = await readEvents();
    events.push(event);
    await saveEvents(events);

    res.status(202).json({ "eventId" : event.id, "status" : "received" });
    deliverWebhook(event.id).catch(err => console.error("Фоновая ошибка доставки:", err));
});

app.listen(PORT, () => console.log(`Сервер на ${PORT}`));