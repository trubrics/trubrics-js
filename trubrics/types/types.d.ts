export type TrackRequest = {
    event: string,
    user_id: string,
    properties?: Record<string, any>,
    timestamp?: Date = new Date()
}

export type TrackLLMRequest = {
    user_id: string,
    prompt: string,
    generation: string,
    assistant_id?: string,
    properties?: Record<string, any>,
    timestamp?: Date = new Date(),
    latency?: number
    thread_id?: string
}

export type TrubricsInitialization = {
    apiKey: string,
    host?: string,
    flushInterval?: number,
    flushBatchSize?: number,
    isVerbose?: boolean
}

export type EventToPublish = {
    event: TrackRequest | TrackLLMRequest,
    eventType: TrubricsEventTypes
}