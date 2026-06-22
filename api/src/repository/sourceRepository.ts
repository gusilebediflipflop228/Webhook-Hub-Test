
import {readJsonFile} from "../readJson";
import { Mutex } from 'async-mutex';
import {writeFile} from "fs/promises";
import {Source} from "../types";
import path from "path";

const SOURCES_PATH = path.resolve(process.cwd(), 'data', 'sources.json');
const mutex = new Mutex();

export const sourceRepository = {
    async getAll(): Promise<Source[]> {
        return await readJsonFile<Source>(SOURCES_PATH);
    },

    async findById(id: string): Promise<Source | undefined> {
        const sources = await this.getAll();
        return sources.find(s => s.id === id);
    },

    async create(source: Source): Promise<void> {
        await mutex.runExclusive(async () => {
            const sources = await this.getAll();
            sources.push(source);
            await writeFile(SOURCES_PATH, JSON.stringify(sources, null, 2));
        });
    }
};