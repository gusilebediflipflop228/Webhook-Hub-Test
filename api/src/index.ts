import express, { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'data', 'sources.json'); // путь к файлу бд
const app = express();
app.use(express.json()); // парсинг JSON тела запроса(все запросы)

const PORT = 4002;
app.post('/api/sources', async (req: Request, res: Response) => {

    const { name, secret, subscriberUrl } = req.body; // извлечение полей

    if (!name) {
        return res.status(400).json({ error: "Name is required" });
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
        res.status(500).json({ error: "Failed to save source" });
    }
});

app.listen(PORT, () => {
    console.log(`API сервер запущен на порту ${PORT}`);
});