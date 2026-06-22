import { Mutex } from 'async-mutex';
import { writeFile } from 'fs/promises';
import {readJsonFile} from "../readJson";

const mutex = new Mutex();

export async function updateJsonFile<T>(path: string, updater: (data: T[]) => T[]): Promise<void> {
    await mutex.runExclusive(async () => {
        const data = await readJsonFile<T>(path);
        const newData = updater(data);

        // console.log(`[DEBUG] Записываю в ${path}:`, JSON.stringify(newData));

        await writeFile(path, JSON.stringify(newData, null, 2));
    });
}