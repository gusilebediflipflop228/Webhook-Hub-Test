import express, {Request, Response} from 'express';
import {randomUUID} from 'crypto';

const app = express();
app.use(express.json()); // парсинг JSON тела запроса(все запросы)

const PORT = 4002;
app.post('/api/sources', (req: Request, res: Response) => {

    const { name, secret, subscriberUrl } = req.body; // извлечение полей

    if (!name) {
        return res.status(400).json({ error: "Name is required" });
    }

    const id = randomUUID();
    console.log(`Создан источник: ${name} с ID: ${id}`); // для дебага логирование

    res.status(201).json({
        id,
        name,
        ingestUrl: `http://localhost:${PORT}/webhooks/${id}`,
        hasSecret: !!secret // преобразование в бул
    });
});

app.listen(PORT, () => {
    console.log(`API сервер запущен на порту ${PORT}`);
});