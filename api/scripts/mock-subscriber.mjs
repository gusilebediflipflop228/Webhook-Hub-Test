import { createServer } from 'http';

const PORT = process.env.SUBSCRIBER_PORT || 5001;
const server = createServer((req, res) => {
    console.log(`Получен запрос: ${req.method} ${req.url}`);
    if (req.url.includes('fail=1')) {
        console.log('Симуляция ошибки (500)');
        res.writeHead(500);
        res.end('Internal Server Error');
    } else {
        console.log('Успешная доставка (200)');
        res.writeHead(200);
        res.end('OK');
    }
});

server.listen(PORT, () => {
    console.log(`Mock-подписчик запущен на http://localhost:${PORT}`);
    console.log(`Для успеха: POST http://localhost:${PORT}/deliver`);
    console.log(`Для ошибки: POST http://localhost:${PORT}/deliver?fail=1`);
});