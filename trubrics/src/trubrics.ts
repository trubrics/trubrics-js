import { EventToPublish, TrackLLMRequest, TrackRequest, TrubricsInitialization } from '../types/types.js';
import { flushQueue, checkAuth, validateRequest } from './utility/utility.js';
import { DEFAULT_FLUSH_BATCH_SIZE, DEFAULT_FLUSH_INTERVAL, DEFAULT_FLUSH_PERIODIC_CHECK, MAX_FLUSH_BATCH_SIZE, MIN_FLUSH_INTERVAL, TrubricsEventTypes } from './utility/config.js';

/**
 * The Trubrics SDK enables the tracking of events through the Trubrics API.
 *
 * @see {@link https://docs.trubrics.com/track_events/sdks/javascript/ | Trubrics Docs}
 */
export class Trubrics {
    private apiKey = "";
    private host = "https://app.trubrics.com/api/ingestion";
    private queue: EventToPublish[] = [];
    private isVerbose = false;
    private flushInterval: number = DEFAULT_FLUSH_INTERVAL;
    private flushBatchSize: number = DEFAULT_FLUSH_BATCH_SIZE;
    private lastFlushTime: number = Date.now();
    private isFlushing: boolean = false;

    constructor(trubricsInitialization: TrubricsInitialization) {
        this.apiKey = trubricsInitialization.apiKey;
        this.host = trubricsInitialization.host ?? this.host;
        this.isVerbose = trubricsInitialization.isVerbose ?? false;
        this.initFlushParameters(trubricsInitialization);
        setInterval(() => this.periodicFlush(), DEFAULT_FLUSH_PERIODIC_CHECK);
    }

    private initFlushParameters = (trubricsInitialization: TrubricsInitialization) => {
        if (trubricsInitialization.flushInterval) {
            if (trubricsInitialization.flushInterval * 1000 < MIN_FLUSH_INTERVAL) {
                throw new Error(`Flush interval cannot be less than ${MIN_FLUSH_INTERVAL} ms`);
            } else {
                this.flushInterval = trubricsInitialization.flushInterval * 1000;
            }
        }
        if (trubricsInitialization.flushBatchSize) {
            if (trubricsInitialization.flushBatchSize && trubricsInitialization.flushBatchSize > MAX_FLUSH_BATCH_SIZE) {
                throw new Error(`Flush batch size cannot be more than ${MAX_FLUSH_BATCH_SIZE} events`);
            } else {
                this.flushBatchSize = trubricsInitialization.flushBatchSize;
            }
        }
    }

    private async periodicFlush() {
        const now = Date.now();
        const timeSinceLastFlush = now - this.lastFlushTime;

        if (this.queue.length >= this.flushBatchSize || timeSinceLastFlush >= this.flushInterval) {
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
     * @see {@link https://docs.trubrics.com/track_events/sdks/javascript/ | Trubrics Docs}
     */
    public track = (request: TrackRequest) => {
        if (this.isVerbose) {
            console.info("Tracking event...");
        }

        try {
            checkAuth(this.apiKey);
            validateRequest([request.event, request.user_id], [], [request.timestamp], [request.event, request.user_id]);
            request.timestamp = request.timestamp ?? new Date();

            this.queue.push({
                event: request,
                eventType: TrubricsEventTypes.EVENT
            });
        } catch (error) {
            console.error("Trubrics was unable to track the latest events.", error);
        }
    };

    /**
     * This function is used to track LLM events.
     *
     * @see {@link https://docs.trubrics.com/track_events/sdks/javascript/ | Trubrics Docs}
     */
    public trackLLM = (request: TrackLLMRequest) => {
        if (this.isVerbose) {
            console.info("Tracking llm...");
        }

        try {
            checkAuth(this.apiKey);
            validateRequest([request.user_id, request.prompt, request.assistant_id, request.generation], [request.latency], [request.timestamp], [request.user_id, request.prompt, request.assistant_id, request.generation]);
            request.timestamp = request.timestamp ?? new Date();

            this.queue.push({
                event: request,
                eventType: TrubricsEventTypes.LLM_EVENT
            });
        } catch (error) {
            console.error("Trubrics was unable to track the latest LLM event.", error);
        }
    };
}