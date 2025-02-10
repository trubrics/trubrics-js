import { TrackRequest } from "../../types/types.js";

export const validateResponse = (response: Response) => {
    if (!response.ok) {
        console.error(`Request failed: ${response.statusText}`);
        return false;
    }
    return true;
}

export const validateRequest = (
    strings: (string | null | undefined)[],
    numbers: (number | null | undefined)[],
    dates: (Date | null | undefined)[],
    mandatory: any[]
) => {
    if (mandatory.some(item => item === null || item === undefined)) {
        throw new Error("Mandatory fields cannot be null or undefined");
    }

    for (const item of strings) {
        if (item !== null && item !== undefined && (typeof item !== "string" || item === "")) {
            throw new Error("String fields must be non-empty strings");
        }
    }

    for (const item of numbers) {
        if (item !== null && item !== undefined && (!Number.isInteger(item) || typeof item !== "number")) {
            throw new Error("Integer fields must be integers");
        }
    }

    for (const item of dates) {
        if (item !== null && item !== undefined && !(item instanceof Date)) {
            throw new Error("Datetime fields must be instances of Date");
        }
    }
}

export const checkAuth = (apiKey: string) => {
    if (!apiKey) {
        throw new Error("No API key provided.");
    }
}

export const flushQueue = async (queue: TrackRequest[], host: string, apiKey: string, isVerbose: boolean) => {
    const queueCount = queue.length;
    if (queueCount === 0) {
        return;
    }

    const events = queue.slice(0, queueCount)
    const success = await batchEvents(events, host, apiKey, isVerbose);

    if (!success) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        if (isVerbose) {
            console.info(`Retrying to post ${queueCount} events`);
        }
        await batchEvents(events, host, apiKey, isVerbose);
    }
    queue.splice(0, queueCount);
}

const batchEvents = async (events: TrackRequest[], host: string, apiKey: string, isVerbose: boolean) => {
    if (isVerbose) {
        console.info(`Posting ${events.length} events`);
    }

    try {
        const url = new URL(host + "/publish_events");
        const response = await fetch(url, {
            method: "POST",
            body: JSON.stringify(events),
            headers: { "Content-Type": "application/json", "x-api-key": apiKey }
        });
        return validateResponse(response);
    } catch (error) {
        console.error(`Trubrics was unable to post ${events.length} events.`, error);
        return false;
    }
}
