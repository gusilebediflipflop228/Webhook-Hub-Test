import {createServer, IncomingMessage, ServerResponse} from 'http';
import {readFileSync, existsSync} from 'fs';
import crypto from 'crypto';

const PORT = process.env.SUBSCRIBER_PORT || 5001;
const SECRETS_FILE = '/app/data/secrets.json';

function isSignatureValid(body: string, sourceId: string, signature: string | string[] | undefined): boolean {
    if (!existsSync(SECRETS_FILE)) {
        console.error("[DEBUG] Файл секретов не найден!");
        return false;
    }

    const secrets = JSON.parse(readFileSync(SECRETS_FILE, 'utf-8'));
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

    console.log(`[DEBUG] Полученная: ${receivedSignature}`);
    console.log(`[DEBUG] Ожидаемая:   ${expectedSignature}`);

    return receivedSignature === expectedSignature;
}

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    let body = '';
    req.on('data', (chunk: any) => { body += chunk; });

    req.on('end', () => {
        let data;
        try {
            data = JSON.parse(body);
        } catch {
            res.writeHead(400); res.end('Invalid JSON'); return;
        }

        const signature = req.headers['x-signature'];

        if (!isSignatureValid(body, data.sourceId, signature)) {
            res.writeHead(401); res.end('Unauthorized'); return;
        }

        console.log('Сигнатура верна!');

        if (req.url?.includes('fail=1')) {
            res.writeHead(500); res.end('Internal Server Error');
        } else {
            res.writeHead(200); res.end('OK');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Mock-подписчик запущен на порту ${PORT}`);
});