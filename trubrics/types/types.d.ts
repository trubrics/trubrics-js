export type TrackRequest = {
    event: string,
    user_id: string,
    properties?: Record<string, any>,
    timestamp?: Date = new Date()
}

export type TrackLLMRequest = {
    user_id: string,
    prompt: string,
    assistant_id: string,
    generation: string,
    properties?: Record<string, any>,
    timestamp?: Date = new Date(),
    latency?: number
}

export type TrubricsInitialization = {
    apiKey: string,
    host?: string,
    flushInterval?: number,
    flushAt?: number,
    isVerbose?: boolean
}
