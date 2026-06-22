import { Request, Response } from 'express';
import { sourceService } from '../service/sourceService';

export const createSource = async (req: Request, res: Response) => {
    console.log("ПРИШЕЛ ЗАПРОС НА СОЗДАНИЕ SOURCE С name:", req.body.name);
    const { name, secret, subscriberUrl } = req.body;

    if (!name) return res.status(400).json({ error: "Name is required" });

    try {
        const source = await sourceService.createSource({ name, secret, subscriberUrl });
        console.log("SOURCE СОЗДАН, ID:", source.id);

        res.status(201).json({
            id: source.id,
            name: source.name,
            subscriberUrl: source.subscriberUrl,
            hasSecret: !!secret
        });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};