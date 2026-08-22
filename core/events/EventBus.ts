/**
 * EventBus
 *
 * Lightweight, decoupled internal Pub/Sub Event Bus for L.U.C.I. 2.0.
 * Allows modules (ConversationEngine, ModelRouter, MemoryManager, Speech recognition)
 * to communicate asynchronously without direct coupling.
 */

export type EventType =
  | 'user:speech_start'
  | 'user:speech_pause'
  | 'user:speech_end'
  | 'luci:speaking_start'
  | 'luci:speaking_end'
  | 'luci:backchannel'
  | 'state:changed'
  | 'tool:executing'
  | 'task:started'
  | 'task:completed';

export type EventCallback = (data?: any) => void;

export class EventBus {
  private static instance: EventBus;
  private listeners: Map<EventType, Set<EventCallback>> = new Map();

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to an event.
   */
  public on(event: EventType, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Emit an event to all subscribers.
   */
  public emit(event: EventType, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks && callbacks.size > 0) {
      for (const cb of callbacks) {
        try {
          cb(data);
        } catch (err) {
          console.error(`[EventBus] Error executing listener for event "${event}":`, err);
        }
      }
    }
  }

  /**
   * Clear all subscribers (useful for testing or reset).
   */
  public clear(): void {
    this.listeners.clear();
  }
}
