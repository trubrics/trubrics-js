export enum TrubricsEventTypes {
    EVENT = "event",
    LLM_EVENT = "llm_event"
}

export enum TrubricsIngestionEndpoints {
    EVENT = "publish_events",
    LLM_EVENT = "publish_llm_events"
}

export const MIN_FLUSH_INTERVAL: number = 1000
export const MAX_FLUSH_BATCH_SIZE: number = 100
export const DEFAULT_FLUSH_INTERVAL: number = 10000
export const DEFAULT_FLUSH_BATCH_SIZE: number = 20
export const DEFAULT_FLUSH_PERIODIC_CHECK: number = 1000