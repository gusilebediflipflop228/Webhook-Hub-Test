# Webhook Hub

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

Система для приема, хранения и надежной доставки вебхуков с механизмом повторных попыток.

Технологический стек
- Backend: Node.js + TypeScript + Express
- Frontend: Next.js + Tailwind CSS
- Infrastructure: Docker, Docker Compose
- Storage: JSON (file-based)

## Подготовка конфигурации:
В корне проекта создайте файл .env, используя .env.example в качестве шаблона:
- API_PORT — порт, на котором работает ваш бэкенд.
- WEB_PORT - порт, на котором работае ваш бекенд.
- NEXT_PUBLIC_API_URL — адрес API для фронтенда.
- SUBSCRIBER_PORT — порт, на котором запускается mock-подписчик.

## Запуск проекта:
Для запуска всей системы (API, Web, Subscriber) достаточно одной команды:
```
docker-compose up --build
```
После запуска сервисы будут доступны по адресам:
- Web UI: http://localhost:3000
- API: http://localhost:4002
- Subscriber (Mock): http://localhost:5001

## Тестирование
1. Создание источника:
Убедитесь, что в data/sources.json добавлен источник, обязательно с указанием subscriberUrl, пример:
```
{  
    "name": "payments", 
    "secret": "optional-shared-secret",   
    "subscriberUrl": "http://localhost:5001/deliver" 
} 
```
2. Отправка вебхука:
   Отправьте POST-запрос на ваш API, пример:
- URL: POST http://localhost:4002/api/webhooks/{sourceId}
- Header: x-webhook-secret: optional-shared-secret
- Body (JSON):
```
{
    "orderId": 12345,
    "amount": 500
}
```
3. Проверка доставки:
   В терминале: Вы увидите логи обработки запроса и попыток доставки.
   В UI: Откройте http://localhost:3000. Вы увидите новое событие, его статус и историю всех попыток доставки в блоке Details.

## Механизм повторных попыток (Retry)
Если подписчик недоступен (например, выключен), система автоматически поставит событие в очередь и совершит серию повторных попыток с интервалами (1с, 3с, 9с). Статус и прогресс каждой попытки отображается в реальном времени на странице деталей события.
