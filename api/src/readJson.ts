import { existsSync } from 'fs';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function readJsonFile<T>(filePath: string): Promise<T[]> {
    const dir = path.dirname(filePath);
    console.log(`[FILE] Чтение/Инициализация файла: ${filePath}`);

    if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
    }

    if (!existsSync(filePath)) {
        await writeFile(filePath, JSON.stringify([], null, 2));
        return [];
    }

    const content = await readFile(filePath, 'utf-8');
    try {
        return JSON.parse(content || '[]') as T[];
    } catch (e) {
        return [];
    }
}