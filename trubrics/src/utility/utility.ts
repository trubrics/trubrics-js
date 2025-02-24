import { EventToPublish, TrackLLMRequest, TrackRequest, TrubricsEventTypes, TrubricsIngestionEndpoints } from "../types.js";

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

export const flushQueue = async (queue: EventToPublish[], host: string, apiKey: string, isVerbose: boolean) => {
    const events: TrackRequest[] = [];
    const llmEvents: TrackLLMRequest[] = [];

    const queueCount = queue.length;
    if (queueCount === 0) {
        return;
    }

    const eventsToPublish = queue.slice(0, queueCount)

    for (const event of eventsToPublish) {
        if (event.eventType === TrubricsEventTypes.EVENT) {
            events.push(event.event as TrackRequest);
        } else if (event.eventType === TrubricsEventTypes.LLM_EVENT) {
            llmEvents.push(event.event as TrackLLMRequest);
        }
    }

    const eventsSuccess = await batchEvents(events, host, apiKey, isVerbose, TrubricsIngestionEndpoints.EVENT, TrubricsEventTypes.EVENT);
    const llmEventsSuccess = await batchEvents(llmEvents, host, apiKey, isVerbose, TrubricsIngestionEndpoints.LLM_EVENT, TrubricsEventTypes.LLM_EVENT);

    if (!eventsSuccess) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        if (isVerbose) {
            console.info(`Retrying to post ${queueCount} events`);
        }
        await batchEvents(events, host, apiKey, isVerbose, TrubricsIngestionEndpoints.EVENT, TrubricsEventTypes.EVENT);
    }

    if (!llmEventsSuccess) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        if (isVerbose) {
            console.info(`Retrying to post ${queueCount} events`);
        }
        await batchEvents(llmEvents, host, apiKey, isVerbose, TrubricsIngestionEndpoints.LLM_EVENT, TrubricsEventTypes.LLM_EVENT);
    }
    queue.splice(0, queueCount);
}

const batchEvents = async (
    events: (TrackRequest | TrackLLMRequest)[],
    host: string, apiKey: string,
    isVerbose: boolean,
    endpoint: TrubricsIngestionEndpoints,
    eventType: TrubricsEventTypes
) => {
    if (isVerbose) {
        console.info(`Posting ${events.length} ${eventType}s`);
    }

    try {
        const url = new URL(`${host}/${endpoint}`);
        const response = await fetch(url, {
            method: "POST",
            body: JSON.stringify(events),
            headers: { "Content-Type": "application/json", "x-api-key": apiKey }
        });
        return validateResponse(response);
    } catch (error) {
        console.error(`Trubrics was unable to post ${events.length} ${eventType}s.`, error);
        return false;
    }
}
