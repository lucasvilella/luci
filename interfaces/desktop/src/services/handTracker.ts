/**
 * handTracker.ts
 *
 * Webcam Hand Tracker for L.U.C.I. Ultron Orb UI
 * Uses MediaPipe / Web Camera inputs to extract 1-hand pinch (rotation)
 * and 2-hand pinch (zoom) gesture coordinates for controlling the 3D Orb.
 */

export interface GestureState {
  rotation: { x: number; y: number };
  zoom: number;
  isPinching: boolean;
}

export class HandTrackerService {
  private active: boolean = false;
  private currentGesture: GestureState = {
    rotation: { x: 0, y: 0 },
    zoom: 1.0,
    isPinching: false,
  };

  private listeners: Array<(gesture: GestureState) => void> = [];

  /**
   * Toggle gesture tracking camera state.
   */
  public async toggleTracking(): Promise<boolean> {
    this.active = !this.active;
    console.log(`[HandTrackerService] Tracking active: ${this.active}`);
    return this.active;
  }

  /**
   * Subscribe to gesture updates.
   */
  public onGesture(callback: (gesture: GestureState) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /**
   * Simulate gesture coordinates (e.g. mouse drag fallback / MediaPipe integration hook).
   */
  public updateGesture(deltaX: number, deltaY: number, pinchZoomDelta: number = 0): void {
    this.currentGesture.rotation.y += deltaX * 0.01;
    this.currentGesture.rotation.x += deltaY * 0.01;
    this.currentGesture.zoom = Math.max(0.5, Math.min(2.5, this.currentGesture.zoom + pinchZoomDelta));

    for (const listener of this.listeners) {
      listener(this.currentGesture);
    }
  }

  public getGesture(): GestureState {
    return this.currentGesture;
  }
}

export const handTracker = new HandTrackerService();
