import { TrackLLMRequest, TrackRequest, TrubricsInitialization } from '../types/types.js'
import { flushQueue, checkAuth, validateRequest } from './utility/utility.js';

/**
 * The TrubricsClientTracker enables the tracking of client side events through the Trubrics API.
 *
 * @example
 * ```typescript
 * const trubrics = new Trubrics({
 *   apiKey: "YOUR_API_KEY",
 * });
 * ```
 */
export class Trubrics {
    private apiKey = "";
    private host = "https://app.trubrics.com/api/ingestion";
    private queue: TrackRequest[] = [];
    private isVerbose = false;
    private flushInterval: number;
    private flushAt: number;
    private lastFlushTime: number;
    private isFlushing: boolean;

    constructor(trubricsInitialization: TrubricsInitialization) {
        this.apiKey = trubricsInitialization.apiKey;
        this.host = trubricsInitialization.host ?? this.host;
        this.isVerbose = trubricsInitialization.isVerbose ?? false;
        this.flushInterval = trubricsInitialization.flushInterval ?? 10000;
        this.flushAt = trubricsInitialization.flushAt ?? 20;
        this.lastFlushTime = Date.now();
        this.isFlushing = false;
        setInterval(() => this.periodicFlush(), 1000);
    }

    private async periodicFlush() {
        const now = Date.now();
        const timeSinceLastFlush = now - this.lastFlushTime;

        if (this.queue.length >= this.flushAt || timeSinceLastFlush >= this.flushInterval) {
            await this.flush();
            this.lastFlushTime = Date.now();
        }
    }

    /**
     * This function is used to flush the queue.
     */
    public flush = async () => {
        if (this.isFlushing) {
            return;
        }

        this.isFlushing = true;
        await flushQueue(this.queue, this.host, this.apiKey, this.isVerbose);
        this.isFlushing = false;
    };

    /**
     * This function is used to track events.
     *
     * @example
     * ```typescript
     *  trubrics.track({
     *      event: "Page Viewed",
     *      properties: {
     *          page: "Home page"
     *      },
     *      user_id: "your-username"
     *  });
     * ```
     */
    public track = (request: TrackRequest) => {
        if (this.isVerbose) {
            console.info("Tracking event...");
        }

        try {
            checkAuth(this.apiKey);
            validateRequest([request.event, request.user_id], [], [request.timestamp], [request.event, request.user_id]);
            request.timestamp = request.timestamp ?? new Date();

            this.queue.push(request);
        } catch (error) {
            console.error("Trubrics was unable to track the latest events.", error);
        }
    };

    /**
     * This function is used to track LLM events.
     *
     * @example
     * ```typescript
     *  trubrics.track({
     *      user_id: "your-username"
     *      prompt: "Hello",
     *      assistant_id: "your-assistant-id",
     *      generation: "Hi",
     *      properties: {
     *          page: "Home page"
     *      },
     *      latency: 1000, // The latency in milliseconds between the prompt and the generation
     *  });
     * ```
     */
    public trackLLM = (request: TrackLLMRequest) => {
        if (this.isVerbose) {
            console.info("Tracking llm...");
        }

        try {
            checkAuth(this.apiKey);
            validateRequest([request.user_id, request.prompt, request.assistant_id, request.generation], [request.latency], [request.timestamp], [request.user_id, request.prompt, request.assistant_id, request.generation]);
            request.timestamp = request.timestamp ?? new Date();

            const promptTimestamp = new Date(request.timestamp.getTime() - (request.latency ?? 1));

            this.track({
                event: "Prompt",
                user_id: request.user_id,
                properties: {
                    $text: request.prompt,
                    ...request.properties
                },
                timestamp: promptTimestamp
            });

            this.track({
                event: "Generation",
                user_id: request.user_id,
                properties: {
                    $text: request.generation,
                    $prompt: request.prompt,
                    latency: request.latency,
                    ...request.properties
                },
                timestamp: request.timestamp
            });
        } catch (error) {
            console.error("Trubrics was unable to track the latest LLM event.", error);
        }
    };
}
