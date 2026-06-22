import express from 'express';
import { Request, Response } from 'express';
import cors from 'cors';
import { createSource } from './controller/sourceController';
import { handleIncomingWebhook, getEvents, getEventById, retryEvent } from './controller/webhookController';

const app = express();
app.set('strict routing', true);
app.use(express.json());
app.use(cors());

const PORT = process.env.API_PORT || 4002;

// const validateUuid = (req: Request, res: Response, next: any) => {
//     const id = req.params.id;
//     if (!id || id.length < 36) {
//         return res.status(404).json({ error: "Event not found" });
//     }
//     next();
// };

app.post('/api/sources', createSource);
app.post('/api/webhooks/:sourceId', handleIncomingWebhook);
app.get('/api/events/:id', (req, res, next) => {
    if (req.params.id === 'events' || req.params.id === '') {
        return next();
    }
    getEventById(req, res);
});
app.get('/api/events', getEvents);
app.post('/api/events/:id/retry', retryEvent);

app.listen(PORT, () => console.log(`Сервер запущен на ${PORT}`));