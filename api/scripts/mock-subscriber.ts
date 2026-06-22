import { createServer, IncomingMessage, ServerResponse } from 'http';
import { readFileSync, existsSync } from 'fs';
import crypto from 'crypto';

const PORT = process.env.SUBSCRIBER_PORT || 5001;
const SECRETS_FILE = '/app/data/secrets.json';

function isSignatureValid(body: string, sourceId: string | undefined, signature: string | string[] | undefined): boolean {
    if (!sourceId) {
        console.error("[DEBUG] sourceId не получен из заголовков!");
        return false;
    }

    const fs = require('fs');
    console.log(`[DEBUG] Пытаюсь прочитать файл: ${SECRETS_FILE}`);
    console.log(`[DEBUG] Файл существует: ${fs.existsSync(SECRETS_FILE)}`);
    if (fs.existsSync(SECRETS_FILE)) {
        const content = fs.readFileSync(SECRETS_FILE, 'utf-8');
        console.log(`[DEBUG] Содержимое файла: ${content}`);
    }

    if (!existsSync(SECRETS_FILE)) {
        console.error("[DEBUG] Файл секретов не найден!");
        return false;
    }

    const fileContent = JSON.parse(readFileSync(SECRETS_FILE, 'utf-8'));
    const secrets = Array.isArray(fileContent) ? fileContent[0] : fileContent;
    const secret = secrets[sourceId];

    if (!secret) {
        console.error(`[DEBUG] Секрет не найден для ID: ${sourceId}`);
        return false;
    }

    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

    const receivedSignature = Array.isArray(signature) ? signature[0] : signature;

    return receivedSignature === expectedSignature;
}

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    let body = '';
    req.on('data', (chunk: any) => { body += chunk; });

    req.on('end', () => {
        console.log('[DEBUG] Полученные заголовки:', JSON.stringify(req.headers));

        const sourceId = (req.headers['x-source-id'] || req.headers['source-id']) as string | undefined;
        const signature = req.headers['x-signature'];

        if (!isSignatureValid(body, sourceId, signature)) {
            res.writeHead(401);
            res.end('Unauthorized');
            return;
        }

        console.log('Сигнатура верна! Событие принято.');
        res.writeHead(200);
        res.end('OK');
    });
});

server.listen(PORT, () => {
    console.log(`Mock-подписчик запущен на порту ${PORT}`);
});