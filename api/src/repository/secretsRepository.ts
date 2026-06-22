import { updateJsonFile } from './baseRepository';
import path from "path";

const SECRETS_PATH = path.resolve(process.cwd(), 'data', 'secrets.json');

export const secretRepository = {
    async saveSecret(sourceId: string, secret: string): Promise<void> {
        await updateJsonFile<Record<string, string>>(SECRETS_PATH, (data) => {
            const secrets = (Array.isArray(data) ? data[0] : data) || {};

            secrets[sourceId] = secret;
            return [secrets] as any;
        });
    }
};