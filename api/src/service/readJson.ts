import {existsSync} from 'fs';
import {readFile, writeFile} from 'fs/promises';

export async function readJsonFile(path: string) {
    if (!existsSync(path)) {
        await writeFile(path, JSON.stringify([], null, 2));
        return [];
    }
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content || '[]');
}