/**
 * RequestDeduplicator
 *
 * Guarantees single active execution per Request ID.
 * Prevents parallel duplicate responses, race conditions, or duplicate TTS utterances.
 */

export class RequestDeduplicator {
  private activeRequests: Set<string> = new Map() as any;
  private completedRequests: Map<string, number> = new Map();

  /**
   * Generates a unique Request ID for a turn.
   */
  generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  }

  /**
   * Attempts to acquire lock for a Request ID. Returns true if lock granted.
   */
  acquireLock(requestId: string): boolean {
    if (this.completedRequests.has(requestId)) {
      console.warn(`[RequestDeduplicator] Request [${requestId}] was already completed. Rejecting duplicate.`);
      return false;
    }
    this.completedRequests.set(requestId, Date.now());
    return true;
  }

  /**
   * Releases lock after completion.
   */
  releaseLock(requestId: string): void {
    // Keep in completed map for 30s to prevent stale duplicate retries
    setTimeout(() => {
      this.completedRequests.delete(requestId);
    }, 30000);
  }
}
