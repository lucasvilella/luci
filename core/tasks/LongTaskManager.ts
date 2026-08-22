/**
 * LongTaskManager
 *
 * Background Task Orchestrator for L.U.C.I. 2.0.
 * Executes asynchronous, long-running background tasks (e.g. code generation,
 * batch processing, deep web scraping) without blocking main voice UI.
 */

import { EventBus } from '../events/EventBus';

export interface BackgroundTask {
  id: string;
  name: string;
  userId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  result?: any;
  startTime: number;
  endTime?: number;
}

export class LongTaskManager {
  private eventBus: EventBus;
  private tasks: Map<string, BackgroundTask> = new Map();

  constructor() {
    this.eventBus = EventBus.getInstance();
  }

  /**
   * Spawns a background task.
   */
  async spawnTask(name: string, userId: string, taskFn: () => Promise<any>): Promise<BackgroundTask> {
    const task: BackgroundTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      userId,
      status: 'RUNNING',
      startTime: Date.now(),
    };

    this.tasks.set(task.id, task);
    this.eventBus.emit('task:started', task);
    console.log(`[LongTaskManager] 🚀 Background task started [${task.id}]: ${name}`);

    // Execute asynchronously
    taskFn()
      .then((result) => {
        task.status = 'COMPLETED';
        task.result = result;
        task.endTime = Date.now();
        this.eventBus.emit('task:completed', task);
        console.log(`[LongTaskManager] ✅ Background task completed [${task.id}] in ${task.endTime - task.startTime}ms.`);
      })
      .catch((err) => {
        task.status = 'FAILED';
        task.result = err?.message || 'Task failed';
        task.endTime = Date.now();
        this.eventBus.emit('task:completed', task);
        console.error(`[LongTaskManager] ❌ Background task failed [${task.id}]:`, err);
      });

    return task;
  }

  /**
   * Get all active/completed background tasks.
   */
  getTasks(userId = 'Lucas'): BackgroundTask[] {
    const cleanUserId = userId.trim().toLowerCase();
    return Array.from(this.tasks.values()).filter((t) => t.userId.toLowerCase() === cleanUserId);
  }
}
